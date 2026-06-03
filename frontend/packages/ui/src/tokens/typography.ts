// TODO: paste from Ilé Èkó Brand Board — locked fonts (display + body).
// Placeholders use system fonts so the apps run before fonts are loaded.

export type TypographyVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'overline'
  | 'button';

export interface TypographyStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  letterSpacing?: number;
}

// TODO: replace with brand-board display + body font families
export const fontFamilies = {
  display: 'System',
  body: 'System',
  mono: 'Menlo',
};

export const typography: Record<TypographyVariant, TypographyStyle> = {
  display: {
    fontFamily: fontFamilies.display,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  h3: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  caption: {
    fontFamily: fontFamilies.body,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  overline: {
    fontFamily: fontFamilies.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  button: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
};
