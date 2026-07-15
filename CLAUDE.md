# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This is the marketing website for MAGTECH Sweden AB, a management consulting firm founded by Henrik Magnusson (space/defence/telecom sectors). The entire site is a single static file:

- `index.html` — the whole website: inline `<style>` CSS, inline SVG (logo symbols + about-section illustration), page markup, and a small inline `<script>` at the bottom.

There is no build system, no package manager, no framework, and no test suite — it's a plain static HTML page meant to be deployed as-is (e.g. to any static host). There is no git repository initialized here yet.

## Working with this file

Because everything lives in one file, changes are made by editing `index.html` directly:

- **CSS** lives in the `<style>` block in `<head>`, organized by section with `/* ── NAME ── */` comment dividers (NAV, HERO, SECTORS, SERVICES, ABOUT, CONTACT, FOOTER, ANIMATIONS, HENRIK CARD, TIMELINE, MOBILE). Design tokens (colors, radii) are CSS custom properties on `:root` — reuse these (`--blue`, `--black`, `--gray-*`, `--radius`, etc.) rather than introducing new hard-coded values.
- **Fonts** are DM Sans (body) and DM Mono (labels/eyebrows/mono accents), loaded from Google Fonts in the `<head>`.
- **Sections** run in document order: `nav` → `#hero` → `#sectors` → `#services` → `#experience` (career timeline) → `#about` → `#contact` → `footer`. Nav links and footer links anchor to these section IDs — keep them in sync if section IDs change.
- **Responsive behavior** is handled by a single `@media (max-width: 900px)` block at the end of the `<style>` section — add mobile overrides there rather than scattering breakpoints throughout.
- **Scroll-reveal animation**: any element with the `reveal` class fades/slides in via an `IntersectionObserver` in the bottom `<script>`; add the class to new content blocks that should animate in on scroll.
- **Contact form** posts to Formspree (`https://formspree.io/f/mojbldlz`) via `fetch` in the inline script, with success/error message toggling (`#success-msg` / `#error-msg`) and a hidden `_replyto` field synced from the email input. Fallback contact is `ceo@magtech.se`.

## Testing changes

There is no build/lint/test tooling. Verify changes by opening `index.html` directly in a browser (or via a simple static file server) and checking the affected section, including the mobile breakpoint (<900px) and the scroll-reveal/nav-shadow/form-submit behavior in `<script>`.

## Brand note

This site has its own established brand identity (blue `#434BE7` / black / DM Sans+DM Mono, pill-shaped buttons, subtle grid/orb hero background). Do not apply unrelated design systems or palettes to this file — preserve the existing visual language when adding or modifying sections.
