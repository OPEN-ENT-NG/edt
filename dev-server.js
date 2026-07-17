const fs = require("fs");
const path = require("path");
const httpProxy = require("http-proxy");
const browserSync = require("browser-sync").create();

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

const cookie = `oneSessionId=${VITE_ONE_SESSION_ID}; authenticated=true; XSRF-TOKEN=${VITE_XSRF_TOKEN}`;
const publicDir = path.resolve(__dirname, "src/main/resources/public");

// Manual proxy (rather than browser-sync's `proxy` option): browser-sync forces
// the local server to https as soon as the proxy target is https (not disableable
// via `https: false`), which triggers a self-signed certificate and the browser's
// "connection not private" warning. Going through http-proxy directly in a
// middleware keeps the local server on http while proxying to the https recette.
const proxy = httpProxy.createProxyServer({
  target: VITE_RECETTE,
  changeOrigin: true,
  secure: false,
  autoRewrite: true,
});

// Injects the recette session into every outgoing request (admin pattern)
proxy.on("proxyReq", (proxyReq) => {
  proxyReq.setHeader("cookie", cookie);
  proxyReq.setHeader("X-XSRF-TOKEN", VITE_XSRF_TOKEN || "");
});

// Pins the set-cookie on the response: avoids session rotation
proxy.on("proxyRes", (proxyRes) => {
  proxyRes.headers["set-cookie"] = [
    `oneSessionId=${VITE_ONE_SESSION_ID}`,
    `XSRF-TOKEN=${VITE_XSRF_TOKEN}`,
    "authenticated=true",
  ];
});

proxy.on("error", (err, req, res) => {
  console.error("Proxy error to recette:", err.message);
  if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain" });
  res.end("Proxy error to recette: " + err.message);
});

browserSync.init({
  port: 3000,
  startPath: "/edt",
  open: true,
  ghostMode: false,
  notify: false,
  // Serves local dist/, template/, js/, img/ ; 404 -> fall-through to the proxy
  // (so template/entcore/*, absent from the repo, comes from the recette)
  // serve-static options must be carried by the entry itself (`options`):
  // browser-sync ignores the global `serveStaticOptions` option for object entries.
  serveStatic: [
    {
      route: "/edt/public",
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
  // Auto-reload when webpack re-emits the bundle or a template changes
  files: [
    "src/main/resources/public/dist/*.js",
    "src/main/resources/public/js/behaviours.js",
    "src/main/resources/public/template/**/*.html",
  ],
  watchEvents: ["change", "add"],
  reloadDebounce: 500,
});
