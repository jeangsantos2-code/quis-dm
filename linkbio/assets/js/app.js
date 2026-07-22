(function () {
  const config = window.CN9_LINKBIO_CONFIG;
  const tracking = window.CN9Tracking || {
    setOrigin() {},
    trackEvent() { return Promise.resolve(null); }
  };

  if (!config) return;

  const attribution = readAttribution();
  tracking.setOrigin(attribution);
  setupDiagnosticLink();
  setupGroupMentoringCta();
  setupWhatsAppLink("individual-mentoring-cta", config.INDIVIDUAL_MENTORING_MESSAGE);
  setupWhatsAppLink("care-team-cta", config.CARE_TEAM_MESSAGE);
  setupFooterYear();
  tracking.trackEvent("linkbio_view", eventData());

  function readAttribution() {
    const search = new URLSearchParams(window.location.search);
    const values = {};

    config.ALLOWED_ATTRIBUTION_KEYS.forEach((key) => {
      const received = String(search.get(key) || "").trim();
      const fallback = config.DEFAULT_ATTRIBUTION[key] || "";
      values[key] = received || fallback;
    });

    return values;
  }

  function buildInternalUrl(baseUrl, destination) {
    const url = new URL(baseUrl);

    config.ALLOWED_ATTRIBUTION_KEYS.forEach((key) => {
      if (attribution[key]) url.searchParams.set(key, attribution[key]);
    });

    url.searchParams.set("entry_point", config.ENTRY_POINT);
    url.searchParams.set("destination", destination);
    return url.toString();
  }

  function setupDiagnosticLink() {
    const link = document.querySelector('[data-destination="diagnostico"]');
    if (!link) return;

    const destination = buildInternalUrl(config.DIAGNOSTIC_URL, "diagnostico");
    link.href = destination;
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      await trackDestination("diagnostico");
      window.location.assign(destination);
    });
  }

  function setupGroupMentoringCta() {
    const button = document.getElementById("group-mentoring-cta");
    const status = document.getElementById("group-mentoring-status");
    if (!button || !status) return;

    const destination = buildInternalUrl(config.GROUP_MENTORING_URL, "mentoria_grupo");
    button.dataset.url = destination;

    if (!config.GROUP_MENTORING_ENABLED) {
      const isPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname);
      if (isPreview) status.textContent = "Preview: destino preparado para /mentoria-em-grupo.";
      button.addEventListener("click", (event) => event.preventDefault());
      return;
    }

    button.classList.remove("is-disabled");
    button.removeAttribute("aria-disabled");
    status.hidden = true;
    button.addEventListener("click", async () => {
      await trackDestination("mentoria_grupo");
      window.location.assign(destination);
    });
  }

  function setupWhatsAppLink(id, message) {
    const link = document.getElementById(id);
    if (!link) return;

    link.href = `https://wa.me/${config.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    link.addEventListener("click", () => {
      trackDestination(link.dataset.destination);
    });
  }

  function trackDestination(destination) {
    return tracking.trackEvent("linkbio_destination_click", eventData({ destination }));
  }

  function setupFooterYear() {
    const year = document.getElementById("copyright-year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function eventData(extra = {}) {
    return {
      step: "link_bio",
      path: window.location.pathname,
      entry_point: config.ENTRY_POINT,
      ...attribution,
      ...extra
    };
  }
})();
