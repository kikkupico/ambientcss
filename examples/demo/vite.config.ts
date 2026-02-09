import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "ambientcss";
const githubPagesBase = `/${repoName}/`;

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS === "true" ? githubPagesBase : "/",
  resolve: {
    conditions: ["development"],
  },
});
