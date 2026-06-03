import type { ViewStyle } from 'react-native';

/**
 * Three elevation steps (Design System §04), translated to RN shadows.
 * The CSS uses layered, negative-spread shadows that RN can't reproduce
 * exactly, so these are tuned single-layer approximations of the same feel.
 *   e1 · card   e2 · raised   e3 · overlay
 */
const e1: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 16,
  elevation: 2,
};
const e2: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.14,
  shadowRadius: 24,
  elevation: 6,
};
const e3: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.22,
  shadowRadius: 40,
  elevation: 14,
};

export const elevation = {
  none: {} as ViewStyle,
  e1,
  e2,
  e3,
  card: e1,
  raised: e2,
  overlay: e3,
} satisfies Record<string, ViewStyle>;

export type Elevation = keyof typeof elevation;
