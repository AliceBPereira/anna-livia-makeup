/* Conteúdo padrão do site. É usado na primeira configuração e
   sempre que algum campo ainda não foi preenchido pelo painel. */

export const DEFAULT_CONTENT = {
  // Capa
  brand: "Anna Lívia",
  brandSub: "MAKEUP",
  tagline: "Realce o que\nte faz única",
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

  // Botões da página inicial
  cardAgendamentos: "Studio Anna Lívia Makeup",
  cardMaquiagem: "Noivas, debutantes, pré-wedding e formaturas.",
  cardPenteados: "Coque, tranças, semipreso e ondas.",
  cardPortfolio: "Trabalhos realizados.",
  cardCursos: "Aprenda a se maquiar com a Anna.",
  cardLocalizacao: "Como chegar ao estúdio.",

  // Agendamentos
  bookingIntro: "Os horários são marcados pelo WhatsApp. Veja como funciona:",
  step1Title: "Envie uma mensagem",
  step1Text: "Conte a data, o horário do evento e o tipo de produção.",
  step2Title: "Confirme a disponibilidade",
  step2Text: "A Anna responde com os horários livres e os valores.",
  step3Title: "Garanta o seu horário",
  step3Text: "A reserva é confirmada após o sinal.",

  // Maquiagem / Penteados
  maquiagemIntro: "Escolha a ocasião para ver os trabalhos.",
  penteadosIntro: "Escolha o estilo para ver os trabalhos.",

  // Portfólio
  portfolioIntro: "Alguns dos trabalhos que já fiz. Veja muito mais no Instagram.",

  // Cursos
  showCursos: true,
  cursosSoon: true,
  cursosText:
    "Os cursos de maquiagem estão sendo preparados. Deixe seu nome na lista pelo WhatsApp e seja avisada quando as turmas abrirem.",

  // Localização
  locationTitle: "Realce sua beleza para momentos especiais.",
  locationText: "O atendimento é feito no estúdio, com hora marcada."
};

export const GROUPS = {
  maquiagem: { label: "Maquiagem", cta: "Agendar maquiagem", prefix: "Maquiagem" },
  penteados: { label: "Penteados", cta: "Agendar penteado", prefix: "Penteado" },
  portfolio: { label: "Portfólio", cta: "Quero uma produção assim", prefix: "Portfólio" }
};

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
    description: "" }
].map((a, i) => ({ ...a, order: i, coverThumb: "", coverPhotoId: "", count: 0 }));

/* Campos de texto editáveis no painel, agrupados por seção. */
export const CONTENT_FORM = [
  { title: "Contatos", fields: [
    ["whatsapp", "WhatsApp (com DDD)", "text", "Ex.: (35) 99752-0784. Todos os botões de agendamento usam este número."],
    ["instagram", "Instagram (só o nome de usuário)", "text", "Sem o @. Ex.: annaliviaa_"],
    ["address", "Endereço do estúdio", "textarea", "O mapa da página Localização é gerado a partir deste endereço. Deixe vazio para esconder."],
    ["hours", "Horário de atendimento", "text"]
  ]},
  { title: "Capa (topo do site)", fields: [
    ["brand", "Nome", "text"],
    ["brandSub", "Texto abaixo do nome", "text"],
    ["tagline", "Frase da capa", "textarea", "Use Enter para quebrar a linha."],
    ["heroFeature1", "Destaque 1", "text"],
    ["heroFeature2", "Destaque 2", "text"],
    ["heroFeature3", "Destaque 3", "text"],
    ["heroSignature", "Assinatura", "text"]
  ]},
  { title: "Sobre", fields: [
    ["aboutTitle", "Título", "text"],
    ["aboutText", "Texto", "textarea", "Deixe uma linha em branco para começar um novo parágrafo."],
    ["aboutSignature", "Assinatura", "text"]
  ]},
  { title: "Botões da página inicial", fields: [
    ["cardAgendamentos", "Agendamentos — subtítulo", "text"],
    ["cardMaquiagem", "Maquiagem — subtítulo", "text"],
    ["cardPenteados", "Penteados — subtítulo", "text"],
    ["cardPortfolio", "Portfólio — subtítulo", "text"],
    ["cardCursos", "Cursos — subtítulo", "text"],
    ["cardLocalizacao", "Localização — subtítulo", "text"]
  ]},
  { title: "Página Agendamentos", fields: [
    ["bookingIntro", "Introdução", "textarea"],
    ["step1Title", "Passo 1 — título", "text"], ["step1Text", "Passo 1 — texto", "textarea"],
    ["step2Title", "Passo 2 — título", "text"], ["step2Text", "Passo 2 — texto", "textarea"],
    ["step3Title", "Passo 3 — título", "text"], ["step3Text", "Passo 3 — texto", "textarea"]
  ]},
  { title: "Páginas Maquiagem, Penteados e Portfólio", fields: [
    ["maquiagemIntro", "Maquiagem — introdução", "text"],
    ["penteadosIntro", "Penteados — introdução", "text"],
    ["portfolioIntro", "Portfólio — introdução", "textarea"]
  ]},
  { title: "Página Cursos", fields: [
    ["showCursos", "Mostrar o botão Cursos na página inicial", "checkbox"],
    ["cursosSoon", "Mostrar o selo “EM BREVE”", "checkbox"],
    ["cursosText", "Texto", "textarea"]
  ]},
  { title: "Página Localização", fields: [
    ["locationTitle", "Título", "text"],
    ["locationText", "Texto", "textarea"]
  ]}
];
