import { getContent, getMedia, listAlbums, listPhotos, getFullImage, thumbSrc, fetchCloudState } from "./public-api.js";
import { DEFAULT_CONTENT, DEFAULT_ALBUMS, GROUPS, SITE_ROUTES } from "./defaults.js";

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
  studio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><rect x="5" y="3" width="14" height="15" rx="7"/><path d="M3 21h18M9 18v3M15 18v3"/><path d="M12 6.5c.3 2.2 1.8 3.7 4 4-2.2.3-3.7 1.8-4 4-.3-2.2-1.8-3.7-4-4 2.2-.3 3.7-1.8 4-4z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/></svg>',
  cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5v4.3c1.4 1.4 3.5 2.2 5.5 2.2s4.1-.8 5.5-2.2v-4.3"/><path d="M21.5 9.5V14"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M12 21.5s-6.8-6.4-6.8-11.8a6.8 6.8 0 0 1 13.6 0c0 5.4-6.8 11.8-6.8 11.8z"/><circle cx="12" cy="9.6" r="2.6"/></svg>'
};

const topbar = back => `<div class="topbar"><a class="back" href="${back}">${I.back}Voltar</a><span class="mark">${esc(S?.content?.footerText || NAME)}</span></div>`;
const btnWa = (label, text) => `<a class="btn" href="${wa(text)}" target="_blank" rel="noopener">${I.wa} ${esc(label)}</a>`;
const btnIg = label => igHandle() ? `<a class="btn ghost" href="${igUrl()}" target="_blank" rel="noopener">${I.ig} ${esc(label || S?.content?.igBtnLabel || "Ver mais no Instagram")}</a>` : "";

function iconCard(cls, href, icon, title, sub, extra = "", thumb = "") {
  const lead = thumb
    ? `<div class="slot has-img" aria-hidden="true"><img src="${esc(thumb)}" alt="" loading="lazy"></div>`
    : `<span class="ic">${icon}</span>`;
  return `<a class="card ${cls}" href="${href}"><div class="lead">${lead}</div>${I.curve}<div class="txt"><h2>${esc(title)}</h2><span class="sub">${esc(sub)}</span>${extra}</div><span class="go" aria-hidden="true">${I.arrow}</span></a>`;
}
function albumCard(a, i) {
  const icon = a.group === "penteados" ? I.hair : I.brush;
  const media = a.coverThumb
    ? `<div class="slot has-img" aria-hidden="true"><img src="${esc(a.coverThumb)}" alt="" loading="lazy"></div>`
    : `<span class="ic">${icon}</span>`;
  return `<a class="card sm c${(i % 6) + 1}" href="#/${a.group}/${encodeURIComponent(a.id)}"><div class="lead">${media}</div>${I.curve}<div class="txt"><h2>${esc(a.title)}</h2><span class="sub">${esc(a.subtitle)}</span></div><span class="go" aria-hidden="true">${I.arrow}</span></a>`;
}

function getActiveCourses() {
  const list = Array.isArray(S?.content?.courses) ? S.content.courses : [];
  return list.filter(c => c && c.active !== false && String(c.title || "").trim());
}

/* ---------------- páginas ---------------- */
function getActiveCustomRoutes() {
  const list = Array.isArray(S?.content?.customRoutes) ? S.content.customRoutes : [];
  return list.filter(r => r && r.active !== false && String(r.title || "").trim());
}

