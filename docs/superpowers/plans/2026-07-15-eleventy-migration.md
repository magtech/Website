# Eleventy Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the MAGTECH website from a single 1275-line `index.html` into an Eleventy (11ty) static site with data-driven content sections, while producing a `dist/index.html` build output that preserves the original's single-file (inlined CSS/JS) performance profile.

**Architecture:** Content that repeats (sectors, services, career-timeline entries) moves into YAML data files under `src/_data/`, rendered by Nunjucks partials under `src/_includes/partials/`. CSS is split one file per existing `/* ── SECTION ── */` divider under `src/assets/css/`, numbered so a plain filename sort gives correct cascade order. Two small Eleventy global-data JS files (`bundledCss.js`, `mainJs.js`) read and concatenate those files at build time, so `dist/index.html` still ships one inlined `<style>` and one inlined `<script>` block, identical in spirit to the current site.

**Tech Stack:** Node.js + npm, `@11ty/eleventy` (justification: it directly targets the two stated pain points, content-as-data and a repeatable build step, without pulling in a client-side framework; see `docs/decisions/2026-07-15-static-site-generator.md`), and `js-yaml` (justification: Eleventy 3.x does not recognize `.yaml` files in `_data/` as global data without an explicitly registered parser — `js-yaml` is the same library Eleventy uses internally for front-matter parsing, so this avoids a second YAML implementation; it is present transitively already, this just makes it an explicit, declared dependency). No other packages — CSS/JS bundling is done with a ~10-line custom Node module rather than an additional plugin dependency.

## Global Constraints

- Preserve the existing brand identity exactly: blue `#434BE7` / black / DM Sans + DM Mono, pill-shaped buttons, subtle grid/orb hero background. Do not introduce new colors, radii, or fonts — reuse the existing CSS custom properties (`--blue`, `--black`, `--gray-*`, `--radius`, etc). (Per `CLAUDE.md`.)
- Sections must render in this order: nav → hero → sectors → services → experience (timeline) → about → contact → footer. Nav links and footer links must keep anchoring to these section IDs. (Per `CLAUDE.md`.)
- No new third-party dependency without a one-line justification (per global `CLAUDE.md` code quality defaults). This plan introduces exactly one: `@11ty/eleventy`, justified above.
- `dist/` is build output only — never commit it. `node_modules/` is never committed.
- Copy/content text must be reproduced byte-for-byte from the current `index.html` — this is a structural migration, not a content rewrite. Do not "fix" the pre-existing inconsistency between full sector names ("Telecommunications") used in the sectors/hero sections and the abbreviated form ("Telecom") used in the career timeline — that inconsistency already exists in the source of truth and is out of scope here.
- Formspree endpoint (`https://formspree.io/f/mojbldlz`) and fallback contact (`ceo@magtech.se`) must be preserved exactly.

---

