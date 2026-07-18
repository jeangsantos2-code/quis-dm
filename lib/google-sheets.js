async function sendToGoogleSheets(type, data) {
  const endpoint = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const token = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  if (!endpoint || !token) return { skipped: true };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, type, data })
  });

  if (!response.ok) throw new Error(`google_sheets_${response.status}`);

  const payload = await response.json().catch(() => ({}));
  if (payload.ok === false) throw new Error(`google_sheets_${payload.error || "rejected"}`);
  return payload;
}

function logSettled(label, names, results) {
  const destinations = Object.fromEntries(results.map((result, index) => [
    names[index],
    result.status === "fulfilled"
      ? result.value?.skipped ? "skipped" : "ok"
      : String(result.reason?.message || "failed").slice(0, 120)
  ]));
  console.info(label, destinations);
}

module.exports = { sendToGoogleSheets, logSettled };
