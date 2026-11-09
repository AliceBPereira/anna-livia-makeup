/* Conteúdo padrão do site. É usado na primeira configuração e
   sempre que algum campo ainda não foi preenchido pelo painel. */

export const DEFAULT_CONTENT = {
  // Capa (Entrada do site)
  brand: "Anna Lívia",
  brandSub: "MAKEUP",
  tagline: "Realce o que\nte faz única",
  heroCta: "Agendar horário",
  heroFeature1: "Maquiagem para todas as ocasiões",
  heroFeature2: "Beleza com técnica e autenticidade",
  heroFeature3: "Atendimento personalizado",
  heroSignature: "Studio Anna Lívia Makeup",

  // Sobre
  aboutTitle: "Sobre",
  aboutText:
    "Sou a Anna Lívia, maquiadora e hairstylist. No meu estúdio, cada cliente tem um atendimento exclusivo, com tempo e atenção para criar uma produção que combine com ela.\n\nMeu trabalho é realçar a sua beleza natural, do primeiro clique à última dança.",
  aboutSignature: "Anna Lívia",

  // Contatos
  whatsapp: "(35) 9752-0784",
  instagram: "annaliviaa_",
  address: "",
  hours: "A definir",

  // Página inicial e Botões / Visibilidade das Rotas
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
  showCursos: true,
  cardCursosTitle: "Cursos",
  cardCursos: "Aprenda a se maquiar com a Anna.",
  cursosSoonBadge: "EM BREVE",
  showLocalizacao: true,
  cardLocalizacaoTitle: "Localização",
  cardLocalizacao: "Como chegar ao estúdio.",
  customRoutes: [],

  // O Estúdio (Ambiente, bancada e estrutura)
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

  // Agendamentos
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

  // Maquiagem / Penteados / Portfólio
  maquiagemTitle: "Maquiagem",
  maquiagemIntro: "Escolha a ocasião para ver os trabalhos.",
  maquiagemCta: "Agendar maquiagem",
  penteadosTitle: "Penteados",
  penteadosIntro: "Escolha o estilo para ver os trabalhos.",
  penteadosCta: "Agendar penteado",
  portfolioTitle: "Portfólio",
  portfolioIntro: "Alguns dos trabalhos que já fiz. Veja muito mais no Instagram.",
  portfolioCta: "Quero uma produção assim",

  // Cursos (lista de cursos + estado "Em breve" quando vazio)
  cursosTitle: "Cursos",
  cursosIntro: "Aprenda técnicas de automaquiagem e aperfeiçoamento profissional com a Anna Lívia.",
  cursosSoon: true,
  cursosText:
    "Os cursos de maquiagem estão sendo preparados. Deixe seu nome na lista pelo WhatsApp e seja avisada quando as turmas abrirem.",
  cursosWaitlistCta: "Quero ser avisada",
  courses: [],

  // Localização e Gerais
  locationTitle: "Realce sua beleza para momentos especiais.",
  locationText: "O atendimento é feito no estúdio, com hora marcada.",
  locationCta: "Agendar horário",
  igBtnLabel: "Ver mais no Instagram",
  emptyGalleryText: "Novas fotos chegando em breve por aqui.",
  footerText: "Anna Lívia Makeup",

  // Cores principais do tema (originais padrão em destaque)
  colorPage: "#14110F",
  colorCol: "#231F1B",
  colorCard: "#342D27",
  colorGold: "#C8A96A",
  colorInk: "#F7F4EF"
};

export const THEME_COLORS = [
  { key: "colorGold", label: "Cor de Destaque (Dourado / Botões)", default: "#C8A96A", presets: ["#C8A96A", "#D9B48F", "#D4AF37", "#C9968A", "#B68D65"] },
  { key: "colorPage", label: "Fundo Externo da Página", default: "#14110F", presets: ["#14110F", "#1C1916", "#0E0C0A", "#1E1614", "#26201C"] },
  { key: "colorCol", label: "Fundo do Painel Principal", default: "#231F1B", presets: ["#231F1B", "#2A2622", "#1B1714", "#2E2320", "#332B25"] },
  { key: "colorCard", label: "Cor dos Cards e Blocos", default: "#342D27", presets: ["#342D27", "#332E29", "#28221D", "#3D2F2B", "#423830"] },
  { key: "colorInk", label: "Cor Principal dos Textos", default: "#F7F4EF", presets: ["#F7F4EF", "#F3EEE6", "#FFFFFF", "#F5E6D8", "#EAE0D5"] }
];

