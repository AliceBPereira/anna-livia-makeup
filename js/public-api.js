/* Leitura pública dos dados do site.
   - Modo Cloud (Vercel Blob via /api/store): sincronizado em todos os dispositivos.
   - Modo Firebase: usa a API REST do Firestore.
   - Fallback local (IndexedDB) apenas se estiver rodando sem servidor local. */
import { firebaseConfig, MODE } from "./config.js";
import { DEFAULT_CONTENT, DEFAULT_ALBUMS, ensureRequiredAlbums } from "./defaults.js";
import { kvGet } from "./idb.js";

const BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
const KEY = `key=${encodeURIComponent(firebaseConfig.apiKey)}`;

function dec(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("mapValue" in v) return decFields(v.mapValue.fields || {});
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(dec);
  return null;
}
function decFields(f) { const o = {}; for (const k in f) o[k] = dec(f[k]); return o; }
function decDoc(d) { return { id: d.name.split("/").pop(), ...decFields(d.fields || {}) }; }

async function restGet(path) {
  const r = await fetch(`${BASE}/${path}?${KEY}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("Firestore " + r.status);
  return decDoc(await r.json());
}
async function restList(col) {
  let out = [], token = "";
  do {
    const r = await fetch(`${BASE}/${col}?${KEY}&pageSize=300${token ? "&pageToken=" + token : ""}`);
    if (!r.ok) throw new Error("Firestore " + r.status);
    const j = await r.json();
    out = out.concat((j.documents || []).map(decDoc));
    token = j.nextPageToken || "";
  } while (token);
  return out;
}
async function restWhere(col, field, value) {
  const r = await fetch(`${BASE}:runQuery?${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: col }],
      where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } } }
    }})
  });
  if (!r.ok) throw new Error("Firestore " + r.status);
  const j = await r.json();
  return j.filter(e => e.document).map(e => decDoc(e.document));
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

let cloudPromise = null;
let cloudData = null;

export async function fetchCloudState(force = false) {
  if (!force && cloudPromise) return cloudPromise;
  cloudPromise = (async () => {
    try {
      const r = await fetch(`/api/store?t=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) throw new Error("API " + r.status);
      cloudData = await r.json();
      return cloudData;
    } catch (e) {
      cloudPromise = null;
      return null;
    }
  })();
  return cloudPromise;
}

export async function getContent() {
  if (MODE === "cloud") {
    const st = await fetchCloudState();
    if (st && st.content) return { ...DEFAULT_CONTENT, ...st.content };
  }
  const c = MODE === "firebase" ? await restGet("site/content") : await kvGet("content");
  return { ...DEFAULT_CONTENT, ...(c || {}) };
}

export async function getMedia() {
  if (MODE === "cloud") {
    const st = await fetchCloudState();
    if (st && st.media) return { hero: "", about: "", ...st.media };
  }
  const m = MODE === "firebase" ? await restGet("site/media") : await kvGet("media");
  return { hero: "", about: "", ...(m || {}) };
}

export async function listAlbums() {
  if (MODE === "cloud") {
    const st = await fetchCloudState();
    if (st && st.albums) return ensureRequiredAlbums(st.albums).sort(byOrder);
  }
  const list = MODE === "firebase" ? await restList("albums") : await kvGet("albums");
  return ensureRequiredAlbums(list && list.length ? list : DEFAULT_ALBUMS).sort(byOrder);
}

export async function listPhotos(albumId) {
  if (MODE === "cloud") {
    const st = await fetchCloudState();
    if (st && st.photos) return st.photos.filter(p => p.albumId === albumId).sort(byOrder);
  }
  let list;
  if (MODE === "firebase") list = await restWhere("photos", "albumId", albumId);
  else list = ((await kvGet("photos")) || []).filter(p => p.albumId === albumId);
  return list.sort(byOrder);
}

export async function getFullImage(photo) {
  if (photo.fullUrl) return photo.fullUrl;
  if (MODE === "firebase") {
    const d = await restGet("photoData/" + photo.id);
    return d ? d.data : (photo.thumbUrl || photo.thumb);
  }
  return (await kvGet("full:" + photo.id)) || photo.thumb;
}

export const thumbSrc = p => p.thumbUrl || p.thumb || "";

function blobToDataUrl(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

async function tryFetchCachedImage(url) {
  if (!url) return null;
  try {
    const r = await fetch(url, { cache: "force-cache" });
    if (!r.ok) return null;
    const b = await r.blob();
    if (!b || b.size < 100 || !String(b.type || "").startsWith("image/")) return null;
    return await blobToDataUrl(b);
  } catch (e) {
    return null;
  }
}

export async function rescueLegacyImagesFromCache(onProgress) {
  try {
    const r = await fetch(`/api/store?action=legacyBlobs&t=${Date.now()}`, { cache: "no-store" });
    if (!r.ok) return { rescuedPhotos: 0, rescuedMedia: 0, totalMissing: 0 };
    const { missingPhotos = [], legacyMedia = {} } = await r.json();
    let rescuedPhotos = 0;
    let rescuedMedia = 0;

    // 1. Tenta resgatar imagens de capa/sobre do cache do navegador
    for (const key of ["hero", "about"]) {
      const m = legacyMedia[key];
      if (m && m.url) {
        const dataUrl = await tryFetchCachedImage(m.url);
        if (dataUrl) {
          const sr = await fetch("/api/store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "rescueLegacyItem", type: "media", key, dataUrl })
          });
          if (sr.ok) rescuedMedia++;
        }
      }
    }

    // 2. Descobre possíveis vínculos de álbum salvos no cache local do aparelho
    let coverMap = {};
    try {
      const meta = JSON.parse(localStorage.getItem("alm-rescue-meta-v1") || localStorage.getItem("alm-cache-v1") || "null");
      if (meta && Array.isArray(meta.albums)) {
        meta.albums.forEach(a => {
          if (a.coverPhotoId && a.coverPhotoId !== "none") coverMap[a.coverPhotoId] = a.id;
        });
      }
    } catch (e) {}

    // 3. Tenta resgatar cada foto do cache de 1 ano do navegador
    for (let i = 0; i < missingPhotos.length; i++) {
      const p = missingPhotos[i];
      if (onProgress) onProgress({ index: i + 1, total: missingPhotos.length, rescuedPhotos });
      const [thumbData, fullData] = await Promise.all([
        tryFetchCachedImage(p.thumbUrl),
        tryFetchCachedImage(p.fullUrl)
      ]);
      if (thumbData || fullData) {
        const sr = await fetch("/api/store", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "rescueLegacyItem",
            type: "photo",
            id: p.id,
            ts: p.ts,
            order: i,
            albumId: coverMap[p.id] || "portfolio",
            thumb: thumbData || fullData,
            full: fullData || thumbData
          })
        });
        if (sr.ok) rescuedPhotos++;
      }
    }
    return { rescuedPhotos, rescuedMedia, totalMissing: missingPhotos.length };
  } catch (e) {
    console.warn("rescueLegacyImagesFromCache:", e);
    return { rescuedPhotos: 0, rescuedMedia: 0, totalMissing: 0 };
  }
}