### Task 1: Project scaffolding, design tokens, base layout, nav, footer, core JS

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.eleventy.js`
- Create: `src/_data/site.yaml`
- Create: `src/_data/bundledCss.js`
- Create: `src/_data/mainJs.js`
- Create: `src/assets/css/00-tokens.css`
- Create: `src/assets/css/01-nav.css`
- Create: `src/assets/css/09-footer.css`
- Create: `src/assets/css/10-animations.css`
- Create: `src/assets/css/99-mobile.css`
- Create: `src/assets/js/main.js`
- Create: `src/_includes/layouts/base.njk`
- Create: `src/_includes/partials/nav.njk`
- Create: `src/_includes/partials/footer.njk`
- Create: `src/_includes/partials/svg/logo.njk`
- Create: `src/index.njk`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - Global Eleventy data `site` (from `site.yaml`) with keys: `title`, `companyName`, `tagline`, `contactEmail`, `formspreeEndpoint`, `linkedinUrl`, `copyrightYear`, `location`, `nav` (list of `{label, href, cta?}`), `footerLinks` (list of `{label, href, external?}`).
  - Global Eleventy data `bundledCss` (string) and `mainJs` (string), used by `base.njk`.
  - Layout `layouts/base.njk`, which every page's front matter will reference as `layout: layouts/base.njk`. Injects page body via Eleventy's automatic `{{ content | safe }}`.
  - `src/assets/css/*.css` files sorted alphabetically by filename determine bundle order — later tasks add files named `0N-<section>.css` where `N` places them correctly between `01-nav.css` and `09-footer.css`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "magtech-website",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "eleventy --serve",
    "build": "eleventy"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0",
    "js-yaml": "^4.1.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 3: Install dependencies**

Run: `npm install`
Expected: `node_modules/@11ty/eleventy` and `node_modules/js-yaml` exist, `package-lock.json` created.

- [ ] **Step 4: Create `.eleventy.js`**

```js
const yaml = require("js-yaml");

module.exports = function (eleventyConfig) {
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });
  eleventyConfig.addDataExtension("yaml", (contents) => yaml.load(contents));

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      data: "_data",
    },
  };
};
```

- [ ] **Step 5: Create `src/_data/site.yaml`**

```yaml
title: "MAGTECH — Henrik Magnusson | Management Consulting"
companyName: "MAGTECH Sweden AB"
tagline: "Management Consulting"
contactEmail: "ceo@magtech.se"
formspreeEndpoint: "https://formspree.io/f/mojbldlz"
linkedinUrl: "https://www.linkedin.com/company/magtech-sweden-ab"
copyrightYear: 2026
location: "Uppsala, Sweden"
nav:
  - label: "Sectors"
    href: "#sectors"
  - label: "Services"
    href: "#services"
  - label: "Experience"
    href: "#experience"
  - label: "About"
    href: "#about"
  - label: "Get in touch"
    href: "#contact"
    cta: true
footerLinks:
  - label: "Sectors"
    href: "#sectors"
  - label: "Services"
    href: "#services"
  - label: "Experience"
    href: "#experience"
  - label: "About"
    href: "#about"
  - label: "Contact"
    href: "#contact"
  - label: "LinkedIn"
    href: "https://www.linkedin.com/company/magtech-sweden-ab"
    external: true
  - label: "ceo@magtech.se"
    href: "mailto:ceo@magtech.se"
```

- [ ] **Step 6: Create `src/_data/bundledCss.js`**

```js
const fs = require("fs");
const path = require("path");

const CSS_DIR = path.join(__dirname, "..", "assets", "css");

module.exports = () =>
  fs
    .readdirSync(CSS_DIR)
    .filter((file) => file.endsWith(".css"))
    .sort()
    .map((file) => fs.readFileSync(path.join(CSS_DIR, file), "utf8"))
    .join("\n\n");
```

- [ ] **Step 7: Create `src/_data/mainJs.js`**

```js
const fs = require("fs");
const path = require("path");

module.exports = () =>
  fs.readFileSync(path.join(__dirname, "..", "assets", "js", "main.js"), "utf8");
```

- [ ] **Step 8: Create `src/assets/css/00-tokens.css`**

```css
:root {
  --blue: #434BE7;
  --blue-dark: #2D34C0;
  --blue-light: #6B72ED;
  --blue-faint: #EEF0FD;
  --black: #0D0D12;
  --gray-900: #1A1A24;
  --gray-600: #5A5A72;
  --gray-300: #C4C4D4;
  --gray-100: #F4F4F8;
  --white: #FFFFFF;
  --radius: 16px;
  --radius-sm: 8px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'DM Sans', sans-serif;
  background: var(--white);
  color: var(--black);
  line-height: 1.6;
  overflow-x: hidden;
}
```

- [ ] **Step 9: Create `src/assets/css/01-nav.css`**

```css
nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5vw;
  height: 72px;
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(67,75,231,0.08);
  transition: box-shadow 0.3s;
}
nav.scrolled { box-shadow: 0 4px 32px rgba(67,75,231,0.10); }
.nav-logo svg { height: 26px; width: auto; display: block; }
.nav-links { display: flex; gap: 36px; list-style: none; }
.nav-links a {
  text-decoration: none;
  color: var(--gray-600);
  font-size: 0.92rem;
  font-weight: 400;
  letter-spacing: 0.03em;
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--blue); }
.nav-cta {
  background: var(--blue);
  color: var(--white) !important;
  padding: 10px 22px;
  border-radius: 100px;
  font-weight: 500 !important;
  transition: background 0.2s, transform 0.2s !important;
}
.nav-cta:hover { background: var(--blue-dark) !important; transform: translateY(-1px); }
```

- [ ] **Step 10: Create `src/assets/css/09-footer.css`**

```css
footer {
  background: var(--black);
  color: rgba(255,255,255,0.4);
  padding: 48px 5vw;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
}
.footer-logo svg { height: 22px; width: auto; }
.footer-links { display: flex; gap: 28px; list-style: none; }
.footer-links a {
  color: rgba(255,255,255,0.35);
  text-decoration: none;
  font-size: 0.82rem;
  transition: color 0.2s;
}
.footer-links a:hover { color: var(--blue-light); }
.footer-copy { font-size: 0.78rem; }
```

- [ ] **Step 11: Create `src/assets/css/10-animations.css`**

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes scrollPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
.reveal.visible { opacity: 1; transform: none; }
```

- [ ] **Step 12: Create `src/assets/css/99-mobile.css`**

```css
@media (max-width: 900px) {
  .nav-links { display: none; }
  .hero-sectors { display: none; }
  .sectors-grid { grid-template-columns: 1fr; }
  .sector-card { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .services-grid { grid-template-columns: 1fr; }
  .about-grid { grid-template-columns: 1fr; gap: 48px; }
  .about-visual { height: 280px; }
  .timeline::before { left: 100px; }
  .tl-item { grid-template-columns: 100px 1fr; gap: 0 24px; }
  .tl-item::before { left: 94px; }
  .tl-meta { padding-right: 0; }
  .about-stats { grid-template-columns: 1fr 1fr; }
  .form-row { grid-template-columns: 1fr; }
  footer { flex-direction: column; align-items: flex-start; }
}
```

- [ ] **Step 13: Create `src/assets/js/main.js`**

```js
// Nav scroll shadow
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 100);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
reveals.forEach(el => observer.observe(el));
```

- [ ] **Step 14: Create `src/_includes/partials/svg/logo.njk`**

```html
<svg style="display:none">
  <symbol id="logo-blue" viewBox="575 383.8205 380 62.3589">
    <style>.lb-i{fill:#434BE7;}.lb-t{fill:#434BE7;}</style>
    <g transform="rotate(0 575 383.8205)">
      <svg width="95.6132" height="62.3589" x="575" y="383.8205" viewBox="16.429 28.96 67.004 43.7">
        <g class="lb-i"><path fill-rule="evenodd" clip-rule="evenodd" d="M73.232,28.96c-5.631,0-10.194,4.567-10.194,10.197c0,8.74-4.368,13.108-13.11,13.108c-8.737,0-13.111-4.369-13.111-13.108c0-5.63-4.563-10.197-10.194-10.197s-10.194,4.567-10.194,10.197c0,5.631,4.563,10.198,10.194,10.198c8.742,0,13.111,4.369,13.111,13.111c0,5.631,4.563,10.194,10.195,10.194c5.63,0,10.2-4.563,10.2-10.194c0-8.742,4.368-13.111,13.104-13.111c5.637,0,10.2-4.567,10.2-10.198C83.433,33.527,78.869,28.96,73.232,28.96z"/></g>
      </svg>
    </g>
    <g transform="rotate(0 687.2423 394.2136)">
      <svg width="267.7577" height="41.5727" x="687.2423" y="394.2136" viewBox="4 -31.64 206.36 32.04">
        <g class="lb-t"><path d="M34.08-31.24Q34.60-31.24 34.92-30.90Q35.24-30.56 35.24-30.04L35.24-30.04L35.24-1.20Q35.24-0.68 34.92-0.34Q34.60 0 34.08 0L34.08 0Q33.56 0 33.20-0.34Q32.84-0.68 32.84-1.20L32.84-1.20L32.84-25.72L20.68-0.96Q20.40-0.40 19.64-0.40L19.64-0.40Q18.92-0.40 18.52-1.16L18.52-1.16L6.40-25.36L6.40-1.20Q6.40-0.68 6.06-0.34Q5.72 0 5.20 0L5.20 0Q4.68 0 4.34-0.34Q4-0.68 4-1.20L4-1.20L4-30.04Q4-30.56 4.34-30.90Q4.68-31.24 5.20-31.24L5.20-31.24Q6-31.24 6.28-30.64L6.28-30.64L19.72-4.08L33-30.64Q33.36-31.24 34.08-31.24L34.08-31.24Z M66.72-1.72Q66.84-1.48 66.84-1.20L66.84-1.20Q66.84-0.72 66.48-0.36Q66.12 0 65.64 0L65.64 0Q64.84 0 64.52-0.76L64.52-0.76L61.56-7.84L45.28-7.84L42.32-0.76Q42.04 0 41.20 0L41.20 0Q40.64 0 40.32-0.36Q40-0.72 40-1.20L40-1.20Q40-1.48 40.12-1.72L40.12-1.72L52.24-30.40Q52.56-31.24 53.40-31.24L53.40-31.24Q54.20-31.24 54.56-30.40L54.56-30.40L66.72-1.72ZM46.20-10L60.64-10L53.40-27.28L46.20-10Z M93.52-15.20Q94.04-15.20 94.38-14.88Q94.72-14.56 94.72-14.04L94.72-14.04L94.72-3.88Q94.72-3.60 94.68-3.42Q94.64-3.24 94.44-3.04L94.44-3.04Q91 0.40 84.60 0.40L84.60 0.40Q80.40 0.40 76.80-1.78Q73.20-3.96 71.08-7.66Q68.96-11.36 68.96-15.64L68.96-15.64Q68.96-19.92 71.06-23.60Q73.16-27.28 76.74-29.46Q80.32-31.64 84.60-31.64L84.60-31.64Q90.20-31.64 94.48-28.08L94.48-28.08Q94.84-27.80 94.84-27.28L94.84-27.28Q94.84-26.80 94.52-26.42Q94.20-26.04 93.64-26.04L93.64-26.04Q93.20-26.04 92.64-26.52L92.64-26.52Q89.60-29.24 84.60-29.24L84.60-29.24Q81.08-29.24 78.02-27.36Q74.96-25.48 73.16-22.34Q71.36-19.20 71.36-15.64L71.36-15.64Q71.36-11.96 73.14-8.82Q74.92-5.68 77.98-3.84Q81.04-2 84.60-2L84.60-2Q88.96-2 92.32-4.48L92.32-4.48L92.32-13.04L85.60-13.04Q85.08-13.04 84.74-13.36Q84.40-13.68 84.40-14.16L84.40-14.16Q84.40-14.60 84.74-14.90Q85.08-15.20 85.60-15.20L85.60-15.20L93.52-15.20Z M121.56-31.24Q122.04-31.24 122.34-30.94Q122.64-30.64 122.64-30.16L122.64-30.16Q122.64-29.68 122.34-29.38Q122.04-29.08 121.56-29.08L121.56-29.08L111.44-29.08L111.44-1.20Q111.44-0.68 111.10-0.34Q110.76 0 110.24 0L110.24 0Q109.72 0 109.38-0.34Q109.04-0.68 109.04-1.20L109.04-1.20L109.04-29.08L98.92-29.08Q98.44-29.08 98.14-29.38Q97.84-29.68 97.84-30.16L97.84-30.16Q97.84-30.64 98.14-30.94Q98.44-31.24 98.92-31.24L98.92-31.24L121.56-31.24Z M147.68-2.40Q148.16-2.40 148.52-2.04Q148.88-1.68 148.88-1.20L148.88-1.20Q148.88-0.68 148.52-0.34Q148.16 0 147.68 0L147.68 0L128.44 0Q127.92 0 127.58-0.34Q127.24-0.68 127.24-1.20L127.24-1.20L127.24-30.04Q127.24-30.56 127.58-30.90Q127.92-31.24 128.44-31.24L128.44-31.24L147.68-31.24Q148.16-31.24 148.52-30.90Q148.88-30.56 148.88-30.04L148.88-30.04Q148.88-29.56 148.52-29.20Q148.16-28.84 147.68-28.84L147.68-28.84L129.64-28.84L129.64-16.84L142.88-16.84Q143.40-16.84 143.74-16.50Q144.08-16.16 144.08-15.64L144.08-15.64Q144.08-15.12 143.74-14.76Q143.40-14.40 142.88-14.40L142.88-14.40L129.64-14.40L129.64-2.40L147.68-2.40Z M168.72-31.64Q174.32-31.64 178.60-28.08L178.60-28.08Q178.96-27.80 178.96-27.28L178.96-27.28Q178.96-26.80 178.64-26.42Q178.32-26.04 177.76-26.04L177.76-26.04Q177.32-26.04 176.76-26.52L176.76-26.52Q173.72-29.24 168.72-29.24L168.72-29.24Q165.20-29.24 162.14-27.36Q159.08-25.48 157.28-22.34Q155.48-19.20 155.48-15.64L155.48-15.64Q155.48-11.96 157.26-8.82Q159.04-5.68 162.10-3.84Q165.16-2 168.72-2L168.72-2Q173.44-2 177-4.92L177-4.92Q177.28-5.12 177.60-5.12L177.60-5.12Q178.08-5.12 178.46-4.76Q178.84-4.40 178.84-3.88L178.84-3.88Q178.84-3.36 178.56-3.04L178.56-3.04Q175.12 0.40 168.72 0.40L168.72 0.40Q164.52 0.40 160.92-1.78Q157.32-3.96 155.20-7.66Q153.08-11.36 153.08-15.64L153.08-15.64Q153.08-19.92 155.18-23.60Q157.28-27.28 160.86-29.46Q164.44-31.64 168.72-31.64L168.72-31.64Z M207.96-30.04Q207.96-30.56 208.30-30.90Q208.64-31.24 209.16-31.24L209.16-31.24Q209.64-31.24 210-30.90Q210.36-30.56 210.36-30.04L210.36-30.04L210.36-1.20Q210.36-0.68 210-0.34Q209.64 0 209.16 0L209.16 0Q208.64 0 208.30-0.34Q207.96-0.68 207.96-1.20L207.96-1.20L207.96-14.68L187.76-14.68L187.76-1.20Q187.76-0.68 187.42-0.34Q187.08 0 186.56 0L186.56 0Q186.04 0 185.70-0.34Q185.36-0.68 185.36-1.20L185.36-1.20L185.36-30.04Q185.36-30.56 185.70-30.90Q186.04-31.24 186.56-31.24L186.56-31.24Q187.08-31.24 187.42-30.90Q187.76-30.56 187.76-30.04L187.76-30.04L187.76-16.84L207.96-16.84L207.96-30.04Z"/></g>
      </svg>
    </g>
  </symbol>

  <symbol id="logo-white" viewBox="575 383.8205 380 62.3589">
    <style>.lw-i{fill:rgba(255,255,255,0.65);}.lw-t{fill:rgba(255,255,255,0.65);}</style>
    <g transform="rotate(0 575 383.8205)">
      <svg width="95.6132" height="62.3589" x="575" y="383.8205" viewBox="16.429 28.96 67.004 43.7">
        <g class="lw-i"><path fill-rule="evenodd" clip-rule="evenodd" d="M73.232,28.96c-5.631,0-10.194,4.567-10.194,10.197c0,8.74-4.368,13.108-13.11,13.108c-8.737,0-13.111-4.369-13.111-13.108c0-5.63-4.563-10.197-10.194-10.197s-10.194,4.567-10.194,10.197c0,5.631,4.563,10.198,10.194,10.198c8.742,0,13.111,4.369,13.111,13.111c0,5.631,4.563,10.194,10.195,10.194c5.63,0,10.2-4.563,10.2-10.194c0-8.742,4.368-13.111,13.104-13.111c5.637,0,10.2-4.567,10.2-10.198C83.433,33.527,78.869,28.96,73.232,28.96z"/></g>
      </svg>
    </g>
    <g transform="rotate(0 687.2423 394.2136)">
      <svg width="267.7577" height="41.5727" x="687.2423" y="394.2136" viewBox="4 -31.64 206.36 32.04">
        <g class="lw-t"><path d="M34.08-31.24Q34.60-31.24 34.92-30.90Q35.24-30.56 35.24-30.04L35.24-30.04L35.24-1.20Q35.24-0.68 34.92-0.34Q34.60 0 34.08 0L34.08 0Q33.56 0 33.20-0.34Q32.84-0.68 32.84-1.20L32.84-1.20L32.84-25.72L20.68-0.96Q20.40-0.40 19.64-0.40L19.64-0.40Q18.92-0.40 18.52-1.16L18.52-1.16L6.40-25.36L6.40-1.20Q6.40-0.68 6.06-0.34Q5.72 0 5.20 0L5.20 0Q4.68 0 4.34-0.34Q4-0.68 4-1.20L4-1.20L4-30.04Q4-30.56 4.34-30.90Q4.68-31.24 5.20-31.24L5.20-31.24Q6-31.24 6.28-30.64L6.28-30.64L19.72-4.08L33-30.64Q33.36-31.24 34.08-31.24L34.08-31.24Z M66.72-1.72Q66.84-1.48 66.84-1.20L66.84-1.20Q66.84-0.72 66.48-0.36Q66.12 0 65.64 0L65.64 0Q64.84 0 64.52-0.76L64.52-0.76L61.56-7.84L45.28-7.84L42.32-0.76Q42.04 0 41.20 0L41.20 0Q40.64 0 40.32-0.36Q40-0.72 40-1.20L40-1.20Q40-1.48 40.12-1.72L40.12-1.72L52.24-30.40Q52.56-31.24 53.40-31.24L53.40-31.24Q54.20-31.24 54.56-30.40L54.56-30.40L66.72-1.72ZM46.20-10L60.64-10L53.40-27.28L46.20-10Z M93.52-15.20Q94.04-15.20 94.38-14.88Q94.72-14.56 94.72-14.04L94.72-14.04L94.72-3.88Q94.72-3.60 94.68-3.42Q94.64-3.24 94.44-3.04L94.44-3.04Q91 0.40 84.60 0.40L84.60 0.40Q80.40 0.40 76.80-1.78Q73.20-3.96 71.08-7.66Q68.96-11.36 68.96-15.64L68.96-15.64Q68.96-19.92 71.06-23.60Q73.16-27.28 76.74-29.46Q80.32-31.64 84.60-31.64L84.60-31.64Q90.20-31.64 94.48-28.08L94.48-28.08Q94.84-27.80 94.84-27.28L94.84-27.28Q94.84-26.80 94.52-26.42Q94.20-26.04 93.64-26.04L93.64-26.04Q93.20-26.04 92.64-26.52L92.64-26.52Q89.60-29.24 84.60-29.24L84.60-29.24Q81.08-29.24 78.02-27.36Q74.96-25.48 73.16-22.34Q71.36-19.20 71.36-15.64L71.36-15.64Q71.36-11.96 73.14-8.82Q74.92-5.68 77.98-3.84Q81.04-2 84.60-2L84.60-2Q88.96-2 92.32-4.48L92.32-4.48L92.32-13.04L85.60-13.04Q85.08-13.04 84.74-13.36Q84.40-13.68 84.40-14.16L84.40-14.16Q84.40-14.60 84.74-14.90Q85.08-15.20 85.60-15.20L85.60-15.20L93.52-15.20Z M121.56-31.24Q122.04-31.24 122.34-30.94Q122.64-30.64 122.64-30.16L122.64-30.16Q122.64-29.68 122.34-29.38Q122.04-29.08 121.56-29.08L121.56-29.08L111.44-29.08L111.44-1.20Q111.44-0.68 111.10-0.34Q110.76 0 110.24 0L110.24 0Q109.72 0 109.38-0.34Q109.04-0.68 109.04-1.20L109.04-1.20L109.04-29.08L98.92-29.08Q98.44-29.08 98.14-29.38Q97.84-29.68 97.84-30.16L97.84-30.16Q97.84-30.64 98.14-30.94Q98.44-31.24 98.92-31.24L98.92-31.24L121.56-31.24Z M147.68-2.40Q148.16-2.40 148.52-2.04Q148.88-1.68 148.88-1.20L148.88-1.20Q148.88-0.68 148.52-0.34Q148.16 0 147.68 0L147.68 0L128.44 0Q127.92 0 127.58-0.34Q127.24-0.68 127.24-1.20L127.24-1.20L127.24-30.04Q127.24-30.56 127.58-30.90Q127.92-31.24 128.44-31.24L128.44-31.24L147.68-31.24Q148.16-31.24 148.52-30.90Q148.88-30.56 148.88-30.04L148.88-30.04Q148.88-29.56 148.52-29.20Q148.16-28.84 147.68-28.84L147.68-28.84L129.64-28.84L129.64-16.84L142.88-16.84Q143.40-16.84 143.74-16.50Q144.08-16.16 144.08-15.64L144.08-15.64Q144.08-15.12 143.74-14.76Q143.40-14.40 142.88-14.40L142.88-14.40L129.64-14.40L129.64-2.40L147.68-2.40Z M168.72-31.64Q174.32-31.64 178.60-28.08L178.60-28.08Q178.96-27.80 178.96-27.28L178.96-27.28Q178.96-26.80 178.64-26.42Q178.32-26.04 177.76-26.04L177.76-26.04Q177.32-26.04 176.76-26.52L176.76-26.52Q173.72-29.24 168.72-29.24L168.72-29.24Q165.20-29.24 162.14-27.36Q159.08-25.48 157.28-22.34Q155.48-19.20 155.48-15.64L155.48-15.64Q155.48-11.96 157.26-8.82Q159.04-5.68 162.10-3.84Q165.16-2 168.72-2L168.72-2Q173.44-2 177-4.92L177-4.92Q177.28-5.12 177.60-5.12L177.60-5.12Q178.08-5.12 178.46-4.76Q178.84-4.40 178.84-3.88L178.84-3.88Q178.84-3.36 178.56-3.04L178.56-3.04Q175.12 0.40 168.72 0.40L168.72 0.40Q164.52 0.40 160.92-1.78Q157.32-3.96 155.20-7.66Q153.08-11.36 153.08-15.64L153.08-15.64Q153.08-19.92 155.18-23.60Q157.28-27.28 160.86-29.46Q164.44-31.64 168.72-31.64L168.72-31.64Z M207.96-30.04Q207.96-30.56 208.30-30.90Q208.64-31.24 209.16-31.24L209.16-31.24Q209.64-31.24 210-30.90Q210.36-30.56 210.36-30.04L210.36-30.04L210.36-1.20Q210.36-0.68 210-0.34Q209.64 0 209.16 0L209.16 0Q208.64 0 208.30-0.34Q207.96-0.68 207.96-1.20L207.96-1.20L207.96-14.68L187.76-14.68L187.76-1.20Q187.76-0.68 187.42-0.34Q187.08 0 186.56 0L186.56 0Q186.04 0 185.70-0.34Q185.36-0.68 185.36-1.20L185.36-1.20L185.36-30.04Q185.36-30.56 185.70-30.90Q186.04-31.24 186.56-31.24L186.56-31.24Q187.08-31.24 187.42-30.90Q187.76-30.56 187.76-30.04L187.76-30.04L187.76-16.84L207.96-16.84L207.96-30.04Z"/></g>
      </svg>
    </g>
  </symbol>
</svg>
```

- [ ] **Step 15: Create `src/_includes/partials/nav.njk`**

```html
<nav id="main-nav">
  <a href="#hero" class="nav-logo">
    <svg><use href="#logo-blue"/></svg>
  </a>
  <ul class="nav-links">
    {% for link in site.nav %}
    <li><a href="{{ link.href }}"{% if link.cta %} class="nav-cta"{% endif %}>{{ link.label }}</a></li>
    {% endfor %}
  </ul>
</nav>
```

- [ ] **Step 16: Create `src/_includes/partials/footer.njk`**

```html
<footer>
  <a href="#hero" class="footer-logo">
    <svg><use href="#logo-white"/></svg>
  </a>
  <ul class="footer-links">
    {% for link in site.footerLinks %}
    <li><a href="{{ link.href }}"{% if link.external %} target="_blank" rel="noopener"{% endif %}>{{ link.label }}</a></li>
    {% endfor %}
  </ul>
  <span class="footer-copy">© {{ site.copyrightYear }} {{ site.companyName }}. {{ site.location }}.</span>
</footer>
```

- [ ] **Step 17: Create `src/_includes/layouts/base.njk`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ site.title }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet">
<style>
{{ bundledCss | safe }}
</style>
</head>
<body>

{% include "partials/svg/logo.njk" %}

{% include "partials/nav.njk" %}

{{ content | safe }}

{% include "partials/footer.njk" %}

<script>
{{ mainJs | safe }}
</script>
</body>
</html>
```

- [ ] **Step 18: Create `src/index.njk`**

```
---
layout: layouts/base.njk
---
```

- [ ] **Step 19: Build and verify**

Run: `npm run build`
Expected: `dist/index.html` is created with no errors.

Run: `grep -c 'id="main-nav"' dist/index.html && grep -c '<footer>' dist/index.html && grep -c 'MAGTECH Sweden AB' dist/index.html && grep -c '@media (max-width: 900px)' dist/index.html && grep -c '.reveal.visible' dist/index.html`
Expected: each grep returns `1` (found).

- [ ] **Step 20: Commit**

```bash
git add package.json package-lock.json .gitignore .eleventy.js src/
git commit -m "feat: scaffold Eleventy site with base layout, nav, footer"
```

---

### Task 2: Hero section + shared sectors data

**Files:**
- Create: `src/_data/sectors.yaml`
- Create: `src/assets/css/02-hero.css`
- Create: `src/_includes/partials/hero.njk`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: `site.tagline` (from Task 1's `site.yaml`).
- Produces: global Eleventy data `sectors` — a list of `{id, icon, name, badgeSub, title, description, tags}`. Tasks 3 (sectors section) and 7 (contact form sector `<select>`) both consume this same list (`sector.name`, `sector.title`, `sector.icon`, `sector.description`, `sector.tags`).

- [ ] **Step 1: Create `src/_data/sectors.yaml`**

```yaml
- id: defence
  icon: "🛡️"
  name: "Defence"
  badgeSub: "Complex systems & programmes"
  title: "Defence"
  description: "Supporting defence programmes that demand rigorous requirements management, verified test processes, and delivery under strict governance. Our consultants understand the operational realities of complex defence systems and the accountability that comes with them."
  tags:
    - "Systems acquisition"
    - "Programme governance"
    - "Requirements traceability"
- id: telecom
  icon: "📡"
  name: "Telecommunications"
  badgeSub: "Network & platform delivery"
  title: "Telecommunications"
  description: "From network infrastructure rollouts to platform modernisation, MAGTECH supports telecoms organisations managing large-scale technical programmes across multiple stakeholders, suppliers, and regulatory environments."
  tags:
    - "Infrastructure delivery"
    - "Supplier management"
    - "Network transformation"
- id: space
  icon: "🛰️"
  name: "Space"
  badgeSub: "Systems engineering & ops"
  title: "Space"
  description: "Space programmes are among the most demanding engineering endeavours on earth. We bring structured project management and systems engineering discipline to organisations developing, launching, and operating space-based assets."
  tags:
    - "Mission planning"
    - "Systems engineering"
    - "Operations readiness"
```

- [ ] **Step 2: Create `src/assets/css/02-hero.css`**

```css
#hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 120px 5vw 80px;
  position: relative;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.hero-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(67,75,231,0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(67,75,231,0.055) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
}
.hero-bg::after {
  content: '';
  position: absolute;
  top: -200px; right: -200px;
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(67,75,231,0.10) 0%, transparent 70%);
  border-radius: 50%;
}
.hero-orb2 {
  position: absolute;
  bottom: -150px; left: 10%;
  width: 500px; height: 500px;
  background: radial-gradient(circle, rgba(107,114,237,0.07) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
.hero-content {
  position: relative;
  z-index: 1;
  max-width: 780px;
}
.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 0.76rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--blue);
  background: var(--blue-faint);
  padding: 6px 14px;
  border-radius: 100px;
  margin-bottom: 32px;
  opacity: 0;
  animation: fadeUp 0.7s ease 0.1s forwards;
}
.hero-eyebrow::before {
  content: '';
  width: 6px; height: 6px;
  background: var(--blue);
  border-radius: 50%;
}
.hero-title {
  font-size: clamp(2.8rem, 5.5vw, 4.8rem);
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--black);
  margin-bottom: 28px;
  opacity: 0;
  animation: fadeUp 0.8s ease 0.25s forwards;
}
.hero-title em { font-style: italic; color: var(--blue); font-weight: 300; }
.hero-sub {
  font-size: 1.1rem;
  color: var(--gray-600);
  font-weight: 300;
  max-width: 540px;
  line-height: 1.8;
  margin-bottom: 48px;
  opacity: 0;
  animation: fadeUp 0.8s ease 0.4s forwards;
}
.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  opacity: 0;
  animation: fadeUp 0.8s ease 0.55s forwards;
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--blue);
  color: var(--white);
  text-decoration: none;
  padding: 16px 32px;
  border-radius: 100px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 24px rgba(67,75,231,0.28);
  border: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}
.btn-primary:hover { background: var(--blue-dark); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(67,75,231,0.36); }
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: var(--black);
  text-decoration: none;
  padding: 16px 28px;
  border-radius: 100px;
  font-size: 0.95rem;
  font-weight: 400;
  border: 1.5px solid var(--gray-300);
  transition: border-color 0.2s, color 0.2s, transform 0.2s;
}
.btn-secondary:hover { border-color: var(--blue); color: var(--blue); transform: translateY(-2px); }

.hero-sectors {
  position: absolute;
  right: 5vw;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 1;
  opacity: 0;
  animation: fadeUp 0.8s ease 0.7s forwards;
}
.sector-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--white);
  border: 1px solid rgba(67,75,231,0.12);
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  min-width: 200px;
}
.sector-icon {
  width: 36px; height: 36px;
  background: var(--blue-faint);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}
.sector-name {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--black);
}
.sector-sub {
  font-size: 0.74rem;
  color: var(--gray-600);
  font-weight: 300;
}

.scroll-hint {
  position: absolute;
  bottom: 36px; left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--gray-300);
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  z-index: 1;
  opacity: 0;
  animation: fadeUp 1s ease 1s forwards;
}
.scroll-line {
  width: 1px; height: 40px;
  background: linear-gradient(to bottom, var(--blue), transparent);
  animation: scrollPulse 1.8s ease-in-out infinite;
}
```

- [ ] **Step 3: Create `src/_includes/partials/hero.njk`**

```html
<section id="hero">
  <div class="hero-bg"><div class="hero-orb2"></div></div>

  <div class="hero-content">
    <span class="hero-eyebrow">{{ site.tagline }}</span>
    <h1 class="hero-title">
      Senior consulting for<br>
      <em>mission-critical</em><br>
      programmes
    </h1>
    <p class="hero-sub">
      MAGTECH is led by Henrik Magnusson — a senior executive with 20+ years of hands-on leadership in space, defence, and telecommunications, including programmes with ESA, NASA, and the Swedish Armed Forces.
    </p>
    <div class="hero-actions">
      <a href="#services" class="btn-primary">
        Our services
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <a href="#contact" class="btn-secondary">Start a conversation</a>
    </div>
  </div>

  <div class="hero-sectors">
    {% for sector in sectors %}
    <div class="sector-badge">
      <div class="sector-icon">{{ sector.icon }}</div>
      <div>
        <div class="sector-name">{{ sector.name }}</div>
        <div class="sector-sub">{{ sector.badgeSub }}</div>
      </div>
    </div>
    {% endfor %}
  </div>

  <div class="scroll-hint">
    <div class="scroll-line"></div>
    <span>Scroll</span>
  </div>
</section>
```

- [ ] **Step 4: Add hero include to `src/index.njk`**

```
---
layout: layouts/base.njk
---
{% include "partials/hero.njk" %}
```

- [ ] **Step 5: Build and verify**

Run: `npm run build && grep -c 'mission-critical' dist/index.html && grep -c 'Start a conversation' dist/index.html && grep -c 'Complex systems &amp; programmes' dist/index.html`
Expected: each returns `1`.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add hero section and shared sectors data"
```

---

### Task 3: Sectors section

**Files:**
- Create: `src/assets/css/03-sectors.css`
- Create: `src/_includes/partials/sectors.njk`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: global `sectors` data (from Task 2) — uses `sector.icon`, `sector.title`, `sector.description`, `sector.tags`.
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Create `src/assets/css/03-sectors.css`**

```css
#sectors {
  padding: 120px 5vw;
  background: var(--black);
  color: var(--white);
  position: relative;
  overflow: hidden;
}
#sectors::before {
  content: '';
  position: absolute;
  top: -300px; right: -300px;
  width: 800px; height: 800px;
  background: radial-gradient(circle, rgba(67,75,231,0.13) 0%, transparent 65%);
  pointer-events: none;
}
.sectors-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  margin-top: 64px;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: var(--radius);
  overflow: hidden;
}
.sector-card {
  padding: 52px 44px;
  background: rgba(255,255,255,0.03);
  border-right: 1px solid rgba(255,255,255,0.06);
  transition: background 0.3s;
  position: relative;
  overflow: hidden;
}
.sector-card:last-child { border-right: none; }
.sector-card:hover { background: rgba(67,75,231,0.08); }
.sector-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--blue), var(--blue-light));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}
.sector-card:hover::before { transform: scaleX(1); }
.sector-card-icon {
  font-size: 2.4rem;
  margin-bottom: 28px;
  display: block;
}
.sector-card-title {
  font-size: 1.3rem;
  font-weight: 400;
  color: var(--white);
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}
.sector-card-desc {
  font-size: 0.88rem;
  color: rgba(255,255,255,0.45);
  font-weight: 300;
  line-height: 1.8;
}
.sector-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
}
.sector-tag {
  font-family: 'DM Mono', monospace;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--blue-light);
  background: rgba(67,75,231,0.15);
  padding: 4px 10px;
  border-radius: 100px;
}
```

- [ ] **Step 2: Create `src/_includes/partials/sectors.njk`**

```html
<section id="sectors">
  <div style="position:relative;z-index:1;">
    <div class="section-header reveal">
      <span class="section-eyebrow" style="color:var(--blue-light)">Where we operate</span>
      <h2 class="section-title section-title-white">Three sectors.<br><em style="color:var(--blue-light)">Deep expertise.</em></h2>
    </div>

    <div class="sectors-grid reveal">
      {% for sector in sectors %}
      <div class="sector-card">
        <span class="sector-card-icon">{{ sector.icon }}</span>
        <h3 class="sector-card-title">{{ sector.title }}</h3>
        <p class="sector-card-desc">
          {{ sector.description }}
        </p>
        <div class="sector-card-tags">
          {% for tag in sector.tags %}
          <span class="sector-tag">{{ tag }}</span>
          {% endfor %}
        </div>
      </div>
      {% endfor %}
    </div>
  </div>
</section>
```

Note: `.section-header` and `.section-eyebrow` and `.section-title` classes are shared across sections (sectors/services/about all use them) but were never split into their own CSS file in the original — they live inline within each section's comment block in `index.html` (e.g. `.section-header` etc. are actually defined once, under `/* ── SERVICES ── */` at `index.html:356-374`, and reused by sectors/about even though defined in the services block). To preserve the original cascade without duplicating rules, these shared classes are defined once in `04-services.css` (Task 4) since that matches their original location — `sectors.njk` and `about.njk` depend on `04-services.css` being loaded for their section-header styling to render correctly. This is called out explicitly in Task 4's Interfaces and in Task 8's verification.

- [ ] **Step 3: Add sectors include to `src/index.njk`**

```
---
layout: layouts/base.njk
---
{% include "partials/hero.njk" %}
{% include "partials/sectors.njk" %}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build && grep -c 'sector-card-title">Defence' dist/index.html && grep -c 'Mission planning' dist/index.html`
Expected: each returns `1`. Note: `.section-header`/`.section-title` styling will look unstyled until Task 4 lands `04-services.css` — this is expected and corrected there.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: add sectors section"
```

