import type { CSSProperties, PropsWithChildren } from "react";

export type AmbientTheme = {
  lightX?: number;
  lightY?: number;
  keyLight?: number;
  fillLight?: number;
  lightHue?: number;
  lightSaturation?: number;
  highlightColor?: string;
  lumeHue?: number;
};

export type AmbientProviderProps = PropsWithChildren<{
  className?: string;
  style?: CSSProperties;
  theme?: AmbientTheme;
}>;

const VAR_MAP: Record<string, keyof AmbientTheme> = {
  "--amb-light-x": "lightX",
  "--amb-light-y": "lightY",
  "--amb-key-light-intensity": "keyLight",
  "--amb-fill-light-intensity": "fillLight",
  "--amb-light-hue": "lightHue",
  "--amb-light-saturation": "lightSaturation",
  "--amb-highlight-color": "highlightColor",
  "--amb-lume-hue": "lumeHue",
};

export function AmbientProvider({ children, className, style, theme }: AmbientProviderProps) {
  const themeVars: Record<string, string> = {};
  for (const [varName, key] of Object.entries(VAR_MAP)) {
    const value = theme?.[key];
    if (value !== undefined) {
      themeVars[varName] = key === "lightSaturation" ? `${value}%` : String(value);
    }
  }
  // Derived variables must be re-declared here so they recompute using the
  // overridden input variables on this element rather than inheriting the
  // already-resolved values from :root.
  themeVars["--amb-lume"] = [
    "color-mix(in oklab,",
    "hsl(var(--amb-lume-hue) 100% 74%) calc(clamp(0, (0.5 - var(--amb-key-light-intensity)) / 0.2, 1) * 100%),",
    "hsl(var(--amb-light-hue) var(--amb-light-saturation)",
    "calc((1 - sign(var(--amb-key-light-intensity) - 0.5)) * 50% + 25%)))",
  ].join(" ");
  themeVars["--amb-label"] =
    "hsl(var(--amb-light-hue) var(--amb-light-saturation) calc((1 - var(--amb-key-light-intensity)) * 60% + 20%))";
  const mergedStyle = { ...themeVars, ...style } as CSSProperties;

  return (
    <div className={className} style={mergedStyle}>
      {children}
    </div>
  );
}
