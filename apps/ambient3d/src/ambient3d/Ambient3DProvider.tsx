import { createContext, useContext, useMemo, type CSSProperties, type PropsWithChildren } from "react";
import { AmbientProvider, type AmbientTheme } from "@ambientcss/components";
import { DEFAULT_THEME, type Ambient3DTheme } from "./types";

const Ambient3DContext = createContext<Ambient3DTheme>(DEFAULT_THEME);

export function useAmbient3DTheme(): Ambient3DTheme {
  return useContext(Ambient3DContext);
}

export type Ambient3DProviderProps = PropsWithChildren<{
  theme?: Partial<Ambient3DTheme>;
  className?: string;
  style?: CSSProperties;
}>;

/**
 * The 3D Provider does two jobs:
 *   1. publishes the theme to 3D components via React context
 *   2. forwards the same values to the CSS AmbientProvider so embedded 2D
 *      ambient components stay synchronized with the 3D scene
 */
export function Ambient3DProvider({ children, theme, className, style }: Ambient3DProviderProps) {
  const resolved = useMemo<Ambient3DTheme>(
    () => ({ ...DEFAULT_THEME, ...theme }),
    [theme]
  );
  const cssTheme: AmbientTheme = resolved;
  return (
    <Ambient3DContext.Provider value={resolved}>
      <AmbientProvider
        theme={cssTheme}
        {...(className !== undefined ? { className } : {})}
        {...(style !== undefined ? { style } : {})}
      >
        {children}
      </AmbientProvider>
    </Ambient3DContext.Provider>
  );
}