---

### Task 4: Services section (and shared section-header styles)

**Files:**
- Create: `src/_data/services.yaml`
- Create: `src/assets/css/04-services.css`
- Create: `src/_includes/partials/services.njk`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: nothing new.
- Produces: global Eleventy data `services` — list of `{icon, title, description}`. Consumed by Task 7 (contact form service `<select>`). `04-services.css` also produces the shared `.section-header`, `.section-eyebrow`, `.section-title`, `.section-title em`, `.section-title-white` rules used by `sectors.njk` (Task 3) and `about.njk` (Task 6) — this matches the original file, where these shared rules live under the `/* ── SERVICES ── */` block (`index.html:356-374`).

- [ ] **Step 1: Create `src/_data/services.yaml`**

```yaml
- icon: "📋"
  title: "Project Management"
  description: "We lead and support complex technical programmes from initiation through delivery. Our project managers bring structure, risk awareness, and stakeholder discipline to environments where schedule and cost overruns have real consequences. We work within established frameworks — including PRINCE2, PMP, and agile-hybrid approaches — adapting to the client's context."
- icon: "🏭"
  title: "Production Management"
  description: "For programmes with a production or manufacturing dimension, MAGTECH provides experienced consultants who understand the interplay between engineering design, supply chain, quality assurance, and schedule. We help organisations build and sustain production capability for high-value, low-volume systems."
- icon: "📐"
  title: "Requirements Management"
  description: "Poor requirements are the root cause of most project failures. We establish and manage requirements processes that create clear traceability from customer need to delivered capability — reducing rework, managing change effectively, and providing the foundation for rigorous verification and validation."
- icon: "✅"
  title: "Test-Driven Development"
  description: "In safety-critical and regulated environments, verification cannot be an afterthought. Our consultants embed test thinking early in development — defining acceptance criteria before implementation, building traceable test cases from requirements, and ensuring that what is delivered can be proven to meet its specification."
```

