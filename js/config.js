/* =============================================================
   CONFIGURAÇÃO DO FIREBASE
   -------------------------------------------------------------
   1. Crie o projeto em https://console.firebase.google.com
   2. Em "Configurações do projeto" > "Seus apps" > ícone </> (Web),
      copie os valores do objeto firebaseConfig e cole abaixo.
   3. Enquanto os valores abaixo não forem preenchidos, o site e o
      painel funcionam em MODO DEMONSTRAÇÃO (dados salvos apenas no
      navegador de quem está testando).
   Veja o passo a passo completo no arquivo LEIA-ME.md
   ============================================================= */
export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "siteanalivia.firebaseapp.com",
  projectId: "siteanalivia",
  storageBucket: "siteanalivia.firebasestorage.app",
  messagingSenderId: "515779491465",
  appId: "COLE_AQUI"
};

/* Onde as fotos ficam guardadas:
   "firestore" -> dentro do banco de dados (100% gratuito, sem cartão de crédito).
   "storage"   -> no Firebase Storage (exige o plano Blaze, que tem cota gratuita;
                  recomendado se o site tiver muitas visitas).
   Trocar a opção vale para as próximas fotos enviadas; as antigas continuam funcionando. */
export const IMAGE_STORAGE = "firestore";

export const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/10.12.2";

export const isConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("COLE") &&
  !!firebaseConfig.projectId && !firebaseConfig.projectId.startsWith("COLE");

export const MODE = isConfigured ? "firebase" : "demo";
