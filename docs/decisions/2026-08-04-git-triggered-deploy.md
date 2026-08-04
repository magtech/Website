# Decision: Deploy to one.com from CI on tagged releases

Date: 2026-08-04

## Problem

Build output is uploaded to one.com by hand. The build step introduced
by the Eleventy migration made the *build* repeatable but left the
*deploy* exactly as it was, and that gap has three consequences:

1. **No record of what is live.** Nothing ties the file on the server
   to a commit. `package.json`'s version has never been bumped, there
   are no git tags, and pushing to `master` publishes nothing — so what
   is committed and what is served can drift apart silently.
2. **No verification.** Nothing checks the built file before it reaches
   production. There is no test suite, and the failure modes of a
   single-file inlined build (an empty CSS/JS bundle, unrendered
   template syntax, nav anchors pointing at sections that no longer
   exist) are all invisible until a human notices them on the live site.
3. **No rollback handle.** `dist/` is gitignored, so the previous
   known-good output exists only wherever the maintainer last left a
   copy.

This is the situation the 2026-07-15 decision note anticipated in its
"Revisit if" clause: "Deploys move from manual upload to git-triggered
— add CI on top of the existing build step."

## Options

1. **GitHub Actions → SFTP to the existing one.com web space**,
   triggered by a `v*` tag.
2. **GitHub Actions → SFTP to one.com, triggered on every push to
   `master`** (continuous deployment).
3. **Migrate hosting to a git-native static host** (Netlify, Cloudflare
   Pages, GitHub Pages) and let it build and deploy on push.

## Trade-offs

1. **Tag-triggered SFTP**: costs a deliberate extra step per release
   (cut a tag) and means storing one.com credentials as repository
   secrets. Buys a named, auditable release with a natural rollback
   handle, while leaving hosting, DNS and mail on the existing paid
   one.com account entirely untouched. The upload is a single file, so
   no sync or diffing machinery is needed.
2. **Push-to-`master` deploy**: lowest friction, nothing to remember.
   But with a single maintainer, no test suite and no staging
   environment, it makes every commit — including `chore:` and
   docs-only commits — a production event on the company's public
   marketing site. The safety margin is too thin to justify the
   convenience.
3. **Git-native host**: the best developer experience by some distance
   — preview deploys per branch, atomic rollback, no credentials to
   manage. Costs moving hosting and DNS away from a working, already
   paid-for one.com account, for a site that changes a handful of times
   a year. The migration risk and ongoing account churn outweigh the
   ergonomics at this size.

## Decision

Adopt **option 1**. Pushing a `v*` tag runs
`.github/workflows/deploy.yml`, which builds, runs the smoke check
(`npm run verify`), uploads `dist/index.html` to one.com over SFTP, and
then fetches the live page to confirm the deploy actually landed where
the site is served from. `workflow_dispatch` provides a dry run that
builds and verifies without uploading.

Releases are cut with `npm version`, which bumps `package.json`,
commits and tags in one step, and refuses to run on a dirty tree.
`CHANGELOG.md` records what shipped in each version.

The upload uses OpenSSH `sftp` directly rather than a third-party
action. The payload is one file, so an action's sync and diffing logic
buys nothing, and the leading candidate is a small, sporadically
maintained project that would hold production credentials. `sftp` runs
in batch mode (`-b -`) so it aborts and exits non-zero on a failed
transfer, and the host key is pinned via `known_hosts` rather than
blindly trusted on first connection.

one.com constrains the mechanism: SFTP must be enabled in the control
panel, and a full SSH shell is only available on higher plan tiers, so
`rsync` and `scp` cannot be relied on. Plain SFTP file transfer works
on every tier.

## Revisit if

- one.com retires SFTP, or begins offering documented public-key
  authentication — key auth would remove the `sshpass` dependency and
  the stored password.
- The site grows beyond a single output file — the upload step would
  need to sync a directory, at which point a purpose-built action or
  `lftp` mirroring becomes worth its weight again.
- A second maintainer joins, or a real test suite exists — push-to-
  `master` deploy with a staging environment becomes defensible, and
  option 2 should be reconsidered.
- Hosting moves for unrelated reasons — option 3's preview deploys and
  atomic rollback come free at that point.
