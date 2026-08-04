// Smoke check for the built single-file output. Runs in CI before deploy,
// and locally via `npm run verify`. No test framework by design — this only
// needs to catch the failure modes a single-file inlined build actually has:
// a partial build, an empty CSS/JS bundle, unrendered templates, and nav
// anchors drifting out of sync with section IDs.
import { readFileSync, statSync } from "node:fs";

const FILE = "dist/index.html";

// A healthy build is ~52 KB (17 KB inlined CSS + 1.6 KB JS + markup).
// The floor catches a truncated or partial build, the ceiling runaway inlining.
const MIN_BYTES = 30_000;
const MAX_BYTES = 500_000;

// Bundles are inlined, never linked — assert they arrived and are non-trivial.
const MIN_STYLE_CHARS = 5_000;
const MIN_SCRIPT_CHARS = 500;

// CLAUDE.md requires nav/footer links to stay in sync with section IDs.
// Nothing enforced that until now.
const SECTION_IDS = ["hero", "sectors", "services", "experience", "about", "contact"];

const MUST_CONTAIN = [
  ["https://formspree.io/f/", "contact form action (site.formspreeEndpoint)"],
  ["ceo@magtech.se", "contact address"],
  ["MAGTECH Sweden AB", "company name in footer"],
  ["IntersectionObserver", "main.js was inlined"],
  ["--blue", "00-tokens.css was inlined"],
];

// Unrendered template syntax or data that resolved to nothing.
const MUST_NOT_CONTAIN = ["{{", "{%", "[object Object]", "undefined<", ">undefined"];

const errors = [];

let html;
try {
  html = readFileSync(FILE, "utf8");
} catch {
  console.error(`FAIL: ${FILE} does not exist — did \`npm run build\` run?`);
  process.exit(1);
}

const bytes = statSync(FILE).size;
if (bytes < MIN_BYTES) errors.push(`${FILE} is ${bytes} B, expected >= ${MIN_BYTES} B`);
if (bytes > MAX_BYTES) errors.push(`${FILE} is ${bytes} B, expected <= ${MAX_BYTES} B`);

const style = /<style>([\s\S]*?)<\/style>/.exec(html);
if (!style || style[1].length < MIN_STYLE_CHARS) {
  errors.push(
    `inlined <style> is ${style ? style[1].length : 0} chars, expected >= ${MIN_STYLE_CHARS} ` +
      `(bundledCss.js may have produced nothing)`,
  );
}

const script = /<script>([\s\S]*?)<\/script>/.exec(html);
if (!script || script[1].length < MIN_SCRIPT_CHARS) {
  errors.push(
    `inlined <script> is ${script ? script[1].length : 0} chars, expected >= ${MIN_SCRIPT_CHARS} ` +
      `(mainJs.js may have produced nothing)`,
  );
}

for (const id of SECTION_IDS) {
  if (!html.includes(`id="${id}"`)) errors.push(`missing section id="${id}"`);
  if (!html.includes(`href="#${id}"`)) errors.push(`no nav/footer link to href="#${id}"`);
}

for (const [needle, label] of MUST_CONTAIN) {
  if (!html.includes(needle)) errors.push(`missing ${label} (expected "${needle}")`);
}

for (const bad of MUST_NOT_CONTAIN) {
  if (html.includes(bad)) errors.push(`output contains unrendered/invalid marker: ${bad}`);
}

if (errors.length) {
  console.error(`FAIL: ${FILE} failed ${errors.length} check(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`OK: ${FILE} passed all checks (${bytes} bytes).`);
