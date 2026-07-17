const paidPurchases = globalThis.__cn9PaidPurchases || new Set();
globalThis.__cn9PaidPurchases = paidPurchases;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "method_not_allowed" });
    return;
  }

  const secret = process.env.GREEN_WEBHOOK_TOKEN || process.env.GREEN_WEBHOOK_SECRET;
  if (!secret) {
    res.status(503).json({ ok: false, error: "webhook_token_not_configured" });
    return;
  }

  if (!isAuthorized(req, secret)) {
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const payload = parseBody(req.body);
  if (!payload) {
    res.status(400).json({ ok: false, error: "invalid_json" });
    return;
  }

  const saleMetas = readSaleMetas(payload);
  const paymentStatus = String(pick(payload, [
    "currentStatus",
    "status",
    "payment_status",
    "sale.status",
    "currentSale.status",
    "payment.status",
    "transaction.status",
    "purchase.status",
    "order.status",
    "data.status",
    "data.payment_status"
  ]) || "").toLowerCase();

  if (!isPaidStatus(paymentStatus)) {
    res.status(200).json({ ok: true, recorded: false, reason: "not_paid" });
    return;
  }

  const purchaseId = String(pick(payload, [
    "purchaseId",
    "purchase_id",
    "transaction_id",
    "transaction.id",
    "purchase.id",
    "sale.id",
    "currentSale.id",
    "data.purchase_id",
    "data.transaction_id",
    "data.id",
    "data.sale.id",
    "data.currentSale.id"
  ]) || "");

  const orderId = String(pick(payload, [
    "orderId",
    "order_id",
    "order.id",
    "data.order_id",
    "data.order.id"
  ]) || "");

  const finalPurchaseId = purchaseId || orderId;
  if (!finalPurchaseId) {
    res.status(400).json({ ok: false, error: "missing_purchase_id" });
    return;
  }

  if (paidPurchases.has(finalPurchaseId)) {
    res.status(200).json({ ok: true, deduped: true });
    return;
  }
  paidPurchases.add(finalPurchaseId);

  const utmSource = String(pick(payload, ["utm_source", "origin", "metadata.utm_source", "metadata.origin", "data.utm_source", "data.metadata.utm_source", "query.utm_source"]) || saleMetaValue(saleMetas, ["utm_source", "origin"]));
  const utmMedium = String(pick(payload, ["utm_medium", "metadata.utm_medium", "data.utm_medium", "data.metadata.utm_medium", "query.utm_medium"]) || saleMetaValue(saleMetas, ["utm_medium"]));
  const utmCampaign = String(pick(payload, ["utm_campaign", "campaign_id", "metadata.utm_campaign", "metadata.campaign_id", "data.utm_campaign", "data.metadata.utm_campaign", "query.utm_campaign"]) || saleMetaValue(saleMetas, ["utm_campaign", "campaign_id"]));
  const utmContent = String(pick(payload, ["utm_content", "metadata.utm_content", "data.utm_content", "data.metadata.utm_content", "query.utm_content"]) || saleMetaValue(saleMetas, ["utm_content"]));
  const utmTerm = String(pick(payload, ["utm_term", "metadata.utm_term", "data.utm_term", "data.metadata.utm_term", "query.utm_term"]) || saleMetaValue(saleMetas, ["utm_term"]));
  const sourcePost = String(pick(payload, ["source_post", "metadata.source_post", "data.source_post", "data.metadata.source_post", "query.source_post"]) || saleMetaValue(saleMetas, ["source_post"]));
  const subscriberId = String(pick(payload, ["subscriber_id", "metadata.subscriber_id", "data.subscriber_id", "data.metadata.subscriber_id", "query.subscriber_id"]) || saleMetaValue(saleMetas, ["subscriber_id"]));
  const cuid = String(pick(payload, ["cuid", "metadata.cuid", "data.cuid", "data.metadata.cuid", "query.cuid"]) || saleMetaValue(saleMetas, ["cuid"]));
  const publicScore = Number(pick(payload, ["publicScore", "public_score", "score", "metadata.publicScore", "metadata.public_score", "metadata.score", "data.publicScore", "data.public_score", "data.score", "data.metadata.publicScore", "data.metadata.public_score", "query.publicScore"]) || saleMetaValue(saleMetas, ["publicScore", "public_score", "score"]));

  const purchase = {
    eventName: "Purchase",
    purchaseId: finalPurchaseId,
    orderId,
    leadId: String(pick(payload, ["leadId", "lead_id", "metadata.leadId", "metadata.lead_id", "data.leadId", "data.metadata.leadId", "query.leadId", "query.lead_id"]) || saleMetaValue(saleMetas, ["leadId", "lead_id"])),
    sessionId: String(pick(payload, ["sessionId", "session_id", "metadata.sessionId", "metadata.session_id", "data.sessionId", "data.metadata.sessionId", "query.sessionId", "query.session_id"]) || saleMetaValue(saleMetas, ["sessionId", "session_id"])),
    name: String(pick(payload, ["name", "customer.name", "buyer.name", "client.name", "data.name", "data.customer.name", "data.buyer.name", "data.client.name"]) || ""),
    email: String(pick(payload, ["email", "customer.email", "buyer.email", "client.email", "data.email", "data.customer.email", "data.buyer.email", "data.client.email"]) || ""),
    whatsapp: String(pick(payload, ["whatsapp", "phone", "customer.phone", "buyer.phone", "client.phone", "client.cellphone", "data.whatsapp", "data.phone", "data.customer.phone", "data.buyer.phone", "data.client.cellphone"]) || ""),
    origin: utmSource || "green_webhook",
    campaign: utmCampaign,
    utmMedium,
    utmContent,
    utmTerm,
    sourcePost,
    subscriberId,
    cuid,
    ctaLocation: String(pick(payload, ["cta", "ctaLocation", "metadata.cta", "metadata.ctaLocation", "data.cta", "data.metadata.cta", "query.cta", "query.ctaLocation"]) || saleMetaValue(saleMetas, ["cta", "ctaLocation"])),
    category: String(pick(payload, ["category", "metadata.category", "data.category", "data.metadata.category", "query.category"]) || saleMetaValue(saleMetas, ["category"])),
    mainDimension: String(pick(payload, ["mainDimension", "main_dimension", "metadata.mainDimension", "metadata.main_dimension", "data.mainDimension", "data.metadata.mainDimension", "query.mainDimension", "query.main_dimension"]) || saleMetaValue(saleMetas, ["mainDimension", "main_dimension"])),
    publicScore,
    value: Number(pick(payload, ["value", "amount", "price", "sale.amount", "currentSale.amount", "product.amount", "data.value", "data.amount", "data.sale.amount"]) || 497),
    currency: String(pick(payload, ["currency", "sale.currency", "data.currency", "data.sale.currency"]) || "BRL"),
    paymentStatus,
    product: String(pick(payload, ["product.name", "product.title", "data.product.name", "data.product.title"]) || "Mentoria Casamento Nota 9"),
    serverTimestamp: new Date().toISOString()
  };

  if (process.env.CN9_TRACK_DEBUG === "true") {
    console.info("cn9_purchase", {
      purchaseId: purchase.purchaseId,
      orderId: purchase.orderId,
      leadId: purchase.leadId,
      sessionId: purchase.sessionId,
      value: purchase.value
    });
  }

  await Promise.allSettled([
    sendSaleToNotion(purchase),
    updateLeadPurchaseInNotion(purchase),
    sendPurchaseToMeta(purchase)
  ]);

  res.status(200).json({ ok: true, recorded: true });
};

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

