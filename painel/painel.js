import { api, MODE, errMsg, blobToDataURL } from "./admin-api.js";
import { CONTENT_FORM, GROUPS, THEME_COLORS, DEFAULT_CONTENT, SITE_ROUTES } from "../js/defaults.js";
import { processPhoto, makeCover, processSiteImage, loadImage, compressCanvas } from "./image.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const content = $("#content");
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

const IC = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  grip: '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/></svg>',
  img: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16" rx="2"/><circle cx="9" cy="9.5" r="1.7"/><path d="M3.5 17l5-5 4 4 2.5-2.5 5.5 5.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
  move: '<svg viewBox="0 0 24 24"><path d="M3 7h6l2 2h10v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M12 14h6M15 11l3 3-3 3"/></svg>',
  cover: '<svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 17h8M8 13h8"/></svg>',
  check: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 12l3 3 5-6"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  zoom: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5"/></svg>',
  crop: '<svg viewBox="0 0 24 24"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
  rot: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/></svg>'
};

const st = { tab: "", albums: [], photos: [], selecting: false, sel: new Set(), dirty: false, uploading: 0, token: 0, sortables: [], undoStack: [] };

/* =============================== histórico / desfazer (Undo) =============================== */
function updateUndoBtn() {
  const b = $("#undoBtn");
  if (!b) return;
  b.hidden = st.undoStack.length === 0;
  if (st.undoStack.length) {
    const last = st.undoStack[st.undoStack.length - 1];
    b.title = `Desfazer: ${last.label}`;
    $("span", b).textContent = `Desfazer (${st.undoStack.length})`;
  }
}

async function recordUndo(label) {
  if (!api.getSnapshot) return;
  try {
    const snap = await api.getSnapshot();
    st.undoStack.push({ label, snap });
    if (st.undoStack.length > 15) st.undoStack.shift();
    updateUndoBtn();
  } catch (e) { console.warn("undo snapshot err", e); }
}

async function runUndo() {
  if (!st.undoStack.length || !api.restoreSnapshot) return;
  const { label, snap } = st.undoStack.pop();
  updateUndoBtn();
  const btn = $("#undoBtn");
  await busy(btn, async () => {
    try {
      await api.restoreSnapshot(snap);
      localStorage.removeItem("alm-cache-v1");
      toast(`Desfeito: ${label}`);
      st.albums = [];
      route();
    } catch (e) {
      toast(errMsg(e), "bad");
    }
  });
}

/* =============================== avisos e janelas =============================== */
let toastT;
function toast(msg, type = "ok") {
  const t = $("#toast");
  t.textContent = msg; t.className = "toast on " + type;
  clearTimeout(toastT); toastT = setTimeout(() => t.className = "toast " + type, type === "bad" ? 4500 : 2600);
}

