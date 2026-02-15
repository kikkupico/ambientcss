# Releasing `@ambientcss/*` to npm

## Recommended Versioning Flow (Changesets)

This repo uses Changesets for semantic versioning in a monorepo.

- Add a changeset for every user-facing change.
- GitHub Action creates/updates a "version packages" PR.
- Merging that PR triggers publish to npm automatically.

### Create a changeset

```bash
pnpm changeset
```

Select affected package(s) and bump type:

- `patch` = fixes
- `minor` = backward-compatible features
- `major` = breaking changes

## One-time setup

```bash
npm login
npm whoami
```

If you publish from GitHub Actions, create an npm automation token and set it as:

- Repo secret: `NPM_TOKEN`

Also ensure GitHub Actions workflow is enabled:

- `.github/workflows/changesets.yml`

## Preflight checks

```bash
pnpm release:check
pnpm release:pack
```

This validates build/typecheck/docs and produces tarballs in `.artifacts/`.

## Versioning from local machine (manual fallback)

Apply queued changesets into package versions/changelogs:

```bash
pnpm version-packages
```

Then commit those version changes.

## Publish from local machine (manual fallback)

Publish with `latest` tag:

```bash
pnpm release:publish
```

Publish with `next` tag:

```bash
pnpm release:publish:next
```

## Publish from GitHub Actions

Primary automated flow:

1. Merge PRs that include `.changeset/*.md`
2. Action `changesets.yml` creates/updates a version PR
3. Merge version PR
4. Action publishes packages with `latest` tag

Manual workflow (still available):

- `.github/workflows/publish-npm.yml`
- Run manually (`workflow_dispatch`)
- `dry_run=true` to verify without publishing
- `dry_run=false` to publish
- `tag` can be `latest`, `next`, `beta`, etc.

## Verify on npm

```bash
npm view @ambientcss/css version
npm view @ambientcss/components version
```
