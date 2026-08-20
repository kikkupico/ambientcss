/* The three things the builder produces from a config: the kit the preview
   runs on, the stylesheet its shapes need, and the module you take away.
   All three come out of the same catalogue, so what you see and what you
   copy cannot disagree — and the preview injects this very stylesheet, so
   that half cannot disagree either. */

import type { AmbientTheme, ControlKit } from "@ambientcss/components";
import { dressedFamilies, familyCode, familyDress, kitDefaults } from "./catalog";
import type { FamilyName } from "./catalog";
import { emitCss } from "./css";
import { fileName, kitIdent, kitSlug, themeIdent } from "./config";
import type { KitConfig } from "./config";

/* ── The live kit ─────────────────────────────────────────────────────── */

export function buildKit(cfg: KitConfig): ControlKit {
  const slug = kitSlug(cfg.name);
  const dress = (family: FamilyName) =>
    cfg[family].dressed ? familyDress(cfg, slug, family) : undefined;

  const looks: Record<string, readonly string[]> = {};
  for (const family of dressedFamilies(cfg)) looks[family] = familyCode(cfg, slug, family).looks;

  return {
    name: slug,
    rotary: dress("rotary"),
    travel: dress("travel"),
    press: dress("press"),
    latch: dress("latch"),
    bank: dress("bank"),
    defaults: kitDefaults(cfg),
    looks
  };
}

export function buildTheme(cfg: KitConfig): AmbientTheme {
  return {
    lightX: cfg.theme.lightX,
    lightY: cfg.theme.lightY,
    keyLight: cfg.theme.keyLight,
    fillLight: cfg.theme.fillLight,
    lightHue: cfg.theme.lightHue,
    lightSaturation: cfg.theme.lightSaturation,
    highlightColor: cfg.theme.highlightColor,
    lumeHue: cfg.theme.lumeHue
  };
}

/** The kit's own stylesheet. Empty for a kit built entirely from library
 *  parts, which is how those keep a single-file export. */
export function buildStyles(cfg: KitConfig): string {
  return emitCss(cfg, kitSlug(cfg.name), dressedFamilies(cfg));
}

export function styleFileName(cfg: KitConfig): string {
  return `${kitSlug(cfg.name)}.css`;
}

/* ── The module ───────────────────────────────────────────────────────── */

function literal(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : String(value);
}

/** `{ a: 1, b: "x" }` on one line — every object this emits is that small. */
function inlineObject(value: Record<string, unknown>): string {
  const body = Object.entries(value)
    .map(([key, entry]) => `${key}: ${literal(entry)}`)
    .join(", ");
  return `{ ${body} }`;
}

function defaultsCode(cfg: KitConfig): string | null {
  const defaults = kitDefaults(cfg);
  if (!defaults) return null;
  const lines = Object.entries(defaults).map(
    ([family, value]) => `    ${family}: ${inlineObject(value as Record<string, unknown>)}`
  );
  return `  defaults: {\n${lines.join(",\n")}\n  },`;
}

/** The dev-time warning table: which look keys each dressed family accepts.
 *
 *  Worth a comment in the generated file, because the press entry looks like
 *  a promise it does not make. */
function looksCode(cfg: KitConfig): string {
  const families = dressedFamilies(cfg);
  if (families.length === 0) return "  looks: {}";
  const slug = kitSlug(cfg.name);
  const lines = families.map((family) => {
    const keys = familyCode(cfg, slug, family).looks;
    return `    ${family}: [${keys.map((key) => `"${key}"`).join(", ")}]`;
  });
  const note =
    cfg.press.dressed
      ? [
          `  /* Which look keys each family accepts, used only to warn in`,
          `     development. \`press\` names \`material\` and \`shape\` because`,
          `     AmbientButton sends its own defaults for them on every call —`,
          `     naming them keeps that warning quiet; the cap above is chosen here. */`
        ].join("\n") + "\n"
      : "";
  return `${note}  looks: {\n${lines.join(",\n")}\n  }`;
}

function themeCode(cfg: KitConfig, ident: string): string {
  const theme = buildTheme(cfg);
  const lines = Object.entries(theme).map(([key, value]) => `  ${key}: ${literal(value)}`);
  return `export const ${ident}: AmbientTheme = {\n${lines.join(",\n")}\n};`;
}