function modal({ title = "", body = "", actions = [], sheet = false, onMount }) {
  return new Promise(resolve => {
    const ov = document.createElement("div");
    ov.className = "ov" + (sheet ? " sheet" : "");
    ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${title ? `<h3>${esc(title)}</h3>` : ""}<form class="mform" novalidate>${body}<p class="err" role="alert"></p><div class="acts"></div></form></div>`;
    const form = $(".mform", ov), acts = $(".acts", ov), err = $(".err", ov);
    if (!actions.length) { acts.remove(); err.remove(); }
    let done = false;
    const onKey = e => { if (e.key === "Escape") close(null); };
    function close(v) { if (done) return; done = true; ov.remove(); removeEventListener("keydown", onKey); resolve(v); }
    actions.forEach(a => {
      const b = document.createElement("button");
      b.type = a.primary ? "submit" : "button";
      b.className = "btn " + (a.cls || "");
      b.textContent = a.label;
      b.addEventListener("click", async e => {
        e.preventDefault();
        if (!a.run) return close(a.value);
        err.textContent = "";
        const old = b.innerHTML; b.disabled = true; b.innerHTML = '<i class="spin"></i>';
        try {
          const r = await a.run(form);
          if (r === false) { b.disabled = false; b.innerHTML = old; return; }
          close(r === undefined ? true : r);
        } catch (x) { console.error(x); err.textContent = errMsg(x); b.disabled = false; b.innerHTML = old; }
      });
      acts.appendChild(b);
    });
    form.addEventListener("submit", e => { e.preventDefault(); const p = $("button[type=submit]", acts); if (p) p.click(); });
    ov.addEventListener("click", e => { if (e.target === ov) close(null); });
    addEventListener("keydown", onKey);
    $("#modals").appendChild(ov);
    bindEyes(ov);
    if (onMount) onMount(ov, close, err);
    const f = $("input:not([type=checkbox]),textarea", ov);
    if (f && !sheet && matchMedia("(hover:hover)").matches) setTimeout(() => f.focus(), 60);
  });
}
const confirmBox = (title, text, ok = "Confirmar", danger = false) => modal({
  title, body: `<p>${text}</p>`,
  actions: [{ label: "Cancelar", value: false }, { label: ok, cls: danger ? "danger solid" : "primary", primary: true, value: true }]
});
function sheet(img, options) {
  const body = (img ? `<img class="pvimg" src="${esc(img)}" alt="">` : "") +
    options.map((o, i) => `<button type="button" class="opt ${o.cls || ""}" data-i="${i}">${o.icon || ""}<span>${esc(o.label)}</span></button>`).join("") +
    `<button type="button" class="opt cancel" data-i="-1">Cancelar</button>`;
  return modal({
    sheet: true, body,
    onMount(ov, close) {
      ov.addEventListener("click", e => {
        const b = e.target.closest(".opt"); if (!b) return;
        const i = +b.dataset.i; close(i >= 0 ? options[i].value : null);
      });
    }
  });
}
function bindEyes(root) {
  $$(".eye", root).forEach(b => b.onclick = () => {
    const i = b.previousElementSibling; i.type = i.type === "password" ? "text" : "password";
  });
}
async function busy(btn, fn) {
  const old = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<i class="spin"></i>';
  try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = old; }
}
const field = (name, label, type = "text", value = "", hint = "", extra = "") => {
  if (type === "checkbox") return `<label class="check"><input type="checkbox" name="${name}" ${value ? "checked" : ""}> ${esc(label)}</label>`;
  const input = type === "textarea"
    ? `<textarea name="${name}" ${extra}>${esc(value)}</textarea>`
    : type === "password"
      ? `<span class="pw"><input type="password" name="${name}" value="${esc(value)}" ${extra}><button type="button" class="eye" aria-label="Mostrar senha"></button></span>`
      : `<input type="${type}" name="${name}" value="${esc(value)}" ${extra}>`;
  return `<label>${esc(label)}${input}${hint ? `<span class="hint">${esc(hint)}</span>` : ""}</label>`;
};
const fv = (form, n) => (form.elements[n]?.value || "").trim();

/* =============================== entrada =============================== */
const screens = ["boot", "login", "setup", "app"];
const show = id => screens.forEach(s => $("#" + s).hidden = s !== id);

async function boot() {
  if (MODE === "demo") $("#demo").hidden = false;
  bindEyes(document);
  try { await api.init(); }
  catch (e) { console.error(e); $("#boot").innerHTML = `<p class="err" style="text-align:center;padding:20px">Não foi possível carregar o painel. Verifique a internet e a configuração do Firebase.<br><small>${esc(errMsg(e))}</small></p>`; return; }
  api.onAuth(async (user, reason) => {
    if (user) return enterApp();
    let setupDone = true;
    try { setupDone = await api.isSetupDone(); } catch (e) { console.error(e); }
    show(setupDone ? "login" : "setup");
    if (reason === "noaccess") $("#loginErr").textContent = "Este acesso não tem permissão ou foi desativado.";
  });
}

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, email = fv(f, "email"), pw = f.elements.password.value;
  $("#loginErr").textContent = "";
  if (!email || !pw) return $("#loginErr").textContent = "Preencha e-mail e senha.";
  await busy($("button[type=submit]", f), async () => {
    try { await api.signIn(email, pw); } catch (x) { $("#loginErr").textContent = errMsg(x); }
  });
});
$("#forgot").addEventListener("click", () => {
  modal({
    title: "Redefinir senha",
    body: `<p>Digite seu e-mail. Vamos enviar um link para você criar uma nova senha.</p>${field("email", "E-mail", "email", fv($("#loginForm"), "email"))}`,
    actions: [{ label: "Cancelar", value: null }, {
      label: "Enviar link", cls: "primary", primary: true, run: async f => {
        const em = fv(f, "email"); if (!em) throw { friendly: "Digite seu e-mail." };
        await api.resetPassword(em);
        toast(MODE === "demo" ? "No modo demonstração nenhum e-mail é enviado." : "Pronto! Confira sua caixa de entrada (e o spam).");
      }
    }]
  });
});
$("#setupForm").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, name = fv(f, "name"), email = fv(f, "email"), pw = f.elements.password.value;
  $("#setupErr").textContent = "";
  if (!name || !email || pw.length < 6) return $("#setupErr").textContent = "Preencha nome, e-mail e uma senha com pelo menos 6 caracteres.";
  await busy($("button[type=submit]", f), async () => {
    try { await api.setupFirstAdmin({ name, email, password: pw }); } catch (x) { $("#setupErr").textContent = errMsg(x); }
  });
});

let entered = false;
function enterApp() {
  show("app");
  if (entered) return;
  entered = true;
  $$("#tabs button").forEach(b => b.onclick = () => { location.hash = "#" + b.dataset.tab; });
  const ub = $("#undoBtn");
  if (ub) ub.onclick = () => runUndo();
  addEventListener("hashchange", onHash);
  addEventListener("beforeunload", e => { if (st.uploading || st.dirty) { e.preventDefault(); e.returnValue = ""; } });
  route();
}

let lastHash = location.hash;
async function onHash() {
  const nextTab = (location.hash.replace(/^#\/?/, "").split("/")[0]) || "fotos";
  if (st.dirty && st.tab === "textos" && nextTab !== "textos") {
    const r = await modal({
      title: "Salvar alterações?", body: "<p>Você alterou textos do site e ainda não salvou.</p>",
      actions: [{ label: "Descartar", value: "discard" }, { label: "Salvar", cls: "primary", primary: true, value: "save" }]
    });
    if (r === null) { history.replaceState(null, "", lastHash || "#textos"); return; }
    if (r === "save") { try { await saveTextos(); } catch (e) { toast(errMsg(e), "bad"); history.replaceState(null, "", "#textos"); return; } }
    st.dirty = false;
  }
  lastHash = location.hash;
  route();
}

function route() {
  if (!api.me()) return;
  const [tab = "fotos", sub] = location.hash.replace(/^#\/?/, "").split("/");
  const t = ["fotos", "cursos", "textos", "acessos", "conta"].includes(tab) ? tab : "fotos";
  st.tab = t; st.token++;
  st.sortables.forEach(s => s.destroy()); st.sortables = [];
  $("#savebar")?.remove(); $("#selbar")?.remove();
  st.selecting = false; st.sel.clear();
  $$("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === t));
  window.scrollTo(0, 0);
  if (t === "fotos") sub ? viewAlbum(decodeURIComponent(sub)) : viewAlbums();
  else if (t === "cursos") viewCursos();
  else if (t === "textos") viewTextos();
  else if (t === "acessos") viewAcessos();
  else viewConta();
}
const loading = () => { content.innerHTML = '<div style="display:grid;place-items:center;min-height:40vh"><i class="spin"></i></div>'; };
const failView = e => { console.error(e); content.innerHTML = `<div class="emptybox"><p>${esc(errMsg(e))}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></div>`; };

function heroPreviewHtml(src, c = DEFAULT_CONTENT) {
  const bg = src || "../imagens/capa.jpg";
  return `<div class="hero-pv-card" style="background-image:url('${esc(bg)}')">
    <div class="hp-txt">
      <strong>${esc(c.brand || DEFAULT_CONTENT.brand)}</strong>
      <small>${esc(c.brandSub || DEFAULT_CONTENT.brandSub)}</small>
      <span>${esc(c.tagline || DEFAULT_CONTENT.tagline)}</span>
      <i class="hp-btn" style="font-style:normal">${esc(c.heroCta || DEFAULT_CONTENT.heroCta)}</i>
    </div>
    <div class="hp-ft">
      <span>✦ Make</span><span>♡ Técnica</span><span>❀ Exclusivo</span>
    </div>
  </div>`;
}

/* =============================== GERENCIADOR DE ROTAS E MENU DO TOPO =============================== */
function renderRoutesManagerHtml(c) {
  const customRoutes = Array.isArray(c.customRoutes) ? c.customRoutes : [];
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px">
      <div>
        <b style="display:block;font-size:.98rem;color:var(--ink)">Menu do Topo e Rotas do Site (Ativar, Desativar ou Adicionar)</b>
        <span class="hint" style="margin:2px 0 0">Desative qualquer rota (como <b>Portfólio</b>, <b>O Estúdio</b> ou <b>Cursos</b>) para ocultá-la do site sem perder as fotos, e reative quando quiser com 1 clique. Você também pode criar novas rotas no topo do site!</span>
      </div>
      <button type="button" class="btn gold sm" data-route-add>${IC.plus} Nova rota no topo do site</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;margin-top:10px">
      ${SITE_ROUTES.map(r => {
        const on = c[r.key] !== false;
        const label = c[r.titleKey] || r.defaultTitle;
        return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 11px;border-radius:10px;border:1px solid ${on ? "#DCD2C2" : "#E8D5D5"};background:${on ? "#fff" : "#FAF3F3"}">
          <div style="min-width:0">
            <b style="display:block;font-size:.86rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(label)}</b>
            <small style="font-size:.72rem;color:${on ? "#255830" : "#8B2C2C"}">${on ? "✓ Visível no site e menu" : "✕ Desativada (oculta no site)"}</small>
          </div>
          <button type="button" class="btn sm ${on ? "danger" : "primary"}" data-route-toggle="${esc(r.key)}" data-route-label="${esc(label)}">${on ? "Desativar" : "Reativar"}</button>
        </div>`;
      }).join("")}
    </div>
    ${customRoutes.length ? `
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">
        <b style="display:block;font-size:.86rem;margin-bottom:8px">Rotas / Páginas Personalizadas Criadas por Você</b>
        <div style="display:grid;gap:8px">
          ${customRoutes.map((cr, idx) => {
            const on = cr.active !== false;
            const isLink = cr.type === "link";
            const alb = st.albums.find(a => a.id === cr.id);
            return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 12px;border-radius:10px;border:1px solid ${on ? "#DCD2C2" : "#E8D5D5"};background:${on ? "#fff" : "#FAF3F3"}">
              <div style="min-width:180px;flex:1">
                <b style="font-size:.9rem">${esc(cr.title)} ${on ? '<span class="badge">Visível no site</span>' : '<span class="badge off">Desativada</span>'}</b>
                <small style="display:block;font-size:.75rem;color:var(--muted)">${isLink ? `Link externo: ${esc(cr.url || "WhatsApp")}` : `Página com galeria no site (#/pagina/${esc(cr.id)}) · ${plural(alb?.count || 0, "foto", "fotos")}`}</small>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${!isLink ? `<a class="btn sm gold" href="#fotos/${encodeURIComponent(cr.id)}">${IC.img} Fotos (${alb?.count || 0})</a>` : ""}
                <button type="button" class="btn sm" data-croute-edit="${idx}">${IC.edit} Editar</button>
                <button type="button" class="btn sm ${on ? "" : "primary"}" data-croute-toggle="${idx}">${on ? "Desativar" : "Reativar"}</button>
                <button type="button" class="btn sm danger" data-croute-del="${idx}" title="Apagar rota">${IC.trash}</button>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>` : ""}`;
}

async function handleRouteManagerClick(e, c, onRefresh) {
  const toggleBtn = e.target.closest("[data-route-toggle]");
  if (toggleBtn) {
    const key = toggleBtn.dataset.routeToggle;
    const label = toggleBtn.dataset.routeLabel || key;
    const nextVal = c[key] === false ? true : false;
    await busy(toggleBtn, async () => {
      try {
        await recordUndo(`${nextVal ? "Reativar" : "Desativar"} rota ${label}`);
        await api.saveContent({ [key]: nextVal });
        c[key] = nextVal;
        if (loadedContent) loadedContent[key] = nextVal;
        const tf = $("#txtForm");
        if (tf && tf.elements[key]) tf.elements[key].checked = nextVal;
        localStorage.removeItem("alm-cache-v1");
        toast(nextVal ? `Rota “${label}” reativada no site!` : `Rota “${label}” desativada e ocultada do site!`);
        await onRefresh();
      } catch (x) { toast(errMsg(x), "bad"); }
    });
    return true;
  }
  if (e.target.closest("[data-route-add]")) {
    await openCustomRouteModal(null, -1, c, onRefresh);
    return true;
  }
  const crEdit = e.target.closest("[data-croute-edit]");
  if (crEdit) {
    const idx = +crEdit.dataset.crouteEdit;
    const list = Array.isArray(c.customRoutes) ? c.customRoutes : [];
    if (list[idx]) await openCustomRouteModal(list[idx], idx, c, onRefresh);
    return true;
  }
  const crToggle = e.target.closest("[data-croute-toggle]");
  if (crToggle) {
    const idx = +crToggle.dataset.crouteToggle;
    const list = Array.isArray(c.customRoutes) ? [...c.customRoutes] : [];
    if (!list[idx]) return true;
    await busy(crToggle, async () => {
      try {
        list[idx] = { ...list[idx], active: list[idx].active === false ? true : false };
        await recordUndo(`${list[idx].active ? "Reativar" : "Desativar"} rota ${list[idx].title}`);
        await api.saveContent({ customRoutes: list });
        c.customRoutes = list;
        if (loadedContent) loadedContent.customRoutes = list;
        localStorage.removeItem("alm-cache-v1");
        toast(list[idx].active ? `Rota “${list[idx].title}” reativada no site!` : `Rota “${list[idx].title}” desativada no site!`);
        await onRefresh();
      } catch (x) { toast(errMsg(x), "bad"); }
    });
    return true;
  }
  const crDel = e.target.closest("[data-croute-del]");
  if (crDel) {
    const idx = +crDel.dataset.crouteDel;
    const list = Array.isArray(c.customRoutes) ? [...c.customRoutes] : [];
    const target = list[idx];
    if (!target) return true;
    if (!(await confirmBox("Apagar rota?", `A rota <b>${esc(target.title)}</b> sairá do menu e do site. (Se quiser apenas esconder temporariamente, use o botão <b>Desativar</b>).`, "Apagar", true))) return true;
    await busy(crDel, async () => {
      try {
        await recordUndo(`Apagar rota ${target.title}`);
        list.splice(idx, 1);
        await api.saveContent({ customRoutes: list });
        if (target.type !== "link" && st.albums.some(a => a.id === target.id)) {
          await api.deleteAlbum(target.id);
          st.albums = st.albums.filter(a => a.id !== target.id);
        }
        c.customRoutes = list;
        if (loadedContent) loadedContent.customRoutes = list;
        localStorage.removeItem("alm-cache-v1");
        toast("Rota apagada");
        await onRefresh();
      } catch (x) { toast(errMsg(x), "bad"); }
    });
    return true;
  }
  return false;
}

async function openCustomRouteModal(existing, idx, c, onRefresh) {
  const isNew = !existing;
  const cr = existing ? { ...existing } : {
    id: "",
    title: "",
    subtitle: "",
    description: "",
    type: "page",
    url: "",
    ctaLabel: "Agendar pelo WhatsApp",
    inTopMenu: true,
    active: true
  };

  const savedId = await modal({
    title: isNew ? "Nova Rota / Página no Topo do Site" : `Editar Rota: ${cr.title}`,
    body: `
      ${field("title", "Nome no menu do topo e no cartão *", "text", cr.title, "Ex.: Dia da Noiva, Depoimentos, Produtos, Antes & Depois…", 'maxlength="40"')}
      <label>Tipo de rota
        <select name="type" id="crTypeSel">
          <option value="page" ${cr.type !== "link" ? "selected" : ""}>Página dentro do site (com fotos, texto e botão)</option>
          <option value="link" ${cr.type === "link" ? "selected" : ""}>Link direto (abre um site externo, Instagram ou WhatsApp)</option>
        </select>
      </label>
      ${field("subtitle", "Subtítulo (aparece no cartão da página inicial)", "text", cr.subtitle || "", "Ex.: Conheça nossos pacotes especiais", 'maxlength="80"')}
      <div id="crPageFields" ${cr.type === "link" ? "hidden" : ""}>
        ${field("description", "Texto / Descrição da página (aparece acima das fotos)", "textarea", cr.description || "")}
        ${field("ctaLabel", "Texto do botão no final da página", "text", cr.ctaLabel || "Agendar pelo WhatsApp")}
      </div>
      ${field("url", "Link de destino (opcional para página; obrigatório para Link direto)", "text", cr.url || "", "Deixe vazio para o botão abrir direto o seu WhatsApp.")}
      ${field("inTopMenu", "Mostrar no menu do topo do site", "checkbox", cr.inTopMenu !== false)}
      ${field("active", "Rota ativa (visível no site)", "checkbox", cr.active !== false)}`,
    actions: [{ label: "Cancelar", value: null }, {
      label: isNew ? "Criar rota no site" : "Salvar rota", cls: "primary", primary: true, run: async f => {
        const title = fv(f, "title");
        if (!title) throw { friendly: "Digite o nome da rota." };
        const type = f.elements.type.value;
        const id = cr.id || uniqueId(title);
        const updated = {
          id,
          title,
          type,
          subtitle: fv(f, "subtitle"),
          description: fv(f, "description"),
          ctaLabel: fv(f, "ctaLabel") || "Agendar pelo WhatsApp",
          url: fv(f, "url"),
          inTopMenu: f.elements.inTopMenu.checked,
          active: f.elements.active.checked
        };
        const list = Array.isArray(c.customRoutes) ? [...c.customRoutes] : [];
        if (isNew) list.push(updated);
        else if (idx >= 0) list[idx] = updated;

        await recordUndo(isNew ? `Criar rota ${title}` : `Editar rota ${title}`);
        await api.saveContent({ customRoutes: list });
        c.customRoutes = list;
        if (loadedContent) loadedContent.customRoutes = list;

        if (type === "page") {
          const existingAlb = st.albums.find(a => a.id === id);
          if (!existingAlb) {
            const newAlb = {
              id,
              group: "pagina",
              title,
              subtitle: updated.subtitle,
              description: updated.description,
              order: Math.max(0, ...st.albums.map(x => x.order || 0)) + 1,
              count: 0,
              coverThumb: "",
              coverPhotoId: ""
            };
            await api.saveAlbum(newAlb);
            st.albums.push(newAlb);
          } else {
            await api.saveAlbum({ id, title, subtitle: updated.subtitle, description: updated.description });
            Object.assign(existingAlb, { title, subtitle: updated.subtitle, description: updated.description });
          }
        }
        localStorage.removeItem("alm-cache-v1");
        return { id, type, isNew };
      }
    }],
    onMount(ov) {
      const sel = $("#crTypeSel", ov), pf = $("#crPageFields", ov);
      if (sel && pf) sel.onchange = () => { pf.hidden = sel.value === "link"; };
    }
  });

  if (savedId) {
    toast(savedId.isNew ? "Nova rota criada no site!" : "Rota atualizada no site!");
    await onRefresh();
  }
}

/* =============================== CAPA DA CATEGORIA PRINCIPAL (MAQUIAGEM / PENTEADOS / PORTFÓLIO / ESTÚDIO) =============================== */
function groupCoverKeys(group) {
  if (group === "maquiagem") return { coverKey: "coverMaquiagem", idKey: "coverMaquiagemPhotoId", label: "Maquiagem" };
  if (group === "penteados") return { coverKey: "coverPenteados", idKey: "coverPenteadosPhotoId", label: "Penteados" };
  if (group === "portfolio") return { coverKey: "coverPortfolio", idKey: "coverPortfolioPhotoId", label: "Portfólio" };
  if (group === "estudio") return { coverKey: "coverEstudio", idKey: "coverEstudioPhotoId", label: "O Estúdio" };
  return null;
}

function getEffectiveGroupCover(group, c, albums) {
  const keys = groupCoverKeys(group);
  if (!keys) return "";
  const val = c?.[keys.coverKey];
  if (val === "none") return "";
  if (val) return val;
  return albums.find(x => x.group === group && x.coverThumb)?.coverThumb || "";
}

async function setGroupCover(group, p) {
  const keys = groupCoverKeys(group);
  if (!keys) return;
  const coverThumb = p ? (p.thumbUrl ? p.thumbUrl : await blobToDataURL(await makeCover(p.thumb))) : "none";
  const photoId = p ? p.id : "";
  await recordUndo(`Alterar capa principal de ${keys.label}`);
  const patch = { [keys.coverKey]: coverThumb, [keys.idKey]: photoId };
  await api.saveContent(patch);
  if (!loadedContent) loadedContent = { ...DEFAULT_CONTENT };
  Object.assign(loadedContent, patch);
  localStorage.removeItem("alm-cache-v1");
}

async function chooseGroupCoverModal(group, c, onDone) {
  const keys = groupCoverKeys(group);
  if (!keys) return;
  const subAlbums = st.albums.filter(a => a.group === group);
  let sections = [];
  try {
    sections = await Promise.all(subAlbums.map(async a => ({
      album: a,
      photos: await api.loadPhotos(a.id).catch(() => [])
    })));
  } catch (e) {
    return toast(errMsg(e), "bad");
  }
  const totalPhotos = sections.reduce((acc, s) => acc + s.photos.length, 0);
  const curId = c?.[keys.idKey] || "";
  const curCover = getEffectiveGroupCover(group, c, st.albums);

  await modal({
    title: `Capa Principal de ${keys.label} (na Página Inicial)`,
    body: `
      <p style="margin-top:-4px">Escolha qual imagem das subcategorias será a <b>capa da categoria toda de ${esc(keys.label)}</b> na página inicial do site:</p>
      ${totalPhotos ? sections.map(({ album, photos }) => !photos.length ? "" : `
        <div style="margin-bottom:14px">
          <b style="display:block;font-size:.85rem;color:var(--muted);margin-bottom:6px">${esc(album.title)} (${plural(photos.length, "foto", "fotos")})</b>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px">
            ${photos.map(p => {
              const src = p.thumbUrl || p.thumb;
              const isSel = curId === p.id || (!curId && curCover && curCover === src);
              return `<button type="button" data-pick-pid="${esc(p.id)}" data-pick-aid="${esc(album.id)}" style="position:relative;aspect-ratio:4/5;border-radius:10px;overflow:hidden;border:${isSel ? "3px solid var(--gold)" : "1px solid var(--line)"};padding:0;cursor:pointer;background:#eee">
                <img src="${esc(src)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">
                ${isSel ? `<span style="position:absolute;inset:auto 0 0 0;background:rgba(200,169,106,.95);color:#1B1510;font-size:.62rem;font-weight:700;padding:2px 4px;text-align:center">★ Capa atual</span>` : ""}
              </button>`;
            }).join("")}
          </div>
        </div>
      `).join("") : `<div class="emptybox" style="margin-bottom:12px">${IC.img}<p>Adicione fotos em alguma subcategoria de <b>${esc(keys.label)}</b> primeiro para poder escolher a capa.</p></div>`}
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--line)">
        ${c?.[keys.coverKey] !== "none" ? `<button type="button" class="btn sm" data-pick-none>Usar apenas ícone (sem foto de capa)</button>` : `<span class="hint" style="margin:0">Atualmente usando apenas o ícone dourado (sem foto).</span>`}
        <button type="button" class="btn sm" data-pick-close>Fechar</button>
      </div>`,
    onMount(ov, close) {
      ov.onclick = async e => {
        if (e.target.closest("[data-pick-close]")) return close(null);
        const noneBtn = e.target.closest("[data-pick-none]");
        if (noneBtn) {
          await busy(noneBtn, async () => {
            await setGroupCover(group, null);
            if (c) { c[keys.coverKey] = "none"; c[keys.idKey] = ""; }
          });
          toast(`Capa de ${keys.label} alterada para ícone`);
          close(true);
          if (onDone) onDone();
          return;
        }
        const pickBtn = e.target.closest("[data-pick-pid]");
        if (pickBtn) {
          const pid = pickBtn.dataset.pickPid;
          const aid = pickBtn.dataset.pickAid;
          const sec = sections.find(s => s.album.id === aid);
          const photo = sec?.photos.find(x => x.id === pid);
          if (!photo) return;
          pickBtn.disabled = true;
          try {
            await setGroupCover(group, photo);
            if (c) {
              c[keys.coverKey] = loadedContent[keys.coverKey];
              c[keys.idKey] = loadedContent[keys.idKey];
            }
            toast(`Foto escolhida como capa principal de ${keys.label}!`);
            close(true);
            if (onDone) onDone();
          } catch (x) {
            pickBtn.disabled = false;
            toast(errMsg(x), "bad");
          }
        }
      };
    }
  });
}

/* =============================== FOTOS E ESTÚDIO =============================== */
const GROUP_ORDER = ["estudio", "portfolio", "maquiagem", "penteados"];

async function viewAlbums() {
  const tk = st.token; loading();
  let m = {}, c = DEFAULT_CONTENT;
  try { [st.albums, m, c] = await Promise.all([api.loadAlbums(), api.loadMedia().catch(() => ({})), api.loadContent().catch(() => DEFAULT_CONTENT)]); } catch (e) { return failView(e); }
  if (tk !== st.token) return;
  media = m || {};
  loadedContent = c;
  let stagedHero = null;

  const item = (a, drag) => `<li class="album" data-id="${esc(a.id)}">
      ${drag ? `<span class="handle" aria-label="Arraste para mudar a ordem">${IC.grip}</span>` : '<span class="handle"></span>'}
      <span class="cov" style="${a.coverThumb ? `background-image:url('${esc(a.coverThumb)}')` : ""}">${a.coverThumb ? "" : IC.img}</span>
      <span class="meta"><b>${esc(a.title)}</b><small>${plural(a.count || 0, "foto", "fotos")}${a.subtitle ? " · " + esc(a.subtitle) : ""}</small></span>${IC.chev}</li>`;

  function renderQuickHero() {
    const isStaged = stagedHero !== null;
    const val = isStaged ? stagedHero : media.hero;
    const src = val || "../imagens/capa.jpg";
    const badge = isStaged
      ? `<span class="badge" style="background:#FFF3CD;color:#7A5A00">Pronta para salvar</span>`
      : (media.hero ? `<span class="badge">Personalizada</span>` : `<span class="badge">Original</span>`);
    return `
      ${heroPreviewHtml(src, c)}
      <div style="flex:1;min-width:210px">
        <b style="display:block;font-size:1.05rem;margin-bottom:4px">Foto Principal de Entrada (Capa) ${badge}</b>
        <span class="hint" style="margin:0 0 10px">Você pode trocar apenas a foto de fundo — todos os textos sobre a imagem (<i>${esc(c.brand)} ${esc(c.brandSub)}</i>, frase e botão) são mantidos automaticamente!</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <span class="btn gold sm upl" style="position:relative;overflow:hidden">${IC.img} Trocar imagem da capa<input type="file" accept="image/*" id="quickHeroIn" style="position:absolute;inset:0;opacity:0;cursor:pointer"></span>
          ${val ? `<button type="button" class="btn sm danger" id="quickHeroReset">Voltar à foto original</button>` : ""}
          <a class="btn sm" href="#textos">${IC.edit} Editar textos ou cores</a>
          ${isStaged ? `<button type="button" class="btn primary sm" id="quickHeroSave">Salvar nova capa</button>` : ""}
        </div>
      </div>`;
  }

  function renderGroupCoverBar(g) {
    const keys = groupCoverKeys(g);
    if (!keys) return "";
    const coverSrc = getEffectiveGroupCover(g, c, st.albums);
    const isNone = c[keys.coverKey] === "none" || !coverSrc;
    const isCustom = !!(c[keys.coverKey] && c[keys.coverKey] !== "none");
    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:10px 12px;margin-bottom:10px;border-radius:12px;background:#FBF8F3;border:1px solid #E5DAC8">
      <div style="display:flex;align-items:center;gap:10px;min-width:200px;flex:1">
        <span class="cov" style="width:44px;height:44px;border-radius:8px;flex-shrink:0;${coverSrc ? `background-image:url('${esc(coverSrc)}')` : ""}">${coverSrc ? "" : IC.img}</span>
        <div>
          <b style="display:block;font-size:.86rem">Capa de ${esc(keys.label)} na página inicial ${isCustom ? '<span class="badge">Escolhida por você</span>' : (coverSrc ? '<span class="badge">Automática</span>' : '<span class="badge off">Sem capa (desativada)</span>')}</b>
          <small style="display:block;font-size:.75rem;color:var(--muted)">${coverSrc ? `Escolha qual imagem será a capa de <b>${esc(keys.label)}</b> ou desative para deixar sem capa.` : `Atualmente sem foto de capa (exibe apenas o ícone dourado no cartão).`}</small>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button type="button" class="btn sm gold" data-group-cover="${g}">${IC.cover} ${coverSrc ? "Trocar capa" : "Escolher capa"}</button>
        ${!isNone ? `<button type="button" class="btn sm danger" data-group-nocover="${g}">Desativar capa (deixar sem)</button>` : ""}
      </div>
    </div>`;
  }

  const groupRouteKey = { estudio: "showEstudio", portfolio: "showPortfolio", maquiagem: "showMaquiagem", penteados: "showPenteados" };
  const groupRouteTitle = { estudio: "O Estúdio", portfolio: "Portfólio", maquiagem: "Maquiagem", penteados: "Penteados" };
  const customPageAlbums = st.albums.filter(a => a.group === "pagina");

  content.innerHTML = `
    <div class="panel" id="quickHeroBox" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:16px;background:#FBF8F3;border-color:#E5DAC8">
      ${renderQuickHero()}
    </div>
    <div class="panel" id="routesMgrBox" style="margin-bottom:24px">
      ${renderRoutesManagerHtml(c)}
    </div>
    <h2 class="title">Fotos do Estúdio e Galerias</h2>
    <p class="help">Toque em <b>O Estúdio</b> ou em qualquer categoria abaixo para adicionar fotos, apagar, escolher a capa ou deixar sem capa.</p>
    ${GROUP_ORDER.map(g => {
      const list = st.albums.filter(a => a.group === g);
      const rKey = groupRouteKey[g];
      const isOn = c[rKey] !== false;
      const statusBadge = isOn ? `<span class="badge">Ativa no site</span>` : `<span class="badge off">Desativada no site (oculta)</span>`;
      const toggleBtn = `<button type="button" class="btn sm ${isOn ? "" : "primary"}" data-route-toggle="${rKey}" data-route-label="${groupRouteTitle[g]}">${isOn ? "Desativar no site" : "Reativar no site"}</button>`;
      if (g === "estudio") return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:22px;margin-bottom:8px"><h3 class="group" style="margin:0">O Estúdio (Ambiente, Bancada e Estrutura) ${statusBadge}</h3><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="btn sm" data-edit-estudio>${IC.edit} Editar textos do Estúdio</button>${toggleBtn}</div></div>
        ${renderGroupCoverBar(g)}
        <ul class="albums">${list.map(a => item(a, false)).join("")}</ul>`;
      if (g === "portfolio") return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:22px;margin-bottom:8px"><h3 class="group" style="margin:0">Portfólio Geral ${statusBadge}</h3>${toggleBtn}</div>
        ${renderGroupCoverBar(g)}
        <ul class="albums">${list.map(a => item(a, false)).join("")}</ul>`;
      return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:22px;margin-bottom:8px"><h3 class="group" style="margin:0">${GROUPS[g].label} ${statusBadge}</h3>${toggleBtn}</div>
        ${renderGroupCoverBar(g)}
        <ul class="albums" data-group="${g}">${list.map(a => item(a, true)).join("")}</ul>
        <button class="btn sm addalbum" data-add="${g}">${IC.plus} Nova categoria em ${GROUPS[g].label}</button>`;
    }).join("")}
    ${customPageAlbums.length ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:22px;margin-bottom:8px"><h3 class="group" style="margin:0">Páginas Personalizadas no Topo do Site</h3><button type="button" class="btn sm gold" data-route-add>${IC.plus} Nova rota no topo</button></div>
      <ul class="albums">${customPageAlbums.map(a => item(a, false)).join("")}</ul>` : ""}`;

  function bindQuickHero() {
    const box = $("#quickHeroBox");
    if (!box) return;
    const inp = $("#quickHeroIn", box);
    if (inp) inp.onchange = async e => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      try {
        const canvas = await openCropModal(f, 2 / 3, "Enquadrar foto da capa (o texto fica à esquerda)", c);
        if (!canvas) return;
        const { blob } = await compressCanvas(canvas, 1536, 420 * 1024, 0.85);
        stagedHero = await blobToDataURL(blob);
        box.innerHTML = renderQuickHero();
        bindQuickHero();
        toast("Prévia pronta! Clique em “Salvar nova capa” para publicar.");
      } catch (x) { toast(errMsg(x), "bad"); }
    };
    const rst = $("#quickHeroReset", box);
    if (rst) rst.onclick = () => {
      stagedHero = "";
      box.innerHTML = renderQuickHero();
      bindQuickHero();
      toast("Capa original selecionada. Clique em “Salvar nova capa” para confirmar.");
    };
    const sav = $("#quickHeroSave", box);
    if (sav) sav.onclick = e => busy(e.currentTarget, async () => {
      try {
        await recordUndo("Alterar foto da capa principal");
        await api.saveMedia("hero", stagedHero);
        media.hero = stagedHero;
        stagedHero = null;
        localStorage.removeItem("alm-cache-v1");
        box.innerHTML = renderQuickHero();
        bindQuickHero();
        toast("Capa principal publicada no site!");
      } catch (x) { toast(errMsg(x), "bad"); }
    });
  }
  bindQuickHero();

  content.onclick = async e => {
    if (await handleRouteManagerClick(e, c, viewAlbums)) return;
    const gcBtn = e.target.closest("[data-group-cover]");
    if (gcBtn) return chooseGroupCoverModal(gcBtn.dataset.groupCover, c, viewAlbums);
    const ncBtn = e.target.closest("[data-group-nocover]");
    if (ncBtn) {
      const g = ncBtn.dataset.groupNocover;
      const keys = groupCoverKeys(g);
      if (keys) {
        await busy(ncBtn, async () => {
          await setGroupCover(g, null);
          c[keys.coverKey] = "none";
          c[keys.idKey] = "";
        });
        toast(`Capa de ${keys.label} desativada (ficará sem foto)!`);
        viewAlbums();
      }
      return;
    }
    if (e.target.closest("[data-edit-estudio]")) return editEstudioTexts();
    const add = e.target.closest("[data-add]");
    if (add) return newAlbum(add.dataset.add);
    const li = e.target.closest(".album");
    if (li && !e.target.closest(".handle")) location.hash = "#fotos/" + encodeURIComponent(li.dataset.id);
  };
  $$("ul[data-group]").forEach(ul => st.sortables.push(Sortable.create(ul, {
    handle: ".handle", animation: 180, ghostClass: "sortable-ghost", chosenClass: "sortable-chosen",
    onEnd: async ev => {
      if (ev.oldIndex === ev.newIndex) return;
      const ids = $$("ul.albums li").map(li => li.dataset.id);
      const list = ids.map(id => st.albums.find(a => a.id === id)).filter(Boolean);
      try { await recordUndo("Ordem das categorias"); await api.reorderAlbums(list); list.forEach((a, i) => a.order = i); localStorage.removeItem("alm-cache-v1"); toast("Ordem salva"); }
      catch (x) { toast(errMsg(x), "bad"); viewAlbums(); }
    }
  })));
}

async function editEstudioTexts() {
  let c;
  try { c = await api.loadContent(); } catch (e) { return toast(errMsg(e), "bad"); }
  const sec = CONTENT_FORM.find(s => s.title.startsWith("O Estúdio"));
  if (!sec) return (location.hash = "#textos");
  const ok = await modal({
    title: "Textos e Informações do Estúdio",
    body: `<p style="margin-top:-4px">Edite os textos que aparecem acima das fotos do estúdio e bancada:</p>` +
      sec.fields.map(([k, label, type, hint]) => field(k, label, type, c[k], hint || "")).join(""),
    actions: [{ label: "Cancelar", value: false }, {
      label: "Salvar informações", cls: "primary", primary: true, run: async f => {
        const patch = {};
        sec.fields.forEach(([k, , type]) => {
          const el = f.elements[k];
          if (el) patch[k] = type === "checkbox" ? el.checked : el.value.trim();
        });
        await recordUndo("Editar informações do Estúdio");
        await api.saveContent(patch);
        localStorage.removeItem("alm-cache-v1");
        return true;
      }
    }]
  });
  if (ok) toast("Informações do Estúdio salvas no site!");
}

function slugify(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "categoria";
}
function uniqueId(title) {
  const base = slugify(title); let id = base, n = 2;
  while (st.albums.some(a => a.id === id) || ["estudio", "portfolio", "maquiagem", "penteados"].includes(id)) id = `${base}-${n++}`;
  return id;
}

async function newAlbum(group) {
  const id = await modal({
    title: `Nova categoria em ${GROUPS[group].label}`,
    body: field("title", "Nome", "text", "", "Ex.: Madrinhas", 'maxlength="40"') +
      field("subtitle", "Subtítulo (aparece no botão)", "text", "", "Ex.: Para as madrinhas do grande dia", 'maxlength="70"') +
      field("description", "Descrição (aparece acima das fotos)", "textarea"),
    actions: [{ label: "Cancelar", value: null }, {
      label: "Criar", cls: "primary", primary: true, run: async f => {
        const title = fv(f, "title"); if (!title) throw { friendly: "Dê um nome para a categoria." };
        const a = {
          id: uniqueId(title), group, title, subtitle: fv(f, "subtitle"), description: fv(f, "description"),
          order: Math.max(0, ...st.albums.map(x => x.order || 0)) + 1, count: 0, coverThumb: "", coverPhotoId: ""
        };
        await recordUndo(`Criar categoria ${title}`);
        await api.saveAlbum(a); st.albums.push(a); localStorage.removeItem("alm-cache-v1");
        return a.id;
      }
    }]
  });
  if (id) { toast("Categoria criada. Agora adicione as fotos!"); location.hash = "#fotos/" + encodeURIComponent(id); }
}

async function editAlbum(a) {
  if (a.group === "estudio") return editEstudioTexts();
  if (a.group === "pagina") {
    let c = loadedContent;
    try { if (!c) c = await api.loadContent(); } catch (e) { c = DEFAULT_CONTENT; }
    const list = Array.isArray(c.customRoutes) ? c.customRoutes : [];
    const idx = list.findIndex(x => x && x.id === a.id);
    if (idx >= 0) {
      await openCustomRouteModal(list[idx], idx, c, () => renderAlbum(a));
      return;
    }
  }
  const isPf = a.group === "portfolio";
  const r = await modal({
    title: "Editar categoria",
    body: field("title", "Nome", "text", a.title, "", 'maxlength="40"') +
      (isPf ? `<p class="hint" style="margin-top:-6px">O texto de introdução do Portfólio é editado na aba Capa, Cores & Textos.</p>` :
        field("subtitle", "Subtítulo (aparece no botão)", "text", a.subtitle, "", 'maxlength="70"') +
        field("description", "Descrição (aparece acima das fotos)", "textarea", a.description)) +
      (isPf ? "" : `<button type="button" class="btn danger block" data-del style="margin:6px 0 4px">${IC.trash} Apagar esta categoria</button>`),
    actions: [{ label: "Cancelar", value: null }, {
      label: "Salvar", cls: "primary", primary: true, run: async f => {
        const title = fv(f, "title"); if (!title) throw { friendly: "O nome não pode ficar vazio." };
        const patch = { id: a.id, title };
        if (!isPf) { patch.subtitle = fv(f, "subtitle"); patch.description = fv(f, "description"); }
        await recordUndo(`Editar categoria ${a.title}`);
        await api.saveAlbum(patch); Object.assign(a, patch); localStorage.removeItem("alm-cache-v1");
        return "saved";
      }
    }],
    onMount(ov, close) { const d = $("[data-del]", ov); if (d) d.onclick = () => close("delete"); }
  });
  if (r === "saved") { toast("Categoria atualizada"); renderAlbum(a); }
  if (r === "delete") {
    const n = st.photos.length;
    const ok = await confirmBox("Apagar categoria?", `A categoria <b>${esc(a.title)}</b>${n ? ` e ${plural(n, "foto", "fotos")}` : ""} vão sair do site. Isso não pode ser desfeito.`, "Apagar", true);
    if (!ok) return;
    try { loading(); await recordUndo(`Apagar categoria ${a.title}`); await api.deleteAlbum(a.id); localStorage.removeItem("alm-cache-v1"); toast("Categoria apagada"); location.hash = "#fotos"; }
    catch (e) { toast(errMsg(e), "bad"); renderAlbum(a); }
  }
}

/* =============================== FOTOS: dentro da categoria =============================== */
let current = null, dragging = false;

async function viewAlbum(id) {
  const tk = st.token; loading();
  try {
    if (!st.albums.length) st.albums = await api.loadAlbums();
    if (!loadedContent) loadedContent = await api.loadContent().catch(() => DEFAULT_CONTENT);
    current = st.albums.find(a => a.id === id);
    if (!current) { location.replace("#fotos"); return; }
    st.photos = await api.loadPhotos(id);
  } catch (e) { return failView(e); }
  if (tk !== st.token) return;
  if ((current.count || 0) !== st.photos.length) {     // corrige o contador, se preciso
    current.count = st.photos.length;
    api.saveAlbum({ id: current.id, count: current.count }).catch(() => { });
  }
  renderAlbum(current);
}

const tileHtml = (p, i, a) => {
  const gKeys = groupCoverKeys(a.group);
  const isGroupCover = gKeys && loadedContent && loadedContent[gKeys.idKey] === p.id;
  const isSubGroup = a.group === "maquiagem" || a.group === "penteados";
  return `<div class="tile" data-id="${esc(p.id)}">
  <img src="${esc(p.thumbUrl || p.thumb)}" alt="" loading="lazy">
  ${i === 0 ? '<span class="tag">Destaque</span>' : ""}
  ${a.coverPhotoId === p.id ? `<span class="tag cv">${isSubGroup ? "Capa da subcategoria" : "Capa"}</span>` : ""}
  ${isGroupCover ? `<span class="tag cv" style="top:auto;bottom:28px;left:6px;background:rgba(200,169,106,.95);color:#1B1510">★ Capa de ${esc(gKeys.label)}</span>` : ""}
  <span class="num">${i + 1}</span>
  <button class="del" type="button" aria-label="Apagar foto">${IC.trash}</button></div>`;
};

function renderAlbum(a) {
  if (st.tab !== "fotos" || current !== a) return;
  st.sortables.forEach(s => s.destroy()); st.sortables = [];
  $("#selbar")?.remove(); st.selecting = false; st.sel.clear();
  const n = st.photos.length;
  const siteUrl = a.group === "portfolio" ? "../#/portfolio" : (a.group === "estudio" ? "../#/estudio" : (a.group === "pagina" ? `../#/pagina/${encodeURIComponent(a.id)}` : `../#/${a.group}/${encodeURIComponent(a.id)}`));
  content.innerHTML = `
    <button class="backbtn" data-act="back">${IC.back} Todas as categorias</button>
    <div class="ahead">
      <span class="cov" style="${a.coverThumb ? `background-image:url('${esc(a.coverThumb)}')` : ""}">${a.coverThumb ? "" : IC.img}</span>
      <div class="grow"><h2 class="title">${esc(a.title)} ${!a.coverThumb ? '<span class="badge off">Sem capa</span>' : ""}</h2><p>${GROUPS[a.group]?.label || ""} · ${plural(n, "foto", "fotos")}</p></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${a.coverThumb ? `<button class="btn sm danger" data-act="nocover" title="Deixar sem foto de capa">Desativar capa (deixar sem)</button>` : ""}
        <button class="btn sm" data-act="edit" title="Editar textos">${IC.edit} ${a.group === "estudio" ? "Editar textos do Estúdio" : "Editar textos"}</button>
      </div>
    </div>
    <div class="toolbar">
      <span class="btn gold upl">${IC.plus} Adicionar fotos<input type="file" accept="image/*" multiple id="fileIn" aria-label="Escolher fotos"></span>
      ${n > 1 ? `<button class="btn" data-act="select">${IC.check} Selecionar</button>` : ""}
      <a class="btn" href="${siteUrl}" target="_blank" rel="noopener">${IC.ext} Ver no site</a>
    </div>
    ${n ? `<p class="help">Arraste uma foto para mudar a ordem${matchMedia("(hover:hover)").matches ? "" : " (toque e segure)"}. A <b>primeira</b> aparece em destaque no site. Toque numa foto para escolher ou desativar a capa.</p>
      <div class="pgrid" id="grid">${st.photos.map((p, i) => tileHtml(p, i, a)).join("")}</div>`
      : `<div class="emptybox" id="emptybox">${IC.img}<p>Nenhuma foto nesta seção ainda.<br>Toque em <b>Adicionar fotos</b> para escolher fotos ${a.group === "estudio" ? "do estúdio, bancada e ambiente" : "do celular ou do computador"}.</p></div><div class="pgrid" id="grid"></div>`}`;

  content.onclick = async e => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "back") return (location.hash = "#fotos");
    if (act === "edit") return editAlbum(a);
    if (act === "nocover") {
      try {
        await clearAlbumCover(a);
        toast(`Capa de ${a.title} desativada (sem foto de capa)!`);
        renderAlbum(a);
      } catch (x) { toast(errMsg(x), "bad"); }
      return;
    }
    if (act === "select") return toggleSelect(true);
    const tile = e.target.closest(".tile:not(.up)");
    if (!tile || dragging) return;
    const p = st.photos.find(x => x.id === tile.dataset.id);
    if (!p) return;
    if (st.uploading) return toast("Aguarde o envio das fotos terminar.", "bad");
    if (st.selecting) {
      st.sel.has(p.id) ? st.sel.delete(p.id) : st.sel.add(p.id);
      tile.classList.toggle("sel"); updateSelbar(); return;
    }
    if (e.target.closest(".del")) return deletePhotos([p]);
    photoMenu(p);
  };
  $("#fileIn").onchange = e => { const files = [...e.target.files]; e.target.value = ""; uploadFiles(files, a); };

  const grid = $("#grid");
  if (n > 1) st.sortables.push(Sortable.create(grid, {
    animation: 180, delay: 220, delayOnTouchOnly: true, touchStartThreshold: 8,
    draggable: ".tile:not(.up)", ghostClass: "sortable-ghost", chosenClass: "sortable-chosen",
    onStart: () => { dragging = true; },
    onEnd: async ev => {
      setTimeout(() => dragging = false, 80);
      if (ev.oldIndex === ev.newIndex) return;
      const ids = $$(".tile[data-id]", grid).map(t => t.dataset.id);
      st.photos = ids.map(id => st.photos.find(p => p.id === id)).filter(Boolean);
      await saveOrder(a);
    }
  }));
}

async function saveOrder(a) {
  try { await recordUndo("Ordem das fotos"); await api.reorderPhotos(st.photos); st.photos.forEach((p, i) => p.order = i); localStorage.removeItem("alm-cache-v1"); toast("Ordem salva"); }
  catch (e) { toast(errMsg(e), "bad"); }
  renderAlbum(a);
}

function toggleSelect(on) {
  st.selecting = on; st.sel.clear();
  $("#grid")?.classList.toggle("selecting", on);
  $$(".tile.sel").forEach(t => t.classList.remove("sel"));
  st.sortables.forEach(s => s.option("disabled", on));
  $("#selbar")?.remove();
  if (!on) return;
  const bar = document.createElement("div");
  bar.className = "selbar"; bar.id = "selbar";
  bar.innerHTML = `<span id="selN">Toque nas fotos</span><button class="btn sm danger solid" id="selDel" disabled>${IC.trash} Apagar</button><button class="btn sm" id="selX">Cancelar</button>`;
  document.body.appendChild(bar);
  $("#selX").onclick = () => toggleSelect(false);
  $("#selDel").onclick = () => deletePhotos(st.photos.filter(p => st.sel.has(p.id)));
}
function updateSelbar() {
  const n = st.sel.size;
  $("#selN").textContent = n ? plural(n, "selecionada", "selecionadas") : "Toque nas fotos";
  $("#selDel").disabled = !n;
}

async function photoMenu(p) {
  const a = current, i = st.photos.indexOf(p);
  const opts = [];
  const gKeys = groupCoverKeys(a.group);
  const isSubGroup = a.group === "maquiagem" || a.group === "penteados";
  const isGroupCover = gKeys && loadedContent && loadedContent[gKeys.idKey] === p.id;
  if (isSubGroup) {
    if (a.coverPhotoId !== p.id) opts.push({ label: `Usar como capa desta subcategoria (${a.title})`, icon: IC.cover, value: "cover" });
    else opts.push({ label: `Desativar capa desta subcategoria (deixar sem capa)`, icon: IC.cover, value: "nocover" });
    if (!isGroupCover) {
      opts.push({ label: `★ Usar como capa principal de ${gKeys.label} (na página inicial)`, icon: IC.star, value: "groupCover" });
    } else {
      opts.push({ label: `Desativar capa principal de ${gKeys.label} (deixar sem capa)`, icon: IC.star, value: "noGroupCover" });
    }
  } else {
    if (a.coverPhotoId !== p.id) opts.push({ label: "Usar como capa desta seção", icon: IC.cover, value: "cover" });
    else opts.push({ label: "Desativar capa desta seção (deixar sem capa)", icon: IC.cover, value: "nocover" });
  }
  if (i > 0) opts.push({ label: "Mover para o início (destaque)", icon: IC.up, value: "first" });
  if (i < st.photos.length - 1) opts.push({ label: "Mover para o fim", icon: IC.down, value: "last" });
  opts.push({ label: "Ajustar enquadramento / cortar", icon: IC.crop, value: "crop" });
  opts.push({ label: "Ver foto inteira", icon: IC.zoom, value: "view" });
  opts.push({ label: "Mover para outra categoria", icon: IC.move, value: "move" });
  opts.push({ label: "Apagar foto", icon: IC.trash, value: "delete", cls: "red" });
  const v = await sheet(p.thumbUrl || p.thumb, opts);
  try {
    if (v === "cover") {
      await setCover(a, p);
      if (a.group === "portfolio" || a.group === "estudio") await setGroupCover(a.group, p);
      toast(isSubGroup ? `Capa de ${a.title} atualizada!` : "Capa atualizada!");
      renderAlbum(a);
    }
    if (v === "nocover") {
      await clearAlbumCover(a);
      toast(isSubGroup ? `Subcategoria ${a.title} agora está sem capa!` : "Capa desativada!");
      renderAlbum(a);
    }
    if (v === "groupCover" && gKeys) {
      await setGroupCover(a.group, p);
      toast(`Capa principal de ${gKeys.label} atualizada na página inicial!`);
      renderAlbum(a);
    }
    if (v === "noGroupCover" && gKeys) {
      await setGroupCover(a.group, null);
      toast(`Capa principal de ${gKeys.label} desativada (sem foto)!`);
      renderAlbum(a);
    }
    if (v === "first" || v === "last") {
      st.photos.splice(i, 1);
      v === "first" ? st.photos.unshift(p) : st.photos.push(p);
      await saveOrder(a);
    }
    if (v === "crop") await cropPhoto(p, a);
    if (v === "view") viewFull(p);
    if (v === "move") movePhoto(p);
    if (v === "delete") deletePhotos([p]);
  } catch (e) { toast(errMsg(e), "bad"); }
}

async function openCropModal(src, ratio = 4 / 5, title = "Ajustar enquadramento", heroText = null) {
  let img = await loadImage(src);
  let z = 1, nx = 0, ny = 0;
  function clamp() {
    const iw0 = img.naturalWidth || img.width, ih0 = img.naturalHeight || img.height;
    const s = Math.max(ratio / iw0, 1 / ih0) * z;
    const iw = iw0 * s, ih = ih0 * s;
    const mx = Math.max(0, (iw - ratio) / 2) / ratio, my = Math.max(0, (ih - 1) / 2);
    nx = Math.max(-mx, Math.min(mx, nx)); ny = Math.max(-my, Math.min(my, ny));
  }
  function paint(c, w, h) {
    const iw0 = img.naturalWidth || img.width, ih0 = img.naturalHeight || img.height;
    c.fillStyle = "#332E29"; c.fillRect(0, 0, w, h);
    const s = Math.max(w / iw0, h / ih0) * z;
    const iw = iw0 * s, ih = ih0 * s;
    c.imageSmoothingQuality = "high";
    c.drawImage(img, w / 2 + nx * w - iw / 2, h / 2 + ny * h - ih / 2, iw, ih);
  }
  const heroOverlay = heroText ? `<div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(95deg,rgba(24,17,12,.7) 0%,rgba(24,17,12,.3) 48%,transparent 75%),linear-gradient(180deg,transparent 60%,rgba(18,14,11,.85) 90%);color:#F5E0C7">
    <div style="position:absolute;left:5%;top:22%;width:55%;text-align:center">
      <div style="font-family:var(--serif);font-size:1.35rem;line-height:1">${esc(heroText.brand || DEFAULT_CONTENT.brand)}</div>
      <div style="font-size:.5rem;letter-spacing:.38em;margin:4px 0 6px;color:#EBD3BA">${esc(heroText.brandSub || DEFAULT_CONTENT.brandSub)}</div>
      <div style="font-size:.44rem;letter-spacing:.25em;text-transform:uppercase;line-height:1.5;white-space:pre-line;color:#EBD3BA">${esc(heroText.tagline || DEFAULT_CONTENT.tagline)}</div>
      <div style="display:inline-block;margin-top:8px;padding:3px 8px;border:1px solid rgba(230,194,154,.75);border-radius:999px;font-size:.42rem;letter-spacing:.18em;text-transform:uppercase">${esc(heroText.heroCta || DEFAULT_CONTENT.heroCta)}</div>
    </div>
    <div style="position:absolute;left:6%;right:6%;bottom:7%;border-top:1px solid rgba(217,180,143,.4);padding-top:5px;display:flex;justify-content:space-around;font-size:.4rem;letter-spacing:.15em;text-transform:uppercase;color:#EBD3BA">
      <span>✦ Destaques</span><span>♡ Técnica</span><span>❀ Atendimento</span>
    </div>
  </div>` : "";
  try {
    return await modal({
      title,
      body: `<p style="margin-top:-4px">${heroText ? "Arraste a foto para posicionar o rosto à direita — os textos à esquerda e no rodapé serão mantidos sobre a foto:" : "Arraste a foto para posicionar e use o zoom para aproximar."}</p>
        <div class="crop-stage" id="cStage"><canvas id="cCv"></canvas>${heroOverlay}<div class="grid"></div></div>
        <div class="crop-bar"><span style="font-size:.76rem;color:var(--muted)">Zoom</span><input type="range" id="cZoom" min="1" max="4" step="0.01" value="1"></div>
        <div style="display:flex;gap:8px;margin-bottom:6px">
          <button type="button" class="btn sm" id="cRot">${IC.rot} Girar</button>
          <button type="button" class="btn sm" id="cReset">Centralizar</button>
        </div>`,
      actions: [{ label: "Cancelar", value: null }, {
        label: "Salvar ajuste", cls: "primary", primary: true, run: async () => {
          const long = 1600;
          const w = ratio >= 1 ? long : Math.round(long * ratio);
          const h = ratio >= 1 ? Math.round(long / ratio) : long;
          const out = document.createElement("canvas");
          out.width = w; out.height = h;
          paint(out.getContext("2d"), w, h);
          return out;
        }
      }],
      onMount(ov) {
        const stage = $("#cStage", ov), cv = $("#cCv", ov), ctx = cv.getContext("2d"), zoom = $("#cZoom", ov);
        function size() {
          const maxH = Math.min(window.innerHeight * 0.44, 360);
          const w = Math.min(stage.parentElement.clientWidth || 320, maxH * ratio);
          stage.style.width = w + "px"; stage.style.aspectRatio = String(ratio);
          const d = window.devicePixelRatio || 1;
          cv.width = Math.round(w * d); cv.height = Math.round((w / ratio) * d);
          paint(ctx, cv.width, cv.height);
        }
        setTimeout(size, 20);
        zoom.oninput = () => { z = +zoom.value; clamp(); paint(ctx, cv.width, cv.height); };
        $("#cReset", ov).onclick = () => { z = 1; nx = 0; ny = 0; zoom.value = 1; paint(ctx, cv.width, cv.height); };
        $("#cRot", ov).onclick = () => {
          const iw0 = img.naturalWidth || img.width, ih0 = img.naturalHeight || img.height;
          const c = document.createElement("canvas"); c.width = ih0; c.height = iw0;
          const x = c.getContext("2d"); x.translate(c.width / 2, c.height / 2); x.rotate(Math.PI / 2); x.drawImage(img, -iw0 / 2, -ih0 / 2);
          img = c; nx = 0; ny = 0; clamp(); paint(ctx, cv.width, cv.height);
        };
        const pts = new Map(); let pinch = null;
        stage.addEventListener("pointerdown", e => {
          stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
          stage.classList.add("drag");
          if (pts.size === 2) { const a = [...pts.values()]; pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), z }; }
        });
        stage.addEventListener("pointermove", e => {
          if (!pts.has(e.pointerId)) return;
          const p = pts.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y;
          pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pts.size === 2 && pinch) {
            const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
            z = Math.max(1, Math.min(4, pinch.z * d / pinch.d)); zoom.value = z;
          } else {
            nx += dx / (stage.clientWidth || 1); ny += dy / (stage.clientHeight || 1);
          }
          clamp(); paint(ctx, cv.width, cv.height);
        });
        const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) stage.classList.remove("drag"); };
        stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
        stage.addEventListener("wheel", e => {
          e.preventDefault(); z = Math.max(1, Math.min(4, z * (e.deltaY < 0 ? 1.06 : 1 / 1.06))); zoom.value = z; clamp(); paint(ctx, cv.width, cv.height);
        }, { passive: false });
      }
    });
  } finally {
    if (src instanceof Blob && img && img.src) URL.revokeObjectURL(img.src);
  }
}

