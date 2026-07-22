import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "" so the built dist/index.html loads over file:// — the shot
// script screenshots the built page directly, no dev server involved.
export default defineConfig({
  plugins: [react()],
  base: "",
  publicDir: false,
  resolve: {
    conditions: ["development"],
  },
  build: {
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    modulePreload: { polyfill: false },
  },
});
