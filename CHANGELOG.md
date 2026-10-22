# Changelog

Notable changes to the MAGTECH website. Versions correspond to git tags;
pushing a `v*` tag deploys that build to production.

## [Unreleased]

## [1.1.9] — 2026-08-04

### Changed
- Documented the one.com document root
  (`/customers/c/6/e/czxlcw9fj/webroots/www/`) and the Varnish cache in
  front of the site. `public_html/` and the `index.html` in the SFTP login
  directory are not served.

## [1.1.8] — 2026-08-04

### Added
- Before uploading, the deploy compares the file at `ONECOM_REMOTE_PATH`
  with what the public site serves, and warns if they differ. Earlier
  deploys wrote to `public_html/index.html`, which is never served, so they
  passed without changing the site.

## [1.1.7] — 2026-08-04

No changes; re-release to trigger a deploy.

## [1.1.6] — 2026-08-04

### Fixed
- SFTP `-o` options now come before `-b`. ssh uses the first value it
  gets for an option, so the `BatchMode=no` added in 1.1.1 had been
  overridden by the `batchmode yes` that `sftp -b` adds.

## [1.1.5] — 2026-08-04

No changes; re-release to trigger a deploy.

## [1.1.4] — 2026-08-04

No changes; re-release to trigger a deploy.

## [1.1.3] — 2026-08-04

### Added
- The deploy reads the uploaded file back over SFTP and compares it byte
  for byte with what was sent. The public-URL check now fails only if the
  live page is actually broken, since Varnish can serve the previous build
  for a while after a correct upload.

## [1.1.2] — 2026-08-04

No changes; version bump only (not tagged).

## [1.1.1] — 2026-08-04

Not tagged; its changes first deployed with 1.1.3.

### Fixed
- SFTP password authentication on the deploy runner: the password is
  passed via `sshpass -e`, password auth is forced with a single attempt,
  required secrets are checked for being empty or having stray whitespace,
  the batch commands run from a file instead of stdin, sftp logs its auth
  negotiation (`-v`), and `BatchMode=no` is set so password auth is
  allowed.

## [1.1.0] — 2026-08-04

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
- Updated the `brace-expansion` transitive dependency in the lockfile.

## [1.0.0] — 2026-07-15

### Changed
- Migrated from a hand-authored single `index.html` to an Eleventy
  build. Content moved into `_data/*.yaml`, markup split into per-section
  Nunjucks partials, CSS and JS split per section and re-inlined at build
  time to preserve the original single-file, zero-extra-requests output.
