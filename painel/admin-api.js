/* Camada de dados do painel.
   - Modo Cloud (padrão na Vercel): sincronizado em todos os dispositivos via /api/store + Vercel Blob.
   - Modo Firebase: Firebase Auth + Firestore (+ Storage opcional).
   - Fallback local (IndexedDB) caso aberto localmente sem servidor. */
import { firebaseConfig, IMAGE_STORAGE, FIREBASE_SDK, MODE } from "../js/config.js";
import { DEFAULT_CONTENT, DEFAULT_ALBUMS, ensureRequiredAlbums } from "../js/defaults.js";
import { kvGet, kvSet, kvDel } from "../js/idb.js";

export { MODE };
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const uid8 = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const blobToDataURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });

/* ---------- mensagens de erro em português ---------- */
export function errMsg(e) {
  const c = (e && (e.code || e.message)) || "";
  const map = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/invalid-login-credentials": "E-mail ou senha incorretos.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/user-not-found": "Não existe acesso com este e-mail.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/missing-password": "Digite a senha.",
    "auth/network-request-failed": "Sem conexão com a internet. Verifique e tente de novo.",
    "auth/requires-recent-login": "Por segurança, saia e entre de novo antes de fazer isso.",
    "auth/operation-not-allowed": "O login por e-mail e senha não está ativado.",
    "permission-denied": "Você não tem permissão para fazer isso.",
    "unavailable": "Sem conexão com o servidor. Verifique a internet."
  };
  for (const k in map) if (c.includes(k)) return map[k];
  return (e && e.friendly) || (e && e.message) || "Algo deu errado. Tente novamente.";
}
const fail = (code, friendly) => { const e = new Error(code); e.code = code; if (friendly) e.friendly = friendly; return e; };

/* =================================================================
   CLOUD (Vercel Blob via /api/store — funciona em todos os aparelhos)
   ================================================================= */
