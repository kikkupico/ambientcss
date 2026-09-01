# Contributing

## Setup

```bash
git clone https://github.com/kikkupico/ambientcss.git
cd ambientcss
pnpm install
```

## Workflow

```bash
pnpm build           # build all packages
pnpm typecheck        # typecheck the workspace
pnpm --filter @ambientcss/components test   # run component tests
pnpm docs:dev         # run the documentation site locally
pnpm --filter demo dev # run the demo app locally
```

Before opening a PR, run the same checks CI runs:

```bash
pnpm release:check
```

## Changes to `@ambientcss/css` or `@ambientcss/components`

These are the two published packages. Any user-facing change to either needs
a [changeset](https://github.com/changesets/changesets):

```bash
pnpm changeset
```

Pick the affected package(s) and a bump type (`patch` for fixes, `minor` for
backward-compatible features, `major` for breaking changes), and commit the
generated file under `.changeset/` with your PR.

Changes to `packages/ambient-css/src/ambient.css` are checked against an API
baseline (`pnpm api:check`) — if you intentionally add or rename a public
class or custom property, update the baseline with `pnpm --filter
@ambientcss/css api:write` and include that in your PR.

## Publishing

Publishing is maintainer-run via Changesets; see [RELEASING.md](./RELEASING.md).

## License

By contributing, you agree your contributions will be licensed under this
repository's [MIT license](./LICENSE).
