(function () {
  const config = window.CN9_CONFIG || {};
  const ORIGIN_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "source_post",
    "campaign_id",
    "adset_id",
    "ad_id",
    "placement",
    "fbclid",
    "ref",
    "subscriber_id",
    "cuid",
    "entry_point",
    "cta_position",
    "destination"
  ];

  const UNIQUE_EVENTS = new Set([
    "QuizLandingViewed",
    "QuizStarted",
    "QuizCompleted",
    "LeadGateViewed",
    "LeadCaptured",
    "ResultUnlocked",
    "ResultViewed",
    "OfferViewed",
    "PriceBlockViewed"
  ]);

  const META_EVENT_MAP = {
    QuizLandingViewed: "PageView",
    HeroViewed: "ViewContent",
    LeadCaptured: "Lead",
    InitiateCheckout: "InitiateCheckout"
  };

  function randomId(prefix) {
    const random = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${Date.now()}_${random}`;
  }

  function readJson(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Session storage is best-effort only.
    }
  }

  function getSessionId() {
    const querySessionId = new URLSearchParams(window.location.search).get("sessionId");
    let sessionId = querySessionId || sessionStorage.getItem("cn9_session_id");
    if (!sessionId) {
      sessionId = randomId("cn9_sess");
    }
    sessionStorage.setItem("cn9_session_id", sessionId);
    return sessionId;
  }

  function getLeadId() {
    const queryLeadId = new URLSearchParams(window.location.search).get("leadId");
    if (queryLeadId) sessionStorage.setItem("cn9_lead_id", queryLeadId);
    return sessionStorage.getItem("cn9_lead_id") || "";
  }

  function setLeadId(leadId) {
    sessionStorage.setItem("cn9_lead_id", leadId);
  }

  function createLeadId() {
    const leadId = randomId("cn9_lead");
    setLeadId(leadId);
    return leadId;
  }

  function getOrigin() {
    const current = new URLSearchParams(window.location.search);
    const stored = readJson("cn9_origin", {});
    const origin = { ...stored };

    ORIGIN_KEYS.forEach((key) => {
      const value = current.get(key);
      if (value) origin[key] = value;
      if (!origin[key]) origin[key] = "";
    });

    writeJson("cn9_origin", origin);
    return origin;
  }

  function setOrigin(values = {}) {
    const stored = readJson("cn9_origin", {});
    const origin = { ...stored };

    ORIGIN_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        origin[key] = values[key] ? String(values[key]) : "";
      } else if (!origin[key]) {
        origin[key] = "";
      }
    });

    writeJson("cn9_origin", origin);
    return origin;
  }

  function getDevice() {
    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      userAgent: navigator.userAgent
    };
  }

  function getPageName() {
    const path = window.location.pathname;
    if (path.includes("linkbio")) return "linkbio";
    if (path.includes("obrigado")) return "obrigado";
    if (path.includes("politica")) return "politica";
    if (path.includes("termos")) return "termos";
    return "quiz";
  }

  function getResultSnapshot() {
    return readJson("cn9_result", {});
  }

  function shouldTrackUnique(eventName, data) {
    const customKey = data?.dedupeKey ? String(data.dedupeKey) : "";
    if (!UNIQUE_EVENTS.has(eventName) && !customKey) return true;
    const sessionId = getSessionId();
    const key = `cn9_once_${sessionId}_${customKey || eventName}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  }

  function sanitizeMetaPayload(eventName) {
    if (eventName === "LeadCaptured") {
      return { content_name: "Diagnóstico Casamento Nota 9" };
    }
    if (eventName === "InitiateCheckout") {
      return {
        content_name: "Mentoria Casamento Nota 9",
        content_type: "product",
        value: config.PRICE_CASH || 297,
        currency: "BRL"
      };
    }
    return {};
  }

  function initMetaPixel() {
    if (!config.META_PIXEL_ID || window.fbq) return;
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq("init", config.META_PIXEL_ID);
  }

  function trackMeta(eventName) {
    if (!config.META_PIXEL_ID) return;
    const metaName = META_EVENT_MAP[eventName];
    if (!metaName) return;
    initMetaPixel();
    const payload = sanitizeMetaPayload(eventName);
    if (metaName === "PageView") {
      window.fbq("track", "PageView");
      return;
    }
    window.fbq("track", metaName, payload);
  }

  function buildEvent(eventName, data) {
    return {
      eventName,
      eventId: randomId("cn9_evt"),
      sessionId: getSessionId(),
      leadId: getLeadId(),
      timestamp: new Date().toISOString(),
      page: getPageName(),
      step: data.step || "",
      origin: getOrigin(),
      device: getDevice(),
      data
    };
  }

  async function trackEvent(eventName, data = {}) {
    if (!shouldTrackUnique(eventName, data)) return null;
    const event = buildEvent(eventName, data);

    trackMeta(eventName);

    if (!config.TRACK_ENDPOINT) return event;

    try {
      const body = JSON.stringify(event);
      if (navigator.sendBeacon) {
        const sent = navigator.sendBeacon(config.TRACK_ENDPOINT, new Blob([body], { type: "application/json" }));
        if (sent) return event;
      }

      await fetch(config.TRACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      });
    } catch (error) {
      if (config.DEBUG_TRACKING) {
        console.warn("Tracking unavailable", eventName);
      }
    }

    return event;
  }

  function buildCheckoutUrl(ctaLocation) {
    const baseUrl = config.CHECKOUT_URL || "#";
    const url = new URL(baseUrl, window.location.href);
    const origin = getOrigin();
    const result = getResultSnapshot();

    ORIGIN_KEYS.forEach((key) => {
      if (origin[key]) url.searchParams.set(key, origin[key]);
    });

    url.searchParams.set("sessionId", getSessionId());
    if (getLeadId()) url.searchParams.set("leadId", getLeadId());
    if (ctaLocation) url.searchParams.set("cta", ctaLocation);
    if (result.publicScore) url.searchParams.set("publicScore", result.publicScore);
    if (result.category) url.searchParams.set("category", result.category);
    if (result.mainDimension) url.searchParams.set("mainDimension", result.mainDimension);

    return url.toString();
  }

  window.CN9Tracking = {
    getSessionId,
    getLeadId,
    setLeadId,
    createLeadId,
    getOrigin,
    setOrigin,
    trackEvent,
    buildCheckoutUrl
  };
})();
