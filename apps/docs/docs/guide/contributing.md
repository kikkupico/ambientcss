---
title: Contributing
---

# Contributing

This page documents how this repo is built, tested, deployed, and released.

## Tech Stack

- Monorepo: `pnpm` workspace
- Language/tooling: TypeScript, Node.js
- CSS package build: `lightningcss`
- React package build: `tsup`
- Demo app: React + Vite (`examples/demo`)
- Docs site: Docusaurus (`apps/docs`)
- CI/CD: GitHub Actions
- Versioning/releases: Changesets + npm publish

## Repository Layout

- `packages/ambient-css`: `@ambientcss/css`
- `packages/ambient-components`: `@ambientcss/components`
- `examples/demo`: demo application
- `apps/docs`: documentation site
- `scripts`: workspace build/typecheck helpers
- `.github/workflows`: deployment and release workflows

## Local Setup

```bash
pnpm install
```

## Common Commands

- Build all workspaces:

```bash
pnpm build
```

- Typecheck publishable/workspace apps:

```bash
pnpm typecheck
```

- Run docs locally:

```bash
pnpm docs:dev
```

- Build docs:

```bash
pnpm docs:build
```

- Run full release gate:

```bash
pnpm release:check
```

## Deployment

### Docs deployment (GitHub Pages)

- Workflow: `.github/workflows/deploy.yml`
- Trigger: push to `master`
- Steps:
  1. Install dependencies
  2. Run launch gate (`pnpm build && pnpm typecheck && pnpm docs:build`)
  3. Deploy `apps/docs/build` to GitHub Pages

## Versioning and Releases

This repo uses Changesets for semantic versioning.

### 1. Add a changeset in your feature/fix PR

```bash
pnpm changeset
```

Choose:
- package(s) changed
- bump type (`patch`, `minor`, `major`)
- summary

Commit the generated file in `.changeset/`.

### 2. Merge your PR to `master`

After merge, Changesets workflow creates/updates a version PR.

- Workflow: `.github/workflows/changesets.yml`
- Version PR title: `chore: version packages`

### 3. Merge the version PR

On merge, packages are published to npm by the same workflow.

### Release commands (local fallback)

- Apply pending changesets to versions/changelogs:

```bash
pnpm version-packages
```

- Publish with Changesets locally:

```bash
pnpm release:changeset:publish
```

## npm Publishing and Auth

Initial package publish is commonly done from local CLI (`npm login`).

After first publish, configure npm Trusted Publishing for CI releases:
- Repository: `kikkupico/ambientcss`
- Workflow: `.github/workflows/changesets.yml`

Manual publish workflow also exists:
- `.github/workflows/publish-npm.yml`

## Contributor Checklist

Before opening/merging a PR:

1. Run `pnpm release:check`
2. Add/commit a changeset for user-facing changes
3. Ensure docs/examples are updated when behavior changes
