const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const httpProxy = require("http-proxy");
const browserSync = require("browser-sync").create();

const APP_ADDRESS = "/edt";
const LOCAL_CSS = "css/edt.css"; // relative to publicDir, built by `yarn watch:sass`
const PORT = Number(process.env.PORT) || 3000;

// Copied from entcore/admin proxy-development.conf.js (no dotenv dep)
const parseEnvFile = (content) => {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
};

const envPath = path.resolve(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error(
    "Missing .env file. Copy .env.template to .env then run `dev-auth-fetcher connect` (or the auth-user-frontend skill)."
  );
  process.exit(1);
}
const env = parseEnvFile(fs.readFileSync(envPath, "utf-8"));
const { VITE_RECETTE, VITE_XSRF_TOKEN, VITE_ONE_SESSION_ID } = env;
if (!VITE_RECETTE) {
  console.error("VITE_RECETTE missing in .env");
  process.exit(1);
}

// dev-auth-fetcher writes the URL with a trailing slash, which would produce
// `//edt` upstream (404).
const recette = VITE_RECETTE.replace(/\/+$/, "");
const cookie = `oneSessionId=${VITE_ONE_SESSION_ID}; authenticated=true; XSRF-TOKEN=${VITE_XSRF_TOKEN}`;
const publicDir = path.resolve(__dirname, "src/main/resources/public");

// Manual proxy (rather than browser-sync's `proxy` option): browser-sync forces
// the local server to https as soon as the proxy target is https (not disableable
// via `https: false`), which triggers a self-signed certificate and the browser's
// "connection not private" warning. Going through http-proxy directly in a
// middleware keeps the local server on http while proxying to the https recette.
const proxy = httpProxy.createProxyServer({
  target: recette,
  changeOrigin: true,
  secure: false,
  autoRewrite: true,
  // The local server is http, the recette is https. `autoRewrite` rewrites the
  // HOST of any redirect the recette sends (e.g. to localhost:3000) but keeps its
  // PROTOCOL. Without this, a redirect (typically /auth/login when the session has
  // expired) sends the browser to https://localhost:3000 -> "This site can't
  // provide a secure connection", with no indication of what actually went wrong.
  protocolRewrite: "http",
  // The HTML document is rewritten to inject the browser-sync client and the local
  // stylesheet (see buildInjection), so we write the response ourselves.
  selfHandleResponse: true,
});

// Only navigation documents get rewritten. Angular's partial templates are also
// text/html: without this filter each one would receive its own copy of the
// browser-sync client.
const wantsHtmlDocument = (req) => (req.headers.accept || "").indexOf("text/html") !== -1;

// Injects the recette session into every outgoing request (admin pattern)
proxy.on("proxyReq", (proxyReq, req) => {
  proxyReq.setHeader("cookie", cookie);
  proxyReq.setHeader("X-XSRF-TOKEN", VITE_XSRF_TOKEN || "");
  // Uncompressed response so we can rewrite it (HTML documents only)
  if (wantsHtmlDocument(req)) proxyReq.setHeader("accept-encoding", "identity");
});

// A session that has expired shows up ONLY as a redirect to /auth/login — flag it
// explicitly, otherwise the browser just shows a blank page with no explanation.
let sessionExpiredLogged = false;
proxy.on("proxyRes", (proxyRes, req, res) => {
  const location = proxyRes.headers["location"];
  if (!sessionExpiredLogged && location && location.indexOf("/auth/login") !== -1) {
    sessionExpiredLogged = true;
    console.error(
      "\nRecette session expired (redirected to /auth/login).\n" +
        "Regenerate .env with `dev-auth-fetcher connect`, then restart.\n"
    );
  }
  // Pins the set-cookie on the response: avoids session rotation
  proxyRes.headers["set-cookie"] = [
    `oneSessionId=${VITE_ONE_SESSION_ID}`,
    `XSRF-TOKEN=${VITE_XSRF_TOKEN}`,
    "authenticated=true",
  ];

  const contentType = proxyRes.headers["content-type"] || "";
  const rewritable =
    wantsHtmlDocument(req) &&
    contentType.indexOf("text/html") !== -1 &&
    !proxyRes.headers["content-encoding"];

  if (!rewritable) {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
    return;
  }

  const chunks = [];
  proxyRes.on("data", (chunk) => chunks.push(chunk));
  proxyRes.on("end", () => {
    let body = Buffer.concat(chunks).toString("utf8");
    const injection = buildInjection();
    body =
      body.indexOf("</head>") !== -1
        ? body.replace("</head>", injection + "</head>")
        : body + injection;

    const headers = Object.assign({}, proxyRes.headers);
    headers["content-length"] = Buffer.byteLength(body);
    res.writeHead(proxyRes.statusCode, headers);
    res.end(body);
  });
});