- [ ] **Step 2: Create `src/assets/css/04-services.css`**

```css
#services {
  padding: 120px 5vw;
  background: var(--gray-100);
}
.section-header { margin-bottom: 64px; }
.section-eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--blue);
  margin-bottom: 16px;
  display: block;
}
.section-title {
  font-size: clamp(2rem, 3.5vw, 2.8rem);
  font-weight: 300;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--black);
}
.section-title em { font-style: italic; color: var(--blue); }
.section-title-white { color: var(--white); }

.services-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}
.service-card {
  background: var(--white);
  border-radius: var(--radius);
  padding: 44px 40px;
  border: 1px solid transparent;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
  position: relative;
  overflow: hidden;
}
.service-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--blue), var(--blue-light));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}
.service-card:hover::before { transform: scaleX(1); }
.service-card:hover {
  border-color: rgba(67,75,231,0.15);
  box-shadow: 0 16px 48px rgba(67,75,231,0.10);
  transform: translateY(-4px);
}
.service-icon {
  width: 52px; height: 52px;
  background: var(--blue-faint);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  margin-bottom: 28px;
}
.service-title {
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--black);
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}
.service-desc {
  font-size: 0.9rem;
  color: var(--gray-600);
  line-height: 1.75;
  font-weight: 300;
}
```

