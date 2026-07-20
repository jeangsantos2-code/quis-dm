(function () {
  const app = document.getElementById("app");
  const config = window.CN9_CONFIG;
  const scoring = window.CN9Scoring;
  const tracking = window.CN9Tracking;

  const INTERSTITIALS = {
    1: {
      number: 1,
      theme: "automatico",
      label: "Piloto automático",
      title: "O casal pode continuar junto e, mesmo assim, ir ficando para depois.",
      text: "A casa funciona. Mas quase tudo gira em torno de agenda, contas e tarefas.",
      scene: "automatico"
    },
    2: {
      number: 2,
      theme: "tempo",
      label: "O tempo não resolve sozinho",
      title: "O tempo não aproxima sozinho.",
      text: "Quando nada muda, o casal só aprende a viver distante com mais eficiência.",
      scene: "tempo"
    },
    3: {
      number: 3,
      theme: "agenda",
      label: "Agenda cheia, casal sem espaço",
      title: "Filhos, trabalho e compromissos encontram espaço.",
      text: "O casal, muitas vezes, fica para depois.",
      scene: "agenda"
    }
  };

  const SCENE_VISUALS = {
    automatico: {
      mobile: "/quiz/assets/images/scene-automatico-mobile.jpg",
      desktop: "/quiz/assets/images/scene-automatico-desktop.jpg",
      alt: "Um casal fisicamente perto, mas absorvido pelo celular e pela rotina."
    },
    tempo: {
      mobile: "/quiz/assets/images/scene-tempo-mobile.jpg",
      desktop: "/quiz/assets/images/scene-tempo-desktop.jpg",
      alt: "Duas xícaras e um calendário entre um casal que se afastou na rotina."
    },
    agenda: {
      mobile: "/quiz/assets/images/scene-agenda-mobile.jpg",
      desktop: "/quiz/assets/images/scene-agenda-desktop.jpg",
      alt: "Uma mesa tomada por agenda, mochila, telefone, tarefas e desenhos das crianças."
    }
  };

  const state = {
    screen: "intro",
    questionIndex: 0,
    interstitialNumber: 1,
    quizStartedAt: Number(sessionStorage.getItem("cn9_quiz_started_at")) || 0,
    answers: readAnswers(),
    result: null,
    selectedTimer: null,
    leadFormStarted: false,
    completedFields: new Set(),
    viewedObserver: null
  };

  function readAnswers() {
    try {
      return JSON.parse(sessionStorage.getItem("cn9_answers") || "{}");
    } catch (error) {
      return {};
    }
  }

  function writeAnswers() {
    sessionStorage.setItem("cn9_answers", JSON.stringify(state.answers));
  }

  function setScreen(screen, options = {}) {
    state.screen = screen;
    Object.assign(state, options);
    render();
  }

  function brandHeader() {
    return `
      <header class="brand-header" aria-label="Identidade">
        <span class="brand-mark" aria-hidden="true">CN9</span>
        <span>${config.AUTHOR_TAG}</span>
      </header>
    `;
  }

  function legalMiniFooter(showDisclaimer = false) {
    return `
      <footer class="mini-footer">
        ${showDisclaimer ? "<p>Leitura educacional e indicativa, não clínica.</p>" : ""}
        <nav aria-label="Links legais">
          <a href="/quiz/politica-de-privacidade.html">Política de Privacidade</a>
          <span aria-hidden="true">·</span>
          <a href="/quiz/termos-de-uso.html">Termos e condições</a>
        </nav>
      </footer>
    `;
  }

  function primaryButton(label, attrs = "") {
    return `<button class="button button-primary" ${attrs}><span>${label}</span><span aria-hidden="true">&rarr;</span></button>`;
  }

  function render() {
    if (state.viewedObserver) state.viewedObserver.disconnect();

    if (state.screen === "intro") renderIntro();
    if (state.screen === "instruction") renderInstruction();
    if (state.screen === "question") renderQuestion();
    if (state.screen === "interstitial") renderInterstitial();
    if (state.screen === "processing") renderProcessing();
    if (state.screen === "lead_gate") renderLeadGate();
    if (state.screen === "result") renderResult();

    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function renderIntro() {
    app.className = "quiz-shell";
    app.innerHTML = `
      ${brandHeader()}
      <main class="quiz-card intro-screen" aria-labelledby="intro-title">
        <section class="intro-hero">
          <h1 id="intro-title">Seu casamento está crescendo ou apenas funcionando?</h1>
          <p class="intro-main">Talvez vocês não estejam em crise.<br>Mas a rotina pode ter ocupado o lugar do casal.</p>
          <picture class="intro-visual">
            <img src="/quiz/assets/images/intro-casal-presente.jpg" alt="Casal conversando com presença e fazendo planos juntos em casa." width="1280" height="800" loading="eager" decoding="async" fetchpriority="high">
          </picture>
          <p class="support-text">Em cerca de 2 minutos, você vai responder situações do dia a dia, entender o momento de vocês e receber um primeiro passo possível.</p>
          ${primaryButton("Começar agora", 'id="start-quiz"')}
        </section>
      </main>
      ${legalMiniFooter(true)}
    `;

    tracking.trackEvent("QuizLandingViewed", { step: "landing" });
    tracking.trackEvent("HeroViewed", { component: "HeroIntro" });

    document.getElementById("start-quiz").addEventListener("click", () => {
      state.quizStartedAt = Date.now();
      sessionStorage.setItem("cn9_quiz_started_at", String(state.quizStartedAt));
      tracking.trackEvent("QuizStarted", { step: "landing", buttonText: "Começar agora" });
      setScreen("instruction");
    });
  }

  function renderInstruction() {
    app.className = "quiz-shell";
    app.innerHTML = `
      ${brandHeader()}
      <main class="quiz-card instruction-screen" aria-labelledby="instruction-title">
        <section class="instruction-panel">
          <p class="eyebrow">Antes de responder</p>
          <h1 id="instruction-title">Responda pelo que acontece hoje.</h1>
          <p>Não responda pelo casamento ideal.<br>Responda pelo padrão real das últimas semanas.</p>
          <p class="instruction-notes" aria-label="Orientações">
            <span>Sem resposta certa.</span>
            <span>Pense na rotina real.</span>
            <span>Cerca de 2 minutos.</span>
          </p>
          ${primaryButton("Entendi, começar", 'id="confirm-start"')}
        </section>
      </main>
      ${legalMiniFooter()}
    `;

    tracking.trackEvent("QuizInstructionViewed", { step: "instruction" });
    document.getElementById("confirm-start").addEventListener("click", () => {
      setScreen("question", { questionIndex: 0 });
    });
  }

  function renderQuestion() {
    const question = scoring.QUESTIONS[state.questionIndex];
    const selected = state.answers[String(question.number)]?.answerIndex || null;
    const progress = Math.round(question.number / 10 * 100);

    app.className = "quiz-shell";
    app.innerHTML = `
      ${brandHeader()}
      <main class="quiz-card question-screen" aria-labelledby="question-title">
        <section class="question-panel">
          <div class="progress-row">
            <span class="progress-pill">Pergunta ${question.number} de 10</span>
            <span class="progress-track" role="progressbar" aria-label="Progresso do questionário" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><span style="width: ${progress}%"></span></span>
          </div>
          <h1 id="question-title">${question.prompt}</h1>
          <div class="answers" role="list">
            ${question.options.map((option, index) => answerButton(question, option, index, selected)).join("")}
          </div>
          <button class="back-button" id="back-button" type="button">
            <span aria-hidden="true">&larr;</span>
            <span>Voltar</span>
          </button>
        </section>
      </main>
      ${legalMiniFooter()}
    `;

    tracking.trackEvent("QuizQuestionViewed", {
      step: "question",
      questionNumber: question.number,
      questionKey: question.key,
      dimension: question.dimension
    });

    document.querySelectorAll("[data-answer]").forEach((button) => {
      button.addEventListener("click", () => chooseAnswer(question, Number(button.dataset.answer)));
    });

    document.getElementById("back-button").addEventListener("click", goBack);
  }

  function answerButton(question, option, index, selected) {
    const answerIndex = index + 1;
    const selectedClass = selected === answerIndex ? " selected" : "";
    const letter = String.fromCharCode(65 + index);
    return `
      <button class="answer-option${selectedClass}" type="button" data-answer="${answerIndex}">
        <span class="answer-letter">${letter}</span>
        <span>${option.text}</span>
        <span class="answer-check" aria-hidden="true">✓</span>
      </button>
    `;
  }

  function chooseAnswer(question, answerIndex) {
    if (state.selectedTimer) clearTimeout(state.selectedTimer);
    const option = question.options[answerIndex - 1];
    state.answers[String(question.number)] = {
      questionNumber: question.number,
      questionKey: question.key,
      dimension: question.dimension,
      answerIndex,
      answerText: option.text,
      score: option.score,
      level: option.level || answerIndex
    };
    writeAnswers();

    tracking.trackEvent("QuizQuestionAnswered", {
      step: "question",
      questionNumber: question.number,
      questionKey: question.key,
      dimension: question.dimension,
      answerIndex,
      answerText: option.text,
      score: option.score
    });

    document.querySelectorAll(".answer-option").forEach((button) => {
      button.classList.toggle("selected", Number(button.dataset.answer) === answerIndex);
    });

    state.selectedTimer = setTimeout(() => advanceAfterQuestion(question.number), 280);
  }

  function advanceAfterQuestion(questionNumber) {
    if (questionNumber === 10) {
      const completionTimeSeconds = state.quizStartedAt ? Math.round((Date.now() - state.quizStartedAt) / 1000) : null;
      tracking.trackEvent("QuizCompleted", {
        step: "quiz_completed",
        answeredQuestions: 10,
        completionTimeSeconds
      });
      state.result = scoring.calculateResult(state.answers);
      sessionStorage.setItem("cn9_result", JSON.stringify({
        publicScore: state.result.publicScore,
        category: state.result.category.name,
        mainDimension: state.result.mainDimension
      }));
      setScreen("processing");
      return;
    }

    if (questionNumber === 3) {
      setScreen("interstitial", { interstitialNumber: 1 });
      return;
    }
    if (questionNumber === 6) {
      setScreen("interstitial", { interstitialNumber: 2 });
      return;
    }
    if (questionNumber === 8) {
      setScreen("interstitial", { interstitialNumber: 3 });
      return;
    }

    setScreen("question", { questionIndex: state.questionIndex + 1 });
  }

  function goBack() {
    if (state.questionIndex <= 0) {
      setScreen("instruction");
      return;
    }

    setScreen("question", { questionIndex: state.questionIndex - 1 });
  }

  function renderInterstitial() {
    const interstitial = INTERSTITIALS[state.interstitialNumber];
    app.className = "quiz-shell";
    app.innerHTML = `
      ${brandHeader()}
      <main class="quiz-card interstitial-screen" aria-labelledby="interstitial-title">
        <section class="interstitial-panel">
          <h1 id="interstitial-title">${interstitial.title}</h1>
          <p>${interstitial.text}</p>
          ${sceneVisual(interstitial.scene)}
          ${primaryButton("Continuar", 'id="continue-interstitial"')}
          <button class="back-button" id="back-interstitial" type="button">
            <span aria-hidden="true">&larr;</span>
            <span>Voltar</span>
          </button>
        </section>
      </main>
      ${legalMiniFooter()}
    `;

    tracking.trackEvent("InterstitialViewed", {
      step: "interstitial",
      interstitialNumber: interstitial.number,
      theme: interstitial.theme,
      title: interstitial.title
    });

    document.getElementById("continue-interstitial").addEventListener("click", () => {
      tracking.trackEvent("InterstitialContinued", {
        step: "interstitial",
        interstitialNumber: interstitial.number,
        theme: interstitial.theme
      });
      const nextQuestionIndex = interstitial.number === 1 ? 3 : interstitial.number === 2 ? 6 : 8;
      setScreen("question", { questionIndex: nextQuestionIndex });
    });

    document.getElementById("back-interstitial").addEventListener("click", () => {
      tracking.trackEvent("InterstitialBackClicked", {
        step: "interstitial",
        interstitialNumber: interstitial.number,
        theme: interstitial.theme
      });
      setScreen("question", { questionIndex: state.questionIndex });
    });
  }

  function sceneVisual(scene) {
    const visual = SCENE_VISUALS[scene] || SCENE_VISUALS.automatico;
    return `
      <picture class="scene-visual scene-${scene}">
        <source media="(min-width: 720px)" srcset="${visual.desktop}">
        <img src="${visual.mobile}" alt="${visual.alt}" width="900" height="675" loading="eager" decoding="async">
      </picture>
    `;
  }

  function renderProcessing() {
    app.className = "quiz-shell";
    app.innerHTML = `
      ${brandHeader()}
      <main class="quiz-card processing-screen" aria-labelledby="processing-title">
        <section class="processing-panel">
          <div class="processing-mark" aria-hidden="true"><span></span><span></span><span></span></div>
          <h1 id="processing-title">Preparando seu diagnóstico...</h1>
          <p>Agora vamos organizar suas respostas para mostrar onde vocês estão hoje e qual pode ser o primeiro passo.</p>
          <div class="processing-bar" aria-hidden="true"><span></span></div>
        </section>
      </main>
      ${legalMiniFooter()}
    `;

    tracking.trackEvent("ProcessingViewed", { step: "processing" });
    setTimeout(() => setScreen("lead_gate"), 1800);
  }

  function renderLeadGate() {
    if (!state.result) state.result = scoring.calculateResult(state.answers);
    app.className = "quiz-shell";
    app.innerHTML = `
      ${brandHeader()}
      <main class="quiz-card lead-screen" aria-labelledby="lead-title">
        <section class="lead-panel">
          <h1 id="lead-title">Seu diagnóstico está pronto.</h1>
          <p>Antes de abrir sua leitura, conheça quem criou este método.</p>

          <div class="authority-layout">
            <picture class="jean-photo">
              <source media="(min-width: 720px)" srcset="/quiz/assets/images/jean-mentoria-desktop.webp">
              <img src="/quiz/assets/images/jean-mentoria-mobile.webp" alt="Jean Santos conduzindo uma mentoria online." width="900" height="563" loading="eager" fetchpriority="high">
            </picture>
            <div class="authority-copy">
              <h2>Eu sou Jean Santos, fundador do Casamento Nota&nbsp;9.</h2>
              <p>Criei este diagnóstico para casais que não estão em crise, mas percebem que a rotina começou a ocupar o lugar do casal.</p>
              <p class="thesis-line">Ausência de crise nunca foi prova de presença de saúde.</p>
            </div>
          </div>

          <div class="proof-grid" aria-label="Provas de autoridade">
            <span>Fundador do Movimento Casamento Nota 9.</span>
            <span>Método autoral.</span>
            <span>${config.AUTHOR_PROOF}.</span>
            <span>Metodologia baseada em influência, prática e acompanhamento.</span>
          </div>

          <form class="lead-form" id="lead-form" novalidate>
            <div class="form-heading">
              <h2>Onde posso enviar sua leitura?</h2>
              <p>Preencha seus dados para abrir o diagnóstico e receber o próximo passo.</p>
            </div>
            <label>
              <span>Seu nome</span>
              <input name="name" autocomplete="name" placeholder="Seu nome" required>
            </label>
            <label>
              <span>WhatsApp</span>
              <input name="whatsapp" autocomplete="tel" inputmode="tel" placeholder="WhatsApp" required>
            </label>
            <label>
              <span>Seu melhor e-mail</span>
              <input name="email" autocomplete="email" inputmode="email" placeholder="Seu melhor e-mail" required>
            </label>
            ${primaryButton("Ver meu diagnóstico", 'id="lead-submit" type="submit" disabled')}
            <p class="privacy-note">Seus dados serão usados para enviar sua leitura e continuar esta conversa.</p>
          </form>
        </section>
      </main>
      ${legalMiniFooter()}
    `;

    tracking.trackEvent("LeadGateViewed", { step: "lead_gate" });
    tracking.trackEvent("AuthorityViewed", { component: "JeanAuthorityCard", step: "lead_gate" });
    setupLeadForm();
  }

  function setupLeadForm() {
    const form = document.getElementById("lead-form");
    const submit = document.getElementById("lead-submit");
    const fields = Array.from(form.querySelectorAll("input"));

    fields.forEach((field) => {
      field.addEventListener("focus", () => {
        if (!state.leadFormStarted) {
          state.leadFormStarted = true;
          tracking.trackEvent("LeadFormStarted", { step: "lead_gate", firstField: field.name });
        }
      });
      field.addEventListener("input", () => {
        updateLeadSubmit(form, submit);
        maybeTrackFieldCompleted(field);
      });
      field.addEventListener("blur", () => maybeTrackFieldCompleted(field));
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      updateLeadSubmit(form, submit);
      if (submit.disabled) return;

      const formData = new FormData(form);
      const leadId = tracking.getLeadId() || tracking.createLeadId();
      const lead = {
        leadId,
        name: String(formData.get("name")).trim(),
        whatsapp: String(formData.get("whatsapp")).trim(),
        email: String(formData.get("email")).trim()
      };

      submit.disabled = true;
      submit.classList.add("loading");

      await tracking.trackEvent("LeadCaptured", {
        step: "lead_gate",
        ...lead,
        publicScore: state.result.publicScore,
        category: state.result.category.name,
        mainDimension: state.result.mainDimension
      });

      await tracking.trackEvent("ResultUnlocked", {
        step: "lead_gate",
        leadId,
        resultUnlocked: true
      });

      sessionStorage.setItem("cn9_lead_captured", "1");
      setScreen("result");
    });
  }

  function updateLeadSubmit(form, submit) {
    const name = form.elements.name.value.trim();
    const whatsapp = form.elements.whatsapp.value.replace(/\D/g, "");
    const email = form.elements.email.value.trim();
    submit.disabled = !(name.length >= 2 && whatsapp.length >= 10 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }

  function maybeTrackFieldCompleted(field) {
    if (state.completedFields.has(field.name)) return;

    const value = field.value.trim();
    const valid = field.name === "email"
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      : field.name === "whatsapp"
        ? value.replace(/\D/g, "").length >= 10
        : value.length >= 2;

    if (valid) {
      state.completedFields.add(field.name);
      tracking.trackEvent("LeadFormFieldCompleted", { step: "lead_gate", field: field.name });
    }
  }

  function renderResult() {
    if (!state.result) state.result = scoring.calculateResult(state.answers);
    const result = state.result;
    app.className = "result-shell";
    app.innerHTML = `
      ${brandHeader()}
      <main class="result-page" aria-labelledby="result-title">
        ${resultHero(result)}
        ${evidenceSection(result)}
        ${practicalSection(result)}
        ${firstStepSection(result)}
        ${methodSections()}
        ${offerSections()}
      </main>
      ${legalMiniFooter()}
    `;

    setupViewedTrackers();
    setupCheckoutButtons();
    setupFaq();
    setupCopyButtons();
  }

  function resultHero(result) {
    return `
      <section class="result-hero section-band" id="diagnostico" data-track-event="ResultViewed" data-track='{"step":"result","publicScore":${result.publicScore},"scoreScale":"${result.scoreScale}","category":"${result.category.name}","mainDimension":"${result.mainDimension}"}'>
        <h1 id="result-title">Seu casamento parece estar em: ${result.category.name.toLowerCase()}.</h1>
        <div class="score-badge" aria-label="Nota ${result.publicScore} de 9">
          <strong>${result.publicScore}</strong><span>/9</span>
        </div>
        <p class="microcopy">Esta é uma leitura inicial. Ela não mede o amor entre vocês. Ela mostra sinais de crescimento, rotina ou afastamento nas últimas semanas.</p>
        <p class="goal-line">A meta não é perfeição.<br>A meta é crescimento contínuo.</p>
        <div class="score-scale" data-track-event="DiagnosticViewed" data-track='{"step":"diagnostic","publicScore":${result.publicScore},"category":"${result.category.name}"}'>
          ${scoring.CATEGORY_BY_SCORE.map((item) => `
            <div class="${item.slug === result.category.slug ? "active" : ""}">
              <strong>${item.min === item.max ? item.min : `${item.min}-${item.max}`}</strong>
              <span>${item.name}</span>
              <small>${item.text}</small>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function evidenceSection(result) {
    return `
      <section class="section-band" data-track-event="DiagnosticEvidenceViewed" data-track='{"step":"evidence","evidenceCount":3,"mainDimension":"${result.mainDimension}"}'>
        <p class="eyebrow">Leitura das respostas</p>
        <h2>Suas respostas mostram que:</h2>
        <div class="evidence-grid">
          ${result.evidence.map((item) => `<article><span aria-hidden="true">✦</span><p>${item}</p></article>`).join("")}
        </div>
      </section>
    `;
  }

  function practicalSection(result) {
    return `
      <section class="section-band" data-track-event="DiagnosticReflectionViewed" data-track='{"step":"reflection","category":"${result.category.name}"}'>
        <p class="eyebrow">Na prática</p>
        <h2>O que isso quer dizer na prática</h2>
        <div class="reading-grid">
          <article>
            <h3>O que vocês ainda têm</h3>
            <ul>
              <li>História.</li>
              <li>Estrutura.</li>
              <li>Valor para proteger.</li>
              <li>Uma base que pode voltar a receber cuidado.</li>
            </ul>
          </article>
          <article>
            <h3>O que pode estar ficando para depois</h3>
            <ul>
              ${result.fallingBehind.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </article>
          <article class="risk-card">
            <h3>O risco de repetir o padrão</h3>
            <p>Quando um padrão se repete por muito tempo, ele começa a parecer normal.</p>
            <p>O perigo não é uma crise repentina. É se acostumar com uma relação que funciona, mas deixou de crescer.</p>
          </article>
        </div>
      </section>
    `;
  }

  function firstStepSection(result) {
    return `
      <section class="section-band first-step" data-track-event="FirstStepViewed" data-track='{"step":"first_step","mainDimension":"${result.mainDimension}","firstStepType":"${result.firstStep.type}"}'>
        <p class="eyebrow">Seu primeiro passo</p>
        <h2>Comece por onde existe mais espaço para influência agora.</h2>
        <article class="first-step-card">
          <span class="step-label">${result.mainDimensionLabel}</span>
          <h3>${result.firstStep.title}</h3>
          <p>${result.firstStep.action}</p>
          <blockquote>${result.firstStep.example}</blockquote>
          <button class="button button-secondary copy-button" type="button" data-copy="${result.firstStep.example}">Copiar frase</button>
        </article>
        <p class="closing-line">Um passo pode abrir espaço. Mas um casamento não muda por um passo isolado. Ele muda quando um novo padrão começa a se repetir.</p>
      </section>
    `;
  }

  function methodSections() {
    return `
      <section class="section-band movement-section" data-track-event="MethodViewed" data-track='{"step":"method","component":"MovementBridge"}'>
        <p class="eyebrow">O casamento não fica parado</p>
        <h2>Seu casamento já está mudando. A pergunta é para que lado.</h2>
        <p>Quando nada é cuidado, a rotina ocupa o espaço.</p>
        <p>Quando existe presença repetida, o sistema começa a responder de outro jeito.</p>
        <div class="movement-map" role="img" aria-label="Um casal entre duas direções: hoje, a rotina pode levar ao afastamento e a presença pode levar ao crescimento.">
          <picture class="movement-visual">
            <source media="(min-width: 720px)" srcset="/quiz/assets/images/movement-crescimento-desktop.jpg">
            <img src="/quiz/assets/images/movement-crescimento-mobile.jpg" alt="" width="750" height="1000" loading="lazy" decoding="async">
          </picture>
          <div class="path-diagram">
            <div><span>rotina</span><strong>afastamento</strong></div>
            <div class="center-dot">hoje</div>
            <div><span>presença</span><strong>crescimento</strong></div>
          </div>
        </div>
        <p class="law-line">Não existe casamento parado.<br>Ou ele cresce, ou ele se afasta.</p>
      </section>

      <section class="section-band influence-section" data-track-event="InfluenceBlockViewed" data-track='{"step":"method","component":"InfluenceCircle"}'>
        <p class="eyebrow">Influência possível</p>
        <h2>Começa pelo que está sob sua influência</h2>
        <div class="influence-visual" role="img" aria-label="Círculos de influência: no centro estão minhas escolhas e respostas; ao redor, convites, presença e limites; fora do meu controle, a resposta e a decisão do outro.">
          <span class="influence-layer influence-layer-middle" aria-hidden="true"></span>
          <span class="influence-layer influence-layer-inner" aria-hidden="true"></span>
          <span class="influence-label influence-label-outer">resposta e decisão do outro</span>
          <span class="influence-label influence-label-middle">convites, presença<br>e limites</span>
          <span class="influence-label influence-label-inner">minhas escolhas<br>e respostas</span>
        </div>
        <p class="strong-copy">Você não controla seu cônjuge.<br>Você controla sua influência.</p>
        <p>Isso inclui sua forma de responder, o espaço que você protege, os convites que faz e os padrões que decide parar de repetir.</p>
        <p>Não é carregar o casamento sozinho. É parar de esperar tudo começar pelo outro.</p>
      </section>

    `;
  }

  function offerSections() {
    return `
      <section class="section-band offer-hero" id="oferta" data-track-event="OfferViewed" data-track='{"step":"offer","offer":"Mentoria Casamento Nota 9"}'>
        <p class="eyebrow">Seu próximo passo</p>
        <h2>Seu diagnóstico mostrou onde começar. A mentoria transforma esse movimento em prática acompanhada.</h2>
        <picture class="offer-visual">
          <source media="(min-width: 720px)" srcset="/quiz/assets/images/journey-method-desktop.jpg">
          <img src="/quiz/assets/images/journey-method-mobile.jpg" alt="Representação visual de um casal planejando a vida a dois e criando novas experiências." width="800" height="1000" loading="lazy" decoding="async">
        </picture>
        <p>A Mentoria Casamento Nota 9 foi criada para quem ainda vê valor no casamento, mas não quer deixar a rotina decidir o futuro do casal.</p>
      </section>

      <section class="section-band" data-track-event="OfferFitViewed" data-track='{"step":"offer","component":"FitChecklist"}'>
        <h2>Essa jornada faz sentido para você se...</h2>
        <ul class="fit-list">
          <li>O casamento não está em crise, mas o casal ficou para depois.</li>
          <li>As conversas giram mais em torno de filhos, contas e horários.</li>
          <li>Você percebe que esperar o outro mudar primeiro não tem funcionado.</li>
          <li>Você quer começar pelo que depende de você, sem carregar tudo sozinha(o).</li>
          <li>Você quer direção prática, sem fórmula mágica.</li>
          <li>Você quer cuidar de algo valioso antes que esfrie mais.</li>
        </ul>
      </section>

      <section class="section-band" data-track-event="OfferWorkViewed" data-track='{"step":"offer","component":"WorkCards"}'>
        <p class="eyebrow">Na prática</p>
        <h2>O que você vai trabalhar durante a jornada</h2>
        <p>As capacidades centrais do método aparecem em cinco frentes de aplicação, com direção, prática e acompanhamento.</p>
        <picture class="mentorship-visual">
          <source media="(min-width: 720px)" srcset="/quiz/assets/images/mentoria-online-desktop.webp">
          <img src="/quiz/assets/images/mentoria-online-mobile.webp" alt="Participante acompanhando uma mentoria online em grupo e fazendo anotações." width="900" height="563" loading="lazy" decoding="async">
        </picture>
        <div class="work-grid">
          ${workCards().map((card) => `
            <article>
              <h3>${card.title}</h3>
              <p>${card.text}</p>
            </article>
          `).join("")}
        </div>
      </section>

      <section class="section-band" data-track-event="OfferHowItWorksViewed" data-track='{"step":"offer","component":"HowItWorksTimeline"}'>
        <h2>Como funciona</h2>
        <div class="timeline">
          ${timelineItems().map((item, index) => `
            <article>
              <span>${index + 1}</span>
              <div>
                <h3>${item.title}</h3>
                <p>${item.text}</p>
              </div>
            </article>
          `).join("")}
        </div>
        <p class="value-statement">Você não recebe aulas soltas.<br>Você entra em uma jornada com direção, prática e acompanhamento.</p>
      </section>

      <section class="section-band" data-track-event="SocialProofViewed" data-track='{"step":"offer","testimonialsShown":3,"context":"acompanhamentos_anteriores"}'>
        <h2>Quem já passou pelo trabalho de Jean</h2>
        <div class="testimonial-grid">
          ${testimonials().map((item) => `
            <article>
              <p>“${item.text}”</p>
              <strong>${item.name}</strong>
              <span>${item.context}</span>
            </article>
          `).join("")}
        </div>
        <p class="context-note">Relatos de acompanhamentos anteriores conduzidos por Jean Santos.</p>
      </section>

      <section class="section-band pricing-section" data-track-event="PriceBlockViewed" data-track='{"step":"offer","priceCash":497,"installments":12,"installmentValue":51.10}'>
        <p class="eyebrow">Investimento da mentoria</p>
        <h2><span>R$497</span><small>à vista</small></h2>
        <p class="installments">ou 12x de R$51,10</p>
        <p>Seu cônjuge pode participar sem custo adicional.</p>
        <ul>
          <li>2 meses de jornada.</li>
          <li>Onboarding + 8 encontros.</li>
          <li>Comunidade e suporte.</li>
          <li>Ferramentas práticas.</li>
        </ul>
        ${primaryButton("Quero entrar na Mentoria Casamento Nota 9", 'data-checkout="price_block" data-track-event="CtaViewed" data-track=\'{"step":"offer","ctaLocation":"price_block","buttonText":"Quero entrar na Mentoria Casamento Nota 9"}\'')}
        <p class="privacy-note">Você será direcionada(o) para o checkout seguro.</p>
      </section>

      <section class="section-band faq-section" data-track-event="FAQViewed" data-track='{"step":"faq"}'>
        <h2>Perguntas frequentes</h2>
        ${faqs().map((item, index) => `
          <details data-faq="${index + 1}">
            <summary>${item.question}</summary>
            <p>${item.answer}</p>
          </details>
        `).join("")}
      </section>

      <section class="section-band final-cta" data-track-event="FinalCtaViewed" data-track='{"step":"final_cta","ctaLocation":"final_cta"}'>
        <h2>Seu próximo passo não precisa ser grande. Precisa ser claro.</h2>
        <p>Se o diagnóstico fez sentido, a mentoria é o caminho para transformar esse primeiro passo em prática acompanhada.</p>
        ${primaryButton("Sim, quero começar essa jornada", 'data-checkout="final_cta"')}
        <p class="privacy-note">Checkout seguro · acesso após confirmação</p>
      </section>
    `;
  }

  function workCards() {
    return [
      { title: "Escuta e resposta", text: "Práticas para ouvir, validar e responder sem transformar toda conversa em defesa, correção ou cobrança." },
      { title: "Tempo e presença", text: "Ferramentas para proteger pequenos espaços do casal dentro da rotina real." },
      { title: "Planos e experiências a dois", text: "Convites simples para o casal voltar a viver algo que não seja apenas tarefa, conta ou obrigação." },
      { title: "Influência possível", text: "Aplicações para começar pelo que depende de você, sem prometer controlar a resposta do outro." },
      { title: "Continuidade", text: "Revisões para perceber o que funcionou, o que travou e qual movimento precisa ser ajustado." }
    ];
  }

  function timelineItems() {
    return [
      { title: "2 meses de jornada", text: "Tempo suficiente para entender o padrão, aplicar movimentos práticos e ajustar o caminho." },
      { title: "1 encontro de onboarding", text: "Um primeiro encontro para alinhar a jornada, o método e o ponto de partida." },
      { title: "8 encontros semanais em grupo", text: "Encontros para direção, prática, acompanhamento e ajuste." },
      { title: "Comunidade no WhatsApp", text: "Um espaço para troca, suporte e continuidade durante a jornada." },
      { title: "Ferramentas práticas", text: "Materiais para aplicar no dia a dia, sem depender de grandes mudanças na rotina." },
      { title: "Cônjuge opcional", text: "Seu cônjuge pode participar sem custo adicional." }
    ];
  }

  function testimonials() {
    return [
      {
        name: "Amanda S.",
        context: "acompanhamento com Jean",
        text: "Percebi que qualquer questão na relação dependia de mim mesma pra mudar o cenário, evoluir e inspirar pelo exemplo, e não pela cobrança. Hoje me sinto num relacionamento muito mais saudável, com sintonia e parceria."
      },
      {
        name: "Brayan A.",
        context: "acompanhamento com Jean",
        text: "Depois que comecei, meu casamento mudou muito: comunicação mais clara e assertiva, aplicada no dia a dia com a minha esposa. Sou grato ao Jean."
      },
      {
        name: "Cristiano M.",
        context: "acompanhamento com Jean",
        text: "O trabalho do Jean guia num caminho que é difícil, principalmente pra nós homens, que temos dificuldade de buscar ajuda. Recomendo e agradeço."
      }
    ];
  }

  function faqs() {
    return [
      { question: "Meu casamento não está em crise. A mentoria é para mim?", answer: "Sim, se você sente que o casamento funciona, mas o casal ficou para depois. A mentoria não é para crise severa. É para crescimento intencional." },
      { question: "Meu cônjuge precisa participar?", answer: "Não precisa para você começar. Se ele ou ela quiser participar, poderá entrar sem custo adicional." },
      { question: "Posso começar sozinha(o)?", answer: "Sim. A jornada começa pelo que está sob sua influência, sem prometer controlar a resposta do outro." },
      { question: "Isso é terapia de casal?", answer: "Não. É uma mentoria educacional e prática. Não substitui terapia, acompanhamento psicológico ou ajuda especializada." },
      { question: "Como funcionam os encontros?", answer: "São 2 meses de jornada, com 1 onboarding e 8 encontros semanais em grupo." },
      { question: "Os encontros ficam gravados?", answer: config.FAQ_RECORDINGS_ENABLED ? "Sim. As informações de acesso às gravações serão enviadas dentro do ambiente da mentoria." : "Neste momento, os encontros são conduzidos ao vivo. Por isso, a presença nos encontros é recomendada." },
      { question: "Existe suporte durante os dois meses?", answer: "Sim. Você terá comunidade e suporte do time pelo WhatsApp durante a jornada." },
      { question: "Quando recebo o acesso?", answer: "Após a confirmação do pagamento, você receberá as orientações de acesso pelo fluxo definido na Green e pela comunicação da mentoria." },
      { question: "Tenho medo de estar exagerando. Faz sentido cuidar disso agora?", answer: "Cuidar do casamento antes da crise não é exagero. É uma forma madura de proteger algo valioso enquanto ainda existe espaço para crescimento." },
      { question: "E se nada mudar?", answer: "A metodologia trabalha o que você pode aplicar e observar. Mudanças tendem a aparecer com padrões consistentes, mas não são uma promessa automática. Por isso existe acompanhamento." },
      { question: "E se eu estiver vivendo violência, abuso ou risco grave?", answer: "A mentoria não é indicada para situações de violência, abuso, risco grave ou sofrimento psicológico severo. Nesses casos, a prioridade é buscar segurança e ajuda especializada." }
    ];
  }

  function setupViewedTrackers() {
    const blocks = Array.from(document.querySelectorAll("[data-track-event]"));
    if (!("IntersectionObserver" in window)) {
      blocks.forEach(trackBlock);
      return;
    }

    state.viewedObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          trackBlock(entry.target);
          state.viewedObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.45 });

    blocks.forEach((block) => state.viewedObserver.observe(block));
  }

  function trackBlock(block) {
    if (block.dataset.tracked === "true") return;
    block.dataset.tracked = "true";
    let data = {};
    try {
      data = JSON.parse(block.dataset.track || "{}");
    } catch (error) {
      data = {};
    }
    tracking.trackEvent(block.dataset.trackEvent, data);
  }

  function setupCheckoutButtons() {
    document.querySelectorAll("[data-checkout]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        const ctaLocation = button.dataset.checkout;
        const buttonText = button.textContent.trim();
        button.classList.add("loading");

        await tracking.trackEvent("FinalCtaClicked", {
          step: "checkout",
          ctaLocation,
          buttonText
        });
        await tracking.trackEvent("InitiateCheckout", {
          step: "checkout",
          checkoutProvider: "Green",
          checkoutUrl: config.CHECKOUT_URL,
          priceCash: config.PRICE_CASH,
          installments: config.PRICE_INSTALLMENTS,
          installmentValue: config.PRICE_INSTALLMENT_VALUE,
          ctaLocation
        });

        window.location.href = tracking.buildCheckoutUrl(ctaLocation);
      });
    });
  }

  function setupFaq() {
    document.querySelectorAll(".faq-section details").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (details.open) {
          tracking.trackEvent("FAQOpened", {
            step: "faq",
            faqNumber: Number(details.dataset.faq),
            question: details.querySelector("summary").textContent.trim()
          });
        }
      });
    });
  }

  function setupCopyButtons() {
    document.querySelectorAll("[data-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy);
          button.textContent = "Frase copiada";
        } catch (error) {
          button.textContent = "Copie a frase acima";
        }
      });
    });
  }

  render();
})();