proxy.on("error", (err, req, res) => {
  console.error("Proxy error to recette:", err.message);
  if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain" });
  res.end("Proxy error to recette: " + err.message);
});

// The app CSS is compiled into the skin's theme.css (ode-themes), which the
// recette serves and ng-app.js appends to <head> at runtime — nothing ever
// requests /edt/public/css/edt.css. Without this injection, recompiling the sass
// locally has no visible effect whatsoever.
//
// The link is added by a script rather than hardcoded in the HTML: #theme is
// inserted at runtime, and at equal specificity the last <link> in the DOM wins.
// It is placed once, right after #theme, then the observer disconnects —
// permanently forcing it last conflicts with the <link> swap browser-sync
// performs to hot-inject CSS, and the two retrigger each other until the page
// freezes.
const localCssPath = path.join(publicDir, LOCAL_CSS);

// Checked per request, not once at boot: `yarn dev` starts watch:sass and
// dev:server in parallel, so on a fresh clone the server can boot before sass has
// written the file. A boot-time flag would then stay false for the whole session
// and the injection would silently never happen.
const hasLocalCss = () => fs.existsSync(localCssPath);
const localCssSnippet = `<script>(function () {
    var ID = 'dev-local-css';
    var observer;
    function link() {
        var el = document.getElementById(ID);
        if (!el) {
            el = document.createElement('link');
            el.id = ID;
            el.rel = 'stylesheet';
            el.href = '${APP_ADDRESS}/public/${LOCAL_CSS}';
            document.head.appendChild(el);
        }
        return el;
    }
    function place() {
        var theme = document.getElementById('theme');
        if (!theme) return;
        var el = link();
        if (theme.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING) {
            theme.parentNode.insertBefore(el, theme.nextSibling);
        }
        if (observer) observer.disconnect();
    }
    link();
    observer = new MutationObserver(place);
    observer.observe(document.head, {childList: true});
    place();
})();</script>`;

if (!hasLocalCss()) {
  console.warn(
    `\n[!] ${LOCAL_CSS} not built yet: the theme's CSS is used instead.\n` +
      `    It is picked up on the next page load, once \`yarn watch:sass\` has\n` +
      `    compiled it — no restart needed.\n`
  );
}

// What gets appended to the proxied page's <head>. The browser-sync client is
// part of it: with no `server` nor `proxy` option, browser-sync runs in "snippet"
// mode and rewrites no response — it only prints the snippet and waits for you to
// paste it into the page. Without it no client is connected, so `files` broadcasts
// reload orders to nobody and nothing ever auto-reloads.
function buildInjection() {
  return (hasLocalCss() ? localCssSnippet : "") + (browserSync.getOption("snippet") || "");
}

browserSync.init(
  {
    port: PORT,
    startPath: APP_ADDRESS,
    // Do NOT rely on browser-sync to open the browser here: in snippet mode
    // `open: true` is silently forced to false, and the console only ever prints
    // the UI dashboard URL (port 3001), never the app's. Opened manually below.
    open: false,
    ui: false,
    ghostMode: false,
    notify: false,
    // Serves local dist/, template/, js/, css/, img/ ; 404 -> fall-through to the
    // proxy (so template/entcore/*, absent from the repo, comes from the recette)
    // serve-static options must be carried by the entry itself (`options`):
    // browser-sync ignores the global `serveStaticOptions` option for object entries.
    serveStatic: [
      {
        route: `${APP_ADDRESS}/public`,
        dir: publicDir,
        options: {
          cacheControl: false,
          setHeaders: (res) => res.setHeader("Cache-Control", "no-store"),
        },
      },
    ],
    middleware: [
      // Mocks the public conf to test Screeb locally (admin pattern);
      // everything else goes to the recette via the catch-all.
      (req, res) => {
        if (env.SCREEB_APP_ID_DEV && req.url.split("?")[0] === "/edt/conf/public") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ "screeb-app-id": env.SCREEB_APP_ID_DEV }));
          return;
        }
        proxy.web(req, res);
      },
    ],
    // Auto-reload on bundle/template change; .css is hot-injected, no page reload
    files: [
      "src/main/resources/public/dist/*.js",
      "src/main/resources/public/js/behaviours.js",
      "src/main/resources/public/template/**/*.html",
      "src/main/resources/public/css/*.css",
    ],
    watchEvents: ["change", "add"],
    reloadDebounce: 500,
  },
  () => {
    const appUrl = `http://localhost:${PORT}${APP_ADDRESS}`;
    console.log("\n  Recette    : " + recette);
    console.log("  Application: " + appUrl + "\n");
    const opener =
      process.platform === "darwin"
        ? "open"
        : process.platform === "win32"
        ? 'start ""'
        : "xdg-open";
    exec(`${opener} "${appUrl}"`, (err) => {
      if (err) console.log("Open manually: " + appUrl);
    });
  }
);
