import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { elevation } from '../tokens/elevation';
import { Text } from './Text';

export interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** Metric card — small label, big display value, optional sub line. */
export function StatCard({ label, value, sub, subColor = colors.muted, style }: StatCardProps): React.ReactElement {
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderRadius: 16, padding: 15 },
        elevation.e1,
        style,
      ]}
    >
      <Text variant="captionStrong" color={colors.muted} style={{ fontSize: 11.5 }}>
        {label}
      </Text>
      <Text variant="display" style={{ fontSize: 26, lineHeight: 30, marginTop: 5 }}>
        {value}
      </Text>
      {sub ? (
        <Text variant="captionStrong" color={subColor} style={{ fontSize: 11.5, marginTop: 3 }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}