async function cropPhoto(p, a) {
  const fullSrc = await api.getFull(p);
  const canvas = await openCropModal(fullSrc, 4 / 5, "Ajustar foto");
  if (!canvas) return;
  await recordUndo("Ajustar foto");
  const full = await compressCanvas(canvas, 1600, 680 * 1024, 0.85);
  const thumb = await compressCanvas(canvas, 900, 150 * 1024, 0.8);
  const updated = await api.updatePhoto(p.id, { thumb: thumb.blob, full: full.blob, w: full.w, h: full.h });
  Object.assign(p, updated);
  if (a.coverPhotoId === p.id) await setCover(a, p);
  const gKeys = groupCoverKeys(a.group);
  if (gKeys && loadedContent && loadedContent[gKeys.idKey] === p.id) {
    await setGroupCover(a.group, p);
  }
  localStorage.removeItem("alm-cache-v1");
  toast("Foto ajustada");
  renderAlbum(a);
}

async function viewFull(p) {
  modal({
    sheet: true,
    body: `<img class="pvimg" style="max-height:78vh" src="${esc(p.thumbUrl || p.thumb)}" alt=""><button type="button" class="opt cancel">Fechar</button>`,
    onMount(ov, close) {
      $(".cancel", ov).onclick = () => close();
      api.getFull(p).then(src => { const im = $(".pvimg", ov); if (im && src) im.src = src; }).catch(() => { });
    }
  });
}