- [ ] **Step 3: Create `src/_includes/partials/services.njk`**

```html
<section id="services">
  <div class="section-header reveal">
    <span class="section-eyebrow">What we deliver</span>
    <h2 class="section-title">Four disciplines.<br><em>Proven in the field.</em></h2>
  </div>

  <div class="services-grid">
    {% for service in services %}
    <div class="service-card reveal">
      <div class="service-icon">{{ service.icon }}</div>
      <h3 class="service-title">{{ service.title }}</h3>
      <p class="service-desc">
        {{ service.description }}
      </p>
    </div>
    {% endfor %}
  </div>
</section>
```

- [ ] **Step 4: Add services include to `src/index.njk`**

```
---
layout: layouts/base.njk
---
{% include "partials/hero.njk" %}
{% include "partials/sectors.njk" %}
{% include "partials/services.njk" %}
```

- [ ] **Step 5: Build and verify**

Run: `npm run build && grep -c 'Requirements Management' dist/index.html && grep -c 'Test-Driven Development' dist/index.html && grep -c 'class="section-eyebrow"' dist/index.html`
Expected: first two return `1`. Third returns `2` — one `.section-eyebrow` from the sectors section (Task 3) and one from the services section just added; this count grows by one in each later task that adds a section using `.section-eyebrow` (experience, about, contact).

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add services section and shared section-header styles"
```

---

### Task 5: Experience / career timeline section

**Files:**
- Create: `src/_data/timeline.yaml`
- Create: `src/assets/css/05-timeline.css`
- Create: `src/_includes/partials/experience.njk`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks (timeline entries are self-contained).

- [ ] **Step 1: Create `src/_data/timeline.yaml`**

```yaml
- date: "2022 – Present"
  sector: "Space"
  title: "Production & Site Manager"
  org: "Unibap Space Solutions AB, Uppsala"
  description: "Full operational responsibility for a high-technology production site delivering edge-computing platforms for on-orbit AI processing in small and medium satellites. Owns strategic sourcing, supply chain, quality, and scalable production processes."
