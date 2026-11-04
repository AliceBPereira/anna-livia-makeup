# Anna Lívia Makeup — Site Oficial e Painel Exclusivo

Este projeto contém o site de portfólio da **Anna Lívia Makeup** e um **painel administrativo exclusivo** onde ela pode gerenciar todas as fotos, categorias, textos e acessos do site pelo celular ou computador, sem precisar mexer em código.

---

## Estrutura de Arquivos

```
├── index.html          # Página pública do site (Web Mobile + Notebook)
├── css/
│   └── style.css       # Estilos do site público
├── js/
│   ├── config.js       # Configuração do Firebase (colar chaves aqui)
│   ├── defaults.js     # Textos e categorias iniciais padrão
│   ├── idb.js          # Banco local para modo demonstração
│   ├── public-api.js   # Leitura rápida de dados e fotos no site público
│   └── site.js         # Navegação, galerias, lightbox e rotas do site
├── imagens/
│   └── capa.jpg        # Foto original da capa
├── painel/
│   ├── index.html      # Painel administrativo exclusivo
│   ├── painel.css      # Estilos do painel
│   ├── painel.js       # Interface de gestão (fotos, textos, acessos, corte)
│   ├── admin-api.js    # Autenticação e gravação no Firebase / Demo
│   └── image.js        # Compressão, redimensionamento e corte de fotos
├── firestore.rules     # Regras de segurança do banco de dados (Firestore)
└── storage.rules       # Regras de segurança opcionais para Firebase Storage
```

---

## Como acessar o Painel (Navegação Discreta)

O painel **não fica visível** para os visitantes do site e possui bloqueio contra indexação no Google (`noindex, nofollow`). Existem 3 formas de entrar:

1. **Gesto secreto no site:** No rodapé do site, toque **5 vezes seguidas** sobre o texto `© 2026 Anna Lívia Makeup`.
2. **Atalho na URL do site:** Acesse `seusite.com/#/acesso-anna` (ou `#/painel`).
3. **Link direto:** Acesse `seusite.com/painel/` (recomendado salvar nos favoritos da tela inicial do celular).

---

## O que a Anna pode fazer pelo Painel

- **Fotos e Categorias (`Fotos`):**
  - **Adicionar várias fotos de uma vez** direto da galeria do celular ou computador (as fotos são comprimidas e otimizadas automaticamente).
  - **Mudar a ordem das fotos** arrastando com o dedo ou mouse (a primeira foto vira o **Destaque** da galeria).
  - **Enquadrar / Cortar / Girar** qualquer foto enviada com zoom e pré-visualização.
  - **Escolher a foto de capa** de cada categoria ou mover uma foto para outra categoria.
  - **Apagar fotos** (individualmente ou selecionando várias de uma vez).
  - **Criar, renomear, reordenar ou apagar categorias** dentro de Maquiagem e Penteados.
- **Textos e Fotos Fixas (`Textos`):**
  - Trocar e enquadrar a **Foto da Capa** e a **Foto do Sobre**.
  - Editar WhatsApp, Instagram, endereço (gera o mapa automaticamente), horário de atendimento, textos de apresentação, passo a passo de agendamento e ativar/desativar a seção de Cursos.
- **Outras Contas (`Acessos`):**
  - Criar novos logins (nome, e-mail e senha) para outras pessoas ajudarem a cuidar do site.
  - Desativar ou reativar acessos criados e enviar e-mail de redefinição de senha.
- **Minha Conta (`Conta`):**
  - Alterar o próprio nome, trocar a senha ou copiar o link secreto do painel.

---

## Passo a Passo para Entregar 100% Funcional (Firebase + Hospedagem Gratuita)

Enquanto o arquivo `js/config.js` não for preenchido, o site funciona em **Modo Demonstração** (salva tudo no navegador local para você testar). Para colocar no ar definitivamente no plano gratuito do Google:

### 1. Criar o projeto no Firebase (Gratuito, sem cartão)
1. Acesse [console.firebase.google.com](https://console.firebase.google.com/) com a conta Google da cliente (ou a sua) e clique em **Criar um projeto**.
2. No menu lateral, vá em **Criação > Authentication > Vamos começar**:
   - Na aba **Sign-in method**, clique em **E-mail/senha**, ative a primeira chave (**E-mail/senha**) e clique em **Salvar**.
3. No menu lateral, vá em **Criação > Firestore Database > Criar banco de dados**:
   - Escolha a localização (ex.: `southamerica-east1` — São Paulo) e avance.
   - Na aba **Regras (Rules)** do Firestore, apague o conteúdo padrão, cole todo o conteúdo do arquivo [`firestore.rules`](./firestore.rules) deste projeto e clique em **Publicar**.

### 2. Colar as chaves no arquivo `js/config.js`
1. No Firebase, clique na engrenagem **Configurações do projeto** (no topo do menu lateral).
2. Role até **Seus aplicativos** e clique no ícone **`</>` (Web)**.
3. Dê um apelido (ex.: `Site Anna Lívia`) e clique em **Registrar app**.
4. Copie os dados de `firebaseConfig` mostrados na tela e cole dentro do arquivo [`js/config.js`](./js/config.js):
   ```js
   export const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "seu-projeto.firebaseapp.com",
     projectId: "seu-projeto",
     storageBucket: "seu-projeto.firebasestorage.app",
     messagingSenderId: "123456...",
     appId: "1:123456:web:abcdef..."
   };
   ```

### 3. Publicar o site (Netlify, Vercel ou GitHub Pages)
- **Netlify (mais rápido):** Acesse [app.netlify.com/drop](https://app.netlify.com/drop) e arraste esta pasta inteira. O site entra no ar em segundos com HTTPS gratuito.
- **Vercel ou GitHub Pages:** Suba os arquivos desta pasta para um repositório no GitHub e ative o GitHub Pages ou conecte na Vercel.
- **Importante:** Caso use um domínio próprio (ex.: `annaliviamakeup.com.br`), adicione esse domínio no Firebase em **Authentication > Settings > Domínios autorizados**.

### 4. Criar o primeiro acesso da Anna
1. Abra `seusite.com/painel/` (ou dê 5 toques no `©` do rodapé do site).
2. Como ainda não existe nenhum administrador, o painel abrirá automaticamente a tela **Configuração Inicial**.
3. Cadastre o nome, e-mail e senha principal da Anna. A partir desse momento, a tela de configuração inicial é bloqueada para sempre pelo banco de dados e somente ela (ou novos logins que ela criar na aba **Acessos**) poderão entrar.
