import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../tokens/colors';

/**
 * Ilé Èkó icon set — a single, consistent stroke library ported verbatim from
 * the design prototype. 24×24 viewBox, 1.9 default stroke. `spark` is the only
 * glyph rendered filled (the AI sparkle).
 */
export const ICONS = {
  home: 'M3 10.8 12 3l9 7.8M5 9.6V21h5v-6h4v6h5V9.6',
  building:
    'M5 21V4.5A1.5 1.5 0 0 1 6.5 3h7A1.5 1.5 0 0 1 15 4.5V21M15 9h3.5A1.5 1.5 0 0 1 20 10.5V21M3 21h18M8 7h3M8 11h3M8 15h3',
  wallet:
    'M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1M3 7.5V18a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7.5h16M16.5 12.5h.01M14 12.5a2.5 2.5 0 0 0 2.5 2.5H21v-5h-4.5A2.5 2.5 0 0 0 14 12.5Z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  back: 'M15 19l-7-7 7-7',
  fwd: 'M9 5l7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  user: 'M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  phone:
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
  message:
    'M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20l1.3-3.9A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z',
  spark: 'M12 2l1.7 6.6L20 10.5l-6.3 1.9L12 19l-1.7-6.6L4 10.5l6.3-1.9z',
  check: 'M20 6 9 17l-5-5',
  checkCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14.1l-3-3',
  alert: 'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  eyeOff:
    'M9.9 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a16 16 0 0 1-2.3 3.2M6.6 6.6A16 16 0 0 0 2 12s3.5 7 10 7a9.5 9.5 0 0 0 4-.9M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2',
  mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM3.3 6.5 12 13l8.7-6.5',
  lock: 'M6 10V7a6 6 0 1 1 12 0v3M5 10h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1ZM12 15v2',
  x: 'M18 6 6 18M6 6l12 12',
  key: 'M15.5 9a3.5 3.5 0 1 1-3.4 4.4L9 16.5 7 18l-1.5-.5L5 16l1.5-1.5L11 10A3.5 3.5 0 0 1 15.5 9Z',
  calendar: 'M7 2v3M17 2v3M4 8h16M5 4h14a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z',
  shield: 'M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3Z',
  trend: 'M3 17 9 11l4 4 7-8M14 7h6v6',
  filter: 'M3 5h18l-7 8v6l-4-2v-4z',
  door: 'M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M14 12h.01M9 21V8',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  doc: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h6',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 0 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.1-2.9H3a2 2 0 0 1 0-4h.2a1.7 1.7 0 0 0 1.1-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 0 1 0 4h-.2a1.7 1.7 0 0 0-1.4.9Z',
  logout: 'M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16v-4M12 8h.01',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
  idcard:
    'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM5 16c.5-1.6 1.7-2.5 3-2.5s2.5.9 3 2.5M14 9h5M14 13h5M14 16h3',
  half: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 2v20',
  hourglass: 'M6 2h12M6 22h12M8 2c0 4 8 6 8 10s-8 6-8 10M16 2c0 4-8 6-8 10s8 6 8 10',
  flag: 'M4 21V4M4 4c3-1.5 5 1.5 8 0s4-1.5 8 0v10c-4 1.5-5-1.5-8 0s-5-1.5-8 0',
  globe:
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z',
  layers: 'M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  image: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8.5 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM21 16l-5-5L5 21',
  upload: 'M12 16V4M7 9l5-5 5 5M5 20h14',
  heart: 'M12 21s-7-4.5-9.4-9A5.1 5.1 0 0 1 12 5.6 5.1 5.1 0 0 1 21.4 12c-2.4 4.5-9.4 9-9.4 9z',
  bookmark: 'M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z',
  bed: 'M3 18V7M3 12h16a2 2 0 0 1 2 2v4M3 9h6a2 2 0 0 1 2 2v1M21 18v-2',
  bath: 'M4 13V6a2 2 0 0 1 3.5-1.3M3 13h18v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4zM7 19l-1 2M18 19l1 2M8 5h2',
  ruler: 'M3 8l5-5 13 13-5 5zM8 4.5l1.5 1.5M11 7.5l1.5 1.5M14 10.5l1.5 1.5',
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11ZM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',
  droplet: 'M12 3c3 3.6 6 6.8 6 10a6 6 0 0 1-12 0c0-3.2 3-6.4 6-10z',
  car: 'M5 11l1.6-4.2A2 2 0 0 1 8.5 5.5h7A2 2 0 0 1 17.4 6.8L19 11M4 11h16v6H4zM7 17v2M17 17v2',
  sofa: 'M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 12a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5H3zM6 17v2M18 17v2',
  wifi: 'M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01',
  sliders: 'M4 6h10M18 6h2M4 12h2M10 12h10M4 18h7M15 18h5M14 4v4M6 10v4M11 16v4',
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Render filled instead of stroked (use for `spark`). */
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Icon({
  name,
  size = 22,
  color = colors.ink,
  strokeWidth = 1.9,
  fill = false,
  style,
}: IconProps): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path
        d={ICONS[name]}
        stroke={fill ? 'none' : color}
        fill={fill ? color : 'none'}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
