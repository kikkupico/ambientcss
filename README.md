# ambientcss

Monorepo containing:

- `@ambientcss/css`: pure CSS ambient lighting utilities.
- `@ambientcss/components`: React components built on top of Ambient CSS.

## Workspace

```bash
pnpm install
pnpm build
```

## Packages

- `packages/ambient-css`
- `packages/ambient-components`

## Demo

A React demo app lives in `examples/demo`. To run it:

```bash
pnpm --filter demo dev
```

Production demo URL:

- https://ambientcss.vercel.app/

## Docs

Documentation lives in `apps/docs` (Docusaurus). To run it:

```bash
pnpm docs:dev
```

To build docs:

```bash
pnpm docs:build
```

Production docs URL:

- https://kikkupico.github.io/ambientcss/