export const GROUPS = {
  estudio: { label: "O Estúdio", cta: "Agendar horário no estúdio", prefix: "Estúdio" },
  maquiagem: { label: "Maquiagem", cta: "Agendar maquiagem", prefix: "Maquiagem" },
  penteados: { label: "Penteados", cta: "Agendar penteado", prefix: "Penteado" },
  portfolio: { label: "Portfólio", cta: "Quero uma produção assim", prefix: "Portfólio" },
  pagina: { label: "Páginas Extras", cta: "Agendar pelo WhatsApp", prefix: "Página" }
};

export const SITE_ROUTES = [
  { key: "showMaquiagem", id: "maquiagem", titleKey: "cardMaquiagemTitle", subKey: "cardMaquiagem", defaultTitle: "Maquiagem", desc: "Menu superior + Card na página inicial + Galerias de Maquiagem", inTopMenu: true },
  { key: "showPenteados", id: "penteados", titleKey: "cardPenteadosTitle", subKey: "cardPenteados", defaultTitle: "Penteados", desc: "Menu superior + Card na página inicial + Galerias de Penteados", inTopMenu: true },
  { key: "showPortfolio", id: "portfolio", titleKey: "cardPortfolioTitle", subKey: "cardPortfolio", defaultTitle: "Portfólio", desc: "Menu superior + Card na página inicial + Galeria de Portfólio", inTopMenu: true },
  { key: "showEstudio", id: "estudio", titleKey: "cardEstudioTitle", subKey: "cardEstudio", defaultTitle: "O Estúdio", desc: "Menu superior + Card na página inicial + Página de fotos e textos do Estúdio", inTopMenu: true },
  { key: "showCursos", id: "cursos", titleKey: "cardCursosTitle", subKey: "cardCursos", defaultTitle: "Cursos", desc: "Menu superior + Card na página inicial + Página de Cursos", inTopMenu: true },
  { key: "showLocalizacao", id: "localizacao", titleKey: "cardLocalizacaoTitle", subKey: "cardLocalizacao", defaultTitle: "Localização", desc: "Menu superior + Card na página inicial + Mapa e Contatos", inTopMenu: true },
  { key: "showAgendamentos", id: "agendamentos", titleKey: "cardAgendamentosTitle", subKey: "cardAgendamentos", defaultTitle: "Agendamentos", desc: "Botão do topo + Card na página inicial + Passo a passo de agendamento", inTopMenu: false }
];

