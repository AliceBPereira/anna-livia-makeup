/* Pequeno armazenamento chave/valor no IndexedDB, usado apenas no
   MODO DEMONSTRAÇÃO (quando o Firebase ainda não foi configurado). */
const DB = "annalivia-demo", STORE = "kv";
let dbp;
function db() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
function tx(mode, fn) {
  return db().then(d => new Promise((res, rej) => {
    const t = d.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => res(out && "result" in out ? out.result : undefined);
    t.onerror = () => rej(t.error);
  }));
}
export const kvGet = k => tx("readonly", s => s.get(k));
export const kvSet = (k, v) => tx("readwrite", s => { s.put(v, k); });
export const kvDel = k => tx("readwrite", s => { s.delete(k); });