async function setCover(a, p) {
  await recordUndo(`Alterar capa de ${a.title}`);
  const coverThumb = p.thumbUrl ? p.thumbUrl : await blobToDataURL(await makeCover(p.thumb));
  await api.saveAlbum({ id: a.id, coverThumb, coverPhotoId: p.id });
  a.coverThumb = coverThumb; a.coverPhotoId = p.id;
  localStorage.removeItem("alm-cache-v1");
}
async function clearAlbumCover(a) {
  await recordUndo(`Desativar capa de ${a.title}`);
  await api.saveAlbum({ id: a.id, coverThumb: "", coverPhotoId: "none" });
  a.coverThumb = "";
  a.coverPhotoId = "none";
  if (a.group === "portfolio" || a.group === "estudio") {
    const keys = groupCoverKeys(a.group);
    if (keys) {
      await api.saveContent({ [keys.coverKey]: "none", [keys.idKey]: "" });
      if (!loadedContent) loadedContent = { ...DEFAULT_CONTENT };
      loadedContent[keys.coverKey] = "none";
      loadedContent[keys.idKey] = "";
    }
  }
  localStorage.removeItem("alm-cache-v1");
}
async function fixCover(a) {
  if (a.coverPhotoId === "none") return;
  if (a.coverPhotoId && st.photos.some(p => p.id === a.coverPhotoId)) return;
  if (st.photos.length) await setCover(a, st.photos[0]);
  else if (a.coverThumb || a.coverPhotoId) { await api.saveAlbum({ id: a.id, coverThumb: "", coverPhotoId: "" }); a.coverThumb = ""; a.coverPhotoId = ""; }
}

