/**
 * Type system (Design System §03).
 *   Bricolage Grotesque — display & titles (tracking −2%)
 *   Manrope            — UI & body
 *   Spline Sans Mono   — labels / eyebrows (tracking +14%, caps)
 *
 * In React Native a custom `fontFamily` must point at a *specific weight* — the
 * numeric `fontWeight` prop does not synthesise weights for embedded fonts — so
 * each weight is its own family name (matching the loaded asset keys).
 */
export const fonts = {
  display: {
    400: 'BricolageGrotesque_400Regular',
    500: 'BricolageGrotesque_500Medium',
    600: 'BricolageGrotesque_600SemiBold',
    700: 'BricolageGrotesque_700Bold',
    800: 'BricolageGrotesque_800ExtraBold',
  },
  body: {
    400: 'Manrope_400Regular',
    500: 'Manrope_500Medium',
    600: 'Manrope_600SemiBold',
    700: 'Manrope_700Bold',
    800: 'Manrope_800ExtraBold',
  },
  mono: {
    400: 'SplineSansMono_400Regular',
    500: 'SplineSansMono_500Medium',
  },
} as const;

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'title'
  | 'h3'
  | 'body'
  | 'bodyMedium'
  | 'bodyStrong'
  | 'caption'
  | 'captionStrong'
  | 'label'
  | 'button'
  | 'mono';

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase' | 'none';
}

export const typography: Record<TypographyVariant, TypographyStyle> = {
  display: { fontFamily: fonts.display[700], fontSize: 40, lineHeight: 42, letterSpacing: -0.8 },
  h1: { fontFamily: fonts.display[700], fontSize: 28, lineHeight: 31, letterSpacing: -0.56 },
  h2: { fontFamily: fonts.display[700], fontSize: 22, lineHeight: 26, letterSpacing: -0.4 },
  title: { fontFamily: fonts.display[700], fontSize: 18, lineHeight: 23, letterSpacing: -0.2 },
  h3: { fontFamily: fonts.body[700], fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.body[400], fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.body[500], fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.body[600], fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.body[500], fontSize: 12.5, lineHeight: 17 },
  captionStrong: { fontFamily: fonts.body[600], fontSize: 12.5, lineHeight: 17 },
  label: {
    fontFamily: fonts.mono[500],
    fontSize: 10.5,
    lineHeight: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  button: { fontFamily: fonts.body[600], fontSize: 15, lineHeight: 18 },
  mono: { fontFamily: fonts.mono[400], fontSize: 12, lineHeight: 16 },
};

/** Convenience: the four font-family roles as plain strings (default weights). */
export const fontFamilies = {
  display: fonts.display[700],
  body: fonts.body[400],
  bodyStrong: fonts.body[600],
  mono: fonts.mono[400],
};