function isAuthorized(req, secret) {
  const authorization = req.headers.authorization || "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const headerToken = req.headers["x-green-token"] || req.headers["x-webhook-token"] || req.headers["x-cn9-token"];
  const queryToken = req.query?.token;
  return [bearer, headerToken, queryToken].filter(Boolean).includes(secret);
}

function isPaidStatus(status) {
  return ["paid", "approved", "aprovado", "pago", "confirmed", "completed"].some((item) => status.includes(item));
}

function pick(object, paths) {
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => {
      if (current && Object.prototype.hasOwnProperty.call(current, key)) return current[key];
      return undefined;
    }, object);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function readSaleMetas(payload) {
  const raw = pick(payload, ["saleMetas", "currentSale.saleMetas", "data.saleMetas", "data.currentSale.saleMetas"]);
  return Array.isArray(raw) ? raw : [];
}

function saleMetaValue(metas, keys) {
  const wanted = new Set(keys.map(normalizeMetaKey));
  const match = metas.find((meta) => {
    const key = meta?.meta_key ?? meta?.metaKey ?? meta?.key ?? meta?.name;
    return wanted.has(normalizeMetaKey(key));
  });

  if (!match) return "";
  return String(match.meta_value ?? match.metaValue ?? match.value ?? "");
}

function normalizeMetaKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

async function sendSaleToNotion(purchase) {
  const databaseId = process.env.NOTION_SALES_DATABASE_ID;
  if (!process.env.NOTION_TOKEN || !databaseId) return;

  await notionCreatePage(databaseId, {
    "Purchase ID": title(purchase.purchaseId),
    "Order ID": richText(purchase.orderId),
    "Lead ID": richText(purchase.leadId),
    "Session ID": richText(purchase.sessionId),
    "Nome": richText(purchase.name),
    "E-mail": richText(purchase.email),
    "WhatsApp": richText(purchase.whatsapp),
    "Produto": richText(purchase.product),
    "Valor": number(purchase.value),
    "Status": richText(purchase.paymentStatus),
    "Data da compra": date(purchase.serverTimestamp),
    "Origem": richText(purchase.origin),
    "Campanha": richText(purchase.campaign),
    "UTM Medium": richText(purchase.utmMedium),
    "UTM Content": richText(purchase.utmContent),
    "UTM Term": richText(purchase.utmTerm),
    "Post": richText(purchase.sourcePost),
    "Subscriber ID": richText(purchase.subscriberId),
    "CUID": richText(purchase.cuid),
    "CTA de origem": richText(purchase.ctaLocation),
    "Categoria do diagnóstico": richText(purchase.category),
    "Dimensão principal": richText(purchase.mainDimension),
    "Score público": number(purchase.publicScore)
  });
}

async function updateLeadPurchaseInNotion(purchase) {
  const databaseId = process.env.NOTION_LEADS_DATABASE_ID;
  if (!process.env.NOTION_TOKEN || !databaseId || !purchase.leadId) return;

  const pageId = await findNotionPageByTitle(databaseId, "Lead ID", purchase.leadId);
  if (!pageId) return;

  await notionUpdatePage(pageId, {
    "Status do funil": richText("purchase_confirmed"),
    "Compra confirmada?": checkbox(true),
    "Valor pago": number(purchase.value),
    "Data da compra": date(purchase.serverTimestamp),
    "Score público": number(purchase.publicScore)
  });
}

async function sendPurchaseToMeta(purchase) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return;

  const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: purchase.purchaseId,
        action_source: "website",
        custom_data: {
          content_name: "Mentoria Casamento Nota 9",
          content_type: "product",
          value: purchase.value,
          currency: purchase.currency
        }
      }
    ]
  };

  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok && process.env.CN9_TRACK_DEBUG === "true") {
    console.info("cn9_meta_purchase_failed", response.status);
  }
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
    console.info("cn9_notion_sale_failed", response.status);
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
    console.info("cn9_notion_sale_lead_update_failed", response.status);
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
  return { title: [{ text: { content: String(value || "").slice(0, 2000) } }] };
}

function richText(value) {
  return { rich_text: [{ text: { content: String(value || "").slice(0, 2000) } }] };
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
