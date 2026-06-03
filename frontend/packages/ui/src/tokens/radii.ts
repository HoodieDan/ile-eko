// Corner-radius scale (Design System §04) plus a few component radii used verbatim.
export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  input: 14,
  button: 14,
  prop: 18,
  card: 20,
  xl: 22,
  sheet: 26,
  pill: 999,
} as const;

export type Radius = keyof typeof radii;