async function deletePhotos(list) {
  if (!list.length) return;
  const a = current;
  const ok = await confirmBox(list.length === 1 ? "Apagar foto?" : `Apagar ${list.length} fotos?`,
    `${list.length === 1 ? "A foto sai" : "As fotos saem"} do site na hora. Isso não pode ser desfeito.`, "Apagar", true);
  if (!ok) return;
  try {
    await recordUndo(list.length === 1 ? "Apagar foto" : `Apagar ${list.length} fotos`);
    await api.deletePhotos(list);
    const ids = new Set(list.map(p => p.id));
    st.photos = st.photos.filter(p => !ids.has(p.id));
    a.count = st.photos.length;
    await fixCover(a);
    const gKeys = groupCoverKeys(a.group);
    if (gKeys && loadedContent && ids.has(loadedContent[gKeys.idKey])) {
      await api.saveContent({ [gKeys.coverKey]: "", [gKeys.idKey]: "" });
      loadedContent[gKeys.coverKey] = "";
      loadedContent[gKeys.idKey] = "";
    }
    localStorage.removeItem("alm-cache-v1");
    toast(list.length === 1 ? "Foto apagada" : `${list.length} fotos apagadas`);
  } catch (e) { toast(errMsg(e), "bad"); }
  renderAlbum(a);
}

