import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';

export interface MeterProps {
  /** 0–1 fill ratio. */
  value: number;
  color?: string;
  track?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

/** Slim progress meter / bar. */
export function Meter({ value, color = colors.primary, track = colors.surface2, height = 12, style }: MeterProps): React.ReactElement {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={[{ height, borderRadius: 999, backgroundColor: track, overflow: 'hidden' }, style]}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
    </View>
  );
}
