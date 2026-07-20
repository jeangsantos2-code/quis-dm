const SPREADSHEET_ID = "1t3R57-jZsPCVMc0atfkvCm-EHjFxOHYi7mVGg0xQqiw";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const payload = JSON.parse(e.postData.contents || "{}");
    const expectedToken = PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET");
    if (!expectedToken || payload.token !== expectedToken) return json({ ok: false, error: "unauthorized" });

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const data = payload.data || {};
    if (payload.type === "event") appendEvent(spreadsheet, data);
    else if (payload.type === "lead") upsertLead(spreadsheet, data);
    else if (payload.type === "lead_stage") updateLeadStage(spreadsheet, data);
    else if (payload.type === "sale") recordSale(spreadsheet, data);
    else return json({ ok: false, error: "invalid_type" });

    SpreadsheetApp.flush();
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: "processing_failed" });
  } finally {
    lock.releaseLock();
  }
}

function appendEvent(spreadsheet, event) {
  const origin = event.origin || {};
  const data = event.data || {};
  spreadsheet.getSheetByName("Eventos").appendRow([
    event.serverTimestamp || event.timestamp || new Date().toISOString(), event.eventName || "", event.eventId || "",
    event.sessionId || "", event.leadId || data.leadId || "", event.page || "", event.step || data.step || "",
    origin.utm_source || origin.ref || "", origin.utm_medium || "", origin.utm_campaign || origin.campaign_id || "",
    origin.utm_content || "", origin.utm_term || "", origin.source_post || "", origin.subscriber_id || "", origin.cuid || "",
    data.ctaLocation || "", numberOrBlank(data.publicScore || data.score), data.category || "", data.mainDimension || data.dimension || "",
    `${event.device?.viewportWidth || ""}x${event.device?.viewportHeight || ""}`, event.device?.userAgent || "", JSON.stringify(data),
    data.stageId || "", numberOrBlank(data.stageOrder), data.stageGroup || "", data.stageLabel || "",
    numberOrBlank(data.durationSeconds), data.exitReason || "", Boolean(data.potentialAbandonment)
  ]);
}

function upsertLead(spreadsheet, event) {
  const sheet = spreadsheet.getSheetByName("Leads");
  const data = event.data || {};
  const origin = event.origin || {};
  const leadId = data.leadId || event.leadId || "";
  if (!leadId) return;

  const row = findRow(sheet, 2, leadId) || sheet.getLastRow() + 1;
  const existing = row <= sheet.getLastRow() ? sheet.getRange(row, 1, 1, 23).getValues()[0] : Array(23).fill("");
  const values = [
    event.serverTimestamp || event.timestamp || new Date().toISOString(), leadId, event.sessionId || "", data.name || "", data.whatsapp || "", data.email || "",
    origin.utm_source || origin.ref || "", origin.utm_medium || "", origin.utm_campaign || origin.campaign_id || "", origin.utm_content || "", origin.utm_term || "",
    origin.source_post || "", origin.subscriber_id || "", origin.cuid || "", numberOrBlank(data.publicScore), data.category || "", data.mainDimension || "",
    "lead_captured", false, false, "", "", new Date().toISOString()
  ];
  sheet.getRange(row, 1, 1, 23).setValues([values.map((value, index) => value === "" && existing[index] !== "" ? existing[index] : value)]);
}

function updateLeadStage(spreadsheet, event) {
  const sheet = spreadsheet.getSheetByName("Leads");
  const row = findRow(sheet, 2, event.leadId);
  if (!row) return;

  const stages = { ResultViewed: "result_viewed", ResultUnlocked: "result_viewed", OfferViewed: "offer_viewed", InitiateCheckout: "checkout_clicked" };
  const data = event.data || {};
  if (data.publicScore !== undefined) sheet.getRange(row, 15).setValue(numberOrBlank(data.publicScore));
  if (data.category) sheet.getRange(row, 16).setValue(data.category);
  if (data.mainDimension) sheet.getRange(row, 17).setValue(data.mainDimension);
  sheet.getRange(row, 18).setValue(stages[event.eventName] || event.eventName);
  if (event.eventName === "InitiateCheckout") sheet.getRange(row, 19).setValue(true);
  sheet.getRange(row, 23).setValue(new Date().toISOString());
}

function recordSale(spreadsheet, sale) {
  const sales = spreadsheet.getSheetByName("Vendas");
  if (findRow(sales, 2, sale.purchaseId)) return;

  sales.appendRow([
    sale.serverTimestamp || new Date().toISOString(), sale.purchaseId || "", sale.orderId || "", sale.leadId || "", sale.sessionId || "",
    sale.name || "", sale.email || "", sale.whatsapp || "", sale.product || "", numberOrBlank(sale.value), sale.currency || "BRL", sale.paymentStatus || "paid",
    sale.origin || "", sale.utmMedium || "", sale.campaign || "", sale.utmContent || "", sale.utmTerm || "", sale.sourcePost || "",
    sale.subscriberId || "", sale.cuid || "", sale.ctaLocation || "", numberOrBlank(sale.publicScore), sale.category || "", sale.mainDimension || ""
  ]);

  const leads = spreadsheet.getSheetByName("Leads");
  const leadRow = sale.leadId ? findRow(leads, 2, sale.leadId) : 0;
  if (!leadRow) return;
  leads.getRange(leadRow, 18).setValue("purchase_confirmed");
  leads.getRange(leadRow, 20, 1, 4).setValues([[true, numberOrBlank(sale.value), sale.serverTimestamp || new Date().toISOString(), new Date().toISOString()]]);
}

function findRow(sheet, column, value) {
  if (!value || sheet.getLastRow() < 2) return 0;
  const match = sheet.getRange(2, column, sheet.getLastRow() - 1, 1).createTextFinder(String(value)).matchEntireCell(true).findNext();
  return match ? match.getRow() : 0;
}

function numberOrBlank(value) {
  if (value === null || value === undefined || value === "") return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