- date: "2021 – 2022"
  sector: "Space"
  title: "Senior Project Manager"
  org: "Unibap Space Solutions AB, Uppsala"
  description: "Led complex product development and R&D programmes delivering next-generation edge-computing platforms for the space sector. Managed external collaborations with ESA and NASA, bridging engineering execution and product strategy."
- date: "2020 – 2021"
  sector: "Space"
  title: "Interim Head of Propulsion Department"
  org: "GomSpace Sweden AB, Uppsala"
  description: "Full department leadership including P&L, delivery, and people management. Oversaw low-volume industrial manufacturing and cleanroom operations. Primary company interface to ESA across multiple international programmes."
- date: "2018 – 2020"
  sector: "Space"
  title: "Senior Project Manager"
  org: "GomSpace Sweden AB"
  description: "Managed multiple concurrent product development programmes delivering CubeSat propulsion systems. Responsible for budgeting, resource planning, and cross-functional delivery coordination."
- date: "2016 – 2018"
  sector: "Telecom"
  title: "Global Change Driver"
  org: "Ericsson AB – Product Development Unit Radio"
  description: "Led a global operational transformation initiative to reduce OpEx and improve efficiency. Implemented Lean and 5S methodologies across development sites in Europe, China, and Canada, delivering measurable improvements in productivity and cost efficiency."
- date: "2005 – 2017"
  sector: "Defence"
  title: "Project Manager / System Architect"
  org: "FMV – Swedish Defence Materiel Administration"
  description: "Senior leadership roles in development and deployment of mission-critical IP-based communication systems for the Swedish Armed Forces. Led large-scale programmes from pre-study and requirements through procurement, integration, deployment, and lifecycle support."
```

- [ ] **Step 2: Create `src/assets/css/05-timeline.css`**

```css
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 148px;
  top: 8px;
  bottom: 8px;
  width: 1px;
  background: linear-gradient(to bottom, var(--blue), rgba(67,75,231,0.1));
}
.tl-item {
  display: grid;
  grid-template-columns: 148px 1fr;
  gap: 0 40px;
  padding: 0 0 40px;
  position: relative;
}
.tl-item::before {
  content: '';
  position: absolute;
  left: 142px;
  top: 8px;
  width: 13px; height: 13px;
  background: var(--white);
  border: 2px solid var(--blue);
  border-radius: 50%;
  z-index: 1;
}
.tl-meta {
  text-align: right;
  padding-top: 4px;
  padding-right: 0;
}
.tl-date {
  display: block;
  font-family: 'DM Mono', monospace;
  font-size: 0.72rem;
  color: var(--blue);
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}
.tl-sector {
  display: inline-block;
  font-size: 0.68rem;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--blue-faint);
  color: var(--blue);
  padding: 3px 8px;
  border-radius: 100px;
}
.tl-body {
  padding-top: 2px;
  padding-bottom: 8px;
}
.tl-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--black);
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}
.tl-org {
  font-size: 0.82rem;
  color: var(--blue);
  font-weight: 400;
  margin-bottom: 10px;
}
.tl-desc {
  font-size: 0.88rem;
  color: var(--gray-600);
  line-height: 1.75;
  font-weight: 300;
}
```

- [ ] **Step 3: Create `src/_includes/partials/experience.njk`**

```html
<section id="experience" style="padding:120px 5vw; background:var(--gray-100);">
  <div style="max-width:860px; margin:0 auto;">
    <div class="section-header reveal">
      <span class="section-eyebrow">Leadership background</span>
      <h2 class="section-title">Built on <em>real delivery</em></h2>
    </div>

    <div class="timeline reveal">
      {% for item in timeline %}
      <div class="tl-item">
        <div class="tl-meta">
          <span class="tl-date">{{ item.date }}</span>
          <span class="tl-sector">{{ item.sector }}</span>
        </div>
        <div class="tl-body">
          <h3 class="tl-title">{{ item.title }}</h3>
          <p class="tl-org">{{ item.org }}</p>
          <p class="tl-desc">{{ item.description }}</p>
        </div>
      </div>
      {% endfor %}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Add experience include to `src/index.njk`**

```
---
layout: layouts/base.njk
---
{% include "partials/hero.njk" %}
{% include "partials/sectors.njk" %}
{% include "partials/services.njk" %}
{% include "partials/experience.njk" %}
```

- [ ] **Step 5: Build and verify**

Run: `npm run build && grep -c 'FMV – Swedish Defence Materiel Administration' dist/index.html && grep -c 'Interim Head of Propulsion Department' dist/index.html && grep -c 'tl-sector">Telecom<' dist/index.html`
Expected: each returns `1`.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: add experience/timeline section"
```

---

### Task 6: About section (Henrik profile, illustration, stats)

**Files:**
- Create: `src/_data/about.yaml`
- Create: `src/assets/css/06-about.css`
- Create: `src/assets/css/07-henrik-card.css`
- Create: `src/_includes/partials/svg/about-illustration.njk`
- Create: `src/_includes/partials/about.njk`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: `.section-header`/`.section-title` styles (from Task 4's `04-services.css`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Create `src/_data/about.yaml`**

```yaml
label: "Founder & Lead Consultant"
henrik:
  initials: "HM"
  name: "Henrik Magnusson"
  role: "Founder & Lead Consultant · Uppsala, Sweden"
  quals: "M.Sc. Computer Science · Technical Officer & Defence Engineer"
stats:
  - num: "20"
    suffix: "+"
    label: "Years of leadership experience"
  - num: "ESA"
    suffix: ""
    label: "& NASA programme experience"
  - num: "FMV"
    suffix: ""
    label: "Swedish Defence Materiel Administration"
```

- [ ] **Step 2: Create `src/assets/css/06-about.css`**

```css
#about {
  padding: 120px 5vw;
  background: var(--white);
}
.about-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 100px;
  align-items: center;
}
.about-visual {
  position: relative;
  height: 500px;
}
.about-visual svg { width: 100%; height: 100%; }
.about-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--blue);
  margin-bottom: 20px;
  display: block;
}
.about-title {
  font-size: clamp(2rem, 3.5vw, 2.8rem);
  font-weight: 300;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 24px;
  color: var(--black);
}
.about-title em { font-style: italic; color: var(--blue); }
.about-body {
  font-size: 0.95rem;
  color: var(--gray-600);
  line-height: 1.85;
  font-weight: 300;
  margin-bottom: 40px;
}
.about-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  padding-top: 40px;
  border-top: 1px solid var(--gray-100);
}
.about-stat-num {
  font-size: 2.2rem;
  font-weight: 300;
  color: var(--black);
  letter-spacing: -0.04em;
  line-height: 1;
}
.about-stat-num span { color: var(--blue); }
.about-stat-label {
  font-size: 0.78rem;
  color: var(--gray-600);
  font-weight: 300;
  margin-top: 6px;
  line-height: 1.4;
}
```

- [ ] **Step 3: Create `src/assets/css/07-henrik-card.css`**

```css
.henrik-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--blue-faint);
  border: 1px solid rgba(67,75,231,0.15);
  border-radius: var(--radius-sm);
  padding: 20px 24px;
  margin-bottom: 28px;
}
.henrik-initials {
  width: 52px; height: 52px;
  background: var(--blue);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}
