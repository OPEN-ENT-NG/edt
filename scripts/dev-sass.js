/**
 * Sass watcher for local development (started by `yarn dev`).
 *
 * The stylesheet is not part of the regular build: it is compiled into the skin's
 * theme.css (ode-themes). This local compilation exists only so that a sass change
 * can be seen without redeploying a theme — dev-server.js injects the result into
 * the proxied page. The rendering is indicative: variables come from the default
 * entcore-css-lib, not from the deployed skin.
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "src/main/resources/public");
const entry = path.join(publicDir, "sass/index.scss");
const output = path.join(publicDir, "css/edt.css");

if (!fs.existsSync(entry)) {
  console.log(`[sass] no entry point (${path.relative(root, entry)}): nothing to watch.`);
  process.exit(0);
}

console.log(`[sass] watching ${path.relative(root, entry)}`);

const child = spawn(
  path.join(root, "node_modules/.bin/sass"),
  ["--load-path=node_modules/", "--no-source-map", "--watch", `${entry}:${output}`],
  { stdio: "inherit", cwd: root }
);
child.on("exit", (code) => process.exit(code === null ? 0 : code));
