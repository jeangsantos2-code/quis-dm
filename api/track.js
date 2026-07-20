const ALLOWED_EVENTS = new Set([
  "QuizLandingViewed",
  "HeroViewed",
  "QuizStarted",
  "QuizInstructionViewed",
  "QuizQuestionViewed",
  "QuizQuestionAnswered",
  "QuizBackClicked",
  "InterstitialViewed",
  "InterstitialContinued",
  "InterstitialBackClicked",
  "FunnelStageViewed",
  "FunnelStageExited",
  "QuizCompleted",
  "ProcessingViewed",
  "LeadGateViewed",
  "AuthorityViewed",
  "LeadFormStarted",
  "LeadFormFieldCompleted",
  "LeadCaptured",
  "ResultUnlocked",
  "ResultViewed",
  "DiagnosticViewed",
  "DiagnosticEvidenceViewed",
  "DiagnosticReflectionViewed",
  "FirstStepViewed",
  "MethodViewed",
  "InfluenceBlockViewed",
  "MethodCapabilitiesViewed",
  "OfferBridgeViewed",
  "OfferViewed",
  "OfferFitViewed",
  "OfferWorkViewed",
  "OfferHowItWorksViewed",
  "SocialProofViewed",
  "PriceBlockViewed",
  "CtaViewed",
  "CtaClicked",
  "FinalCtaViewed",
  "FinalCtaClicked",
  "InitiateCheckout",
  "ThankYouViewed",
  "FAQViewed",
  "FAQOpened",
  "Purchase"
]);

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

const seenEvents = globalThis.__cn9SeenEvents || new Set();
globalThis.__cn9SeenEvents = seenEvents;

const { sendToGoogleSheets, logSettled } = require("../lib/google-sheets");

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const event = parseBody(req.body);
  if (!event || !ALLOWED_EVENTS.has(event.eventName)) {
    res.status(400).json({ ok: false, error: "invalid_event_name" });
    return;
  }

  if (event.eventName === "Purchase") {
    res.status(403).json({ ok: false, error: "purchase_must_come_from_backend" });
    return;
  }

  const dedupeKey = `${event.sessionId || "no_session"}:${event.eventName}`;
  if (UNIQUE_EVENTS.has(event.eventName) && seenEvents.has(dedupeKey)) {
    res.status(200).json({ ok: true, deduped: true });
    return;
  }
  if (UNIQUE_EVENTS.has(event.eventName)) seenEvents.add(dedupeKey);

  const serverEvent = {
    ...event,
    serverTimestamp: new Date().toISOString()
  };

  if (process.env.CN9_TRACK_DEBUG === "true") {
    console.info("cn9_event", safeEventLog(serverEvent));
  }

  const destinations = [
    sendEventToNotion(serverEvent),
    maybeSendLeadToNotion(serverEvent),
    maybeUpdateLeadInNotion(serverEvent),
    sendToGoogleSheets("event", serverEvent),
    maybeSendLeadToGoogleSheets(serverEvent),
    maybeUpdateLeadInGoogleSheets(serverEvent)
  ];
  const results = await Promise.allSettled(destinations);

  if (process.env.CN9_TRACK_DEBUG === "true") {
    logSettled("cn9_event_destinations", [
      "notion_event", "notion_lead", "notion_lead_update",
      "sheets_event", "sheets_lead", "sheets_lead_update"
    ], results);
  }

  res.status(200).json({ ok: true });
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBody(body) {
  if (!body) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch (error) {
      return null;
    }
  }
  return body;
}

function safeEventLog(event) {
  return {
    eventName: event.eventName,
    eventId: event.eventId,
    sessionId: event.sessionId,
    leadId: event.leadId,
    page: event.page,
    step: event.step,
    serverTimestamp: event.serverTimestamp
  };
}

function maybeSendLeadToGoogleSheets(event) {
  if (event.eventName !== "LeadCaptured") return Promise.resolve({ skipped: true });
  return sendToGoogleSheets("lead", event);
}

function maybeUpdateLeadInGoogleSheets(event) {
  if (!event.leadId || !["ResultViewed", "ResultUnlocked", "OfferViewed", "InitiateCheckout"].includes(event.eventName)) {
    return Promise.resolve({ skipped: true });
  }
  return sendToGoogleSheets("lead_stage", event);
}