async function movePhoto(p) {
  const a = current;
  const others = st.albums.filter(x => x.id !== a.id);
  const to = await modal({
    title: "Mover para…",
    body: `<label>Categoria de destino<select name="to">${GROUP_ORDER.map(g => {
      const opts = others.filter(x => x.group === g);
      return opts.length ? `<optgroup label="${esc(GROUPS[g].label)}">${opts.map(x => `<option value="${esc(x.id)}">${esc(x.title)}</option>`).join("")}</optgroup>` : "";
    }).join("")}</select></label>`,
    actions: [{ label: "Cancelar", value: null }, { label: "Mover", cls: "primary", primary: true, run: async f => f.elements.to.value }]
  });
  if (!to) return;
  const dest = st.albums.find(x => x.id === to);
  try {
    await recordUndo("Mover foto");
    await api.movePhoto(p, to, Math.floor(Date.now() / 1000));
    st.photos = st.photos.filter(x => x.id !== p.id);
    a.count = st.photos.length; dest.count = (dest.count || 0) + 1;
    await fixCover(a);
    if (dest.group !== "portfolio" && !dest.coverPhotoId) {
      const saved = st.photos; st.photos = [p];
      await setCover(dest, p); st.photos = saved;
    }
    localStorage.removeItem("alm-cache-v1");
    toast(`Foto movida para ${dest.title}`);
  } catch (e) { toast(errMsg(e), "bad"); }
  renderAlbum(a);
}

