# demo

The Ambient CSS demo, deployed to Cloudflare Workers as static assets at
[ambientcss.com](https://ambientcss.com).

## Deploy

Pushes to `master` auto-deploy via Cloudflare Workers Builds (Settings →
Builds on the `ambientcss-demo` Worker). Other branches get a preview
version instead of a production deploy.

To deploy manually:

```sh
pnpm demo:deploy   # from the repo root
```

`ambientcss.vercel.app` now just redirects here (see the root `vercel.json`)
and is no longer built on push.