.henrik-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.henrik-name {
  font-size: 1rem;
  font-weight: 500;
  color: var(--black);
  letter-spacing: -0.01em;
}
.henrik-role {
  font-size: 0.82rem;
  color: var(--blue);
  font-weight: 400;
}
.henrik-quals {
  font-size: 0.78rem;
  color: var(--gray-600);
  font-weight: 300;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.02em;
}
```

- [ ] **Step 4: Create `src/_includes/partials/svg/about-illustration.njk`**

```html
<svg viewBox="0 0 480 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="ag1" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#434BE7" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#434BE7" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ag2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#434BE7" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#6B72ED" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <circle cx="240" cy="250" r="200" fill="url(#ag1)"/>

  <circle cx="240" cy="250" r="180" fill="none" stroke="#434BE7" stroke-width="0.5" opacity="0.12"/>
  <circle cx="240" cy="250" r="140" fill="none" stroke="#434BE7" stroke-width="0.5" opacity="0.18"/>
  <circle cx="240" cy="250" r="100" fill="none" stroke="#434BE7" stroke-width="1" opacity="0.22"/>
  <circle cx="240" cy="250" r="60"  fill="none" stroke="#6B72ED" stroke-width="1" opacity="0.32"/>

  <g transform="translate(194,213) scale(0.88)" opacity="0.95">
    <path fill-rule="evenodd" clip-rule="evenodd" fill="#434BE7"
      d="M73.232,28.96c-5.631,0-10.194,4.567-10.194,10.197c0,8.74-4.368,13.108-13.11,13.108c-8.737,0-13.111-4.369-13.111-13.108c0-5.63-4.563-10.197-10.194-10.197s-10.194,4.567-10.194,10.197c0,5.631,4.563,10.198,10.194,10.198c8.742,0,13.111,4.369,13.111,13.111c0,5.631,4.563,10.194,10.195,10.194c5.63,0,10.2-4.563,10.2-10.194c0-8.742,4.368-13.111,13.104-13.111c5.637,0,10.2-4.567,10.2-10.198C83.433,33.527,78.869,28.96,73.232,28.96z"/>
  </g>

  <circle cx="240" cy="70"  r="5" fill="#434BE7" opacity="0.7"/>
  <circle cx="240" cy="430" r="5" fill="#434BE7" opacity="0.7"/>
  <circle cx="60"  cy="250" r="5" fill="#6B72ED" opacity="0.5"/>
  <circle cx="420" cy="250" r="5" fill="#6B72ED" opacity="0.5"/>
  <circle cx="367" cy="123" r="4" fill="#9BA3F0" opacity="0.4"/>
  <circle cx="113" cy="377" r="4" fill="#9BA3F0" opacity="0.4"/>
  <circle cx="113" cy="123" r="4" fill="#9BA3F0" opacity="0.4"/>
  <circle cx="367" cy="377" r="4" fill="#9BA3F0" opacity="0.4"/>
  <line x1="240" y1="70"  x2="240" y2="150" stroke="#434BE7" stroke-width="0.75" opacity="0.2"/>
  <line x1="240" y1="350" x2="240" y2="430" stroke="#434BE7" stroke-width="0.75" opacity="0.2"/>
  <line x1="60"  y1="250" x2="140" y2="250" stroke="#6B72ED" stroke-width="0.75" opacity="0.18"/>
  <line x1="340" y1="250" x2="420" y2="250" stroke="#6B72ED" stroke-width="0.75" opacity="0.18"/>

  <text x="240" y="62" fill="#434BE7" font-size="9" font-family="'DM Mono', monospace" text-anchor="middle" opacity="0.6" letter-spacing="1">PROJECT MGMT</text>
  <text x="240" y="448" fill="#434BE7" font-size="9" font-family="'DM Mono', monospace" text-anchor="middle" opacity="0.6" letter-spacing="1">PRODUCTION MGMT</text>
  <text x="38" y="254" fill="#6B72ED" font-size="9" font-family="'DM Mono', monospace" text-anchor="middle" opacity="0.5" letter-spacing="0.5" transform="rotate(-90 38 254)">REQUIREMENTS</text>
  <text x="442" y="254" fill="#6B72ED" font-size="9" font-family="'DM Mono', monospace" text-anchor="middle" opacity="0.5" letter-spacing="0.5" transform="rotate(90 442 254)">TEST-DRIVEN</text>
</svg>
```

- [ ] **Step 5: Create `src/_includes/partials/about.njk`**

```html
<section id="about">
  <div class="about-grid">

    <div class="about-visual reveal">
      {% include "partials/svg/about-illustration.njk" %}
    </div>

    <div>
      <span class="about-label reveal">{{ about.label }}</span>
      <h2 class="about-title reveal">Henrik Magnusson —<br><em>the person behind MAGTECH</em></h2>

      <div class="henrik-card reveal">
        <div class="henrik-initials">{{ about.henrik.initials }}</div>
        <div class="henrik-meta">
          <span class="henrik-name">{{ about.henrik.name }}</span>
          <span class="henrik-role">{{ about.henrik.role }}</span>
          <span class="henrik-quals">{{ about.henrik.quals }}</span>
        </div>
      </div>

      <p class="about-body reveal">
        Henrik brings over 20 years of senior leadership experience across space, defence, and telecommunications — not as an outside adviser, but as the person who has held the accountability, managed the teams, and delivered the results. He has led high-technology production sites, managed complex R&amp;D programmes, run department P&amp;Ls, and driven global transformation initiatives across multiple industries and continents.
      </p>
      <p class="about-body reveal" style="margin-top:-20px;">
        His career spans Production &amp; Site Manager and Senior Project Manager at Unibap Space Solutions, Interim Head of Propulsion at GomSpace — where he was the primary ESA interface across several international programmes — Global Change Driver at Ericsson, and twelve years at FMV (Swedish Defence Materiel Administration) as Project Manager and System Architect on mission-critical communication systems for the Swedish Armed Forces.
      </p>
      <p class="about-body reveal" style="margin-top:-20px;">
        Henrik holds an M.Sc. in Computer Science (Communication Systems &amp; Networking) and a Technical Officer and Defence Engineer qualification in Command &amp; Control and Communication Systems. He is fluent in Swedish and English.
      </p>
      <div class="about-stats reveal">
        {% for stat in about.stats %}
        <div>
          <div class="about-stat-num">{{ stat.num }}{% if stat.suffix %}<span>{{ stat.suffix }}</span>{% endif %}</div>
          <div class="about-stat-label">{{ stat.label }}</div>
        </div>
        {% endfor %}
      </div>
    </div>

  </div>
</section>
```

Note: `autoescape: true` (set in Task 1's `.eleventy.js`) only escapes the output of `{{ expression }}` interpolation — it does NOT escape literal text typed directly in `.njk` template source. The `about.stats` loop above renders through `{{ stat.label }}`, so `about.yaml`'s plain `&` (e.g. `"& NASA programme experience"`) is correctly auto-escaped to `&amp;` at render time — write that one as plain `&` in the YAML. But the three static prose paragraphs above are literal template text, not variable output, so their `&amp;` entities must be written out explicitly in the `.njk` source (as shown above) — do not "simplify" them to plain `&`, that would render as a literal, un-escaped `&` character in the output HTML (technically invalid, and inconsistent with the original site's hand-authored `&amp;` entities in the same prose).

- [ ] **Step 6: Add about include to `src/index.njk`**

```
---
layout: layouts/base.njk
---
{% include "partials/hero.njk" %}
{% include "partials/sectors.njk" %}
{% include "partials/services.njk" %}
{% include "partials/experience.njk" %}
{% include "partials/about.njk" %}
```

- [ ] **Step 7: Build and verify**

Run: `npm run build && grep -c 'Henrik Magnusson —' dist/index.html && grep -c '20<span>+</span>' dist/index.html && grep -c 'R&amp;D programmes' dist/index.html && grep -c '&amp; NASA programme experience' dist/index.html`
Expected: each returns `1` — the third and fourth confirm autoescape correctly converted `&` to `&amp;`.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat: add about section with Henrik profile and illustration"
```

---

### Task 7: Contact section + form submit handler

**Files:**
- Create: `src/assets/css/08-contact.css`
- Create: `src/_includes/partials/contact.njk`
- Modify: `src/assets/js/main.js`
- Modify: `src/index.njk`

