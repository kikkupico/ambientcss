import type { CSSProperties, PropsWithChildren } from "react";

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

export function AmbientProvider({ children, className, style, theme }: AmbientProviderProps) {
  const cssVars: CSSProperties = {
    "--amb-light-x": theme?.lightX,
    "--amb-light-y": theme?.lightY,
    "--amb-key-light-intensity": theme?.keyLight,
    "--amb-fill-light-intensity": theme?.fillLight,
    "--amb-light-hue": theme?.lightHue,
    "--amb-light-saturation": theme?.lightSaturation !== undefined ? `${theme.lightSaturation}%` : undefined,
    "--amb-highlight-color": theme?.highlightColor,
  } as CSSProperties;

  return (
    <div className={className} style={{ ...cssVars, ...style }}>
      {children}
    </div>
  );
}
