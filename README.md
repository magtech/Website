# MAGTECH website

Marketing website for MAGTECH Sweden AB. Built with
[Eleventy](https://www.11ty.dev/); the build inlines all CSS and JS into
a single `dist/index.html`, preserving the site's zero-extra-requests
profile.

## Getting started

```
npm install
npm run dev      # local dev server with live reload
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with live reload |
| `npm run build` | Builds `dist/index.html` (gitignored) |
| `npm run verify` | Smoke-checks the built file; run after `build` |

## Releasing

Deploys are tag-triggered — pushing to `master` publishes nothing. A
`v*` tag runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds, verifies, uploads to one.com over SFTP, and confirms the
live page.

```
npm run build && npm run verify
npm run dev                        # eyeball it, including <900px
# record the change in CHANGELOG.md, commit
npm version minor -m "chore(release): v%s"
git push --follow-tags
```

The Deploy workflow also has a `workflow_dispatch` trigger with a dry
run (default on) that builds and verifies without uploading.

Deploy credentials live in GitHub repository secrets — see the
Deploying section of [`CLAUDE.md`](CLAUDE.md).

## Documentation

- [`docs/SPEC.md`](docs/SPEC.md) — architecture, source layout, features
- [`docs/decisions/`](docs/decisions) — decision notes
- [`CLAUDE.md`](CLAUDE.md) — conventions and the deploy procedure