/** The generated module: a kit, and the scene it was drawn under. */
export function emitKit(cfg: KitConfig, shareUrl?: string): string {
  const families = dressedFamilies(cfg);
  const slug = kitSlug(cfg.name);
  const kit = kitIdent(cfg.name);
  const theme = themeIdent(cfg.name);
  const styles = buildStyles(cfg);

  /* A plain array rather than a Set: the docs site compiles this page with
     Babel's loose transforms, where spreading a Set back into an array is
     assumed to be array-like and comes out as a one-element `[object Set]`.
     The list is never longer than the parts catalogue, so `includes` is the
     cheaper thing to reason about anyway. */
  const parts: string[] = [];
  const bodies: string[] = [];
  let usesLegend = false;
  for (const family of families) {
    const emitted = familyCode(cfg, slug, family);
    for (const name of emitted.imports) if (!parts.includes(name)) parts.push(name);
    if (emitted.code.includes("look.children as ReactNode")) usesLegend = true;
    bodies.push(emitted.code);
  }

  const undressed = (["rotary", "travel", "press", "latch", "bank"] as FamilyName[]).filter(
    (family) => !families.includes(family)
  );

  const header = [
    `/* ${fileName(cfg.name)} — a control kit, generated by the Ambient CSS Kit Builder.`,
    ` *`,
    ` * A kit is a plain object, so this file is the whole of it: no registry,`,
    ` * no lifecycle, nothing to initialise. Drop it in your project and put it`,
    ` * above your controls with <AmbientKitProvider kit={${kit}}>.`,
    undressed.length > 0
      ? ` *\n * ${undressed.join(", ")} ${undressed.length === 1 ? "is" : "are"} left undressed, so ${undressed.length === 1 ? "it falls" : "they fall"} through to the built-in\n * grounded look. A kit is not obliged to have an opinion about everything.`
      : null,
    styles
      ? ` *\n * The shapes it draws live in ${slug}.css, imported below — most of a kit\n * is a stylesheet and a handful of spans, and this one is no exception.`
      : null,
    shareUrl ? ` *\n * Rebuild or edit it: ${shareUrl}` : null,
    ` */`
  ]
    .filter((line) => line !== null)
    .join("\n");

  const imports: string[] = [];
  if (usesLegend) imports.push(`import type { ReactNode } from "react";`);
  if (parts.length > 0) {
    const names = parts.slice().sort();
    imports.push(
      `import {\n${names.map((name) => `  ${name}`).join(",\n")}\n} from "@ambientcss/components";`
    );
  }
  imports.push(`import type { AmbientTheme, ControlKit } from "@ambientcss/components";`);
  if (styles) imports.push(`import "./${slug}.css";`);

  const body = [
    `export const ${kit}: ControlKit = {`,
    `  name: "${slug}",`,
    ...bodies,
    defaultsCode(cfg),
    looksCode(cfg),
    `};`
  ]
    .filter((line) => line !== null)
    .join("\n");

  const scene = [
    `/* The scene this kit was tuned under. Not part of the kit: light is the`,
    `   room's business, and the same hardware under a different lamp is still`,
    `   the same hardware. */`,
    themeCode(cfg, theme)
  ].join("\n");

  return [header, imports.join("\n"), body, scene].join("\n\n") + "\n";
}

/** The call site: what to write once the module above is in the project. */
export function emitUsage(cfg: KitConfig): string {
  const kit = kitIdent(cfg.name);
  const theme = themeIdent(cfg.name);
  const accent = cfg.theme.accent;
  const module = `./${kitSlug(cfg.name)}`;

  const providerProps = accent
    ? `theme={${theme}} style={{ "--ambx-accent": "${accent}" } as CSSProperties}`
    : `theme={${theme}}`;

  return [
    accent ? `import type { CSSProperties } from "react";` : null,
    `import {`,
    `  AmbientProvider,`,
    `  AmbientKitProvider,`,
    `  AmbientPanel,`,
    `  AmbientKnob,`,
    `  AmbientSwitch,`,
    `  AmbientButton`,
    `} from "@ambientcss/components";`,
    `import "@ambientcss/components/styles.css";`,
    `import { ${kit}, ${theme} } from "${module}";`,
    ``,
    `export function Rack() {`,
    `  return (`,
    `    <AmbientProvider ${providerProps}>`,
    `      <AmbientKitProvider kit={${kit}}>`,
    `        <AmbientPanel material="${cfg.panel.material}">`,
    `          <AmbientKnob label="GAIN" defaultValue={40} />`,
    `          <AmbientSwitch label="ON" defaultValue />`,
    `          <AmbientButton>PLAY</AmbientButton>`,
    `        </AmbientPanel>`,
    `      </AmbientKitProvider>`,
    `    </AmbientProvider>`,
    `  );`,
    `}`
  ]
    .filter((line) => line !== null)
    .join("\n");
}
