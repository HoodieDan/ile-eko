import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { Text } from './Text';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange?: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}

/** Inset segmented control — track is surface-2, active pill is white. */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>): React.ReactElement {
  return (
    <View
      style={[
        { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 13, padding: 4, gap: 4 },
        style,
      ]}
    >
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange?.(opt.value)}
            style={[
              {
                flex: 1,
                minHeight: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                backgroundColor: on ? colors.surface : 'transparent',
              },
              on
                ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 2,
                    elevation: 1,
                  }
                : null,
            ]}
          >
            <Text variant="captionStrong" color={on ? colors.ink : colors.muted} style={{ fontSize: 13 }}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
