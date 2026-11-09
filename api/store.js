const { put, list, del } = require("@vercel/blob");
const crypto = require("crypto");

const DEFAULT_CONTENT = {
  brand: "Anna Lívia",
  brandSub: "MAKEUP",
  tagline: "Realce o que\nte faz única",
  heroCta: "Agendar horário",
  heroFeature1: "Maquiagem para todas as ocasiões",
  heroFeature2: "Beleza com técnica e autenticidade",
  heroFeature3: "Atendimento personalizado",
  heroSignature: "Studio Anna Lívia Makeup",
  aboutTitle: "Sobre",
  aboutText:
    "Sou a Anna Lívia, maquiadora e hairstylist. No meu estúdio, cada cliente tem um atendimento exclusivo, com tempo e atenção para criar uma produção que combine com ela.\n\nMeu trabalho é realçar a sua beleza natural, do primeiro clique à última dança.",
  aboutSignature: "Anna Lívia",
  whatsapp: "(35) 9752-0784",
  instagram: "annaliviaa_",
  address: "",
  hours: "A definir",
  homeExploreSub: "Explore",
  homeExploreTitle: "Serviços & Portfólio",
  showAgendamentos: true,
  cardAgendamentosTitle: "Agendamentos",
  cardAgendamentos: "Studio Anna Lívia Makeup",
  showMaquiagem: true,
  cardMaquiagemTitle: "Maquiagem",
  cardMaquiagem: "Noivas, debutantes, pré-wedding e formaturas.",
  coverMaquiagem: "",
  coverMaquiagemPhotoId: "",
  showPenteados: true,
  cardPenteadosTitle: "Penteados",
  cardPenteados: "Coque, tranças, semipreso e ondas.",
  coverPenteados: "",
  coverPenteadosPhotoId: "",
  showPortfolio: true,
  cardPortfolioTitle: "Portfólio",
  cardPortfolio: "Trabalhos realizados.",
  coverPortfolio: "",
  coverPortfolioPhotoId: "",
  showEstudio: true,
  cardEstudioTitle: "O Estúdio",
  cardEstudio: "Conheça nosso ambiente, bancada e estrutura.",
  coverEstudio: "",
  coverEstudioPhotoId: "",
  showCursos: true,
  cardCursosTitle: "Cursos",
  cardCursos: "Aprenda a se maquiar com a Anna.",
  cursosSoonBadge: "EM BREVE",
  showLocalizacao: true,
  cardLocalizacaoTitle: "Localização",
  cardLocalizacao: "Como chegar ao estúdio.",
  customRoutes: [],
  estudioTitle: "Nosso Estúdio",
  estudioIntro: "Um espaço pensado em cada detalhe para receber você com conforto, calma e exclusividade.",
  estudioText:
    "Nossa bancada conta com iluminação profissional planejada para valorizar cada detalhe da sua beleza, poltronas confortáveis e produtos selecionados de alta durabilidade.\n\nAqui cada cliente vive uma experiência acolhedoramente tranquila do início ao fim da produção.",
  estudioFeat1Title: "Bancada & Iluminação",
  estudioFeat1Text: "Iluminação planejada e produtos selecionados de alta fixação e acabamento impecável.",
  estudioFeat2Title: "Ambiente Acolhedor",
  estudioFeat2Text: "Espaço climatizado e confortável pensado para você relaxar antes do seu grande momento.",
  estudioFeat3Title: "Atendimento Exclusivo",
  estudioFeat3Text: "Hora marcada com tempo e atenção dedicados exclusivamente à sua produção.",
  estudioCta: "Agendar horário no estúdio",
  bookingTitle: "Agendamentos",
  bookingIntro: "Os horários são marcados pelo WhatsApp. Veja como funciona:",
  step1Title: "Envie uma mensagem",
  step1Text: "Conte a data, o horário do evento e o tipo de produção.",
  step2Title: "Confirme a disponibilidade",
  step2Text: "A Anna responde com os horários livres e os valores.",
  step3Title: "Garanta o seu horário",
  step3Text: "A reserva é confirmada após o sinal.",
  bookingCta: "Agendar pelo WhatsApp",
  bookingWaMsg: "Olá, Anna! Gostaria de agendar um horário.",
  maquiagemTitle: "Maquiagem",
  maquiagemIntro: "Escolha a ocasião para ver os trabalhos.",
  maquiagemCta: "Agendar maquiagem",
  penteadosTitle: "Penteados",
  penteadosIntro: "Escolha o estilo para ver os trabalhos.",
  penteadosCta: "Agendar penteado",
  portfolioTitle: "Portfólio",
  portfolioIntro: "Alguns dos trabalhos que já fiz. Veja muito mais no Instagram.",
  portfolioCta: "Quero uma produção assim",
  cursosTitle: "Cursos",
  cursosIntro: "Aprenda técnicas de automaquiagem e aperfeiçoamento profissional com a Anna Lívia.",
  cursosSoon: true,
  cursosText:
    "Os cursos de maquiagem estão sendo preparados. Deixe seu nome na lista pelo WhatsApp e seja avisada quando as turmas abrirem.",
  cursosWaitlistCta: "Quero ser avisada",
  courses: [],
  locationTitle: "Realce sua beleza para momentos especiais.",
  locationText: "O atendimento é feito no estúdio, com hora marcada.",
  locationCta: "Agendar horário",
  igBtnLabel: "Ver mais no Instagram",
  emptyGalleryText: "Novas fotos chegando em breve por aqui.",
  footerText: "Anna Lívia Makeup",
  colorPage: "#14110F",
  colorCol: "#231F1B",
  colorCard: "#342D27",
  colorGold: "#C8A96A",
  colorInk: "#F7F4EF"
};