function pageHome() {
  const c = S.content;
  const aboutSrc = S.media.about || "imagens/capa.jpg";
  const about = `<div class="slot has-img"><img src="${esc(aboutSrc)}" alt="${esc(c.aboutSignature)}"></div>`;
  const estAlbum = S.albums.find(x => x.id === "estudio" || x.group === "estudio");
  const pfAlbum = S.albums.find(x => x.id === "portfolio" || x.group === "portfolio");
  const maqThumb = c.coverMaquiagem === "none" ? "" : (c.coverMaquiagem || S.albums.find(x => x.group === "maquiagem" && x.coverThumb)?.coverThumb || "");
  const pentThumb = c.coverPenteados === "none" ? "" : (c.coverPenteados || S.albums.find(x => x.group === "penteados" && x.coverThumb)?.coverThumb || "");
  const pfThumb = c.coverPortfolio === "none" ? "" : (c.coverPortfolio || pfAlbum?.coverThumb || "");
  const estThumb = c.coverEstudio === "none" ? "" : (c.coverEstudio || estAlbum?.coverThumb || "");
  const activeCourses = getActiveCourses();
  const isCursosSoon = activeCourses.length === 0;

  const cards = [];
  if (c.showAgendamentos !== false) {
    cards.push(iconCard("c1", "#/agendamentos", I.cal, c.cardAgendamentosTitle || "Agendamentos", c.cardAgendamentos));
  }
  if (c.showMaquiagem !== false) {
    cards.push(iconCard("c2", "#/maquiagem", I.brush, c.cardMaquiagemTitle || "Maquiagem", c.cardMaquiagem, "", maqThumb));
  }
  if (c.showPenteados !== false) {
    cards.push(iconCard("c3", "#/penteados", I.hair, c.cardPenteadosTitle || "Penteados", c.cardPenteados, "", pentThumb));
  }
  if (c.showPortfolio !== false) {
    cards.push(iconCard("c4", "#/portfolio", I.photo, c.cardPortfolioTitle || "Portfólio", c.cardPortfolio, "", pfThumb));
  }
  if (c.showEstudio !== false) {
    cards.push(iconCard("c2", "#/estudio", I.studio, c.cardEstudioTitle || "O Estúdio", c.cardEstudio || "Conheça nosso ambiente, bancada e estrutura.", "", estThumb));
  }
  if (c.showCursos !== false) {
    cards.push(iconCard("c5", "#/cursos", I.cap, c.cardCursosTitle || "Cursos", c.cardCursos, isCursosSoon ? `<span class="soon">${esc(c.cursosSoonBadge || "EM BREVE")}</span>` : ""));
  }
  if (c.showLocalizacao !== false) {
    cards.push(iconCard("c6", "#/localizacao", I.map, c.cardLocalizacaoTitle || "Localização", c.cardLocalizacao));
  }

  getActiveCustomRoutes().forEach((cr, idx) => {
    const cls = `c${((idx + 2) % 6) + 1}`;
    if (cr.type === "link") {
      const rawUrl = String(cr.url || "").trim();
      const href = rawUrl ? (/^(https?:\/\/|#|mailto:|tel:)/i.test(rawUrl) ? rawUrl : "https://" + rawUrl) : wa(`Olá, Anna! Gostaria de saber mais sobre: ${cr.title}.`);
      const extAttr = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : "";
      cards.push(`<a class="card ${cls}" href="${esc(href)}"${extAttr}><div class="lead"><span class="ic">${I.spark}</span></div>${I.curve}<div class="txt"><h2>${esc(cr.title)}</h2><span class="sub">${esc(cr.subtitle || "Toque para acessar")}</span></div><span class="go" aria-hidden="true">${I.arrow}</span></a>`);
    } else {
      const crAlbum = S.albums.find(x => x.id === cr.id);
      cards.push(iconCard(cls, `#/pagina/${encodeURIComponent(cr.id)}`, I.spark, cr.title, cr.subtitle || "Veja fotos e detalhes.", "", crAlbum?.coverThumb || ""));
    }
  });

  return `
  <section class="sec home-about">
    <h2>${esc(c.aboutTitle)}</h2><div class="line"></div>
    <div class="about">${about}<div>${paras(c.aboutText)}<b>${esc(c.aboutSignature)}</b></div></div>
  </section>
  ${cards.length ? `<div class="sec-head"><span>${esc(c.homeExploreSub || "Explore")}</span><h2>${esc(c.homeExploreTitle || "Serviços & Portfólio")}</h2></div>
  <nav class="links" aria-label="Páginas">
    ${cards.join("\n    ")}
  </nav>` : ""}`;
}

function pageAgendamentos() {
  const c = S.content;
  const steps = [1, 2, 3].filter(n => c["step" + n + "Title"]).map(n =>
    `<li><div><b>${esc(c["step" + n + "Title"])}</b><span>${esc(c["step" + n + "Text"])}</span></div></li>`).join("");
  return `${topbar("#/")}
  <h1 class="ptitle">${esc(c.bookingTitle || "Agendamentos")}</h1>
  <section class="sec">
    <p class="note">${esc(c.bookingIntro)}</p>
    <ol class="steps">${steps}</ol>
    <div class="center">${btnWa(c.bookingCta || "Agendar pelo WhatsApp", c.bookingWaMsg || "Olá, Anna! Gostaria de agendar um horário.")}</div>
  </section>
  <section class="sec">
    <ul class="info">
      ${c.hours ? `<li><div class="ic">${I.clock}</div><div><small>Horário de atendimento</small><span>${esc(c.hours)}</span></div></li>` : ""}
      <li><div class="ic">${I.phone}</div><div><small>WhatsApp</small><a href="${wa()}" target="_blank" rel="noopener">${esc(c.whatsapp)}</a></div></li>
    </ul>
  </section>`;
}

function pageEstudio() {
  const c = S.content;
  const feats = [
    [I.spark, c.estudioFeat1Title, c.estudioFeat1Text],
    [I.heart, c.estudioFeat2Title, c.estudioFeat2Text],
    [I.studio, c.estudioFeat3Title, c.estudioFeat3Text]
  ].filter(([, t, d]) => String(t || "").trim() || String(d || "").trim());

  return `${topbar("#/")}
  <h1 class="ptitle">${esc(c.estudioTitle || "Nosso Estúdio")}</h1>
  <section class="sec">
    ${c.estudioIntro ? `<p class="note">${esc(c.estudioIntro)}</p>` : ""}
    ${c.estudioText ? `<div class="studio-story">${paras(c.estudioText)}</div>` : ""}
    ${feats.length ? `<div class="studio-feats">${feats.map(([ic, t, d]) => `<div class="studio-feat"><div class="ic">${ic}</div><div>${t ? `<b>${esc(t)}</b>` : ""}${d ? `<span>${esc(d)}</span>` : ""}</div></div>`).join("")}</div>` : ""}
    <div class="gallery" id="gallery" data-album="estudio">${'<div class="ph skel"></div>'.repeat(4)}</div>
    <div class="center btns">${btnWa(c.estudioCta || "Agendar horário no estúdio", "Olá, Anna! Gostaria de agendar um horário no estúdio.")}${btnIg()}</div>
  </section>`;
}

function pageGroup(g) {
  const c = S.content;
  const albums = S.albums.filter(a => a.group === g);
  const title = c[g + "Title"] || GROUPS[g].label;
  return `${topbar("#/")}
  <h1 class="ptitle">${esc(title)}</h1>
  <p class="note" style="margin-top:14px">${esc(c[g + "Intro"])}</p>
  <nav class="links" aria-label="${esc(title)}">${albums.map(albumCard).join("")}</nav>`;
}

function pageAlbum(a) {
  const c = S.content;
  const g = GROUPS[a.group] || GROUPS.portfolio;
  const isPf = a.group === "portfolio";
  const intro = isPf ? c.portfolioIntro : a.description;
  const ctaLabel = isPf ? (c.portfolioCta || g.cta) : (c[a.group + "Cta"] || g.cta);
  const cta = (isPf && c.showAgendamentos !== false)
    ? `<a class="btn" href="#/agendamentos">${esc(ctaLabel)}</a>`
    : btnWa(ctaLabel, `Olá, Anna! Gostaria de agendar: ${g.prefix} – ${a.title}.`);
  return `${topbar(isPf ? "#/" : "#/" + a.group)}
  <h1 class="ptitle">${esc(isPf ? (c.portfolioTitle || a.title) : a.title)}</h1>
  <section class="sec">
    ${intro ? `<p class="note">${esc(intro)}</p>` : ""}
    <div class="gallery" id="gallery" data-album="${esc(a.id)}">${'<div class="ph skel"></div>'.repeat(5)}</div>
    <div class="center btns">${cta}${btnIg()}</div>
  </section>`;
}

function pageCustomRoute(cr) {
  const album = S.albums.find(x => x.id === cr.id);
  const desc = cr.description || album?.description || "";
  const ctaLabel = cr.ctaLabel || "Entrar em contato pelo WhatsApp";
  const rawLink = String(cr.url || "").trim();
  const cta = rawLink
    ? `<a class="btn" href="${esc(/^https?:\/\//i.test(rawLink) ? rawLink : "https://" + rawLink)}" target="_blank" rel="noopener">${esc(ctaLabel)} ${I.arrow}</a>`
    : btnWa(ctaLabel, `Olá, Anna! Gostaria de saber mais sobre: ${cr.title}.`);
  return `${topbar("#/")}
  <h1 class="ptitle">${esc(cr.title)}</h1>
  <section class="sec">
    ${desc ? `<div class="studio-story">${paras(desc)}</div>` : (cr.subtitle ? `<p class="note">${esc(cr.subtitle)}</p>` : "")}
    <div class="gallery" id="gallery" data-album="${esc(cr.id)}">${'<div class="ph skel"></div>'.repeat(4)}</div>
    <div class="center btns">${cta}${btnIg()}</div>
  </section>`;
}

function pageCursos() {
  const c = S.content;
  const activeCourses = getActiveCourses();
  if (!activeCourses.length) {
    return `${topbar("#/")}
    <h1 class="ptitle">${esc(c.cursosTitle || "Cursos")}</h1>
    <section class="sec">
      <div class="center" style="margin-top:0;margin-bottom:16px"><span class="card" style="display:inline-block;min-height:0;border:0;background:none;box-shadow:none"><span class="soon">${esc(c.cursosSoonBadge || "EM BREVE")}</span></span></div>
      <p class="note">${esc(c.cursosText)}</p>
      <div class="center">${btnWa(c.cursosWaitlistCta || "Quero ser avisada", "Olá, Anna! Quero ser avisada sobre os cursos.")}</div>
    </section>`;
  }

  return `${topbar("#/")}
  <h1 class="ptitle">${esc(c.cursosTitle || "Cursos")}</h1>
  <section class="sec">
    ${c.cursosIntro ? `<p class="note">${esc(c.cursosIntro)}</p>` : ""}
    <div class="course-list">
      ${activeCourses.map(cr => {
        const rawLink = String(cr.link || "").trim();
        const href = rawLink
          ? (/^https?:\/\//i.test(rawLink) ? rawLink : "https://" + rawLink)
          : wa(`Olá, Anna! Tenho interesse no curso: ${cr.title}.`);
        const btnText = String(cr.btnLabel || "").trim() || (rawLink ? "Garantir minha vaga" : "Inscrição pelo WhatsApp");
        return `<article class="course-card ${cr.image ? "has-img" : ""}">
          ${cr.image ? `<div class="course-img"><img src="${esc(cr.image)}" alt="${esc(cr.title)}" loading="lazy"></div>` : ""}
          <div class="course-body">
            <h2>${esc(cr.title)}</h2>
            ${(cr.duration || cr.format) ? `<div class="course-meta">
              ${cr.duration ? `<span class="course-tag">${I.clock}<span>${esc(cr.duration)}</span></span>` : ""}
              ${cr.format ? `<span class="course-tag">${I.cap}<span>${esc(cr.format)}</span></span>` : ""}
            </div>` : ""}
            ${cr.description ? `<p class="course-desc">${esc(cr.description)}</p>` : ""}
            <div class="course-foot">
              ${cr.price ? `<div class="course-price"><small>Investimento</small><strong>${esc(cr.price)}</strong></div>` : `<div></div>`}
              <a class="btn" href="${esc(href)}" target="_blank" rel="noopener">${rawLink ? "" : I.wa} ${esc(btnText)} ${rawLink ? I.arrow : ""}</a>
            </div>
          </div>
        </article>`;
      }).join("")}
    </div>
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
      <div class="btns" style="justify-content:center">
        ${btnWa(c.locationCta || "Agendar horário", c.bookingWaMsg || "Olá, Anna! Gostaria de agendar um horário.")}
        ${c.showEstudio !== false ? `<a class="btn ghost" href="#/estudio">${I.studio} Conhecer o Estúdio</a>` : ""}
      </div>
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
    el.outerHTML = `<div class="empty"><p>${esc(S.content.emptyGalleryText || "Novas fotos chegando em breve por aqui.")}</p>${btnIg(S.content.igBtnLabel || "Ver mais no Instagram")}</div>`;
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

/* ---------------- capa, cores, rodapé ---------------- */
function applyTheme(c) {
  const root = document.documentElement.style;
  root.setProperty("--page", c.colorPage || DEFAULT_CONTENT.colorPage);
  root.setProperty("--col", c.colorCol || DEFAULT_CONTENT.colorCol);
  root.setProperty("--card", c.colorCard || DEFAULT_CONTENT.colorCard);
  root.setProperty("--gold", c.colorGold || DEFAULT_CONTENT.colorGold);
  root.setProperty("--ink", c.colorInk || DEFAULT_CONTENT.colorInk);
}

function applyChrome() {
  const c = S.content;
  applyTheme(c);
  document.querySelectorAll("[data-t]").forEach(el => {
    const val = c[el.dataset.t];
    if (val !== undefined && val !== null && val !== "") el.textContent = val;
    else if (DEFAULT_CONTENT[el.dataset.t] !== undefined) el.textContent = DEFAULT_CONTENT[el.dataset.t];
  });
  const src = S.media.hero || "imagens/capa.jpg";
  hero.classList.toggle("custom-bg", !!S.media.hero);
  if (hero.dataset.src !== src) {
    hero.dataset.src = src;
    const pre = new Image();
    pre.onload = () => { hero.style.backgroundImage = `url("${src}")`; };
    pre.src = src;
  }
  $("#social").innerHTML =
    (igHandle() ? `<a href="${igUrl()}" target="_blank" rel="noopener" aria-label="Instagram @${esc(igHandle())}">${I.ig}<span>@${esc(igHandle())}</span></a>` : "") +
    (waNumber(c.whatsapp) ? `<a href="${wa()}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(c.whatsapp)}">${I.wa}<span>${esc(c.whatsapp)}</span></a>` : "");

  const deskMenu = $("#deskMenu");
  if (deskMenu) {
    const links = [`<a href="#/" data-nav="">Início</a>`];
    SITE_ROUTES.forEach(r => {
      if (!r.inTopMenu || c[r.key] === false) return;
      const label = c[r.titleKey] || r.defaultTitle;
      links.push(`<a href="#/${r.id}" data-nav="${r.id}">${esc(label)}</a>`);
    });
    getActiveCustomRoutes().forEach(cr => {
      if (cr.inTopMenu === false) return;
      if (cr.type === "link") {
        const rawUrl = String(cr.url || "").trim();
        const href = rawUrl ? (/^(https?:\/\/|#|mailto:|tel:)/i.test(rawUrl) ? rawUrl : "https://" + rawUrl) : wa(`Olá, Anna! Gostaria de saber mais sobre: ${cr.title}.`);
        const ext = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener"' : "";
        links.push(`<a href="${esc(href)}"${ext}>${esc(cr.title)}</a>`);
      } else {
        links.push(`<a href="#/pagina/${encodeURIComponent(cr.id)}" data-nav="pagina/${esc(cr.id)}">${esc(cr.title)}</a>`);
      }
    });
    deskMenu.innerHTML = links.join("");
  }

  const navCta = $(".nav-cta");
  const heroCta = $("#hero .cta");
  if (c.showAgendamentos === false) {
    const waHref = wa(c.bookingWaMsg || "Olá, Anna! Gostaria de agendar um horário.");
    if (navCta) { navCta.href = waHref; navCta.target = "_blank"; navCta.rel = "noopener"; }
    if (heroCta) { heroCta.href = waHref; heroCta.target = "_blank"; heroCta.rel = "noopener"; }
  } else {
    if (navCta) { navCta.href = "#/agendamentos"; navCta.removeAttribute("target"); navCta.removeAttribute("rel"); }
    if (heroCta) { heroCta.href = "#/agendamentos"; heroCta.removeAttribute("target"); heroCta.removeAttribute("rel"); }
  }

  $("#year").textContent = new Date().getFullYear();
}

/* ---------------- rotas ---------------- */
function route() {
  if (!S) return;
  const c = S.content;
  const key = decodeURIComponent(location.hash.replace(/^#\/?/, "").replace(/\/$/, ""));
  if (key === "acesso" || key === "painel" || key === "acesso-anna") { location.href = "painel/"; return; }
  const [a, b] = key.split("/");
  let html, title = "", album = null, galleryAlbumId = "";
  if (!a) html = pageHome();
  else if (a === "agendamentos" && c.showAgendamentos !== false) { html = pageAgendamentos(); title = c.bookingTitle || "Agendamentos"; }
  else if (a === "estudio" && c.showEstudio !== false) { html = pageEstudio(); title = c.estudioTitle || "Nosso Estúdio"; galleryAlbumId = "estudio"; }
  else if (a === "cursos" && c.showCursos !== false) { html = pageCursos(); title = c.cursosTitle || "Cursos"; }
  else if (a === "localizacao" && c.showLocalizacao !== false) { html = pageLocalizacao(); title = c.cardLocalizacaoTitle || "Localização"; }
  else if (a === "portfolio" && c.showPortfolio !== false) { album = S.albums.find(x => x.group === "portfolio" || x.id === "portfolio"); }
  else if (a === "maquiagem" && c.showMaquiagem !== false && !b) { html = pageGroup(a); title = c.maquiagemTitle || GROUPS[a].label; }
  else if (a === "maquiagem" && c.showMaquiagem !== false && b) { album = S.albums.find(x => x.group === a && x.id === b); }
  else if (a === "penteados" && c.showPenteados !== false && !b) { html = pageGroup(a); title = c.penteadosTitle || GROUPS[a].label; }
  else if (a === "penteados" && c.showPenteados !== false && b) { album = S.albums.find(x => x.group === a && x.id === b); }
  else if (a === "pagina" && b) {
    const cr = getActiveCustomRoutes().find(x => x.id === b && x.type !== "link");
    if (cr) { html = pageCustomRoute(cr); title = cr.title; galleryAlbumId = cr.id; }
  }
  if (album) { html = pageAlbum(album); title = album.title; galleryAlbumId = album.id; }
  if (!html) { if (key) { location.replace("#/"); return; } html = pageHome(); }

  shell.classList.toggle("is-home", !a);
  const activeNav = a === "pagina" && b ? `pagina/${b}` : (a || "");
  document.querySelectorAll("#deskMenu a[data-nav]").forEach(link => {
    link.classList.toggle("active", link.dataset.nav === activeNav);
  });
  view.innerHTML = `<div class="page enter">${html}</div>`;
  document.title = title ? `${title} | ${NAME}` : NAME;
  window.scrollTo(0, 0);
  if (galleryAlbumId) fillGallery(galleryAlbumId);
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
  const changed = !S || json !== JSON.stringify(S);
  S = s;
  Object.keys(photosCache).forEach(k => delete photosCache[k]);
  try { localStorage.setItem(CACHE, json); } catch (e) { /* cache cheio: ignora */ }
  applyChrome();
  if (rerender && changed) route();
  else if (rerender && $("#gallery")) fillGallery($("#gallery").dataset.album);
}

async function refreshSite(force = false) {
  try {
    if (force) await fetchCloudState(true);
    const cloud = await fetchCloudState(false);
    const [content, media, albums] = await Promise.all([getContent(), getMedia(), listAlbums()]);
    setState({ content, media, albums, updatedAt: cloud?.updatedAt || Date.now() }, true);
  } catch (e) {
    console.error(e);
    if (!S) { S = { content: { ...DEFAULT_CONTENT }, media: { hero: "", about: "" }, albums: DEFAULT_ALBUMS }; applyChrome(); route(); }
  }
}

(async function boot() {
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(CACHE) || "null"); } catch (e) { }
  if (cached && cached.content) { S = cached; applyChrome(); route(); }
  await refreshSite(true);
})();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshSite(true);
});
window.addEventListener("storage", e => {
  if (e.key === CACHE) refreshSite(true);
});
