import { useEffect, type CSSProperties, type PropsWithChildren } from "react";

export type AmbientTheme = {
  lightX?: number;
  lightY?: number;
  keyLight?: number;
  fillLight?: number;
  lightHue?: number;
  lightSaturation?: number;
  highlightColor?: string;
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
};

export function AmbientProvider({ children, className, style, theme }: AmbientProviderProps) {
  useEffect(() => {
    const el = document.documentElement;
    const entries = Object.entries(VAR_MAP);
    for (const [varName, key] of entries) {
      const value = theme?.[key];
      if (value !== undefined) {
        const str = key === "lightSaturation" ? `${value}%` : String(value);
        el.style.setProperty(varName, str);
      }
    }
    return () => {
      for (const [varName] of entries) {
        el.style.removeProperty(varName);
      }
    };
  }, [theme]);

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
