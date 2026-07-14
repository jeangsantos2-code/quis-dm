(function () {
  const QUESTIONS = [
    {
      number: 1,
      key: "rotina",
      dimension: "nao_pontuada",
      prompt: "Hoje, como vocês dão conta da rotina da casa?",
      options: [
        { text: "Temos dificuldade até com o básico.", score: null },
        { text: "Damos conta, mas com bastante desgaste.", score: null },
        { text: "Funcionamos bem na maior parte do tempo.", score: null },
        { text: "Somos muito eficientes com casa, filhos e compromissos.", score: null }
      ]
    },
    {
      number: 2,
      key: "conversas",
      dimension: "tempo_presenca",
      prompt: "Nas últimas 4 semanas, sobre o que vocês mais conversaram?",
      options: [
        { text: "Quase só problemas, tarefas e responsabilidades.", score: 1 },
        { text: "Principalmente rotina, com poucas conversas pessoais.", score: 2 },
        { text: "Uma mistura entre rotina e assuntos do casal.", score: 3 },
        { text: "Sentimentos, planos e experiências aparecem com frequência.", score: 4 }
      ]
    },
    {
      number: 3,
      key: "tempo_protegido",
      dimension: "tempo_presenca",
      prompt: "Nas últimas 4 semanas, vocês tiveram algum tempo juntos sem resolver tarefas?",
      options: [
        { text: "Não aconteceu.", score: 1 },
        { text: "Aconteceu uma vez ou por poucos minutos.", score: 2 },
        { text: "Aconteceu algumas vezes.", score: 3 },
        { text: "É algo que protegemos com frequência.", score: 4 }
      ]
    },
    {
      number: 4,
      key: "carinho",
      dimension: "tempo_presenca",
      prompt: "Nas últimas semanas, como ficou o carinho entre vocês?",
      options: [
        { text: "Quase não apareceu.", score: 1 },
        { text: "Apareceu mais como hábito ou cumprimento.", score: 2 },
        { text: "Existiu em alguns momentos espontâneos.", score: 3 },
        { text: "Foi frequente, presente e intencional.", score: 4 }
      ]
    },
    {
      number: 5,
      key: "escuta_oferecida",
      dimension: "escuta_resposta",
      prompt: "Quando seu cônjuge compartilha algo importante, o que você costuma fazer primeiro?",
      options: [
        { text: "Mudo de assunto, minimizo ou deixo para depois.", score: 1 },
        { text: "Tento resolver rapidamente ou dar uma resposta.", score: 2 },
        { text: "Escuto e tento entender antes de responder.", score: 3 },
        { text: "Escuto, faço perguntas e demonstro que entendi.", score: 4 }
      ]
    },
    {
      number: 6,
      key: "escuta_recebida",
      dimension: "escuta_resposta",
      prompt: "Quando você compartilha algo importante, como costuma se sentir?",
      options: [
        { text: "Ignorada(o) ou interrompida(o).", score: 1 },
        { text: "Ouvida(o) pela metade ou com pressa.", score: 2 },
        { text: "Compreendida(o) em alguns momentos.", score: 3 },
        { text: "Acolhida(o), levada(o) a sério e compreendida(o).", score: 4 }
      ]
    },
    {
      number: 7,
      key: "experiencia_nova",
      dimension: "planos_experiencias",
      prompt: "Quando foi a última vez que vocês viveram uma experiência nova juntos?",
      options: [
        { text: "Não consigo lembrar.", score: 1 },
        { text: "Faz muitos meses.", score: 2 },
        { text: "Nos últimos meses.", score: 3 },
        { text: "Recentemente, e já temos outras ideias.", score: 4 }
      ]
    },
    {
      number: 8,
      key: "plano_do_casal",
      dimension: "planos_experiencias",
      prompt: "Hoje, vocês têm algum plano que seja do casal, e não só da casa ou dos filhos?",
      options: [
        { text: "Não consigo identificar um plano realmente nosso.", score: 1 },
        { text: "Existem ideias, mas quase não conversamos sobre elas.", score: 2 },
        { text: "Temos alguns planos e começamos a organizar.", score: 3 },
        { text: "Temos direção, projetos e coisas que queremos construir juntos.", score: 4 }
      ]
    },
    {
      number: 9,
      key: "trajetoria",
      dimension: "urgencia",
      prompt: "Se os próximos 2 anos repetissem exatamente os últimos meses, como você se sentiria?",
      options: [
        { text: "Tranquila(o), porque gostaria de preservar o que já temos.", score: null, level: 1 },
        { text: "Sentiria que algo importante continuaria faltando.", score: null, level: 2 },
        { text: "Ficaria incomodada(o) por perceber que a distância permanece.", score: null, level: 3 },
        { text: "Quero mudar essa direção antes que ela vire o novo normal.", score: null, level: 4 }
      ]
    },
    {
      number: 10,
      key: "prontidao",
      dimension: "agencia",
      prompt: "Ao perceber um ponto de atenção no casamento, qual frase mais representa seu momento?",
      options: [
        { text: "Quero entender melhor antes de agir.", score: null, level: 1 },
        { text: "Percebo que algo depende de mim, mas não sei por onde começar.", score: null, level: 2 },
        { text: "Estou pronta(o) para iniciar um movimento possível.", score: null, level: 3 },
        { text: "Gostaria que meu cônjuge participasse desde o começo.", score: null, level: 4 }
      ]
    }
  ];

  const CATEGORY_BY_SCORE = [
    { min: 2, max: 3, name: "Vínculo pedindo cuidado", slug: "vinculo_pedindo_cuidado", text: "Existe afastamento e pouca presença." },
    { min: 4, max: 5, name: "Piloto automático", slug: "piloto_automatico", text: "A casa funciona, mas o casal ficou para depois." },
    { min: 6, max: 8, name: "Área saudável", slug: "area_saudavel", text: "Existe parceria, mas o crescimento ainda precisa de constância." },
    { min: 9, max: 9, name: "Casamento Nota 9", slug: "casamento_nota_9", text: "Crescimento intencional, presença e direção." }
  ];

  const DIMENSION_LABELS = {
    tempo_presenca: "Tempo e presença",
    escuta_resposta: "Escuta e resposta",
    planos_experiencias: "Planos e experiências a dois"
  };

  const DIMENSION_BULLETS = {
    tempo_presenca: [
      "As conversas parecem estar mais ligadas à rotina.",
      "O tempo do casal pode estar ficando sem proteção.",
      "O carinho ainda aparece, mas pode estar mais automático.",
      "A casa funciona, mas o casal pode estar ficando para depois."
    ],
    escuta_resposta: [
      "A escuta existe, mas talvez venha com pressa.",
      "Algumas conversas importantes podem estar sendo resolvidas rápido demais.",
      "Pode estar faltando mais curiosidade antes da resposta.",
      "Você talvez esteja tentando resolver quando o outro precisa ser entendido."
    ],
    planos_experiencias: [
      "Os planos dos dois parecem ter perdido espaço.",
      "A rotina pode estar ocupando o lugar das experiências novas.",
      "O futuro do casal talvez esteja menos presente nas conversas.",
      "Pode estar faltando algo que seja de vocês dois, não só da casa."
    ],
    urgencia: [
      "A repetição dos últimos meses parece incomodar você.",
      "Existe uma percepção de que algo precisa mudar antes que vire normal.",
      "Você não parece querer esperar a rotina decidir sozinha."
    ],
    agencia: [
      "Você já percebe que existe um movimento possível.",
      "Você parece pronta(o) para começar por algo que depende de você.",
      "O próximo passo precisa ser simples, claro e aplicável."
    ]
  };

  const FIRST_STEPS = {
    escuta_resposta: {
      type: "escute_antes_de_resolver",
      title: "Escute antes de resolver",
      action: "Na próxima conversa importante, não tente corrigir de cara. Primeiro, mostre que entendeu.",
      example: "Entendi. Então o que mais pesou para você foi isso?"
    },
    tempo_presenca: {
      type: "proteja_20_minutos",
      title: "Proteja 20 minutos",
      action: "Escolha um momento da semana e convide seu cônjuge para 20 minutos de conversa sem filhos, contas ou tarefas.",
      example: "Queria separar um tempo só nosso essa semana. Sem resolver nada. Só pra gente conversar."
    },
    planos_experiencias: {
      type: "traga_possibilidade_nova",
      title: "Traga uma possibilidade nova",
      action: "Pense em três experiências simples que poderiam ser de vocês dois e convide seu cônjuge a escolher uma.",
      example: "Queria que a gente escolhesse algo novo pra viver juntos esse mês. Pode ser simples."
    }
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getAnswer(answers, questionNumber) {
    return answers[String(questionNumber)] || answers[questionNumber] || null;
  }

  function calculateResult(answers) {
    const scoredQuestions = QUESTIONS.filter((question) => question.number >= 2 && question.number <= 8);
    const rawScore = scoredQuestions
      .filter((question) => question.number >= 2 && question.number <= 8)
      .reduce((sum, question) => {
        const answer = getAnswer(answers, question.number);
        return sum + (answer && Number.isFinite(answer.score) ? answer.score : 1);
      }, 0);

    const publicScore = clamp(Math.round(2 + ((rawScore - 7) / 21) * 7), 2, 9);
    const category = CATEGORY_BY_SCORE.find((item) => publicScore >= item.min && publicScore <= item.max);
    const dimensionAverages = getDimensionAverages(answers);
    const mainDimension = getMainDimension(dimensionAverages);
    const urgencyLevel = getAnswer(answers, 9)?.level || getAnswer(answers, 9)?.answerIndex || 1;
    const agencyLevel = getAnswer(answers, 10)?.level || getAnswer(answers, 10)?.answerIndex || 1;

    return {
      rawScore,
      publicScore,
      scoreScale: `${publicScore}/9`,
      category,
      dimensionAverages,
      mainDimension,
      mainDimensionLabel: DIMENSION_LABELS[mainDimension],
      urgencyLevel,
      agencyLevel,
      evidence: getEvidence(answers, mainDimension, urgencyLevel, agencyLevel, publicScore),
      fallingBehind: getFallingBehindItems(answers, mainDimension),
      firstStep: FIRST_STEPS[mainDimension]
    };
  }

  function getDimensionAverages(answers) {
    const groups = {
      tempo_presenca: [2, 3, 4],
      escuta_resposta: [5, 6],
      planos_experiencias: [7, 8]
    };

    return Object.fromEntries(Object.entries(groups).map(([dimension, numbers]) => {
      const values = numbers.map((number) => getAnswer(answers, number)?.score || 1);
      const total = values.reduce((sum, value) => sum + value, 0);
      return [dimension, total / values.length];
    }));
  }

  function getMainDimension(averages) {
    const priority = ["escuta_resposta", "tempo_presenca", "planos_experiencias"];
    return priority.reduce((selected, dimension) => {
      if (!selected) return dimension;
      if (averages[dimension] < averages[selected]) return dimension;
      return selected;
    }, null);
  }

  function getEvidence(answers, mainDimension, urgencyLevel, agencyLevel, publicScore) {
    const selected = [];
    const pushUnique = (items) => {
      items.forEach((item) => {
        if (selected.length < 3 && !selected.includes(item)) selected.push(item);
      });
    };

    const lowMap = [
      [2, "tempo_presenca", 0],
      [3, "tempo_presenca", 1],
      [4, "tempo_presenca", 2],
      [5, "escuta_resposta", 1],
      [6, "escuta_resposta", 0],
      [7, "planos_experiencias", 1],
      [8, "planos_experiencias", 3]
    ];

    lowMap.forEach(([questionNumber, dimension, bulletIndex]) => {
      const answer = getAnswer(answers, questionNumber);
      if (answer && answer.score <= 2) pushUnique([DIMENSION_BULLETS[dimension][bulletIndex]]);
    });

    if (selected.length < 2) pushUnique(DIMENSION_BULLETS[mainDimension]);
    if (urgencyLevel >= 3) pushUnique(DIMENSION_BULLETS.urgencia);
    if (agencyLevel >= 2) pushUnique(DIMENSION_BULLETS.agencia);

    if (selected.length < 3 && publicScore >= 6) {
      pushUnique([
        "Existe parceria, mas o crescimento ainda precisa de constância.",
        "A meta não é perfeição. A meta é crescimento contínuo.",
        "Existe um ponto claro por onde começar agora."
      ]);
    }

    return selected.slice(0, 3);
  }

  function getFallingBehindItems(answers, mainDimension) {
    const items = [];
    const add = (item) => {
      if (!items.includes(item)) items.push(item);
    };

    if (mainDimension === "tempo_presenca") {
      add("Conversas pessoais.");
      add("Carinho intencional.");
      add("Tempo protegido.");
    }

    if (mainDimension === "escuta_resposta") {
      add("Escuta sem pressa.");
      add("Conversas pessoais.");
      add("Carinho intencional.");
    }

    if (mainDimension === "planos_experiencias") {
      add("Planos a dois.");
      add("Experiências novas.");
      add("Tempo protegido.");
    }

    const answer2 = getAnswer(answers, 2);
    const answer4 = getAnswer(answers, 4);
    const answer7 = getAnswer(answers, 7);
    if (answer2 && answer2.score <= 2) add("Conversas pessoais.");
    if (answer4 && answer4.score <= 2) add("Carinho intencional.");
    if (answer7 && answer7.score <= 2) add("Experiências novas.");

    return items.slice(0, 4);
  }

  window.CN9Scoring = {
    QUESTIONS,
    CATEGORY_BY_SCORE,
    DIMENSION_LABELS,
    FIRST_STEPS,
    calculateResult
  };
})();