async function sendEventToNotion(event) {
  const databaseId = process.env.NOTION_EVENTS_DATABASE_ID;
  if (!process.env.NOTION_TOKEN || !databaseId) return { skipped: true };
  const origin = event.origin || {};

  await notionCreatePage(databaseId, {
    "Event ID": title(event.eventId || ""),
    "Event Name": richText(event.eventName || ""),
    "Timestamp": date(event.serverTimestamp || event.timestamp),
    "Session ID": richText(event.sessionId || ""),
    "Lead ID": richText(event.leadId || ""),
    "Step": richText(event.step || event.data?.step || ""),
    "Question Number": number(event.data?.questionNumber),
    "Dimension": richText(event.data?.dimension || ""),
    "Category": richText(event.data?.category || ""),
    "Score": number(event.data?.publicScore || event.data?.score),
    "CTA Location": richText(event.data?.ctaLocation || ""),
    "Origin": richText(JSON.stringify(event.origin || {})),
    "UTM Source": richText(origin.utm_source || origin.ref || ""),
    "UTM Medium": richText(origin.utm_medium || ""),
    "UTM Campaign": richText(origin.utm_campaign || origin.campaign_id || ""),
    "UTM Content": richText(origin.utm_content || ""),
    "UTM Term": richText(origin.utm_term || ""),
    "Source Post": richText(origin.source_post || ""),
    "Subscriber ID": richText(origin.subscriber_id || ""),
    "CUID": richText(origin.cuid || ""),
    "Device": richText(`${event.device?.viewportWidth || ""}x${event.device?.viewportHeight || ""}`),
    "Page": richText(event.page || "")
  });
}

async function maybeSendLeadToNotion(event) {
  const databaseId = process.env.NOTION_LEADS_DATABASE_ID;
  if (!process.env.NOTION_TOKEN || !databaseId || event.eventName !== "LeadCaptured") return { skipped: true };

  await notionCreatePage(databaseId, {
    "Lead ID": title(event.data?.leadId || event.leadId || ""),
    "Session ID": richText(event.sessionId || ""),
    "Nome": richText(event.data?.name || ""),
    "WhatsApp": richText(event.data?.whatsapp || ""),
    "E-mail": richText(event.data?.email || ""),
    "Data de captura": date(event.serverTimestamp || event.timestamp),
    "Origem": richText(event.origin?.utm_source || event.origin?.ref || ""),
    "Campanha": richText(event.origin?.utm_campaign || event.origin?.campaign_id || ""),
    "Post": richText(event.origin?.source_post || ""),
    "UTM Medium": richText(event.origin?.utm_medium || ""),
    "UTM Content": richText(event.origin?.utm_content || ""),
    "UTM Term": richText(event.origin?.utm_term || ""),
    "Subscriber ID": richText(event.origin?.subscriber_id || ""),
    "CUID": richText(event.origin?.cuid || ""),
    "Score público": number(event.data?.publicScore),
    "Categoria": richText(event.data?.category || ""),
    "Dimensão principal": richText(event.data?.mainDimension || ""),
    "Status do funil": richText("lead_captured"),
    "Checkout clicado?": checkbox(false),
    "Compra confirmada?": checkbox(false)
  });
}

async function maybeUpdateLeadInNotion(event) {
  const databaseId = process.env.NOTION_LEADS_DATABASE_ID;
  if (!process.env.NOTION_TOKEN || !databaseId || !event.leadId) return { skipped: true };

  const updatesByEvent = {
    ResultViewed: {
      "Score público": number(event.data?.publicScore),
      "Categoria": richText(event.data?.category || ""),
      "Dimensão principal": richText(event.data?.mainDimension || ""),
      "Status do funil": richText("result_viewed")
    },
    OfferViewed: {
      "Status do funil": richText("offer_viewed")
    },
    InitiateCheckout: {
      "Status do funil": richText("checkout_clicked"),
      "Checkout clicado?": checkbox(true)
    }
  };

  const properties = updatesByEvent[event.eventName];
  if (!properties) return { skipped: true };

  const pageId = await findNotionPageByTitle(databaseId, "Lead ID", event.leadId);
  if (!pageId) return { skipped: true };

  await notionUpdatePage(pageId, properties);
}

async function notionCreatePage(databaseId, properties) {
  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: stripEmptyProperties(properties)
    })
  });

  if (!response.ok && process.env.CN9_TRACK_DEBUG === "true") {
    console.info("cn9_notion_event_failed", response.status);
  }
}

async function findNotionPageByTitle(databaseId, propertyName, value) {
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify({
      page_size: 1,
      filter: {
        property: propertyName,
        title: {
          equals: String(value)
        }
      }
    })
  });

  if (!response.ok) return "";
  const payload = await response.json();
  return payload.results?.[0]?.id || "";
}

async function notionUpdatePage(pageId, properties) {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify({
      properties: stripEmptyProperties(properties)
    })
  });

  if (!response.ok && process.env.CN9_TRACK_DEBUG === "true") {
    console.info("cn9_notion_lead_update_failed", response.status);
  }
}

function notionHeaders() {
  return {
    "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
  };
}

function stripEmptyProperties(properties) {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== null));
}

function title(value) {
  return { title: [{ text: { content: String(value).slice(0, 2000) } }] };
}

function richText(value) {
  return { rich_text: [{ text: { content: String(value).slice(0, 2000) } }] };
}

function date(value) {
  return value ? { date: { start: value } } : null;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? { number: parsed } : null;
}

function checkbox(value) {
  return { checkbox: Boolean(value) };
}
