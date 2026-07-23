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
  setupSectionTracking();
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
    const isLocalPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname);
    if (isLocalPreview) {
      url.protocol = window.location.protocol;
      url.host = window.location.host;
    }

    config.ALLOWED_ATTRIBUTION_KEYS.forEach((key) => {
      if (attribution[key]) url.searchParams.set(key, attribution[key]);
    });

    url.searchParams.set("entry_point", config.ENTRY_POINT);
    url.searchParams.set("destination", destination);
    if (destination === "diagnostico" && config.DIAGNOSTIC_ENTRY_MODE) {
      url.searchParams.set("quiz_entry", config.DIAGNOSTIC_ENTRY_MODE);
    }
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
      button.removeAttribute("href");
      button.classList.add("is-disabled");
      button.setAttribute("aria-disabled", "true");
      status.hidden = false;
      button.addEventListener("click", (event) => event.preventDefault());
      return;
    }

    button.classList.remove("is-disabled");
    button.removeAttribute("aria-disabled");
    button.href = destination;
    status.hidden = true;
    button.addEventListener("click", async (event) => {
      event.preventDefault();
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

  function setupSectionTracking() {
    const sections = Array.from(document.querySelectorAll("[data-linkbio-section]"));
    const viewed = new Set();

    const trackSection = (section) => {
      const sectionId = section.dataset.linkbioSection;
      if (!sectionId || viewed.has(sectionId)) return;
      viewed.add(sectionId);
      tracking.trackEvent("linkbio_section_view", eventData({
        section_id: sectionId,
        section_order: Number(section.dataset.sectionOrder || 0)
      }));
    };

    if (!("IntersectionObserver" in window)) {
      sections.forEach(trackSection);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        trackSection(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    sections.forEach((section) => observer.observe(section));
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
