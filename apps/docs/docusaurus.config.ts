import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Ambient CSS",
  tagline: "A physics-based lighting system for CSS",
  favicon: "img/favicon.ico",

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
    image: "img/og-image.png",
    metadata: [
      {
        name: "description",
        content:
          "Define a light source, and every shadow, highlight and surface gradient follows from it. Calibrated against Blender raytraces \u2014 rendered with box-shadow."
      },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:image:alt",
        content:
          "The same hardware panel split down the middle: Blender Cycles raytrace on one side, CSS box-shadow on the other."
      }
    ],
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
          to: "/kit-builder",
          label: "Kit Builder",
          position: "left"
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