const DEFAULT_ALBUMS = [
  { id: "noivas", group: "maquiagem", title: "Noivas", subtitle: "Para o grande dia",
    description: "Maquiagem pensada para o casamento, com teste prévio, alta fixação e acabamento impecável para fotos e filmagem, do altar à festa." },
  { id: "debutantes", group: "maquiagem", title: "Debutantes", subtitle: "Para os 15 anos",
    description: "Uma make com leveza e brilho na medida certa, que valoriza a idade e acompanha a debutante a noite inteira." },
  { id: "pre-wedding", group: "maquiagem", title: "Pré-wedding", subtitle: "Para o ensaio antes do casamento",
    description: "Maquiagem para o ensaio fotográfico do casal, pensada para luz natural e para ficar linda de perto e de longe nas fotos." },
  { id: "formatura", group: "maquiagem", title: "Formatura", subtitle: "Da colação ao baile",
    description: "Uma produção marcante que resiste à colação, às fotos e à festa, sem precisar de retoques." },
  { id: "eventos", group: "maquiagem", title: "Eventos", subtitle: "Convidadas, madrinhas e festas",
    description: "Para casamentos, aniversários, jantares e celebrações em que você quer estar impecável." },
  { id: "outras", group: "maquiagem", title: "Outras ocasiões", subtitle: "Ensaios e momentos especiais",
    description: "Ensaios fotográficos, gravações e qualquer momento que mereça uma produção especial." },
  { id: "coque", group: "penteados", title: "Coque", subtitle: "Clássico, baixo ou despojado",
    description: "Do coque polido ao mais solto e romântico, com acabamento firme que dura o evento todo." },
  { id: "trancas", group: "penteados", title: "Tranças", subtitle: "Delicadas e românticas",
    description: "Tranças embutidas, laterais ou em coroa, com ou sem acessórios." },
  { id: "semipreso", group: "penteados", title: "Semipreso", subtitle: "O melhor dos dois",
    description: "O equilíbrio entre o cabelo solto e a elegância de um preso." },
  { id: "ondas", group: "penteados", title: "Ondas", subtitle: "Movimento natural",
    description: "Ondas e babyliss com volume e movimento que se mantêm do início ao fim." },
  { id: "escova", group: "penteados", title: "Escova modelada", subtitle: "Liso com movimento",
    description: "Escova com pontas modeladas e brilho, para um visual clássico e elegante." },
  { id: "portfolio", group: "portfolio", title: "Portfólio", subtitle: "Trabalhos realizados",
    description: "" },
  { id: "estudio", group: "estudio", title: "O Estúdio", subtitle: "Ambiente, bancada e estrutura",
    description: "" }
].map((a, i) => ({ ...a, order: i, coverThumb: "", coverPhotoId: "", count: 0 }));

