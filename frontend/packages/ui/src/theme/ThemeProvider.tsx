import React, { createContext, useContext, useMemo } from 'react';
import { lightTheme, darkTheme, type ThemeColors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { elevation } from '../tokens/elevation';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  elevation: typeof elevation;
}

function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? darkTheme : lightTheme,
    typography,
    spacing,
    radii,
    elevation,
  };
}

const ThemeContext = createContext<Theme>(buildTheme('light'));

export interface ThemeProviderProps {
  mode?: ThemeMode;
  children: React.ReactNode;
}

export function ThemeProvider({ mode = 'light', children }: ThemeProviderProps): React.ReactElement {
  const value = useMemo(() => buildTheme(mode), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
