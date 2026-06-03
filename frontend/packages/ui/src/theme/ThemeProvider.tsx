import React, { createContext, useContext } from 'react';
import { colors, type ThemeColors } from '../tokens/colors';
import { typography } from '../tokens/typography';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { elevation } from '../tokens/elevation';

export interface Theme {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  elevation: typeof elevation;
}

/**
 * The single Verdant theme. We intentionally do NOT read the device colour
 * scheme — the brand should look identical on every phone, light or dark.
 */
export const theme: Theme = { colors, typography, spacing, radii, elevation };

const ThemeContext = createContext<Theme>(theme);

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
