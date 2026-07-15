# MAGTECH Website — Spec

## Purpose

Marketing website for MAGTECH Sweden AB, a management consulting firm
founded by Henrik Magnusson (space/defence/telecom sectors). The site
introduces the firm, its sectors and services, Henrik's background, and
provides a contact form for inbound inquiries.

## Platforms

Static website, single target: the public web, served from a static
host. No mobile app, no server-side runtime beyond static file hosting.
Desktop and mobile browsers both supported via responsive CSS (mobile
breakpoint at 900px).

## Architecture

Built with [Eleventy (11ty)](https://www.11ty.dev/) as a static site
generator. See [`docs/decisions/2026-07-15-static-site-generator.md`](decisions/2026-07-15-static-site-generator.md)
for the full decision note (problem, options considered, trade-offs).

**Source layout** (`src/`):
- `_data/*.yaml` — content as data: nav links, contact info, sectors,
  services, career timeline entries. Edit these to change content;
  markup stays untouched.
- `_includes/layouts/base.njk` — shared page shell (head, nav, footer).
- `_includes/partials/*.njk` — one template per page section (hero,
  sectors, services, experience, about, contact), matching the
  `/* ── SECTION ── */` divisions from the original single-file site.
- `_includes/partials/svg/*.njk` — logo symbols and the about-section
  illustration as includable SVG partials.
- `assets/css/*.css` — one file per section (tokens, nav, hero, sectors,
  services, about, contact, footer, animations, henrik-card, timeline,
  mobile).
- `assets/js/main.js` — scroll-reveal (`IntersectionObserver`), nav
  shadow-on-scroll, and Formspree contact-form submit handling.

**Build output**: `@11ty/eleventy-plugin-bundle` inlines the split CSS
and JS back into a single `<style>` and `<script>` block at build time,
so `dist/index.html` preserves the original site's "one file, zero
extra requests" performance profile even though the source is split
across files.

**Design tokens**: colors, radii, etc. remain CSS custom properties on
`:root` in `assets/css/tokens.css` (`--blue`, `--black`, `--gray-*`,
`--radius`, ...). Reuse these rather than introducing new hard-coded
values. Brand identity (blue `#434BE7` / black / DM Sans+DM Mono,
pill-shaped buttons, subtle grid/orb hero background) must be preserved
in any new section.

## Core features

## Feature: Static page sections

**Goal:** Present the firm, its sectors, services, and background in a
single-page scrolling layout.

**User story:** As a visitor, I want to quickly understand what MAGTECH
does and who it serves, so I can decide whether to reach out.

**Acceptance criteria:**
- [x] Nav → hero → sectors → services → experience (timeline) → about →
      contact → footer, in that order, with nav/footer anchors kept in
      sync with section IDs.
- [x] Scroll-reveal animation on content blocks via `IntersectionObserver`.
- [x] Responsive layout below 900px width.

**Out of scope:** Multi-language content, dark mode.

**Platform notes:** None beyond standard responsive web.

**Open questions:** None.

## Feature: Contact form

**Goal:** Let visitors reach out without leaving the site.

**User story:** As a visitor, I want to submit an inquiry with my
contact details, so MAGTECH can follow up.

**Acceptance criteria:**
- [x] Form posts to Formspree (endpoint stored in `_data/site.yaml`,
      not hardcoded in markup).
- [x] Success/error states toggle without a page reload.
- [x] `_replyto` hidden field stays synced with the entered email.
- [x] Fallback contact (`ceo@magtech.se`) shown alongside the form.

**Out of scope:** Server-side form validation beyond Formspree's own,
CRM integration.

**Platform notes:** None.

**Open questions:** None.

## Feature: Data-driven content sections

**Goal:** Let sectors, services, and career-timeline entries be added
or edited without touching HTML/CSS.

**User story:** As the site maintainer, I want to add a new sector or
timeline entry by editing a data file, so content changes don't require
touching markup or styling.

**Acceptance criteria:**
- [ ] Sectors, services, and timeline entries are defined in
      `_data/*.yaml` and rendered via loop templates.
- [ ] Adding an entry requires no changes to `.njk` templates or CSS.

**Out of scope:** A visual/CMS editing UI — content is edited as
files by a technical maintainer.

**Platform notes:** None.

**Open questions:** None.

## Feature: Repeatable build & deploy workflow

**Goal:** Replace hand-editing a single HTML file with a build step
that produces deployable output, while keeping the existing manual
upload to a static host.

**User story:** As the site maintainer, I want `npm run build` to
produce a `dist/` folder I can upload as-is, so deploys are repeatable
and I stop hand-editing production markup.

**Acceptance criteria:**
- [ ] `npm run dev` runs a local dev server with live reload.
- [ ] `npm run build` produces `dist/index.html` (plus any passthrough
      assets) matching the current site's single-file output profile.
- [ ] `dist/` is gitignored; only source files are committed.

**Out of scope:** CI/CD, git-triggered auto-deploy (see decision note's
"Revisit if" — can be added later without a redesign).

**Platform notes:** Requires Node.js + npm locally to build; no runtime
Node dependency once `dist/` is deployed (it's static output).

**Open questions:** None.

## Non-functional requirements

- **Performance**: build output should preserve the current single-file
  profile (inlined CSS/JS, no extra requests) via CSS/JS bundling.
- **Offline behavior**: not applicable (marketing site, no app state).
- **Data privacy**: contact form data goes directly to Formspree; no
  first-party storage of visitor-submitted data.
- **Accessibility**: not explicitly addressed by this migration; carry
  forward whatever the current markup does (no regressions), revisit
  separately if needed.
- **Browser support**: modern evergreen browsers (matches current
  site's use of `IntersectionObserver`, CSS custom properties).

## Status

- Migration to Eleventy: not started (this spec is the design; see
  `docs/decisions/2026-07-15-static-site-generator.md` for the
  decision, and the implementation plan for execution steps).
- Current production source: `index.html` (single file, pre-migration).
