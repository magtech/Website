# Decision: Adopt Eleventy as the static site generator

Date: 2026-07-15

## Problem

The site is a single 1275-line `index.html` with inline CSS, inline
SVG, and an inline `<script>`, hand-edited and manually uploaded to a
static host. Two problems with this as the site grows:

1. **Content changes** (adding a sector, a service, a career-timeline
   entry) require editing HTML/CSS directly — there's no separation
   between content and markup.
2. **Deployment/workflow** has no repeatable build step — the file that
   gets hand-edited is the same file that gets uploaded to production.

The site is also expected to grow into more pages (case studies,
insights/blog, service detail pages), which the current single-file
approach doesn't support without duplicating the whole nav/footer/head
shell per page.

## Options

1. **Eleventy (11ty)** — template-based static site generator
   (Nunjucks/Liquid + Markdown/YAML data files), no client-side
   framework, outputs plain HTML/CSS/JS.
2. **Astro** — component-based static site generator (`.astro` files),
   also outputs static HTML by default, with an option to add
   interactive "islands" later.
3. **Hand-rolled build script** — a small Node script (e.g. using
   `posthtml-include`) to stitch HTML partials together, no framework.

## Trade-offs

1. **Eleventy**: costs a Node/npm toolchain and a build step before
   each deploy, plus a small templating language to learn. Buys a
   direct fix for both stated problems (data files for content, a real
   build→deploy step) with a minimal dependency footprint, and native
   multi-page/collection support for the planned growth — all while
   keeping the output as plain static HTML/CSS/JS, matching the site's
   existing "no framework" character.
2. **Astro**: same core benefits as Eleventy, plus headroom for
   interactive components (richer form validation, animated widgets)
   without a framework migration later. Costs a heavier dependency
   tree and more machinery than a marketing site currently needs.
3. **Hand-rolled script**: smallest possible dependency, full control.
   Costs having to write and maintain page-collection/routing logic
   yourself as soon as "more pages later" actually happens — which is
   the exact problem this decision is trying to solve, just without
   documentation or community support behind it.

## Decision

Adopt **Eleventy**. It directly targets both stated pain points
(content-as-data, repeatable build) without introducing a component
framework or client-JS runtime the site doesn't need. Output remains
plain static HTML/CSS/JS uploaded by hand to the existing static host —
the deployment model doesn't change, only the source organization and
the presence of a build step.

CSS and JS are split into per-section source files for
maintainability, then re-bundled into a single inlined `<style>` and
`<script>` at build time (via `@11ty/eleventy-plugin-bundle`), so the
production output keeps the current site's "one file, zero extra
requests" performance profile.

## Revisit if

- The site needs client-side interactivity beyond what plain JS
  handles comfortably (e.g. a multi-step form, live filtering) — Astro
  islands would be a lighter path than bolting a framework onto
  Eleventy.
- Non-technical staff need to edit content and YAML/Markdown files stop
  being acceptable — would need a CMS (headless or git-based) layered
  on top.
- Deploys move from manual upload to git-triggered — add CI on top of
  the existing build step; doesn't require re-architecting.