async function uploadFiles(files, a) {
  files = files.filter(f => /^image\//.test(f.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
  if (!files.length) return;
  await recordUndo(files.length === 1 ? "Adicionar foto" : `Adicionar ${files.length} fotos`);
  $("#emptybox")?.remove();
  const grid = $("#grid");
  if (st.selecting) toggleSelect(false);
  st.sortables.forEach(s => s.option("disabled", true));
  st.uploading++;
  const tiles = files.map(f => {
    const t = document.createElement("div");
    t.className = "tile up";
    const url = URL.createObjectURL(f);
    t.innerHTML = `<img src="${url}" alt=""><i class="spin"></i><span class="st">Aguardando…</span>`;
    grid.appendChild(t);
    return t;
  });
  tiles[0].scrollIntoView({ behavior: "smooth", block: "center" });
  let order = st.photos.length ? Math.max(...st.photos.map(p => p.order || 0)) + 1 : 0;
  let ok = 0; const errors = [];
  for (let i = 0; i < files.length; i++) {
    const t = tiles[i], label = $(".st", t);
    label.textContent = `Preparando ${i + 1}/${files.length}…`;
    try {
      const r = await processPhoto(files[i]);
      label.textContent = `Enviando ${i + 1}/${files.length}…`;
      const p = await api.addPhoto(a.id, r, order++);
      st.photos.push(p); ok++;
      label.textContent = "Pronto ✓"; $(".spin", t)?.remove();
    } catch (e) {
      console.error(e);
      t.classList.add("bad"); $(".spin", t)?.remove(); label.textContent = "Não enviada";
      errors.push(`${files[i].name}: ${errMsg(e)}`);
    }
    URL.revokeObjectURL($("img", t).src);
  }
  st.uploading--;
  a.count = st.photos.length;
  try { await fixCover(a); } catch (e) { console.error(e); }
  localStorage.removeItem("alm-cache-v1");
  if (ok) toast(ok === 1 ? "1 foto adicionada ao site" : `${ok} fotos adicionadas ao site`);
  if (errors.length) modal({
    title: "Algumas fotos não foram enviadas",
    body: `<p>${errors.map(esc).join("<br>")}</p>`,
    actions: [{ label: "Entendi", cls: "primary", primary: true, value: true }]
  });
  renderAlbum(a);
}

/* =============================== CURSOS =============================== */
let loadedContent = null;

async function viewCursos() {
  const tk = st.token; loading();
  let c;
  try { c = await api.loadContent(); } catch (e) { return failView(e); }
  if (tk !== st.token) return;
  loadedContent = c;
  const courses = Array.isArray(c.courses) ? c.courses : [];
  const activeCount = courses.filter(x => x && x.active !== false && String(x.title || "").trim()).length;

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px">
      <h2 class="title" style="margin:0">Cursos</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn gold" id="addCourseBtn">${IC.plus} Adicionar curso</button>
        <a class="btn" href="../#/cursos" target="_blank" rel="noopener">${IC.ext} Ver no site</a>
      </div>
    </div>
    <div class="panel" style="background:${activeCount ? "#F3F9F4" : "#FBF8F3"};border-color:${activeCount ? "#C3DFC8" : "#E5DAC8"};margin-bottom:20px">
      ${activeCount
        ? `<b style="display:block;font-size:.95rem;color:#255830;margin-bottom:4px">✓ ${plural(activeCount, "curso publicado", "cursos publicados")} no site</b>
           <span class="hint" style="margin:0">O aviso “Em Breve” foi substituído automaticamente pelos seus cursos abaixo. Se você pausar ou apagar todos os cursos, o site volta a mostrar “${esc(c.cursosSoonBadge || "EM BREVE")}” sozinho.</span>`
        : `<b style="display:block;font-size:.95rem;color:#7A5A00;margin-bottom:4px">⏳ O site está exibindo o aviso “${esc(c.cursosSoonBadge || "EM BREVE")}”</b>
           <span class="hint" style="margin:0">Enquanto nenhum curso estiver ativo abaixo, o site mostra automaticamente o selo <b>${esc(c.cursosSoonBadge || "EM BREVE")}</b> e o botão da lista de espera. Clique em <b>Adicionar curso</b> quando quiser lançar um curso com valor, duração e link!</span>`}
    </div>

    ${courses.length ? `<ul class="adm-courses" id="courseList">
      ${courses.map((cr, idx) => {
        const off = cr.active === false;
        return `<li class="adm-course ${off ? "off" : ""}" data-idx="${idx}">
          <span class="c-cov" style="${cr.image ? `background-image:url('${esc(cr.image)}')` : ""}">${cr.image ? "" : IC.img}</span>
          <div class="c-info">
            <b>${esc(cr.title || "Curso sem nome")} ${off ? '<span class="badge off">Pausado (oculto)</span>' : '<span class="badge">Visível no site</span>'}</b>
            <small>
              ${cr.price ? `<b>Valor:</b> ${esc(cr.price)} · ` : ""}
              ${cr.duration ? `<b>Duração:</b> ${esc(cr.duration)} · ` : ""}
              ${cr.format ? `${esc(cr.format)} · ` : ""}
              <b>Link:</b> ${cr.link ? esc(cr.link) : "Direto para o WhatsApp"}
            </small>
          </div>
          <div class="acts">
            <button type="button" class="btn sm" data-cact="edit">${IC.edit} Editar</button>
            <button type="button" class="btn sm" data-cact="toggle">${off ? "Ativar no site" : "Pausar"}</button>
            ${idx > 0 ? `<button type="button" class="btn sm" data-cact="up" title="Subir">${IC.up}</button>` : ""}
            ${idx < courses.length - 1 ? `<button type="button" class="btn sm" data-cact="down" title="Descer">${IC.down}</button>` : ""}
            <button type="button" class="btn sm danger" data-cact="del" title="Apagar">${IC.trash}</button>
          </div>
        </li>`;
      }).join("")}
    </ul>` : `<div class="emptybox" style="margin-bottom:20px">${IC.img}<p>Nenhum curso cadastrado ainda.<br>Enquanto esta lista estiver vazia, o site exibe <b>${esc(c.cursosSoonBadge || "EM BREVE")}</b>.<br>Toque em <b>Adicionar curso</b> acima quando quiser cadastrar seu primeiro curso.</p></div>`}

    <form class="panel" id="cursosTxtForm" style="margin-top:22px" novalidate>
      <h3 class="group" style="margin-top:0">Textos da Página de Cursos e Aviso “Em Breve”</h3>
      ${field("showCursos", "Mostrar o botão Cursos na página inicial", "checkbox", c.showCursos !== false)}
      ${field("cursosTitle", "Título da página de Cursos", "text", c.cursosTitle || "Cursos")}
      ${field("cursosIntro", "Frase de introdução (aparece acima da lista quando há cursos ativos)", "textarea", c.cursosIntro || "")}
      ${field("cursosSoonBadge", "Texto do selo quando não há cursos ativos (ex.: EM BREVE)", "text", c.cursosSoonBadge || "EM BREVE")}
      ${field("cursosText", "Texto exibido enquanto não há nenhum curso ativo", "textarea", c.cursosText || "")}
      ${field("cursosWaitlistCta", "Texto do botão da lista de espera (enquanto em breve)", "text", c.cursosWaitlistCta || "Quero ser avisada")}
      <button type="submit" class="btn primary">Salvar textos de Cursos</button>
    </form>`;

  $("#addCourseBtn").onclick = () => openCourseModal(null, courses);

  const cl = $("#courseList");
  if (cl) cl.onclick = async e => {
    const b = e.target.closest("[data-cact]"); if (!b) return;
    const idx = +b.closest(".adm-course").dataset.idx;
    const act = b.dataset.cact;
    const cr = courses[idx]; if (!cr) return;
    if (act === "edit") return openCourseModal(cr, courses, idx);
    if (act === "toggle") {
      cr.active = cr.active === false ? true : false;
      await saveCoursesList(courses, cr.active ? `Ativar curso ${cr.title}` : `Pausar curso ${cr.title}`);
      return;
    }
    if (act === "up" && idx > 0) {
      [courses[idx - 1], courses[idx]] = [courses[idx], courses[idx - 1]];
      await saveCoursesList(courses, "Mudar ordem dos cursos");
      return;
    }
    if (act === "down" && idx < courses.length - 1) {
      [courses[idx + 1], courses[idx]] = [courses[idx], courses[idx + 1]];
      await saveCoursesList(courses, "Mudar ordem dos cursos");
      return;
    }
    if (act === "del") {
      if (!(await confirmBox("Apagar curso?", `O curso <b>${esc(cr.title)}</b> será removido do site.`, "Apagar", true))) return;
      courses.splice(idx, 1);
      await saveCoursesList(courses, `Apagar curso ${cr.title}`);
    }
  };

  $("#cursosTxtForm").onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    const patch = {
      showCursos: f.elements.showCursos.checked,
      cursosTitle: fv(f, "cursosTitle") || "Cursos",
      cursosIntro: fv(f, "cursosIntro"),
      cursosSoonBadge: fv(f, "cursosSoonBadge") || "EM BREVE",
      cursosText: fv(f, "cursosText"),
      cursosWaitlistCta: fv(f, "cursosWaitlistCta") || "Quero ser avisada"
    };
    await busy($("button[type=submit]", f), async () => {
      try {
        await recordUndo("Editar textos de Cursos");
        await api.saveContent(patch);
        localStorage.removeItem("alm-cache-v1");
        toast("Textos de Cursos salvos!");
        viewCursos();
      } catch (x) { toast(errMsg(x), "bad"); }
    });
  };
}

async function saveCoursesList(courses, undoLabel) {
  try {
    await recordUndo(undoLabel);
    const activeCount = courses.filter(x => x && x.active !== false && String(x.title || "").trim()).length;
    await api.saveContent({ courses, cursosSoon: activeCount === 0 });
    localStorage.removeItem("alm-cache-v1");
    toast("Cursos atualizados no site!");
    viewCursos();
  } catch (x) { toast(errMsg(x), "bad"); }
}

async function openCourseModal(existing, courses, idx = -1) {
  const isNew = !existing;
  const cr = existing ? { ...existing } : {
    id: "cr-" + Date.now().toString(36),
    title: "",
    price: "",
    duration: "",
    format: "",
    link: "",
    btnLabel: "Quero me inscrever",
    description: "",
    image: "",
    active: true
  };
  let pickedImg = cr.image || "";

  const ok = await modal({
    title: isNew ? "Adicionar Curso" : "Editar Curso",
    body: `
      ${field("title", "Nome do curso *", "text", cr.title, "Ex.: Curso de Automaquiagem VIP ou Especialização em Noivas")}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
        ${field("price", "Valor / Investimento", "text", cr.price, "Ex.: R$ 490,00 ou 6x de R$ 89")}
        ${field("duration", "Tempo de duração", "text", cr.duration, "Ex.: 4 horas (1 dia)")}
      </div>
      ${field("format", "Modalidade / Formato", "text", cr.format, "Ex.: Presencial no estúdio · Individual ou Online")}
      ${field("description", "Descrição (o que a aluna vai aprender, materiais, certificado…)", "textarea", cr.description)}
      ${field("link", "Link do curso (Hotmart, Kiwify, página de vendas…)", "text", cr.link, "Deixe vazio se quiser que o botão abra direto o seu WhatsApp!")}
      ${field("btnLabel", "Texto do botão de inscrição", "text", cr.btnLabel || "Quero me inscrever")}
      <div class="imgfield" id="courseImgBox" style="margin-bottom:14px">
        <span class="pv ab" id="courseImgPv" style="${pickedImg ? `background-image:url('${esc(pickedImg)}')` : ""}"></span>
        <div>
          <b>Foto do curso (opcional)</b>
          <span class="hint">Uma foto ilustrativa do curso ou certificado.</span>
          <div class="acts">
            <span class="btn sm gold upl" style="position:relative;overflow:hidden">Escolher foto<input type="file" accept="image/*" id="courseImgIn" style="position:absolute;inset:0;opacity:0;cursor:pointer"></span>
            <button type="button" class="btn sm danger" id="courseImgDel" ${pickedImg ? "" : "hidden"}>Remover foto</button>
          </div>
        </div>
      </div>
      ${field("active", "Mostrar este curso publicado no site", "checkbox", cr.active !== false)}`,
    actions: [{ label: "Cancelar", value: false }, {
      label: isNew ? "Adicionar e publicar" : "Salvar curso", cls: "primary", primary: true, run: async f => {
        const title = fv(f, "title");
        if (!title) throw { friendly: "Digite o nome do curso." };
        const updated = {
          ...cr,
          title,
          price: fv(f, "price"),
          duration: fv(f, "duration"),
          format: fv(f, "format"),
          description: fv(f, "description"),
          link: fv(f, "link"),
          btnLabel: fv(f, "btnLabel") || "Quero me inscrever",
          image: pickedImg,
          active: f.elements.active.checked
        };
        if (isNew) courses.push(updated);
        else if (idx >= 0) courses[idx] = updated;
        await saveCoursesList(courses, isNew ? `Adicionar curso ${title}` : `Editar curso ${title}`);
        return true;
      }
    }],
    onMount(ov) {
      const inp = $("#courseImgIn", ov), pv = $("#courseImgPv", ov), delBtn = $("#courseImgDel", ov);
      if (inp) inp.onchange = async e => {
        const f = e.target.files[0]; e.target.value = ""; if (!f) return;
        try {
          const img = await loadImage(f);
          const { blob } = await compressCanvas(img, 1000, 220 * 1024, 0.84);
          if (f instanceof Blob && img.src) URL.revokeObjectURL(img.src);
          pickedImg = await blobToDataURL(blob);
          pv.style.backgroundImage = `url('${pickedImg}')`;
          delBtn.hidden = false;
        } catch (x) { toast(errMsg(x), "bad"); }
      };
      if (delBtn) delBtn.onclick = () => {
        pickedImg = "";
        pv.style.backgroundImage = "";
        delBtn.hidden = true;
      };
    }
  });
  return ok;
}

/* =============================== CAPA, CORES E TEXTOS =============================== */
let media = {};
let pendingMedia = {};
let colorState = {};

function markDirty() {
  st.dirty = true;
  const topBtn = $("#topSaveBtn");
  if (topBtn) topBtn.disabled = false;
  showSavebar();
}

async function viewTextos() {
  const tk = st.token; loading();
  let c;
  try { [c, media] = await Promise.all([api.loadContent(), api.loadMedia()]); } catch (e) { return failView(e); }
  if (tk !== st.token) return;
  loadedContent = c;
  st.dirty = false;
  pendingMedia = {};
  colorState = {};
  THEME_COLORS.forEach(tc => { colorState[tc.key] = (c[tc.key] || tc.default).toUpperCase(); });

  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:6px">
      <h2 class="title" style="margin:0">Capa, Cores e Textos</h2>
      <button type="button" class="btn primary" id="topSaveBtn" data-save-all disabled>Salvar alterações</button>
    </div>
    <p class="help">Altere a foto da capa principal (os textos sobre a capa são mantidos!), ative/desative rotas do site, personalize as cores ou qualquer texto e toque em <b>Salvar alterações</b>.</p>
    <details class="panel" open>
      <summary>Menu do Topo e Rotas do Site (Ativar, Desativar ou Adicionar)</summary>
      <div class="body" id="txtRoutesBody">${renderRoutesManagerHtml(c)}</div>
    </details>
    <details class="panel" open>
      <summary>Foto da Capa Principal (Entrada) e Foto do “Sobre”</summary>
      <div class="body" id="mediaBody">${renderMediaFields()}</div>
    </details>
    <details class="panel" open>
      <summary>Cores Principais do Site</summary>
      <div class="body" id="colorsBody">${renderColorFields()}</div>
    </details>
    <form id="txtForm" novalidate>
      ${CONTENT_FORM.map((sec, i) => `<details class="panel" ${i === 0 ? "open" : ""}><summary>${esc(sec.title)}</summary><div class="body">
        ${sec.fields.map(([k, label, type, hint]) => field(k, label, type, c[k], hint || "")).join("")}
      </div></details>`).join("")}
      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <button type="button" class="btn primary" data-save-all>Salvar alterações</button>
      </div>
    </form>`;

  const form = $("#txtForm");
  form.addEventListener("input", () => markDirty());
  form.addEventListener("submit", e => e.preventDefault());
  const trb = $("#txtRoutesBody");
  if (trb) trb.onclick = e => handleRouteManagerClick(e, c, () => {
    trb.innerHTML = renderRoutesManagerHtml(c);
  });
  bindImgFields();
  bindColorFields();
  bindSaveAllBtns();
}

function renderMediaFields() {
  const hasPending = Object.keys(pendingMedia).length > 0;
  return `
    ${imgField("hero", "Foto da Capa Principal (Entrada do Site)", "Troque a imagem de fundo mantendo todos os textos da capa sobrepostos (Anna Lívia Makeup, frase, botão e destaques do rodapé).")}
    ${imgField("about", "Foto do “Sobre”", "Aparece ao lado do texto de apresentação da Anna Lívia.")}
    ${hasPending ? `<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <span style="font-size:.82rem;color:#7A5A00"><b>Alteração de foto pronta!</b> Clique em Salvar para publicar no site.</span>
      <button type="button" class="btn primary sm" data-save-all>Salvar foto no site</button>
    </div>` : ""}`;
}

function imgField(key, title, hint) {
  const isStaged = key in pendingMedia;
  const val = isStaged ? pendingMedia[key] : media[key];
  const src = val || "../imagens/capa.jpg";
  const badge = isStaged
    ? `<span class="badge" style="background:#FFF3CD;color:#7A5A00">Não salva</span>`
    : (media[key] ? `<span class="badge">Personalizada</span>` : `<span class="badge">Original</span>`);
  const preview = key === "hero"
    ? heroPreviewHtml(src, loadedContent || DEFAULT_CONTENT)
    : `<span class="pv ab" style="${src ? `background-image:url('${esc(src)}')` : ""}"></span>`;
  return `<div class="imgfield" data-key="${key}">
    ${preview}
    <div>
      <b>${esc(title)} ${badge}</b>
      <span class="hint">${esc(hint)}</span>
      <div class="acts">
        <span class="btn sm gold upl" style="position:relative;overflow:hidden">Trocar foto<input type="file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer"></span>
        ${val ? `<button type="button" class="btn sm danger" data-reset>Voltar à foto original</button>` : ""}
      </div>
    </div>
  </div>`;
}

function bindImgFields() {
  $$(".imgfield").forEach(box => {
    const key = box.dataset.key;
    $("input[type=file]", box).onchange = async e => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      const btn = $(".upl", box);
      try {
        const ratio = key === "hero" ? 2 / 3 : 3 / 4;
        const canvas = await openCropModal(
          f,
          ratio,
          key === "hero" ? "Enquadrar foto da capa principal" : "Enquadrar foto do Sobre",
          key === "hero" ? (loadedContent || DEFAULT_CONTENT) : null
        );
        if (!canvas) return;
        await busy(btn, async () => {
          const maxB = key === "hero" ? 420 * 1024 : 200 * 1024;
          const { blob } = await compressCanvas(canvas, key === "hero" ? 1536 : 1200, maxB, 0.85);
          const url = await blobToDataURL(blob);
          pendingMedia[key] = url;
          markDirty();
          $("#mediaBody").innerHTML = renderMediaFields();
          bindImgFields();
          bindSaveAllBtns();
          toast("Foto pronta! Toque em Salvar alterações para publicar.");
        });
      } catch (x) { toast(errMsg(x), "bad"); }
    };
    const r = $("[data-reset]", box);
    if (r) r.onclick = () => {
      pendingMedia[key] = "";
      markDirty();
      $("#mediaBody").innerHTML = renderMediaFields();
      bindImgFields();
      bindSaveAllBtns();
      toast("Foto original selecionada. Toque em Salvar para confirmar.");
    };
  });
}

function renderColorFields() {
  const isAllOrig = THEME_COLORS.every(tc => (colorState[tc.key] || tc.default).toUpperCase() === tc.default.toUpperCase());
  return `
    <div class="orig-palette">
      <div style="flex:1;min-width:220px">
        <b style="display:block;font-size:.88rem;color:var(--ink);margin-bottom:4px">★ Cores Originais do Site (Sempre em Destaque)</b>
        <small style="display:block;font-size:.76rem;color:var(--muted);margin-bottom:9px">Estas são as cores originais da identidade visual. Mesmo se você mudar abaixo, elas continuam salvas aqui para você voltar quando quiser:</small>
        <div class="swatches">
          ${THEME_COLORS.map(tc => `<button type="button" class="orig-chip" data-set-color="${tc.key}" data-hex="${tc.default}" title="Usar cor original (${tc.default}) em ${esc(tc.label)}"><i style="background:${tc.default}"></i><span>${esc(tc.label.split(" (")[0])}</span></button>`).join("")}
        </div>
      </div>
      <button type="button" class="btn sm ${isAllOrig ? "" : "gold"}" id="resetAllColorsBtn" ${isAllOrig ? "disabled" : ""}>${IC.rot} Voltar às cores originais</button>
    </div>
    ${THEME_COLORS.map(tc => {
      const cur = (colorState[tc.key] || tc.default).toUpperCase();
      const isOrig = cur === tc.default.toUpperCase();
      return `<div class="color-row" data-ckey="${tc.key}">
        <div class="c-info">
          <b>${esc(tc.label)} ${isOrig ? '<span class="badge">Original</span>' : '<span class="badge" style="background:#FFF3CD;color:#7A5A00">Personalizada</span>'}</b>
          <small>Código atual: <code>${esc(cur)}</code> · Original: <code>${esc(tc.default)}</code></small>
        </div>
        <div class="color-ctrl">
          ${tc.presets.map((hex, idx) => {
            const h = hex.toUpperCase();
            return `<button type="button" class="swatch ${idx === 0 ? "orig" : ""} ${cur === h ? "active" : ""}" style="background:${h}" data-set-color="${tc.key}" data-hex="${h}" title="${idx === 0 ? `Cor original (${h})` : h}"></button>`;
          }).join("")}
          <label class="color-picker-wrap" title="Escolher qualquer cor">
            <input type="color" data-color-picker="${tc.key}" value="${cur}">
            <span>Outra cor</span>
          </label>
          ${!isOrig ? `<button type="button" class="btn sm" data-set-color="${tc.key}" data-hex="${tc.default}">Voltar ao original</button>` : ""}
        </div>
      </div>`;
    }).join("")}
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:flex-end">
      <button type="button" class="btn primary sm" data-save-all>Salvar cores no site</button>
    </div>`;
}