const STATE_PATH = "db/state-v1";
const ADMINS_PATH = "db/admins-v1";

const SECRET = crypto
  .createHash("sha256")
  .update(process.env.BLOB_READ_WRITE_TOKEN || "anna-livia-secret-key")
  .digest();

function hashPw(pw, salt = crypto.randomBytes(16).toString("hex")) {
  const h = crypto.scryptSync(String(pw), salt, 64).toString("hex");
  return `${salt}:${h}`;
}
function checkPw(pw, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, h] = stored.split(":");
  const test = crypto.scryptSync(String(pw), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(test, "hex"));
}
function signToken(payload) {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 86400 * 1000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}
function verifyToken(tok) {
  if (!tok || !tok.includes(".")) return null;
  const [data, sig] = tok.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  if (sig !== expected) return null;
  try {
    const p = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    return p.exp > Date.now() ? p : null;
  } catch (e) {
    return null;
  }
}

const memCache = {};

async function readJsonBlob(prefix, fallback, forWrite = false) {
  if (!forWrite && memCache[prefix] && (Date.now() - memCache[prefix].ts < 15000)) {
    return JSON.parse(JSON.stringify(memCache[prefix].data));
  }
  try {
    const { blobs } = await list({ prefix, limit: 30 });
    if (!blobs || !blobs.length) return fallback();
    blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime() || b.pathname.localeCompare(a.pathname));
    const newest = blobs[0];
    const r = await fetch(newest.url, { cache: "no-store" });
    if (!r.ok) {
      if (forWrite) throw new Error(`Armazenamento temporariamente indisponível (${r.status}).`);
      if (memCache[prefix]) return JSON.parse(JSON.stringify(memCache[prefix].data));
      return fallback();
    }
    const data = await r.json();
    memCache[prefix] = { data, ts: Date.now() };
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    console.error("readJsonBlob error:", e);
    if (forWrite) throw e;
    if (memCache[prefix]) return JSON.parse(JSON.stringify(memCache[prefix].data));
    return fallback();
  }
}

async function writeJsonBlob(prefix, obj) {
  const { blobs } = await list({ prefix, limit: 30 }).catch(() => ({ blobs: [] }));
  const key = `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}.json`;
  await put(key, JSON.stringify(obj), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
    cacheControlMaxAge: 0
  });
  memCache[prefix] = { data: obj, ts: Date.now() };
  if (blobs && blobs.length) {
    try { await del(blobs.map(b => b.url)); } catch (e) { console.warn("del old blobs:", e); }
  }
}

function defaultState() {
  return {
    content: { ...DEFAULT_CONTENT },
    media: { hero: "", about: "" },
    albums: DEFAULT_ALBUMS.map(a => ({ ...a })),
    photos: [],
    updatedAt: Date.now()
  };
}

