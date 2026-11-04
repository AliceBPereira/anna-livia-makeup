import { getContent, getMedia, listAlbums, listPhotos, getFullImage, thumbSrc } from "./public-api.js";
import { DEFAULT_CONTENT, DEFAULT_ALBUMS, GROUPS } from "./defaults.js";

const $ = s => document.querySelector(s);
const view = $("#view"), shell = $("#shell"), hero = $("#hero");
const CACHE = "alm-cache-v1";
const NAME = "Anna Lívia Makeup";

let S = null;               // { content, media, albums }
const photosCache = {};     // albumId -> photos[]

/* ---------------- utilidades ---------------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const paras = s => String(s || "").split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("");
function waNumber(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d && !d.startsWith("55") && d.length <= 11) d = "55" + d;
  return d;
}
const wa = text => `https://wa.me/${waNumber(S.content.whatsapp)}${text ? "?text=" + encodeURIComponent(text) : ""}`;
const igHandle = () => String(S.content.instagram || "").replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
const igUrl = () => `https://www.instagram.com/${igHandle()}/`;

const I = {
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 5l-7 7 7 7"/></svg>',
  curve: '<svg class="curve" viewBox="0 0 22 100" preserveAspectRatio="none" aria-hidden="true"><path d="M2 0 C2 22, 20 32, 19 52 S 5 86, 7 100"/></svg>',
  wa: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".9" fill="currentColor"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="8" cy="13.5" r=".6" fill="currentColor"/><circle cx="12" cy="13.5" r=".6" fill="currentColor"/><circle cx="16" cy="13.5" r=".6" fill="currentColor"/><circle cx="8" cy="17" r=".6" fill="currentColor"/><circle cx="12" cy="17" r=".6" fill="currentColor"/></svg>',
  brush: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.6 20.4l7.2-7.2 1.6 1.6-7.2 7.2c-.45.45-1.15.45-1.6 0s-.45-1.15 0-1.6z"/><path d="M10.8 13.2l2.6-2.6 1.6 1.6-2.6 2.6"/><path d="M13.4 10.6c.3-2.7 2.3-6.2 5-7.3 1.3-.5 2.8 1 2.3 2.3-1.1 2.7-4.6 4.7-7.3 5"/><path d="M15.6 8.4l2.4-2.4"/></svg>',
  hair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="17.6" cy="7.2" r="2.9"/><path d="M7.4 10.6c-.2-3.7 2.6-6.2 5.8-6.2 1.2 0 2.3.3 3.1.9"/><path d="M7.4 10.6c-.8 1-1.4 1.9-1.6 2.6l1.4.5-.2 1.6c0 .8.6 1.3 1.4 1.2l1.4-.2.4 3.4"/><path d="M15.7 10.3c.2 2.7-.7 4.7-2.3 5.9l.6 4.1"/><path d="M15.7 10.3c1.2-.2 2.2-.7 2.9-1.5"/><path d="M9.6 7.6c2 .1 4.1 1 5.9 2.6"/></svg>',
  photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="16" rx="1.5"/><circle cx="9" cy="9" r="1.6"/><path d="M3.5 17l5-5 4 4 2.5-2.5 5.5 5.5"/></svg>',
  cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5v4.3c1.4 1.4 3.5 2.2 5.5 2.2s4.1-.8 5.5-2.2v-4.3"/><path d="M21.5 9.5V14"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 21.5s-6.8-6.4-6.8-11.8a6.8 6.8 0 0 1 13.6 0c0 5.4-6.8 11.8-6.8 11.8z"/><circle cx="12" cy="9.6" r="2.6"/></svg>'
};

const topbar = back => `<div class="topbar"><a class="back" href="${back}">${I.back}Voltar</a><span class="mark">${NAME}</span></div>`;
const btnWa = (label, text) => `<a class="btn" href="${wa(text)}" target="_blank" rel="noopener">${I.wa} ${esc(label)}</a>`;
const btnIg = label => igHandle() ? `<a class="btn ghost" href="${igUrl()}" target="_blank" rel="noopener">${I.ig} ${esc(label || "Ver mais no Instagram")}</a>` : "";

function iconCard(cls, href, icon, title, sub, extra = "") {
  return `<a class="card ${cls}" href="${href}"><div class="lead"><span class="ic">${icon}</span></div>${I.curve}<div class="txt"><h2>${esc(title)}</h2><span class="sub">${esc(sub)}</span>${extra}</div><span class="go" aria-hidden="true">${I.arrow}</span></a>`;
}
function albumCard(a, i) {
  const icon = a.group === "penteados" ? I.hair : I.brush;
  const media = a.coverThumb
    ? `<div class="slot has-img" aria-hidden="true"><img src="${esc(a.coverThumb)}" alt="" loading="lazy"></div>`
    : `<span class="ic">${icon}</span>`;
  return `<a class="card sm c${(i % 6) + 1}" href="#/${a.group}/${encodeURIComponent(a.id)}"><div class="lead">${media}</div>${I.curve}<div class="txt"><h2>${esc(a.title)}</h2><span class="sub">${esc(a.subtitle)}</span></div><span class="go" aria-hidden="true">${I.arrow}</span></a>`;
}

/* ---------------- páginas ---------------- */
function pageHome() {
  const c = S.content;
  const aboutSrc = S.media.about || "imagens/capa.jpg";
  const about = `<div class="slot has-img"><img src="${esc(aboutSrc)}" alt="${esc(c.aboutSignature)}"></div>`;
  const cursos = c.showCursos !== false
    ? iconCard("c5", "#/cursos", I.cap, "Cursos", c.cardCursos, c.cursosSoon ? '<span class="soon">EM BREVE</span>' : "") : "";
  return `
  <section class="sec home-about">
    <h2>${esc(c.aboutTitle)}</h2><div class="line"></div>
    <div class="about">${about}<div>${paras(c.aboutText)}<b>${esc(c.aboutSignature)}</b></div></div>
  </section>
  <div class="sec-head"><span>Explore</span><h2>Serviços & Portfólio</h2></div>
  <nav class="links" aria-label="Páginas">
    ${iconCard("c1", "#/agendamentos", I.cal, "Agendamentos", c.cardAgendamentos)}
    ${iconCard("c2", "#/maquiagem", I.brush, "Maquiagem", c.cardMaquiagem)}
    ${iconCard("c3", "#/penteados", I.hair, "Penteados", c.cardPenteados)}
    ${iconCard("c4", "#/portfolio", I.photo, "Portfólio", c.cardPortfolio)}
    ${cursos}
    ${iconCard("c6", "#/localizacao", I.map, "Localização", c.cardLocalizacao)}
  </nav>`;
}

