(function () {
  const config = window.CN9_CONFIG;
  const tracking = window.CN9Tracking || {
    getSessionId() { return ""; },
    getLeadId() { return ""; },
    getOrigin() { return {}; },
    setOrigin() {},
    trackEvent() { return Promise.resolve(null); }
  };

  if (!config) return;

  const attribution = readAttribution();
  tracking.setOrigin({
    ...attribution,
    entry_point: config.ENTRY_POINT,
    destination: config.DESTINATION
  });

  setupCheckoutLinks();
  setupInternalCtas();
  setupSectionTracking();
  setupTestimonialTracking();
  setupTestimonialCarousel();
  setupTestimonialProofDialog();
  setupFaqTracking();
  setupFooterYear();
  tracking.trackEvent("mentoring_landing_view", eventData());

  function readAttribution() {
    const search = new URLSearchParams(window.location.search);
    const stored = tracking.getOrigin();
    const values = {};

    config.ALLOWED_ATTRIBUTION_KEYS.forEach((key) => {
      const received = String(search.get(key) || "").trim();
      const previous = String(stored[key] || "").trim();
      if (received || previous) values[key] = received || previous;
    });

    return values;
  }

  function buildCheckoutUrl(ctaPosition) {
    const url = new URL(config.CHECKOUT_URL);

    config.ALLOWED_ATTRIBUTION_KEYS.forEach((key) => {
      if (attribution[key]) url.searchParams.set(key, attribution[key]);
    });

    url.searchParams.set("entry_point", config.ENTRY_POINT);
    url.searchParams.set("destination", config.DESTINATION);
    url.searchParams.set("cta_position", ctaPosition);

    const sessionId = tracking.getSessionId();
    const leadId = tracking.getLeadId();
    if (sessionId) url.searchParams.set("sessionId", sessionId);
    if (leadId) url.searchParams.set("leadId", leadId);

    return url.toString();
  }

  function setupCheckoutLinks() {
    document.querySelectorAll("[data-checkout-position]").forEach((link) => {
      const ctaPosition = link.dataset.checkoutPosition;
      link.href = buildCheckoutUrl(ctaPosition);

      link.addEventListener("click", async (event) => {
        event.preventDefault();
        if (link.dataset.navigating === "true") return;

        link.dataset.navigating = "true";
        link.classList.add("loading");
        tracking.setOrigin({ cta_position: ctaPosition });

        await tracking.trackEvent("mentoring_checkout_click", eventData({
          cta_position: ctaPosition,
          checkout_provider: "Green",
          price_cash: config.PRICE_CASH,
          price_installments: config.PRICE_INSTALLMENTS,
          price_installment_value: config.PRICE_INSTALLMENT_VALUE
        }));

        window.location.assign(buildCheckoutUrl(ctaPosition));
      });
    });
  }

  function setupInternalCtas() {
    document.querySelectorAll("[data-scroll-target]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const selector = String(link.dataset.scrollTarget || "").trim();
        const target = selector ? document.querySelector(selector) : null;
        if (!target) return;

        event.preventDefault();
        const ctaPosition = link.dataset.ctaPosition || "";
        tracking.setOrigin({ cta_position: ctaPosition });
        tracking.trackEvent("mentoring_cta_click", eventData({
          cta_position: ctaPosition,
          destination: selector
        }));

        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start"
        });
      });
    });
  }

  function setupTestimonialTracking() {
    const testimonials = Array.from(document.querySelectorAll("[data-testimonial-id]"));
    const viewed = new Set();

    const trackTestimonial = (element) => {
      const testimonialId = element.dataset.testimonialId;
      if (!testimonialId || viewed.has(testimonialId)) return;
      viewed.add(testimonialId);
      tracking.trackEvent("mentoring_testimonial_view", eventData({
        testimonial_id: testimonialId
      }));
    };

    if (!("IntersectionObserver" in window)) {
      testimonials.forEach(trackTestimonial);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        trackTestimonial(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });

    testimonials.forEach((testimonial) => observer.observe(testimonial));
  }

  function setupSectionTracking() {
    const sections = Array.from(document.querySelectorAll("[data-mentoring-section]"));
    const viewed = new Set();

    const trackSection = (section) => {
      const sectionId = section.dataset.mentoringSection;
      if (!sectionId || viewed.has(sectionId)) return;
      viewed.add(sectionId);
      tracking.trackEvent("mentoring_section_view", eventData({
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
    }, { threshold: 0.15 });

    sections.forEach((section) => observer.observe(section));
  }

  function setupTestimonialCarousel() {
    const track = document.getElementById("testimonial-track");
    const previous = document.querySelector("[data-carousel-prev]");
    const next = document.querySelector("[data-carousel-next]");
    const status = document.querySelector(".mg-carousel-status");
    if (!track || !previous || !next || !status) return;

    const cards = Array.from(track.querySelectorAll("[data-testimonial-id]"));
    let activeIndex = 0;
    let frame = null;

    const updateControls = () => {
      const trackLeft = track.getBoundingClientRect().left;
      activeIndex = cards.reduce((closestIndex, card, index) => {
        const currentDistance = Math.abs(cards[closestIndex].getBoundingClientRect().left - trackLeft);
        const candidateDistance = Math.abs(card.getBoundingClientRect().left - trackLeft);
        return candidateDistance < currentDistance ? index : closestIndex;
      }, 0);

      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex === cards.length - 1;
      status.textContent = `${activeIndex + 1} de ${cards.length}`;
    };

    const goTo = (index) => {
      const targetIndex = Math.max(0, Math.min(cards.length - 1, index));
      const card = cards[targetIndex];
      const left = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
      track.scrollTo({ left, behavior: "smooth" });
    };

    previous.addEventListener("click", () => goTo(activeIndex - 1));
    next.addEventListener("click", () => goTo(activeIndex + 1));

    track.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      goTo(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    });

    track.addEventListener("scroll", () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateControls);
    }, { passive: true });

    window.addEventListener("resize", updateControls);
    updateControls();
  }

  function setupTestimonialProofDialog() {
    const dialog = document.getElementById("testimonial-proof-dialog");
    const image = document.getElementById("testimonial-proof-image");
    const person = document.getElementById("testimonial-proof-person");
    const media = dialog?.querySelector(".mg-proof-dialog-media");
    const close = dialog?.querySelector(".mg-proof-dialog-close");
    if (!dialog || !image || !person || !media || !close) return;

    document.querySelectorAll(".mg-proof-trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const proofPerson = trigger.dataset.proofPerson || "Participante";
        media.classList.toggle("is-amanda", trigger.dataset.proofMode === "amanda");
        image.src = trigger.dataset.proofSrc || "";
        image.alt = `Captura original do relato de ${proofPerson}.`;
        person.textContent = proofPerson;
        dialog.showModal();
      });
    });

    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      image.removeAttribute("src");
      image.alt = "";
      person.textContent = "";
      media.classList.remove("is-amanda");
    });
  }

  function setupFaqTracking() {
    document.querySelectorAll(".mg-faq-list details").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        tracking.trackEvent("mentoring_faq_open", eventData({
          question_id: details.dataset.questionId || ""
        }));
      });
    });
  }

  function setupFooterYear() {
    const year = document.getElementById("copyright-year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function eventData(extra = {}) {
    return {
      step: "mentoring_group",
      pathname: window.location.pathname,
      entry_point: config.ENTRY_POINT,
      ...attribution,
      ...extra
    };
  }
})();