async function getState(forWrite = false) {
  const s = await readJsonBlob(STATE_PATH, defaultState, forWrite);
  s.content = { ...DEFAULT_CONTENT, ...(s.content || {}) };
  if (!Array.isArray(s.content.courses)) s.content.courses = [];
  if (!Array.isArray(s.content.customRoutes)) s.content.customRoutes = [];
  s.media = { hero: "", about: "", ...(s.media || {}) };
  const albums = (s.albums && s.albums.length ? s.albums : DEFAULT_ALBUMS).slice();
  ["portfolio", "estudio"].forEach(reqId => {
    if (!albums.some(a => a.id === reqId)) {
      const def = DEFAULT_ALBUMS.find(a => a.id === reqId);
      if (def) albums.push({ ...def, order: albums.length });
    }
  });
  s.albums = albums.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  s.photos = (s.photos || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return s;
}

async function getAdmins() {
  return await readJsonBlob(ADMINS_PATH, () => ({ setupDone: false, admins: [] }));
}

async function uploadDataUrl(pathPrefix, dataUrl) {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return dataUrl;
  const buf = Buffer.from(m[2], "base64");
  const blob = await put(`${pathPrefix}-${Date.now()}.jpg`, buf, {
    access: "public",
    addRandomSuffix: true,
    contentType: m[1] || "image/jpeg",
    cacheControlMaxAge: 31536000
  });
  return blob.url;
}

function uid() {
  return crypto.randomBytes(6).toString("hex") + Date.now().toString(36).slice(-4);
}

function err(res, status, code, message) {
  res.status(status).json({ error: code, message });
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const q = req.query || {};
      if (q.action === "init") {
        const [st, ad] = await Promise.all([getState(), getAdmins()]);
        return res.status(200).json({ ...st, setupDone: !!ad.setupDone });
      }
      const st = await getState();
      return res.status(200).json(st);
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { action } = body;

    // Ações que não exigem sessão prévia
    if (action === "status") {
      const ad = await getAdmins();
      const tok = verifyToken((req.headers.authorization || "").replace(/^Bearer\s+/i, ""));
      let me = null;
      if (tok) {
        const u = ad.admins.find(x => x.uid === tok.uid && x.active !== false);
        if (u) me = { uid: u.uid, name: u.name, email: u.email, owner: u.owner, active: u.active };
      }
      return res.status(200).json({ setupDone: !!ad.setupDone, user: me });
    }

    if (action === "setupFirstAdmin") {
      const ad = await getAdmins();
      if (ad.setupDone && ad.admins.length) return err(res, 403, "setup-already-done", "O acesso principal já foi configurado.");
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!name || !email || password.length < 6) return err(res, 400, "auth/weak-password", "Preencha nome, e-mail e senha (mínimo 6 caracteres).");
      const user = { uid: uid(), name, email, pwHash: hashPw(password), active: true, owner: true, createdAt: Date.now() };
      ad.setupDone = true;
      ad.admins = [user];
      await writeJsonBlob(ADMINS_PATH, ad);
      const st = await getState();
      await writeJsonBlob(STATE_PATH, st);
      const token = signToken({ uid: user.uid, email: user.email });
      return res.status(200).json({ token, user: { uid: user.uid, name: user.name, email: user.email, owner: true, active: true } });
    }

    if (action === "signIn") {
      const ad = await getAdmins();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      const u = ad.admins.find(x => x.email.toLowerCase() === email);
      if (!u || !checkPw(password, u.pwHash)) return err(res, 401, "auth/invalid-credential", "E-mail ou senha incorretos.");
      if (u.active === false) return err(res, 403, "noaccess", "Este acesso foi desativado.");
      const token = signToken({ uid: u.uid, email: u.email });
      return res.status(200).json({ token, user: { uid: u.uid, name: u.name, email: u.email, owner: u.owner, active: u.active } });
    }

    // Demais ações exigem administrador autenticado
    const tok = verifyToken((req.headers.authorization || "").replace(/^Bearer\s+/i, ""));
    if (!tok) return err(res, 401, "permission-denied", "Sessão expirada. Entre novamente.");
    const ad = await getAdmins();
    const me = ad.admins.find(x => x.uid === tok.uid && x.active !== false);
    if (!me) return err(res, 403, "permission-denied", "Sem permissão.");

    if (action === "listAdmins") {
      return res.status(200).json({
        admins: ad.admins.map(({ pwHash, ...rest }) => rest)
      });
    }

    if (action === "createAdmin") {
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!name || !email) return err(res, 400, "auth/invalid-email", "Preencha nome e e-mail.");
      if (password.length < 6) return err(res, 400, "auth/weak-password", "A senha precisa ter pelo menos 6 caracteres.");
      if (ad.admins.some(x => x.email.toLowerCase() === email)) return err(res, 400, "auth/email-already-in-use", "Este e-mail já está cadastrado.");
      ad.admins.push({ uid: uid(), name, email, pwHash: hashPw(password), active: true, owner: false, createdAt: Date.now(), createdBy: me.uid });
      await writeJsonBlob(ADMINS_PATH, ad);
      return res.status(200).json({ ok: true });
    }

    if (action === "setAdminActive") {
      const target = ad.admins.find(x => x.uid === body.uid);
      if (!target || target.owner) return err(res, 400, "permission-denied", "Não é possível alterar o acesso principal.");
      target.active = !!body.active;
      await writeJsonBlob(ADMINS_PATH, ad);
      return res.status(200).json({ ok: true });
    }

    if (action === "adminSetPassword") {
      const target = ad.admins.find(x => x.uid === body.uid);
      const nw = String(body.newPassword || "");
      if (!target) return err(res, 404, "auth/user-not-found", "Usuário não encontrado.");
      if (nw.length < 6) return err(res, 400, "auth/weak-password", "A senha precisa ter pelo menos 6 caracteres.");
      target.pwHash = hashPw(nw);
      await writeJsonBlob(ADMINS_PATH, ad);
      return res.status(200).json({ ok: true });
    }

    if (action === "updateMyName") {
      me.name = String(body.name || "").trim() || me.name;
      await writeJsonBlob(ADMINS_PATH, ad);
      return res.status(200).json({ ok: true, name: me.name });
    }

    if (action === "changePassword") {
      if (!checkPw(body.currentPw, me.pwHash)) return err(res, 400, "auth/wrong-password", "Senha atual incorreta.");
      if (!body.newPw || String(body.newPw).length < 6) return err(res, 400, "auth/weak-password", "A nova senha precisa ter pelo menos 6 caracteres.");
      me.pwHash = hashPw(body.newPw);
      await writeJsonBlob(ADMINS_PATH, ad);
      return res.status(200).json({ ok: true });
    }

    // Operações no estado do site
    const st = await getState(true);

    if (action === "saveContent") {
      const next = { ...st.content, ...(body.content || {}) };
      if (Array.isArray(next.courses)) {
        for (const c of next.courses) {
          if (c && typeof c.image === "string" && c.image.startsWith("data:")) {
            c.image = await uploadDataUrl(`courses/${c.id || uid()}`, c.image);
          }
        }
      }
      st.content = next;
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true, content: st.content });
    }

    if (action === "saveMedia") {
      const key = body.key;
      const val = body.dataUrl;
      if (!["hero", "about"].includes(key)) return err(res, 400, "invalid-key", "Chave inválida.");
      if (!val) {
        st.media[key] = "";
      } else if (val.startsWith("data:")) {
        st.media[key] = await uploadDataUrl(`site/${key}`, val);
      } else {
        st.media[key] = val;
      }
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true, url: st.media[key], media: st.media });
    }

    if (action === "saveAlbum") {
      const a = body.album || {};
      const i = st.albums.findIndex(x => x.id === a.id);
      if (i >= 0) st.albums[i] = { ...st.albums[i], ...a };
      else st.albums.push({ count: 0, coverThumb: "", coverPhotoId: "", ...a });
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true, albums: st.albums });
    }

    if (action === "deleteAlbum") {
      const id = body.id;
      st.photos = st.photos.filter(p => p.albumId !== id);
      st.albums = st.albums.filter(a => a.id !== id);
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true });
    }

    if (action === "reorderAlbums") {
      const orderMap = new Map((body.ids || []).map((id, idx) => [id, idx]));
      st.albums.forEach(a => { if (orderMap.has(a.id)) a.order = orderMap.get(a.id); });
      st.albums.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true });
    }

    if (action === "addPhoto") {
      const pid = body.id || uid();
      const [thumbUrl, fullUrl] = await Promise.all([
        uploadDataUrl(`photos/${pid}-thumb`, body.thumb),
        uploadDataUrl(`photos/${pid}-full`, body.full)
      ]);
      const photo = {
        id: pid,
        albumId: body.albumId,
        order: body.order ?? st.photos.length,
        w: body.w || 800,
        h: body.h || 1000,
        thumbUrl,
        fullUrl,
        createdAt: Date.now()
      };
      st.photos.push(photo);
      const alb = st.albums.find(a => a.id === body.albumId);
      if (alb) {
        alb.count = st.photos.filter(p => p.albumId === alb.id).length;
        if (alb.coverPhotoId !== "none" && !alb.coverThumb) {
          alb.coverThumb = thumbUrl;
          alb.coverPhotoId = photo.id;
        }
      }
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true, photo, album: alb });
    }

    if (action === "updatePhoto") {
      const p = st.photos.find(x => x.id === body.id);
      if (!p) return err(res, 404, "not-found", "Foto não encontrada.");
      const [thumbUrl, fullUrl] = await Promise.all([
        uploadDataUrl(`photos/${p.id}-thumb`, body.thumb),
        uploadDataUrl(`photos/${p.id}-full`, body.full)
      ]);
      p.thumbUrl = thumbUrl;
      p.fullUrl = fullUrl;
      p.w = body.w || p.w;
      p.h = body.h || p.h;
      const alb = st.albums.find(a => a.id === p.albumId);
      if (alb && alb.coverPhotoId === p.id) alb.coverThumb = thumbUrl;
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true, photo: p });
    }

    if (action === "deletePhotos") {
      const ids = new Set(body.ids || []);
      st.photos = st.photos.filter(p => !ids.has(p.id));
      st.albums.forEach(a => {
        const list = st.photos.filter(p => p.albumId === a.id).sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
        a.count = list.length;
        if (a.coverPhotoId !== "none" && (!a.coverPhotoId || !list.some(p => p.id === a.coverPhotoId))) {
          a.coverPhotoId = list[0]?.id || "";
          a.coverThumb = list[0]?.thumbUrl || list[0]?.thumb || "";
        }
      });
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true });
    }

    if (action === "reorderPhotos") {
      const orderMap = new Map((body.ids || []).map((id, idx) => [id, idx]));
      st.photos.forEach(p => { if (orderMap.has(p.id)) p.order = orderMap.get(p.id); });
      st.photos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true });
    }

    if (action === "movePhoto") {
      const p = st.photos.find(x => x.id === body.id);
      if (p) {
        p.albumId = body.toAlbum;
        p.order = body.order ?? Date.now();
      }
      st.albums.forEach(a => {
        const list = st.photos.filter(x => x.albumId === a.id).sort((x, y) => (x.order ?? 0) - (y.order ?? 0));
        a.count = list.length;
        if (a.coverPhotoId !== "none" && (!a.coverPhotoId || !list.some(x => x.id === a.coverPhotoId))) {
          a.coverPhotoId = list[0]?.id || "";
          a.coverThumb = list[0]?.thumbUrl || list[0]?.thumb || "";
        }
      });
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true });
    }

    if (action === "restoreSnapshot") {
      const snap = body.snapshot || {};
      if (snap.content) st.content = { ...DEFAULT_CONTENT, ...snap.content };
      if (snap.media) st.media = { hero: "", about: "", ...snap.media };
      if (Array.isArray(snap.albums)) st.albums = snap.albums;
      if (Array.isArray(snap.photos)) st.photos = snap.photos;
      st.updatedAt = Date.now();
      await writeJsonBlob(STATE_PATH, st);
      return res.status(200).json({ ok: true, state: st });
    }

    return err(res, 400, "unknown-action", "Ação desconhecida: " + action);
  } catch (e) {
    console.error("API error:", e);
    return err(res, 500, "server-error", e.message || "Erro interno no servidor.");
  }
};
