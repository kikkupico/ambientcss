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
  const mergedStyle = { ...themeVars, ...style } as CSSProperties;

  return (
    <div className={className} style={mergedStyle}>
      {children}
    </div>
  );
}
