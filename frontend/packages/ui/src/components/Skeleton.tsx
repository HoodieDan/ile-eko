import React, { useEffect, useRef } from 'react';
import { Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Placeholder bar for content that is still loading. Prefer this over
 * "…will appear here" copy: an empty-state message shown during a fetch tells
 * the user they have no data when they simply have no data *yet*.
 */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 7,
  style,
}: SkeletonProps): React.ReactElement {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 620, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 620, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.surface2, opacity: pulse },
        style,
      ]}
    />
  );
}
