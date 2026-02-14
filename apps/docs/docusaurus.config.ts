import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Ambient CSS",
  tagline: "Documentation for @ambientcss/css and @ambientcss/components",

  url: "https://kikkupico.github.io",
  baseUrl: "/ambientcss/",

  organizationName: "kikkupico",
  projectName: "ambientcss",

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn"
    }
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"]
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts"
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css"
        }
      } satisfies Preset.Options
    ]
  ],

  themeConfig: {
    navbar: {
      title: "Ambient CSS",
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs"
        },
        {
          href: "https://ambientcss.vercel.app/",
          label: "Demo App",
          position: "right"
        },
        {
          href: "https://github.com/kikkupico/ambientcss",
          label: "GitHub",
          position: "right"
        }
      ]
    }
  } satisfies Preset.ThemeConfig
};

export default config;