**Interfaces:**
- Consumes: `site.formspreeEndpoint`, `site.contactEmail` (from Task 1's `site.yaml`); `sectors` list (Task 2, uses `sector.name` for the sector `<select>`); `services` list (Task 4, uses `service.title` for the discipline `<select>`).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Create `src/assets/css/08-contact.css`**

```css
#contact {
  padding: 120px 5vw;
  background: var(--blue-faint);
  position: relative;
  overflow: hidden;
}
#contact::before {
  content: '';
  position: absolute;
  bottom: -200px; right: -200px;
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(67,75,231,0.10) 0%, transparent 70%);
  pointer-events: none;
}
.contact-inner {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
}
.contact-sub {
  color: var(--gray-600);
  font-weight: 300;
  margin-bottom: 52px;
  font-size: 1rem;
  line-height: 1.75;
}
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--gray-600);
  letter-spacing: 0.04em;
}
.form-field input,
.form-field textarea,
.form-field select {
  background: var(--white);
  border: 1.5px solid transparent;
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.92rem;
  color: var(--black);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
}
.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
  border-color: var(--blue);
  box-shadow: 0 0 0 4px rgba(67,75,231,0.10);
}
.form-field textarea { resize: none; height: 120px; }
.form-submit { margin-top: 8px; }
.success-msg {
  display: none;
  background: white;
  border: 1.5px solid var(--blue);
  border-radius: var(--radius-sm);
  padding: 20px;
  color: var(--blue);
  font-size: 0.92rem;
  text-align: center;
  margin-top: 16px;
}
```

- [ ] **Step 2: Create `src/_includes/partials/contact.njk`**

```html
<section id="contact">
  <div class="contact-inner">
    <span class="section-eyebrow">Contact</span>
    <h2 class="section-title reveal" style="margin-bottom:16px;">Let's talk about<br><em>your programme</em></h2>
    <p class="contact-sub reveal">
      Whether you need a single experienced consultant or support for a broader programme, we'd like to hear from you.
    </p>

    <form class="contact-form reveal" id="contact-form" action="{{ site.formspreeEndpoint }}" method="POST">
      <input type="hidden" name="_replyto" id="hidden-replyto">
      <input type="hidden" name="_subject" value="New enquiry via magtech.se">

      <div class="form-row">
        <div class="form-field">
          <label for="name">Name</label>
          <input type="text" id="name" name="name" placeholder="Your name" required>
        </div>
        <div class="form-field">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" placeholder="you@organisation.com" required oninput="document.getElementById('hidden-replyto').value=this.value">
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label for="org">Organisation</label>
          <input type="text" id="org" name="organisation" placeholder="Organisation name">
        </div>
        <div class="form-field">
          <label for="sector">Sector</label>
          <select id="sector" name="sector">
            <option value="">Select sector</option>
            {% for sector in sectors %}
            <option>{{ sector.name }}</option>
            {% endfor %}
            <option>Other</option>
          </select>
        </div>
      </div>
      <div class="form-field">
        <label for="service">Area of interest</label>
        <select id="service" name="service">
          <option value="">Select a discipline</option>
          {% for service in services %}
          <option>{{ service.title }}</option>
          {% endfor %}
          <option>Multiple / Not sure yet</option>
        </select>
      </div>
      <div class="form-field">
        <label for="message">Tell us about your need</label>
        <textarea id="message" name="message" placeholder="Describe your programme, challenge, or question…"></textarea>
      </div>
      <div class="form-submit">
        <button type="submit" class="btn-primary" id="submit-btn">
          Send message
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="success-msg" id="success-msg">
        ✓ Message received. We'll be in touch shortly.
      </div>
      <div class="success-msg" id="error-msg" style="border-color:#e55;color:#c33;">
        ✗ Something went wrong. Please email us at <a href="mailto:{{ site.contactEmail }}" style="color:#c33;">{{ site.contactEmail }}</a>
      </div>
    </form>
  </div>
</section>
```

- [ ] **Step 3: Append form handler to `src/assets/js/main.js`**

Add this block to the end of the existing file (do not remove the nav-shadow or scroll-reveal blocks from Task 1):

```js

// Contact form — submits to Formspree, emails forwarded to ceo@magtech.se
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.textContent = 'Sending…';
  btn.style.pointerEvents = 'none';
  const form = e.target;
  try {
    const res = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      document.getElementById('success-msg').style.display = 'block';
      btn.style.display = 'none';
      form.reset();
    } else {
      document.getElementById('error-msg').style.display = 'block';
      btn.textContent = 'Send message';
      btn.style.pointerEvents = 'auto';
    }
  } catch {
    document.getElementById('error-msg').style.display = 'block';
    btn.textContent = 'Send message';
    btn.style.pointerEvents = 'auto';
  }
});
```

- [ ] **Step 4: Add contact include to `src/index.njk`**

```
---
layout: layouts/base.njk
---
{% include "partials/hero.njk" %}
{% include "partials/sectors.njk" %}
{% include "partials/services.njk" %}
{% include "partials/experience.njk" %}
{% include "partials/about.njk" %}
{% include "partials/contact.njk" %}
```

- [ ] **Step 5: Build and verify**

Run: `npm run build && grep -c 'action="https://formspree.io/f/mojbldlz"' dist/index.html && grep -c '<option>Space</option>' dist/index.html && grep -c '<option>Test-Driven Development</option>' dist/index.html && grep -c "getElementById('contact-form')" dist/index.html`
Expected: each returns `1`.

- [ ] **Step 6: Manual dev-server check (do not submit the form — avoid sending a real Formspree submission during a build check)**

Run: `npm run dev`
Open the printed local URL in a browser. Confirm the contact form renders with all fields, the sector/discipline dropdowns are populated, and no console errors appear. Do not click "Send message" during this check. Stop the dev server (Ctrl+C) when done.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: add contact section and form submit handler"
```

---

### Task 8: Full-site verification, mobile check, and cutover

**Files:**
- Modify: `CLAUDE.md` (root)
- Delete: `index.html` (root — superseded by `dist/index.html`, which is generated by `npm run build` and gitignored)

**Interfaces:**
- Consumes: the complete built `dist/index.html` from Tasks 1–7.
- Produces: nothing (final task).

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: no errors; `dist/index.html` produced.

- [ ] **Step 2: Structural completeness check**

Run:
```bash
for marker in 'id="main-nav"' 'id="hero"' 'id="sectors"' 'id="services"' 'id="experience"' 'id="about"' 'id="contact"' '<footer>' '<script>' '<style>'; do
  echo -n "$marker: "; grep -c "$marker" dist/index.html
done
```
Expected: every marker returns `1` — confirms the nav, all six page sections, the footer, and one style block and one script block are all present, matching the original document structure (`nav → hero → sectors → services → experience → about → contact → footer`).

- [ ] **Step 3: Visual and interaction check via dev server**

Run: `npm run dev`
Open the local URL. Check against the pre-migration site (open the old `index.html` directly in a second tab for comparison before deleting it in Step 5):
- Nav bar gets a shadow after scrolling down 20px.
- Each section fades/slides in on scroll (the `.reveal` → `.visible` transition).
- Hero sector badges, sectors grid, services grid, timeline, about illustration, and contact form all render with correct copy and match the original's spacing/typography.
- Resize the browser to below 900px width (or use device toolbar) and confirm: nav links hide, sectors/services grids go single-column, timeline collapses to the narrower layout, and the footer stacks vertically — matching the `@media (max-width: 900px)` rules from `99-mobile.css`.

Stop the dev server when done (Ctrl+C).

- [ ] **Step 4: Update `CLAUDE.md`**

Read the current `CLAUDE.md` and replace its "Repository overview" and "Working with this file" / "Testing changes" sections to describe the new Eleventy structure instead of the old single-file structure. Reference `docs/SPEC.md` for the full architecture description rather than duplicating it. Keep the "Brand note" section as-is (still applies).

- [ ] **Step 5: Remove the legacy `index.html`**

```bash
git rm index.html
```

- [ ] **Step 6: Update `docs/SPEC.md` status section**

Open `docs/SPEC.md` and update the "Status" section to reflect that the Eleventy migration is complete, and check off the two acceptance criteria in the "Data-driven content sections" and "Repeatable build & deploy workflow" features that were previously unchecked.

- [ ] **Step 7: Final commit**

```bash
git add CLAUDE.md docs/SPEC.md
git commit -m "chore: complete Eleventy migration, remove legacy index.html"
```

- [ ] **Step 8: Deploy (manual, per existing workflow)**

Run: `npm run build`
Upload the contents of `dist/` to the static host, replacing the previously hand-uploaded `index.html` — same manual process as before, just uploading generated output instead of a hand-edited file.

---

## Self-Review Notes

- **Spec coverage:** All four `docs/SPEC.md` features are covered — static page sections (Tasks 1–7), contact form (Task 7), data-driven content sections (Tasks 2, 4, 5 — sectors/services/timeline as YAML + loops), repeatable build & deploy workflow (Task 1's `npm run build`/`npm run dev`, Task 8's deploy step).
- **Cross-file dependency called out:** `.section-header`/`.section-eyebrow`/`.section-title` are defined once in `04-services.css` (Task 4) but used by `sectors.njk` (Task 3, built first) and `about.njk` (Task 6) — this out-of-order dependency is noted explicitly in Task 3's verification step and Task 4's Interfaces block so it isn't mistaken for a bug.
- **Autoescaping called out:** Task 6's about paragraphs and Task 2/5's YAML data rely on Nunjucks `autoescape: true` (set explicitly in Task 1, Step 4) to convert `&` to `&amp;` — flagged inline in Task 6 so the pattern isn't broken by later edits.
- **No placeholders:** every task step contains complete, copy-pasteable file content sourced directly from the current `index.html`; no "TODO"/"similar to above" shortcuts.
