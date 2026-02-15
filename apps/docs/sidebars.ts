import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "intro",
    {
      type: "category",
      label: "Guide",
      items: [
        "guide/getting-started",
        "guide/concept",
        "guide/demo",
        "guide/contributing"
      ]
    },
    {
      type: "category",
      label: "@ambientcss/css",
      items: [
        "ambient-css/overview",
        "ambient-css/install",
        "ambient-css/usage",
        "ambient-css/global-settings",
        "ambient-css/classes",
        "ambient-css/recipes"
      ]
    },
    {
      type: "category",
      label: "@ambientcss/components",
      items: [
        "ambient-components/overview",
        "ambient-components/install",
        "ambient-components/usage",
        "ambient-components/provider",
        "ambient-components/panel",
        "ambient-components/button",
        "ambient-components/switch",
        "ambient-components/knob",
        "ambient-components/slider-fader",
        "ambient-components/examples"
      ]
    }
  ]
};

export default sidebars;
