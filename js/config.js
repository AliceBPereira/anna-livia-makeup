/* =============================================================
   CONFIGURAÇÃO DE ARMAZENAMENTO
   -------------------------------------------------------------
   O site utiliza automaticamente o banco na nuvem da Vercel
   (/api/store com Vercel Blob) quando publicado na Vercel, ou
   Firebase caso as chaves abaixo sejam preenchidas.
   ============================================================= */
export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "siteanalivia.firebaseapp.com",
  projectId: "siteanalivia",
  storageBucket: "siteanalivia.firebasestorage.app",
  messagingSenderId: "515779491465",
  appId: "COLE_AQUI"
};

export const IMAGE_STORAGE = "firestore";
export const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/10.12.2";

export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("COLE") &&
  !!firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("COLE");

export const MODE = isFirebaseConfigured ? "firebase" : "cloud";