function cloudImpl() {
  const TOK_KEY = "alm-cloud-token";
  let listeners = [], current = null, setupDone = true;
  const emit = (u, r) => listeners.forEach(f => f(u, r));
  const getTok = () => localStorage.getItem(TOK_KEY) || "";
  const setTok = t => t ? localStorage.setItem(TOK_KEY, t) : localStorage.removeItem(TOK_KEY);

  async function call(action, payload = {}) {
    const r = await fetch("/api/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getTok() ? { Authorization: "Bearer " + getTok() } : {})
      },
      body: JSON.stringify({ action, ...payload })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw fail(j.error || "server-error", j.message);
    return j;
  }

  async function fetchState() {
    const r = await fetch(`/api/store?t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) throw fail("unavailable");
    return await r.json();
  }

  return {
    async init() {
      try {
        const s = await call("status");
        setupDone = !!s.setupDone;
        current = s.user || null;
        if (!current) setTok("");
        setTimeout(() => emit(current), 0);
      } catch (e) {
        // Se estiver rodando localmente sem a função /api/store, cai para o modo local
        console.warn("Cloud API indisponível localmente, usando fallback local:", e);
        Object.assign(this, demoImpl());
        return this.init();
      }
    },
    onAuth(cb) { listeners.push(cb); },
    me: () => current,
    async isSetupDone() { return setupDone; },
    async signIn(email, password) {
      const r = await call("signIn", { email, password });
      setTok(r.token);
      current = r.user;
      emit(current);
    },
    async signOut() {
      setTok("");
      current = null;
      emit(null);
    },
    async resetPassword() {
      throw fail("reset-info", "Peça para outro administrador redefinir sua senha na aba Acessos.");
    },
    async adminSetPassword(uid, newPassword) {
      await call("adminSetPassword", { uid, newPassword });
    },
    async changePassword(currentPw, newPw) {
      await call("changePassword", { currentPw, newPw });
    },
    async setupFirstAdmin({ name, email, password }) {
      const r = await call("setupFirstAdmin", { name, email, password });
      setupDone = true;
      setTok(r.token);
      current = r.user;
      emit(current);
    },
    async listAdmins() {
      const r = await call("listAdmins");
      return r.admins || [];
    },
    async createAdmin({ name, email, password }) {
      await call("createAdmin", { name, email, password });
    },
    async setAdminActive(uid, active) {
      await call("setAdminActive", { uid, active });
    },
    async updateMyName(name) {
      const r = await call("updateMyName", { name });
      if (current) current.name = r.name || name;
    },
    async loadContent() {
      const st = await fetchState();
      return { ...DEFAULT_CONTENT, ...(st.content || {}) };
    },
    async saveContent(content) {
      await call("saveContent", { content });
    },
    async loadMedia() {
      const st = await fetchState();
      return { hero: "", about: "", ...(st.media || {}) };
    },
    async saveMedia(key, dataUrl) {
      const r = await call("saveMedia", { key, dataUrl });
      return r.url || "";
    },
    async loadAlbums() {
      const st = await fetchState();
      return ensureRequiredAlbums(st.albums || DEFAULT_ALBUMS).sort(byOrder);
    },
    async saveAlbum(album) {
      await call("saveAlbum", { album });
    },
    async deleteAlbum(id) {
      await call("deleteAlbum", { id });
    },
    async reorderAlbums(list) {
      await call("reorderAlbums", { ids: list.map(a => a.id) });
    },
    async loadPhotos(albumId) {
      const st = await fetchState();
      return (st.photos || []).filter(p => p.albumId === albumId).sort(byOrder);
    },
    async addPhoto(albumId, { thumb, full, w, h }, order) {
      const [tData, fData] = await Promise.all([blobToDataURL(thumb), blobToDataURL(full)]);
      const r = await call("addPhoto", { albumId, thumb: tData, full: fData, w, h, order });
      return r.photo;
    },
    async updatePhoto(id, { thumb, full, w, h }) {
      const [tData, fData] = await Promise.all([blobToDataURL(thumb), blobToDataURL(full)]);
      const r = await call("updatePhoto", { id, thumb: tData, full: fData, w, h });
      return r.photo;
    },
    async deletePhotos(list) {
      await call("deletePhotos", { ids: list.map(p => p.id) });
    },
    async reorderPhotos(list) {
      await call("reorderPhotos", { ids: list.map(p => p.id) });
    },
    async movePhoto(p, toAlbum, order) {
      await call("movePhoto", { id: p.id, toAlbum, order });
    },
    async getFull(p) {
      return p.fullUrl || p.thumbUrl || p.thumb || "";
    },
    async getSnapshot() {
      const st = await fetchState();
      return { content: st.content, media: st.media, albums: st.albums, photos: st.photos };
    },
    async restoreSnapshot(snapshot) {
      await call("restoreSnapshot", { snapshot });
    }
  };
}

/* =================================================================
   FIREBASE
   ================================================================= */
function firebaseImpl() {
  let A, AU, F, ST, app, auth, db;
  let listeners = [], busy = false, current = null;

  async function init() {
    [A, AU, F] = await Promise.all([
      import(`${FIREBASE_SDK}/firebase-app.js`),
      import(`${FIREBASE_SDK}/firebase-auth.js`),
      import(`${FIREBASE_SDK}/firebase-firestore.js`)
    ]);
    app = A.initializeApp(firebaseConfig);
    auth = AU.getAuth(app);
    auth.languageCode = "pt";
    db = F.getFirestore(app);
    AU.onAuthStateChanged(auth, () => { if (!busy) evaluate(); });
  }
  async function storage() {
    if (!ST) ST = await import(`${FIREBASE_SDK}/firebase-storage.js`);
    return ST;
  }
  async function evaluate() {
    const u = auth.currentUser;
    if (!u) { current = null; return emit(null); }
    try {
      const s = await F.getDoc(F.doc(db, "admins", u.uid));
      if (s.exists() && s.data().active !== false) {
        current = { uid: u.uid, email: u.email, ...s.data() };
        return emit(current);
      }
    } catch (e) { console.error(e); }
    current = null;
    await AU.signOut(auth);
    emit(null, "noaccess");
  }
  function emit(user, reason) { listeners.forEach(f => f(user, reason)); }

  const d = (...p) => F.doc(db, ...p);
  async function commitInChunks(ops) {
    for (let i = 0; i < ops.length; i += 400) {
      const b = F.writeBatch(db);
      ops.slice(i, i + 400).forEach(fn => fn(b));
      await b.commit();
    }
  }

  return {
    init,
    onAuth(cb) { listeners.push(cb); },
    me: () => current,
    async signIn(email, pw) { await AU.signInWithEmailAndPassword(auth, email.trim(), pw); },
    async signOut() { await AU.signOut(auth); },
    async resetPassword(email) { await AU.sendPasswordResetEmail(auth, email.trim()); },
    async changePassword(currentPw, newPw) {
      const u = auth.currentUser;
      await AU.reauthenticateWithCredential(u, AU.EmailAuthProvider.credential(u.email, currentPw));
      await AU.updatePassword(u, newPw);
    },
    async isSetupDone() { return (await F.getDoc(d("meta", "setup"))).exists(); },
    async setupFirstAdmin({ name, email, password }) {
      busy = true;
      try {
        const cred = await AU.createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = cred.user.uid;
        const b = F.writeBatch(db);
        b.set(d("admins", uid), { name, email: email.trim(), active: true, owner: true, createdAt: F.serverTimestamp() });
        b.set(d("meta", "setup"), { by: uid, at: F.serverTimestamp() });
        await b.commit();
        if (!(await F.getDoc(d("site", "content"))).exists()) await F.setDoc(d("site", "content"), DEFAULT_CONTENT);
        const al = await F.getDocs(F.collection(db, "albums"));
        if (al.empty) await commitInChunks(DEFAULT_ALBUMS.map(a => bb => { const { id, ...rest } = a; bb.set(d("albums", id), rest); }));
      } finally { busy = false; }
      await evaluate();
    },
    async listAdmins() {
      const s = await F.getDocs(F.collection(db, "admins"));
      return s.docs.map(x => ({ uid: x.id, ...x.data() }));
    },
    async createAdmin({ name, email, password }) {
      const sec = A.initializeApp(firebaseConfig, "sec-" + Date.now());
      const sa = AU.getAuth(sec);
      try {
        const cred = await AU.createUserWithEmailAndPassword(sa, email.trim(), password);
        await F.setDoc(d("admins", cred.user.uid), { name, email: email.trim(), active: true, owner: false, createdAt: F.serverTimestamp(), createdBy: current.uid });
      } finally {
        try { await AU.signOut(sa); } catch (e) { }
        try { await A.deleteApp(sec); } catch (e) { }
      }
    },
    async setAdminActive(uid, active) { await F.updateDoc(d("admins", uid), { active }); },
    async updateMyName(name) { await F.updateDoc(d("admins", current.uid), { name }); current.name = name; },
    async loadContent() { const s = await F.getDoc(d("site", "content")); return { ...DEFAULT_CONTENT, ...(s.exists() ? s.data() : {}) }; },
    async saveContent(c) { await F.setDoc(d("site", "content"), c, { merge: true }); },
    async loadMedia() { const s = await F.getDoc(d("site", "media")); return { hero: "", about: "", ...(s.exists() ? s.data() : {}) }; },
    async saveMedia(key, dataUrl) { await F.setDoc(d("site", "media"), { [key]: dataUrl }, { merge: true }); return dataUrl; },
    async loadAlbums() {
      const s = await F.getDocs(F.collection(db, "albums"));
      return s.docs.map(x => ({ id: x.id, ...x.data() })).sort(byOrder);
    },
    async saveAlbum(a) { const { id, ...rest } = a; await F.setDoc(d("albums", id), rest, { merge: true }); },
    async deleteAlbum(id) {
      const ph = await F.getDocs(F.query(F.collection(db, "photos"), F.where("albumId", "==", id)));
      for (const x of ph.docs) await removeStorage(x.data());
      await commitInChunks([
        ...ph.docs.flatMap(x => [b => b.delete(x.ref), b => b.delete(d("photoData", x.id))]),
        b => b.delete(d("albums", id))
      ]);
    },
    async reorderAlbums(list) { await commitInChunks(list.map((a, i) => b => b.update(d("albums", a.id), { order: i }))); },
    async loadPhotos(albumId) {
      const s = await F.getDocs(F.query(F.collection(db, "photos"), F.where("albumId", "==", albumId)));
      return s.docs.map(x => ({ id: x.id, ...x.data() })).sort(byOrder);
    },
    async addPhoto(albumId, { thumb, full, w, h }, order) {
      const ref = F.doc(F.collection(db, "photos"));
      const base = { albumId, order, w, h, createdAt: F.serverTimestamp() };
      const b = F.writeBatch(db);
      if (IMAGE_STORAGE === "storage") {
        const S = await storage(), st = S.getStorage(app);
        const tp = `photos/${ref.id}/thumb.jpg`, fp = `photos/${ref.id}/full.jpg`;
        const meta = { contentType: "image/jpeg", cacheControl: "public,max-age=31536000" };
        await S.uploadBytes(S.ref(st, tp), thumb, meta);
        await S.uploadBytes(S.ref(st, fp), full, meta);
        Object.assign(base, { thumbUrl: await S.getDownloadURL(S.ref(st, tp)), fullUrl: await S.getDownloadURL(S.ref(st, fp)), paths: [tp, fp] });
      } else {
        base.thumb = await blobToDataURL(thumb);
        b.set(d("photoData", ref.id), { data: await blobToDataURL(full) });
      }
      b.set(ref, base);
      b.update(d("albums", albumId), { count: F.increment(1) });
      await b.commit();
      return { id: ref.id, ...base };
    },
    async updatePhoto(id, { thumb, full, w, h }) {
      const ref = d("photos", id);
      const b = F.writeBatch(db);
      const base = { w, h };
      if (IMAGE_STORAGE === "storage") {
        const S = await storage(), st = S.getStorage(app);
        const tp = `photos/${id}/thumb.jpg`, fp = `photos/${id}/full.jpg`;
        const meta = { contentType: "image/jpeg", cacheControl: "public,max-age=31536000" };
        await S.uploadBytes(S.ref(st, tp), thumb, meta);
        await S.uploadBytes(S.ref(st, fp), full, meta);
        Object.assign(base, { thumbUrl: await S.getDownloadURL(S.ref(st, tp)), fullUrl: await S.getDownloadURL(S.ref(st, fp)), paths: [tp, fp] });
      } else {
        base.thumb = await blobToDataURL(thumb);
        b.set(d("photoData", id), { data: await blobToDataURL(full) });
      }
      b.update(ref, base);
      await b.commit();
      return base;
    },
    async deletePhotos(list) {
      for (const p of list) await removeStorage(p);
      await commitInChunks(list.flatMap(p => [
        b => b.delete(d("photos", p.id)),
        b => b.delete(d("photoData", p.id)),
        b => b.update(d("albums", p.albumId), { count: F.increment(-1) })
      ]));
    },
    async reorderPhotos(list) { await commitInChunks(list.map((p, i) => b => b.update(d("photos", p.id), { order: i }))); },
    async movePhoto(p, toAlbum, order) {
      const b = F.writeBatch(db);
      b.update(d("photos", p.id), { albumId: toAlbum, order });
      b.update(d("albums", p.albumId), { count: F.increment(-1) });
      b.update(d("albums", toAlbum), { count: F.increment(1) });
      await b.commit();
    },
    async getFull(p) {
      if (p.fullUrl) return p.fullUrl;
      const s = await F.getDoc(d("photoData", p.id));
      return s.exists() ? s.data().data : (p.thumbUrl || p.thumb);
    }
  };

  async function removeStorage(p) {
    if (!p.paths || !p.paths.length) return;
    const S = await storage(), st = S.getStorage(app);
    for (const path of p.paths) { try { await S.deleteObject(S.ref(st, path)); } catch (e) { } }
  }
}

/* =================================================================
   FALLBACK LOCAL (IndexedDB — quando aberto sem servidor)
   ================================================================= */
function demoImpl() {
  let listeners = [], current = null;
  const emit = (u, r) => listeners.forEach(f => f(u, r));
  const admins = async () => (await kvGet("demo-admins")) || [];
  async function evaluate() {
    const sid = await kvGet("demo-session");
    const a = (await admins()).find(x => x.uid === sid && x.active !== false);
    current = a ? { ...a } : null;
    emit(current);
  }
  async function photos() { return (await kvGet("photos")) || []; }
  async function albums() { return ensureRequiredAlbums((await kvGet("albums")) || DEFAULT_ALBUMS.map(a => ({ ...a }))); }
  async function bumpCount(id, n) {
    const al = await albums(); const a = al.find(x => x.id === id);
    if (a) { a.count = Math.max(0, (a.count || 0) + n); await kvSet("albums", al); }
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));

  return {
    async init() { setTimeout(evaluate, 0); },
    onAuth(cb) { listeners.push(cb); },
    me: () => current,
    async signIn(email, pw) {
      await wait(150);
      const a = (await admins()).find(x => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!a || a.password !== pw) throw fail("auth/invalid-credential");
      if (a.active === false) { emit(null, "noaccess"); return; }
      await kvSet("demo-session", a.uid); await evaluate();
    },
    async signOut() { await kvDel("demo-session"); await evaluate(); },
    async resetPassword() { await wait(150); },
    async adminSetPassword(uid, nw) {
      const list = await admins(); const a = list.find(x => x.uid === uid);
      if (a) { a.password = nw; await kvSet("demo-admins", list); }
    },
    async changePassword(cur, nw) {
      const list = await admins(); const a = list.find(x => x.uid === current.uid);
      if (a.password !== cur) throw fail("auth/wrong-password");
      if (nw.length < 6) throw fail("auth/weak-password");
      a.password = nw; await kvSet("demo-admins", list);
    },
    async isSetupDone() { return !!(await kvGet("demo-setup")); },
    async setupFirstAdmin({ name, email, password }) {
      if (password.length < 6) throw fail("auth/weak-password");
      const a = { uid: uid8(), name, email: email.trim(), password, active: true, owner: true };
      await kvSet("demo-admins", [a]); await kvSet("demo-setup", true);
      if (!(await kvGet("content"))) await kvSet("content", { ...DEFAULT_CONTENT });
      if (!(await kvGet("albums"))) await kvSet("albums", DEFAULT_ALBUMS.map(x => ({ ...x })));
      await kvSet("demo-session", a.uid); await evaluate();
    },
    async listAdmins() { return (await admins()).map(({ password, ...r }) => r); },
    async createAdmin({ name, email, password }) {
      const list = await admins();
      if (list.some(x => x.email.toLowerCase() === email.trim().toLowerCase())) throw fail("auth/email-already-in-use");
      if (password.length < 6) throw fail("auth/weak-password");
      list.push({ uid: uid8(), name, email: email.trim(), password, active: true, owner: false });
      await kvSet("demo-admins", list);
    },
    async setAdminActive(uid, active) {
      const list = await admins(); const a = list.find(x => x.uid === uid);
      if (a) { a.active = active; await kvSet("demo-admins", list); }
    },
    async updateMyName(name) {
      const list = await admins(); const a = list.find(x => x.uid === current.uid);
      a.name = name; current.name = name; await kvSet("demo-admins", list);
    },
    async loadContent() { return { ...DEFAULT_CONTENT, ...((await kvGet("content")) || {}) }; },
    async saveContent(c) { await kvSet("content", { ...((await kvGet("content")) || {}), ...c }); },
    async loadMedia() { return { hero: "", about: "", ...((await kvGet("media")) || {}) }; },
    async saveMedia(key, v) { const m = (await kvGet("media")) || {}; m[key] = v; await kvSet("media", m); return v; },
    async loadAlbums() { return (await albums()).sort(byOrder); },
    async saveAlbum(a) {
      const al = await albums(); const i = al.findIndex(x => x.id === a.id);
      if (i >= 0) al[i] = { ...al[i], ...a }; else al.push({ count: 0, coverThumb: "", coverPhotoId: "", ...a });
      await kvSet("albums", al);
    },
    async deleteAlbum(id) {
      const ps = await photos();
      for (const p of ps.filter(p => p.albumId === id)) await kvDel("full:" + p.id);
      await kvSet("photos", ps.filter(p => p.albumId !== id));
      await kvSet("albums", (await albums()).filter(a => a.id !== id));
    },
    async reorderAlbums(list) {
      const al = await albums();
      list.forEach((a, i) => { const x = al.find(y => y.id === a.id); if (x) x.order = i; });
      await kvSet("albums", al);
    },
    async loadPhotos(albumId) { return (await photos()).filter(p => p.albumId === albumId).sort(byOrder); },
    async addPhoto(albumId, { thumb, full, w, h }, order) {
      const p = { id: uid8(), albumId, order, w, h, thumb: await blobToDataURL(thumb), createdAt: new Date().toISOString() };
      await kvSet("full:" + p.id, await blobToDataURL(full));
      const ps = await photos(); ps.push(p); await kvSet("photos", ps);
      await bumpCount(albumId, 1);
      return p;
    },
    async updatePhoto(id, { thumb, full, w, h }) {
      const ps = await photos();
      const p = ps.find(x => x.id === id);
      const thumbData = await blobToDataURL(thumb);
      if (p) { p.thumb = thumbData; p.w = w; p.h = h; await kvSet("photos", ps); }
      await kvSet("full:" + id, await blobToDataURL(full));
      return { thumb: thumbData, w, h };
    },
    async deletePhotos(list) {
      const ids = new Set(list.map(p => p.id));
      for (const p of list) { await kvDel("full:" + p.id); await bumpCount(p.albumId, -1); }
      await kvSet("photos", (await photos()).filter(p => !ids.has(p.id)));
    },
    async reorderPhotos(list) {
      const ps = await photos();
      list.forEach((p, i) => { const x = ps.find(y => y.id === p.id); if (x) x.order = i; });
      await kvSet("photos", ps);
    },
    async movePhoto(p, toAlbum, order) {
      const ps = await photos(); const x = ps.find(y => y.id === p.id);
      if (x) { x.albumId = toAlbum; x.order = order; await kvSet("photos", ps); }
      await bumpCount(p.albumId, -1); await bumpCount(toAlbum, 1);
    },
    async getFull(p) { return (await kvGet("full:" + p.id)) || p.thumb; },
    async getSnapshot() {
      return { content: await this.loadContent(), media: await this.loadMedia(), albums: await this.loadAlbums(), photos: await photos() };
    },
    async restoreSnapshot(s) {
      if (s.content) await kvSet("content", s.content);
      if (s.media) await kvSet("media", s.media);
      if (s.albums) await kvSet("albums", s.albums);
      if (s.photos) await kvSet("photos", s.photos);
    }
  };
}

export const api = MODE === "firebase" ? firebaseImpl() : cloudImpl();
