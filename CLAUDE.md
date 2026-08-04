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

See `docs/SPEC.md`'s Architecture section for full detail on the build/bundling mechanism and design tokens. Nav/footer links anchor to section IDs (`#hero`, `#sectors`, `#services`, `#experience`, `#about`, `#contact`) — keep them in sync if section IDs change. `scripts/verify-build.mjs` enforces this: it fails the build if a section ID is missing or nothing links to it.

## Testing changes

There is no separate lint/test suite. Verify changes with:

- `npm run dev` — starts a local dev server with live reload; check the affected section in the browser, including the mobile breakpoint (<900px, rules in `src/assets/css/99-mobile.css`) and the scroll-reveal/nav-shadow/form-submit behavior.
- `npm run build` — produces `dist/index.html` (gitignored; not committed). Confirm it builds without errors before considering a change done.
- `npm run verify` — smoke-checks the built file (size, inlined CSS/JS bundles, anchor sync, content markers, no unrendered template syntax). Run it after `npm run build`. CI runs it too, and a failure blocks the deploy.

## Deploying

Deploys are tag-triggered. Pushing a `v*` tag runs `.github/workflows/deploy.yml`, which builds, runs `npm run verify`, uploads `dist/index.html` to one.com over SFTP, and then fetches the live page to confirm it landed. Pushing to `master` publishes nothing.

To release:

```
npm run build && npm run verify   # then npm run dev and eyeball it, incl. <900px
# record the change under a new heading in CHANGELOG.md, commit
npm version minor -m "chore(release): v%s"
git push --follow-tags
```

Use `minor` for content/feature changes, `patch` for typo-level fixes. `npm version` refuses to run on a dirty tree.

`workflow_dispatch` on the Deploy workflow gives a build-and-verify dry run (the default) that uploads nothing — use it to rehearse, or re-run a failed upload without cutting a new tag.

Credentials live in GitHub repository secrets (`ONECOM_SFTP_HOST`, `ONECOM_SFTP_USERNAME`, `ONECOM_SFTP_PASSWORD`, `ONECOM_KNOWN_HOSTS`) plus the `ONECOM_REMOTE_PATH` variable. Never inline them in the workflow or any source file. Rotating the one.com SSH/SFTP password means updating `ONECOM_SFTP_PASSWORD`, or deploys will start failing at the upload step.

The document root for www.magtech.se is `/customers/c/6/e/czxlcw9fj/webroots/www/`, so `ONECOM_REMOTE_PATH` is `/customers/c/6/e/czxlcw9fj/webroots/www/index.html`. Use the absolute path — it does not depend on where SFTP lands. The SFTP account also exposes `public_html/` and an `index.html` in the login directory; **neither is served**, and both contain stale copies. Uploading to them succeeds and changes nothing, which is why the workflow warns when the file at `ONECOM_REMOTE_PATH` differs from what the live site serves.

one.com fronts the site with Varnish, so a correct deploy can take a while to appear publicly. The workflow proves the upload by reading the file back over SFTP; a stale public page after a green run is cache, not failure. Clear it in the one.com control panel to see the change immediately.

To roll back, download the `index-html-<sha>` artifact from the last good workflow run and upload it manually.

## Brand note

This site has its own established brand identity (blue `#434BE7` / black / DM Sans+DM Mono, pill-shaped buttons, subtle grid/orb hero background). Do not apply unrelated design systems or palettes to this file — preserve the existing visual language when adding or modifying sections.
