const http = require("http");
const fs = require("fs");
const path = require("path");
const trackHandler = require("./api/track");
const greenWebhookHandler = require("./api/green-webhook");

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === "/api/track") {
    await runApi(trackHandler, req, res, requestUrl);
    return;
  }

  if (requestUrl.pathname === "/api/green-webhook") {
    await runApi(greenWebhookHandler, req, res, requestUrl);
    return;
  }

  if (requestUrl.pathname === "/mentoria") {
    res.statusCode = 308;
    res.setHeader("Location", `/mentoria-em-grupo${requestUrl.search}`);
    res.end();
    return;
  }

  serveStatic(requestUrl.pathname, res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Quiz Casamento Nota 9 em http://127.0.0.1:${port}/quiz/`);
  console.log(`Link da bio em http://127.0.0.1:${port}/linkbio`);
});

async function runApi(handler, req, res, requestUrl) {
  const body = await readBody(req);
  const apiReq = {
    method: req.method,
    headers: req.headers,
    query: Object.fromEntries(requestUrl.searchParams.entries()),
    body
  };

  const apiRes = {
    statusCode: 200,
    setHeader(name, value) {
      res.setHeader(name, value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      res.statusCode = this.statusCode;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(payload));
      return this;
    },
    end(payload = "") {
      res.statusCode = this.statusCode;
      res.end(payload);
      return this;
    }
  };

  try {
    await handler(apiReq, apiRes);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "local_api_error" }));
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        resolve(raw);
      }
    });
  });
}

function serveStatic(pathname, res) {
  let safePath = decodeURIComponent(pathname);
  if (safePath === "/" || safePath === "/quiz") safePath = "/quiz/index.html";
  if (safePath === "/linkbio") safePath = "/linkbio/index.html";
  if (safePath.endsWith("/")) safePath += "index.html";

  const filePath = path.resolve(root, `.${safePath}`);
  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", mimeTypes[path.extname(filePath)] || "application/octet-stream");
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
    res.end(content);
  });
}