function pageAgendamentos() {
  const c = S.content;
  const steps = [1, 2, 3].filter(n => c["step" + n + "Title"]).map(n =>
    `<li><div><b>${esc(c["step" + n + "Title"])}</b><span>${esc(c["step" + n + "Text"])}</span></div></li>`).join("");
  return `${topbar("#/")}
  <h1 class="ptitle">Agendamentos</h1>
  <section class="sec">
    <p class="note">${esc(c.bookingIntro)}</p>
    <ol class="steps">${steps}</ol>
    <div class="center">${btnWa("Agendar pelo WhatsApp", "Olá, Anna! Gostaria de agendar um horário.")}</div>
  </section>
  <section class="sec">
    <ul class="info">
      ${c.hours ? `<li><div class="ic">${I.clock}</div><div><small>Horário de atendimento</small><span>${esc(c.hours)}</span></div></li>` : ""}
      <li><div class="ic">${I.phone}</div><div><small>WhatsApp</small><a href="${wa()}" target="_blank" rel="noopener">${esc(c.whatsapp)}</a></div></li>
    </ul>
  </section>`;
}

function pageGroup(g) {
  const albums = S.albums.filter(a => a.group === g);
  return `${topbar("#/")}
  <h1 class="ptitle">${esc(GROUPS[g].label)}</h1>
  <p class="note" style="margin-top:14px">${esc(S.content[g + "Intro"])}</p>
  <nav class="links" aria-label="${esc(GROUPS[g].label)}">${albums.map(albumCard).join("")}</nav>`;
}

function pageAlbum(a) {
  const g = GROUPS[a.group] || GROUPS.portfolio;
  const isPf = a.group === "portfolio";
  const intro = isPf ? S.content.portfolioIntro : a.description;
  const cta = isPf
    ? `<a class="btn" href="#/agendamentos">${esc(g.cta)}</a>`
    : btnWa(g.cta, `Olá, Anna! Gostaria de agendar: ${g.prefix} – ${a.title}.`);
  return `${topbar(isPf ? "#/" : "#/" + a.group)}
  <h1 class="ptitle">${esc(a.title)}</h1>
  <section class="sec">
    ${intro ? `<p class="note">${esc(intro)}</p>` : ""}
    <div class="gallery" id="gallery" data-album="${esc(a.id)}">${'<div class="ph skel"></div>'.repeat(5)}</div>
    <div class="center btns">${cta}${btnIg()}</div>
  </section>`;
}

function pageCursos() {
  return `${topbar("#/")}
  <h1 class="ptitle">Cursos</h1>
  <section class="sec">
    <p class="note">${esc(S.content.cursosText)}</p>
    <div class="center">${btnWa("Quero ser avisada", "Olá, Anna! Quero ser avisada sobre os cursos.")}</div>
  </section>`;
}

