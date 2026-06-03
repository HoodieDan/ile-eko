/**
 * Ilé Èkó — brand themes (Design System).
 *
 * Two directions ship from the design: **Verdant** (landlord app) and **Adire**
 * (tenant / Homes app) so the two apps are instantly distinguishable. Each app
 * is its own bundle and calls `setActiveTheme()` once at startup (before first
 * render); `colors` is the active palette that every component/screen reads.
 *
 * We still ship ONE theme per app and ignore the device light/dark setting.
 * Roles per theme: a brand colour (green / indigo), an action accent for primary
 * CTAs, and a reserved AI accent (iris / marigold). Status colours are shared.
 */
export interface ThemeColors {
  primary: string;
  primaryDeep: string;
  primaryTint: string;
  onPrimary: string;

  accent: string;
  accentTint: string;
  onAccent: string;

  ai: string;
  aiDeep: string;
  aiTint: string;
  onAi: string;

  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  line: string;

  ok: string;
  okTint: string;
  warn: string;
  warnTint: string;
  danger: string;
  dangerTint: string;
  info: string;
  infoTint: string;
  neutral: string;
  neutralTint: string;
}

export type ThemeName = 'verdant' | 'adire';

// Status colours are constant across themes (consistent meaning everywhere).
const SEMANTIC = {
  ok: '#1B7A48',
  okTint: '#E2F1E8',
  warn: '#9A6713',
  warnTint: '#FBEFD5',
  danger: '#BC3525',
  dangerTint: '#FBE5E1',
  info: '#2F6DB0',
  infoTint: '#E4EEF8',
  neutral: '#5C6A63',
  neutralTint: 'rgba(20,36,29,0.06)',
} as const;

/** Verdant — forest green brand, brass-gold action, iris AI. (Landlord app.) */
export const verdant: ThemeColors = {
  primary: '#1E6E52',
  primaryDeep: '#0F3D2E',
  primaryTint: '#E6F0EA',
  onPrimary: '#FFFFFF',
  accent: '#C79233',
  accentTint: '#F6ECD6',
  onAccent: '#14241D',
  ai: '#6246E0',
  aiDeep: '#4A34B8',
  aiTint: '#ECE9FB',
  onAi: '#FFFFFF',
  bg: '#F1EDE4',
  surface: '#FFFFFF',
  surface2: '#F7F4EC',
  ink: '#14241D',
  muted: '#5A6A62',
  line: '#E6E0D4',
  ...SEMANTIC,
};

/** Adire — indigo brand, periwinkle action, marigold AI, cool paper. (Tenant app.) */
export const adire: ThemeColors = {
  primary: '#2E3A8C',
  primaryDeep: '#171B45',
  primaryTint: '#E8EAF6',
  onPrimary: '#FFFFFF',
  accent: '#5563B5',
  accentTint: '#E8EAF6',
  onAccent: '#FFFFFF',
  ai: '#E6A52E',
  aiDeep: '#9C6E12',
  aiTint: '#FBEFD7',
  onAi: '#241B05',
  bg: '#ECEEF6',
  surface: '#FFFFFF',
  surface2: '#F3F4FB',
  ink: '#15183A',
  muted: '#585E7C',
  line: '#E0E3EF',
  ...SEMANTIC,
};

const THEMES: Record<ThemeName, ThemeColors> = { verdant, adire };
const HERO: Record<ThemeName, [string, string]> = {
  verdant: [verdant.primary, verdant.primaryDeep],
  adire: [adire.primary, adire.primaryDeep],
};

/**
 * The ACTIVE palette. A mutable singleton (per app bundle) so the thousands of
 * `colors.x` reads across components/screens flip to the chosen theme without a
 * Context refactor. Components must read `colors.x` at render time (not capture
 * it in module-level constants) so the swap is picked up.
 */
export const colors: ThemeColors = { ...verdant };

/** Hero gradient stops (≈150°) for the active theme. Mutated by setActiveTheme. */
export const heroGradient: [string, string] = [...HERO.verdant];

/** Set the active brand theme. Call ONCE at app startup, before first render. */
export function setActiveTheme(name: ThemeName): void {
  Object.assign(colors, THEMES[name]);
  heroGradient[0] = HERO[name][0];
  heroGradient[1] = HERO[name][1];
}

/** Translucent variant of a #RRGGBB colour. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** We never switch light/dark; aliases resolve to the active palette. */
export const lightTheme = colors;
export const darkTheme = colors;