export const DEFAULT_ALBUMS = [
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

export function ensureRequiredAlbums(list) {
  const out = Array.isArray(list) && list.length ? list.slice() : DEFAULT_ALBUMS.map(a => ({ ...a }));
  ["portfolio", "estudio"].forEach(reqId => {
    if (!out.some(a => a.id === reqId)) {
      const def = DEFAULT_ALBUMS.find(a => a.id === reqId);
      if (def) out.push({ ...def, order: out.length });
    }
  });
  return out;
}

/* Campos de texto editáveis no painel, agrupados por seção. */
export const CONTENT_FORM = [
  { title: "Capa Principal (Entrada do Site)", fields: [
    ["brand", "Título principal (Nome)", "text"],
    ["brandSub", "Subtítulo abaixo do nome", "text"],
    ["tagline", "Frase de impacto da capa", "textarea", "Use Enter para quebrar a linha (ex.: Realce o que / te faz única)."],
    ["heroCta", "Texto do botão da capa", "text"],
    ["heroFeature1", "Destaque 1 (rodapé da capa)", "text"],
    ["heroFeature2", "Destaque 2 (rodapé da capa)", "text"],
    ["heroFeature3", "Destaque 3 (rodapé da capa)", "text"],
    ["heroSignature", "Assinatura no rodapé da capa", "text"]
  ]},
  { title: "Sobre a Anna Lívia", fields: [
    ["aboutTitle", "Título da seção", "text"],
    ["aboutText", "Texto de apresentação", "textarea", "Deixe uma linha em branco para começar um novo parágrafo."],
    ["aboutSignature", "Assinatura", "text"]
  ]},
  { title: "O Estúdio (Ambiente, Bancada e Estrutura)", fields: [
    ["showEstudio", "Mostrar o card “O Estúdio” na página inicial", "checkbox"],
    ["estudioTitle", "Título da página do Estúdio", "text"],
    ["estudioIntro", "Frase de introdução (abaixo do título)", "textarea"],
    ["estudioText", "Texto sobre o ambiente, bancada e estrutura", "textarea", "Conte como é o espaço, iluminação, poltrona, recepção e produtos. As fotos do estúdio são adicionadas na aba Fotos → O Estúdio."],
    ["estudioFeat1Title", "Diferencial 1 — título", "text"],
    ["estudioFeat1Text", "Diferencial 1 — descrição", "textarea"],
    ["estudioFeat2Title", "Diferencial 2 — título", "text"],
    ["estudioFeat2Text", "Diferencial 2 — descrição", "textarea"],
    ["estudioFeat3Title", "Diferencial 3 — título", "text"],
    ["estudioFeat3Text", "Diferencial 3 — descrição", "textarea"],
    ["estudioCta", "Texto do botão de agendamento no Estúdio", "text"]
  ]},
  { title: "Botões e Títulos da Página Inicial", fields: [
    ["homeExploreSub", "Subtítulo acima dos cards (ex.: Explore)", "text"],
    ["homeExploreTitle", "Título acima dos cards (ex.: Serviços & Portfólio)", "text"],
    ["cardAgendamentosTitle", "Card Agendamentos — título", "text"],
    ["cardAgendamentos", "Card Agendamentos — subtítulo", "text"],
    ["cardMaquiagemTitle", "Card Maquiagem — título", "text"],
    ["cardMaquiagem", "Card Maquiagem — subtítulo", "text"],
    ["cardPenteadosTitle", "Card Penteados — título", "text"],
    ["cardPenteados", "Card Penteados — subtítulo", "text"],
    ["cardPortfolioTitle", "Card Portfólio — título", "text"],
    ["cardPortfolio", "Card Portfólio — subtítulo", "text"],
    ["cardEstudioTitle", "Card O Estúdio — título", "text"],
    ["cardEstudio", "Card O Estúdio — subtítulo", "text"],
    ["cardCursosTitle", "Card Cursos — título", "text"],
    ["cardCursos", "Card Cursos — subtítulo", "text"],
    ["cardLocalizacaoTitle", "Card Localização — título", "text"],
    ["cardLocalizacao", "Card Localização — subtítulo", "text"]
  ]},
  { title: "Contatos e Endereço", fields: [
    ["whatsapp", "WhatsApp (com DDD)", "text", "Ex.: (35) 99752-0784. Todos os botões de agendamento usam este número."],
    ["instagram", "Instagram (só o nome de usuário)", "text", "Sem o @. Ex.: annaliviaa_"],
    ["address", "Endereço do estúdio", "textarea", "O mapa da página Localização é gerado a partir deste endereço. Deixe vazio para esconder."],
    ["hours", "Horário de atendimento", "text"]
  ]},
  { title: "Página Agendamentos", fields: [
    ["bookingTitle", "Título da página", "text"],
    ["bookingIntro", "Introdução", "textarea"],
    ["step1Title", "Passo 1 — título", "text"], ["step1Text", "Passo 1 — texto", "textarea"],
    ["step2Title", "Passo 2 — título", "text"], ["step2Text", "Passo 2 — texto", "textarea"],
    ["step3Title", "Passo 3 — título", "text"], ["step3Text", "Passo 3 — texto", "textarea"],
    ["bookingCta", "Texto do botão do WhatsApp", "text"],
    ["bookingWaMsg", "Mensagem automática enviada no WhatsApp", "text"]
  ]},
  { title: "Páginas Maquiagem, Penteados e Portfólio", fields: [
    ["maquiagemTitle", "Maquiagem — título da página", "text"],
    ["maquiagemIntro", "Maquiagem — frase de introdução", "text"],
    ["maquiagemCta", "Maquiagem — texto do botão de agendar", "text"],
    ["penteadosTitle", "Penteados — título da página", "text"],
    ["penteadosIntro", "Penteados — frase de introdução", "text"],
    ["penteadosCta", "Penteados — texto do botão de agendar", "text"],
    ["portfolioTitle", "Portfólio — título da página", "text"],
    ["portfolioIntro", "Portfólio — frase de introdução", "textarea"],
    ["portfolioCta", "Portfólio — texto do botão de agendar", "text"]
  ]},
  { title: "Página Cursos (Textos Gerais e Aviso “Em Breve”)", fields: [
    ["showCursos", "Mostrar o card Cursos na página inicial", "checkbox"],
    ["cursosTitle", "Título da página de Cursos", "text"],
    ["cursosIntro", "Frase de introdução (aparece quando há cursos cadastrados)", "textarea"],
    ["cursosSoonBadge", "Texto do selo quando não há cursos (ex.: EM BREVE)", "text"],
    ["cursosText", "Texto exibido enquanto nenhum curso foi adicionado", "textarea"],
    ["cursosWaitlistCta", "Texto do botão da lista de espera (enquanto em breve)", "text"]
  ]},
  { title: "Página Localização e Outros Textos do Site", fields: [
    ["locationTitle", "Localização — título", "text"],
    ["locationText", "Localização — texto", "textarea"],
    ["locationCta", "Localização — texto do botão", "text"],
    ["igBtnLabel", "Texto dos botões do Instagram", "text"],
    ["emptyGalleryText", "Aviso quando uma galeria ainda não tem fotos", "text"],
    ["footerText", "Nome no rodapé do site (ao lado de © 2026)", "text"]
  ]}
];
