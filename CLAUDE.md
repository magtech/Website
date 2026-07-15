# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This is the marketing website for MAGTECH Sweden AB, a management consulting firm founded by Henrik Magnusson (space/defence/telecom sectors). The site is built with [Eleventy (11ty)](https://www.11ty.dev/) as a static site generator: content and markup live under `src/`, and `npm run build` produces a deployable `dist/index.html` that preserves the original single-file, zero-extra-requests performance profile (inlined CSS/JS).

For the full architecture — source layout, build pipeline, design tokens, and feature-level requirements — see [`docs/SPEC.md`](docs/SPEC.md) and the decision note at [`docs/decisions/2026-07-15-static-site-generator.md`](docs/decisions/2026-07-15-static-site-generator.md). The legacy hand-authored `index.html` that predated this migration has been removed; do not recreate it.

## Working with this file

Source lives under `src/`, not in a single HTML file:

- `src/_data/*.yaml` — content as data (nav links, contact info, sectors, services, career timeline). Edit these to change content without touching markup.
- `src/_includes/layouts/base.njk` — shared page shell (head, nav, footer).
- `src/_includes/partials/*.njk` — one Nunjucks template per page section (hero, sectors, services, experience, about, contact), plus `svg/*.njk` for logo and illustration partials.
- `src/assets/css/*.css` — one file per section (tokens, nav, hero, sectors, services, about, contact, footer, animations, henrik-card, timeline, mobile), bundled at build time into a single inlined `<style>` block.
- `src/assets/js/main.js` — scroll-reveal (`IntersectionObserver`), nav shadow-on-scroll, and Formspree contact-form submit handling, bundled into a single inlined `<script>` block.

See `docs/SPEC.md`'s Architecture section for full detail on the build/bundling mechanism and design tokens. Nav/footer links anchor to section IDs (`#hero`, `#sectors`, `#services`, `#experience`, `#about`, `#contact`) — keep them in sync if section IDs change.

## Testing changes

There is no separate lint/test suite. Verify changes with:

- `npm run dev` — starts a local dev server with live reload; check the affected section in the browser, including the mobile breakpoint (<900px, rules in `src/assets/css/99-mobile.css`) and the scroll-reveal/nav-shadow/form-submit behavior.
- `npm run build` — produces `dist/index.html` (gitignored; not committed). Confirm it builds without errors before considering a change done.

## Brand note

This site has its own established brand identity (blue `#434BE7` / black / DM Sans+DM Mono, pill-shaped buttons, subtle grid/orb hero background). Do not apply unrelated design systems or palettes to this file — preserve the existing visual language when adding or modifying sections.
