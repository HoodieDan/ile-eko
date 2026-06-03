import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { colors } from '../tokens/colors';

export interface SwitchProps {
  value: boolean;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
}

/** Pill toggle — on = forest green, off = line. 50×30. */
export function Switch({ value, onValueChange, disabled = false }: SwitchProps): React.ReactElement {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [value, anim]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 23] });
  return (
    <Pressable
      onPress={() => onValueChange?.(!value)}
      disabled={disabled}
      style={{
        width: 50,
        height: 30,
        borderRadius: 999,
        backgroundColor: value ? colors.primary : colors.line,
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Animated.View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#FFFFFF',
          transform: [{ translateX }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 2,
        }}
      />
    </Pressable>
  );
}