function pageLocalizacao() {
  const c = S.content;
  const addr = String(c.address || "").trim();
  const q = encodeURIComponent(addr.replace(/\n/g, ", "));
  return `${topbar("#/")}
  <section class="sec" style="margin-top:34px">
    <div class="contact">
      <h2>${esc(c.locationTitle)}</h2>
      <p>${esc(c.locationText)}</p>
      ${btnWa("Agendar horário", "Olá, Anna! Gostaria de agendar um horário.")}
      <ul class="info">
        ${addr ? `<li><div class="ic">${I.pin}</div><div><small>Estúdio</small><a href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">${esc(addr)}</a></div></li>` : ""}
        ${c.hours ? `<li><div class="ic">${I.clock}</div><div><small>Horário de atendimento</small><span>${esc(c.hours)}</span></div></li>` : ""}
        <li><div class="ic">${I.phone}</div><div><small>WhatsApp</small><a href="${wa()}" target="_blank" rel="noopener">${esc(c.whatsapp)}</a></div></li>
        ${igHandle() ? `<li><div class="ic">${I.ig}</div><div><small>Instagram</small><a href="${igUrl()}" target="_blank" rel="noopener">@${esc(igHandle())}</a></div></li>` : ""}
      </ul>
      ${addr ? `<div class="map"><iframe title="Mapa do estúdio" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${q}&output=embed"></iframe></div>` : ""}
    </div>
  </section>`;
}

/* ---------------- galeria ---------------- */
async function fillGallery(albumId) {
  const el = $("#gallery");
  if (!el) return;
  let photos = photosCache[albumId];
  if (!photos) {
    try { photos = photosCache[albumId] = await listPhotos(albumId); }
    catch (e) { console.error(e); photos = []; }
  }
  if (!el.isConnected || el.dataset.album !== albumId) return;
  if (!photos.length) {
    el.outerHTML = `<div class="empty"><p>Novas fotos chegando em breve por aqui.</p>${btnIg("Veja os trabalhos no Instagram")}</div>`;
    return;
  }
  el.classList.toggle("few", photos.length < 3);
  el.classList.toggle("one", photos.length === 1);
  el.innerHTML = photos.map((p, i) =>
    `<button class="ph" data-i="${i}" aria-label="Ampliar foto ${i + 1}"><img src="${esc(thumbSrc(p))}" alt="${esc(p.alt || "Trabalho de " + NAME)}" ${i > 3 ? 'loading="lazy"' : ""} decoding="async"></button>`).join("");
  el.querySelectorAll("img").forEach(img => {
    if (img.complete) img.classList.add("ok");
    else img.onload = img.onerror = () => img.classList.add("ok");
  });
  el.onclick = e => {
    const b = e.target.closest(".ph");
    if (b) openLb(photos, +b.dataset.i);
  };
}

/* ---------------- visualizador ---------------- */
const lb = $("#lb"), lbImg = $("#lbImg"), lbC = $("#lbC");
let lbList = [], lbI = 0, lbPushed = false, lbToken = 0;
function showLb() {
  const p = lbList[lbI], tok = ++lbToken;
  lbImg.src = thumbSrc(p);
  lbImg.alt = p.alt || "Trabalho de " + NAME;
  lbC.textContent = `${lbI + 1} / ${lbList.length}`;
  getFullImage(p).then(src => {
    if (tok !== lbToken || !src || src === lbImg.src) return;
    const pre = new Image();
    pre.onload = () => { if (tok === lbToken) lbImg.src = src; };
    pre.src = src;
  }).catch(() => {});
  // pré-carrega a próxima
  const n = lbList[(lbI + 1) % lbList.length];
  if (n) getFullImage(n).then(s => { if (s) new Image().src = s; }).catch(() => {});
}
function openLb(list, i) {
  lbList = list; lbI = i;
  lb.hidden = false; document.body.classList.add("lock");
  showLb();
  history.pushState({ lb: 1 }, ""); lbPushed = true;
  $("#lbX").focus({ preventScroll: true });
}
function closeLb(fromPop) {
  if (lb.hidden) return;
  lb.hidden = true; document.body.classList.remove("lock"); lbImg.src = "";
  if (lbPushed && !fromPop) { lbPushed = false; history.back(); }
  lbPushed = false;
}
function step(d) {
  if (lbList.length < 2) return;
  lbI = (lbI + d + lbList.length) % lbList.length;
  lbImg.classList.add("swap");
  setTimeout(() => { showLb(); lbImg.classList.remove("swap"); }, 120);
}
$("#lbX").onclick = () => closeLb();
$("#lbP").onclick = () => step(-1);
$("#lbN").onclick = () => step(1);
lb.addEventListener("click", e => { if (e.target === lb || e.target.tagName === "FIGURE") closeLb(); });
addEventListener("keydown", e => {
  if (lb.hidden) return;
  if (e.key === "Escape") closeLb();
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});
addEventListener("popstate", () => { if (!lb.hidden) closeLb(true); });
let tx = 0, ty = 0;
lb.addEventListener("touchstart", e => { if (e.touches.length === 1) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; } }, { passive: true });
lb.addEventListener("touchend", e => {
  if (e.changedTouches.length !== 1 || (window.visualViewport && visualViewport.scale > 1.05)) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
  else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) closeLb();
}, { passive: true });

/* ---------------- capa, rodapé ---------------- */
function applyChrome() {
  const c = S.content;
  document.querySelectorAll("[data-t]").forEach(el => { el.textContent = c[el.dataset.t] ?? ""; });
  const src = S.media.hero || "imagens/capa.jpg";
  if (hero.dataset.src !== src) {
    hero.dataset.src = src;
    const pre = new Image();
    pre.onload = () => { hero.style.backgroundImage = `url("${src}")`; };
    pre.src = src;
  }
  $("#social").innerHTML =
    (igHandle() ? `<a href="${igUrl()}" target="_blank" rel="noopener" aria-label="Instagram @${esc(igHandle())}">${I.ig}<span>@${esc(igHandle())}</span></a>` : "") +
    (waNumber(c.whatsapp) ? `<a href="${wa()}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(c.whatsapp)}">${I.wa}<span>${esc(c.whatsapp)}</span></a>` : "");
  const navCursos = $("#navCursos");
  if (navCursos) navCursos.hidden = c.showCursos === false;
  $("#year").textContent = new Date().getFullYear();
}

/* ---------------- rotas ---------------- */
function route() {
  if (!S) return;
  const key = decodeURIComponent(location.hash.replace(/^#\/?/, "").replace(/\/$/, ""));
  if (key === "acesso" || key === "painel" || key === "acesso-anna") { location.href = "painel/"; return; }
  const [a, b] = key.split("/");
  let html, title = "", album = null;
  if (!a) html = pageHome();
  else if (a === "agendamentos") { html = pageAgendamentos(); title = "Agendamentos"; }
  else if (a === "cursos" && S.content.showCursos !== false) { html = pageCursos(); title = "Cursos"; }
  else if (a === "localizacao") { html = pageLocalizacao(); title = "Localização"; }
  else if (a === "portfolio") { album = S.albums.find(x => x.group === "portfolio"); }
  else if ((a === "maquiagem" || a === "penteados") && !b) { html = pageGroup(a); title = GROUPS[a].label; }
  else if ((a === "maquiagem" || a === "penteados") && b) { album = S.albums.find(x => x.group === a && x.id === b); }
  if (album) { html = pageAlbum(album); title = album.title; }
  if (!html) { if (key) { location.replace("#/"); return; } html = pageHome(); }

  shell.classList.toggle("is-home", !a);
  document.querySelectorAll("#deskMenu a[data-nav]").forEach(link => {
    link.classList.toggle("active", link.dataset.nav === (a || ""));
  });
  view.innerHTML = `<div class="page enter">${html}</div>`;
  document.title = title ? `${title} | ${NAME}` : NAME;
  window.scrollTo(0, 0);
  if (album) fillGallery(album.id);
}
addEventListener("hashchange", () => { if (!lb.hidden) closeLb(true); route(); });

/* acesso discreto ao painel: 5 toques no © do rodapé */
let taps = 0, tapT;
$("#copy").addEventListener("click", () => {
  taps++; clearTimeout(tapT);
  tapT = setTimeout(() => taps = 0, 2500);
  if (taps >= 5) location.href = "painel/";
});

/* ---------------- inicialização ---------------- */
function setState(s, rerender) {
  const json = JSON.stringify(s);
  if (S && json === JSON.stringify(S)) return;
  S = s;
  try { localStorage.setItem(CACHE, json); } catch (e) { /* cache cheio: ignora */ }
  applyChrome();
  if (rerender) route();
}
(async function boot() {
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) { }
  if (cached && cached.content) { S = cached; applyChrome(); route(); }
  try {
    const [content, media, albums] = await Promise.all([getContent(), getMedia(), listAlbums()]);
    setState({ content, media, albums }, true);
  } catch (e) {
    console.error(e);
    if (!S) { S = { content: { ...DEFAULT_CONTENT }, media: { hero: "", about: "" }, albums: DEFAULT_ALBUMS }; applyChrome(); route(); }
  }
})();
