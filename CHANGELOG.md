# Changelog

Notable changes to the MAGTECH website. Versions correspond to git tags;
pushing a `v*` tag deploys that build to production.

## [Unreleased]

### Added
- Tag-triggered deploy to one.com via GitHub Actions
  (`.github/workflows/deploy.yml`), with a build-and-verify dry run
  available through `workflow_dispatch`.
- `npm run verify` — smoke check on the built output: size bounds,
  inlined CSS/JS bundles, nav/section anchor sync, content markers, and
  no unrendered template syntax.
- `.nvmrc` and an `engines` field so CI and local builds agree on Node.
- `CHANGELOG.md` and `README.md`.

### Changed
- Footer copyright year is derived from the build date instead of being
  hardcoded to 2026.

## [1.0.0] — 2026-07-15

### Changed
- Migrated from a hand-authored single `index.html` to an Eleventy
  build. Content moved into `_data/*.yaml`, markup split into per-section
  Nunjucks partials, CSS and JS split per section and re-inlined at build
  time to preserve the original single-file, zero-extra-requests output.