function bindColorFields() {
  const body = $("#colorsBody");
  if (!body) return;
  body.onclick = e => {
    const setBtn = e.target.closest("[data-set-color]");
    if (setBtn) {
      const k = setBtn.dataset.setColor, hex = setBtn.dataset.hex.toUpperCase();
      if (colorState[k] !== hex) {
        colorState[k] = hex;
        markDirty();
        body.innerHTML = renderColorFields();
        bindColorFields();
        bindSaveAllBtns();
      }
      return;
    }
    const resetAll = e.target.closest("#resetAllColorsBtn");
    if (resetAll) {
      THEME_COLORS.forEach(tc => { colorState[tc.key] = tc.default.toUpperCase(); });
      markDirty();
      body.innerHTML = renderColorFields();
      bindColorFields();
      bindSaveAllBtns();
      toast("Cores originais restauradas! Toque em Salvar para publicar.");
    }
  };
  $$("[data-color-picker]", body).forEach(inp => {
    inp.oninput = e => {
      const k = inp.dataset.colorPicker;
      colorState[k] = e.target.value.toUpperCase();
      markDirty();
    };
    inp.onchange = e => {
      const k = inp.dataset.colorPicker;
      colorState[k] = e.target.value.toUpperCase();
      markDirty();
      body.innerHTML = renderColorFields();
      bindColorFields();
      bindSaveAllBtns();
    };
  });
}

function bindSaveAllBtns() {
  $$("[data-save-all]").forEach(btn => {
    btn.onclick = e => busy(e.currentTarget, async () => {
      try {
        await saveTextos();
        toast("Alterações salvas e publicadas no site!");
      } catch (x) { toast(errMsg(x), "bad"); }
    });
  });
}

function showSavebar() {
  if ($("#savebar")) return;
  const bar = document.createElement("div");
  bar.className = "savebar"; bar.id = "savebar";
  bar.innerHTML = `<span>Você tem alterações não salvas</span><div style="display:flex;gap:8px"><button type="button" class="btn sm" id="discardBtn" style="background:rgba(255,255,255,.12);color:#fff;border-color:transparent">Descartar</button><button type="button" class="btn primary" id="saveBtn">Salvar alterações</button></div>`;
  document.body.appendChild(bar);
  $("#discardBtn").onclick = () => {
    st.dirty = false;
    pendingMedia = {};
    $("#savebar")?.remove();
    viewTextos();
    toast("Alterações descartadas");
  };
  $("#saveBtn").onclick = e => busy(e.currentTarget, async () => {
    try { await saveTextos(); toast("Alterações salvas e publicadas no site!"); } catch (x) { toast(errMsg(x), "bad"); }
  });
}

async function saveTextos() {
  const form = $("#txtForm"); if (!form) return;
  await recordUndo("Alterar capa, cores ou textos");
  for (const k of Object.keys(pendingMedia)) {
    await api.saveMedia(k, pendingMedia[k]);
    media[k] = pendingMedia[k];
  }
  pendingMedia = {};
  const data = {};
  CONTENT_FORM.forEach(sec => sec.fields.forEach(([k, , type]) => {
    const el = form.elements[k];
    if (el) data[k] = type === "checkbox" ? el.checked : el.value.trim();
  }));
  THEME_COLORS.forEach(tc => {
    data[tc.key] = colorState[tc.key] || tc.default;
  });
  await api.saveContent(data);
  loadedContent = { ...(loadedContent || {}), ...data };
  localStorage.removeItem("alm-cache-v1");
  st.dirty = false;
  $("#savebar")?.remove();
  const topBtn = $("#topSaveBtn");
  if (topBtn) topBtn.disabled = true;
  if ($("#mediaBody")) { $("#mediaBody").innerHTML = renderMediaFields(); bindImgFields(); bindSaveAllBtns(); }
}

/* =============================== ACESSOS =============================== */
async function viewAcessos() {
  const tk = st.token; loading();
  let list;
  try { list = await api.listAdmins(); } catch (e) { return failView(e); }
  if (tk !== st.token) return;
  const me = api.me();
  list.sort((a, b) => (b.owner ? 1 : 0) - (a.owner ? 1 : 0) || String(a.name).localeCompare(b.name));
  content.innerHTML = `
    <h2 class="title">Acessos ao painel</h2>
    <p class="help">Pessoas que podem entrar no painel e editar o site.</p>
    <ul class="users">${list.map(u => {
      const off = u.active === false, isMe = u.uid === me.uid;
      return `<li class="user ${off ? "off" : ""}" data-uid="${esc(u.uid)}" data-email="${esc(u.email)}">
        <span class="av">${esc((u.name || u.email || "?").trim()[0].toUpperCase())}</span>
        <div class="grow"><b>${esc(u.name || "—")}${u.owner ? '<span class="badge">Principal</span>' : ""}${isMe ? '<span class="badge">Você</span>' : ""}${off ? '<span class="badge off">Desativado</span>' : ""}</b><small>${esc(u.email)}</small></div>
        <div class="acts">
          ${!isMe ? `<button class="btn sm" data-act="reset">Redefinir senha</button>` : ""}
          ${!u.owner && !isMe ? (off ? `<button class="btn sm" data-act="on">Reativar</button>` : `<button class="btn sm danger" data-act="off">Desativar</button>`) : ""}
        </div></li>`;
    }).join("")}</ul>
    <div class="panel">
      <h3 class="group" style="margin-top:0">Adicionar pessoa</h3>
      <p class="help">A pessoa entra pelo mesmo endereço do painel, com o e-mail e a senha abaixo. Depois ela pode trocar a senha na aba <b>Conta</b>.</p>
      <form id="newUser" novalidate>
        ${field("name", "Nome", "text", "", "", 'autocomplete="off"')}
        ${field("email", "E-mail", "email", "", "", 'autocomplete="off"')}
        ${field("password", "Senha inicial (mínimo 6 caracteres)", "password", "", "", 'autocomplete="new-password"')}
        <p class="err" id="nuErr"></p>
        <button class="btn primary" type="submit">${IC.plus} Criar acesso</button>
      </form>
    </div>`;
  bindEyes(content);
  content.onclick = async e => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const li = b.closest(".user"), uid = li.dataset.uid, email = li.dataset.email, name = $("b", li).firstChild.textContent;
    try {
      if (b.dataset.act === "off") {
        if (!(await confirmBox("Desativar acesso?", `<b>${esc(name)}</b> não vai mais conseguir entrar no painel. Você pode reativar depois.`, "Desativar", true))) return;
        await busy(b, () => api.setAdminActive(uid, false)); toast("Acesso desativado"); viewAcessos();
      }
      if (b.dataset.act === "on") { await busy(b, () => api.setAdminActive(uid, true)); toast("Acesso reativado"); viewAcessos(); }
      if (b.dataset.act === "reset") {
        if (api.adminSetPassword) {
          const ok = await modal({
            title: `Nova senha para ${name}`,
            body: field("password", "Nova senha (mínimo 6 caracteres)", "password", "", "", 'autocomplete="new-password"'),
            actions: [{ label: "Cancelar", value: false }, {
              label: "Salvar senha", cls: "primary", primary: true, run: async f => {
                const pw = f.elements.password.value;
                if (pw.length < 6) throw { friendly: "A senha precisa ter pelo menos 6 caracteres." };
                await api.adminSetPassword(uid, pw);
                return true;
              }
            }]
          });
          if (ok) toast(`Senha de ${name} atualizada`);
          return;
        }
        if (!(await confirmBox("Redefinir senha?", `Vamos enviar um e-mail para <b>${esc(email)}</b> com um link para criar uma nova senha.`, "Enviar e-mail"))) return;
        await busy(b, () => api.resetPassword(email));
        toast(MODE === "demo" ? "No modo demonstração nenhum e-mail é enviado." : "E-mail enviado");
      }
    } catch (x) { toast(errMsg(x), "bad"); }
  };
  $("#newUser").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, name = fv(f, "name"), email = fv(f, "email"), pw = f.elements.password.value;
    $("#nuErr").textContent = "";
    if (!name || !email) return $("#nuErr").textContent = "Preencha nome e e-mail.";
    if (pw.length < 6) return $("#nuErr").textContent = "A senha precisa ter pelo menos 6 caracteres.";
    await busy($("button[type=submit]", f), async () => {
      try { await api.createAdmin({ name, email, password: pw }); toast(`Acesso criado para ${name}`); viewAcessos(); }
      catch (x) {
        $("#nuErr").textContent = (x.code || "").includes("email-already-in-use")
          ? "Este e-mail já tem cadastro. Se a pessoa estiver na lista como desativada, use “Reativar”."
          : errMsg(x);
      }
    });
  };
}

/* =============================== CONTA =============================== */
function viewConta() {
  const me = api.me();
  const panelUrl = location.href.split("#")[0];
  content.innerHTML = `
    <h2 class="title">Minha conta</h2>
    <p class="help">Conectada como <b>${esc(me.email)}</b></p>
    <form class="panel" id="nameForm" novalidate>
      <h3 class="group" style="margin-top:0">Seu nome</h3>
      ${field("name", "Nome", "text", me.name || "")}
      <button class="btn" type="submit">Salvar nome</button>
    </form>
    <form class="panel" id="pwForm" novalidate>
      <h3 class="group" style="margin-top:0">Trocar senha</h3>
      ${field("cur", "Senha atual", "password", "", "", 'autocomplete="current-password"')}
      ${field("nw", "Nova senha (mínimo 6 caracteres)", "password", "", "", 'autocomplete="new-password"')}
      ${field("nw2", "Repita a nova senha", "password", "", "", 'autocomplete="new-password"')}
      <p class="err" id="pwErr"></p>
      <button class="btn primary" type="submit">Trocar senha</button>
    </form>
    <div class="panel">
      <h3 class="group" style="margin-top:0">Como entrar no painel</h3>
      <p class="help" style="margin-bottom:10px">O painel não aparece para as visitantes do site. Para entrar:</p>
      <ul class="help" style="padding-left:18px;margin-top:0">
        <li>Acesse <b>${esc(panelUrl)}</b> (salve nos favoritos do celular), ou</li>
        <li>No site, toque <b>5 vezes seguidas</b> no texto “© Anna Lívia Makeup” no rodapé.</li>
      </ul>
      <button class="btn sm" id="copyUrl">Copiar endereço do painel</button>
    </div>
    <button class="btn danger block" id="logout" style="max-width:320px">Sair do painel</button>`;
  bindEyes(content);
  $("#nameForm").onsubmit = async e => {
    e.preventDefault(); const name = fv(e.target, "name"); if (!name) return;
    await busy($("button", e.target), async () => {
      try { await api.updateMyName(name); toast("Nome atualizado"); } catch (x) { toast(errMsg(x), "bad"); }
    });
  };
  $("#pwForm").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, cur = f.elements.cur.value, nw = f.elements.nw.value, nw2 = f.elements.nw2.value;
    $("#pwErr").textContent = "";
    if (!cur) return $("#pwErr").textContent = "Digite a senha atual.";
    if (nw.length < 6) return $("#pwErr").textContent = "A nova senha precisa ter pelo menos 6 caracteres.";
    if (nw !== nw2) return $("#pwErr").textContent = "As novas senhas não são iguais.";
    await busy($("button[type=submit]", f), async () => {
      try { await api.changePassword(cur, nw); f.reset(); toast("Senha alterada"); }
      catch (x) { $("#pwErr").textContent = errMsg(x); }
    });
  };
  $("#copyUrl").onclick = async () => {
    try { await navigator.clipboard.writeText(panelUrl); toast("Endereço copiado"); }
    catch (e) { prompt("Copie o endereço:", panelUrl); }
  };
  $("#logout").onclick = async () => {
    if (!(await confirmBox("Sair do painel?", "Você vai precisar do e-mail e da senha para entrar de novo.", "Sair"))) return;
    entered = false; removeEventListener("hashchange", onHash);
    await api.signOut();
    history.replaceState(null, "", location.pathname);
  };
}

boot();
