/* Prepara as fotos no próprio navegador antes de enviar:
   corrige a rotação, reduz o tamanho e comprime em JPEG. */

export function loadImage(src) {
  return new Promise((res, rej) => {
    const url = src instanceof Blob ? URL.createObjectURL(src) : src;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => res(img);
    img.onerror = () => {
      const e = new Error("decode");
      e.friendly = "Não foi possível abrir esta imagem. Use fotos em JPG ou PNG (no iPhone, escolha a foto pela galeria).";
      rej(e);
    };
    img.src = url;
  });
}

export function toBlob(canvas, q) {
  return new Promise(res => canvas.toBlob(res, "image/jpeg", q));
}

/* Redimensiona um canvas já enquadrado (ex.: 4:5 ou 2:3) garantindo limite de bytes. */
export async function compressCanvas(srcCanvas, maxLong, maxBytes, q = 0.85) {
  const W = srcCanvas.width, H = srcCanvas.height;
  let scale = Math.min(1, maxLong / Math.max(W, H));
  for (let tries = 0; tries < 6; tries++) {
    const w = Math.max(1, Math.round(W * scale)), h = Math.max(1, Math.round(H * scale));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(srcCanvas, 0, 0, w, h);
    let qq = q, blob = await toBlob(c, qq);
    while (blob && blob.size > maxBytes && qq > 0.5) { qq -= 0.08; blob = await toBlob(c, qq); }
    if (blob && blob.size <= maxBytes) return { blob, w, h };
    scale *= 0.82;
  }
  throw Object.assign(new Error("too-big"), { friendly: "Imagem grande demais para processar." });
}

/* Redimensiona para caber em maxW x maxH e garante que o arquivo
   fique abaixo de maxBytes (reduzindo qualidade e, se preciso, tamanho). */
export async function resize(img, maxW, maxH, maxBytes, q = 0.84) {
  const W = img.naturalWidth, H = img.naturalHeight;
  let scale = Math.min(1, maxW / W, maxH / H);
  for (let tries = 0; tries < 6; tries++) {
    const w = Math.max(1, Math.round(W * scale)), h = Math.max(1, Math.round(H * scale));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    let qq = q, blob = await toBlob(c, qq);
    while (blob && blob.size > maxBytes && qq > 0.5) { qq -= 0.08; blob = await toBlob(c, qq); }
    if (blob && blob.size <= maxBytes) return { blob, w, h };
    scale *= 0.8;
  }
  throw Object.assign(new Error("too-big"), { friendly: "Imagem grande demais para processar." });
}

export async function processPhoto(file) {
  const img = await loadImage(file);
  try {
    const full = await resize(img, 1800, 1800, 680 * 1024, 0.85);
    const thumb = await resize(img, 800, 1000, 150 * 1024, 0.8);
    return { full: full.blob, thumb: thumb.blob, w: full.w, h: full.h };
  } finally { URL.revokeObjectURL(img.src); }
}

/* Miniatura pequena usada como capa da categoria (dataURL). */
export async function makeCover(src) {
  const img = await loadImage(src);
  const { blob } = await resize(img, 480, 600, 60 * 1024, 0.8);
  return blob;
}

/* Fotos fixas do site (capa e sobre). */
export async function processSiteImage(file, kind) {
  const img = await loadImage(file);
  try {
    const r = kind === "hero"
      ? await resize(img, 1024, 1536, 420 * 1024, 0.85)
      : await resize(img, 900, 1200, 200 * 1024, 0.85);
    return r.blob;
  } finally { URL.revokeObjectURL(img.src); }
}
