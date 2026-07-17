const fs = require("fs");
const path = require("path");
const httpProxy = require("http-proxy");
const browserSync = require("browser-sync").create();

// Recopié de entcore/admin proxy-development.conf.js (pas de dep dotenv)
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
    "Fichier .env manquant. Copiez .env.template en .env puis lancez `dev-auth-fetcher connect` (ou le skill auth-user-frontend)."
  );
  process.exit(1);
}
const env = parseEnvFile(fs.readFileSync(envPath, "utf-8"));
const { PROXY_RECETTE, PROXY_XSRF_TOKEN, PROXY_ONE_SESSION_ID } = env;
if (!PROXY_RECETTE) {
  console.error("PROXY_RECETTE manquant dans .env");
  process.exit(1);
}

const cookie = `oneSessionId=${PROXY_ONE_SESSION_ID}; authenticated=true; XSRF-TOKEN=${PROXY_XSRF_TOKEN}`;
const publicDir = path.resolve(__dirname, "src/main/resources/public");

// Proxy manuel (plutôt que l'option `proxy` de browser-sync) : browser-sync force
// le serveur local en https dès que la cible du proxy est en https (non désactivable
// via `https: false`), ce qui déclenche un certificat auto-signé et le warning
// navigateur "connexion non privée". En passant par http-proxy directement dans un
// middleware, le serveur local reste en http tout en proxifiant vers la recette en https.
const proxy = httpProxy.createProxyServer({
  target: PROXY_RECETTE,
  changeOrigin: true,
  secure: false,
  autoRewrite: true,
});

// Injection de la session recette sur chaque requête sortante (pattern admin)
proxy.on("proxyReq", (proxyReq) => {
  proxyReq.setHeader("cookie", cookie);
  proxyReq.setHeader("X-XSRF-TOKEN", PROXY_XSRF_TOKEN || "");
});

// Épinglage du set-cookie en réponse : évite la rotation de session
proxy.on("proxyRes", (proxyRes) => {
  proxyRes.headers["set-cookie"] = [
    `oneSessionId=${PROXY_ONE_SESSION_ID}`,
    `XSRF-TOKEN=${PROXY_XSRF_TOKEN}`,
    "authenticated=true",
  ];
});

proxy.on("error", (err, req, res) => {
  console.error("Erreur proxy vers la recette :", err.message);
  if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain" });
  res.end("Erreur de proxy vers la recette : " + err.message);
});

browserSync.init({
  port: 3000,
  startPath: "/edt",
  open: true,
  ghostMode: false,
  notify: false,
  // Sert dist/, template/, js/, img/ locaux ; 404 -> fall-through vers le proxy
  // (donc template/entcore/*, absents du repo, viennent de la recette)
  // Les options serve-static doivent être portées par l'entrée elle-même (`options`) :
  // browser-sync ignore l'option globale `serveStaticOptions` pour les entrées objet.
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
    // Catch-all : tout ce qui n'est pas servi localement part vers la recette
    (req, res) => {
      proxy.web(req, res);
    },
  ],
  // Auto-reload quand webpack ré-émet le bundle ou qu'un template change
  files: [
    "src/main/resources/public/dist/*.js",
    "src/main/resources/public/js/behaviours.js",
    "src/main/resources/public/template/**/*.html",
  ],
  watchEvents: ["change", "add"],
  reloadDebounce: 500,
});
