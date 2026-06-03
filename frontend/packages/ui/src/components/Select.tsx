import React, { useState } from 'react';
import { Modal, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../tokens/colors';
import { radii } from '../tokens/radii';
import { Text } from './Text';
import { Icon } from './Icon';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SelectProps<T extends string = string> {
  label?: string;
  value?: T;
  options: SelectOption<T>[];
  placeholder?: string;
  onChange?: (v: T) => void;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Field-styled select that opens a bottom sheet of options. */
export function Select<T extends string = string>({
  label,
  value,
  options,
  placeholder = 'Select',
  onChange,
  containerStyle,
}: SelectProps<T>): React.ReactElement {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13, marginBottom: 7 }}>
          {label}
        </Text>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 54,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colors.line,
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
        }}
      >
        <Text variant="body" color={current ? colors.ink : 'rgba(90,106,98,0.65)'} style={{ flex: 1, fontSize: 15.5 }}>
          {current?.label ?? placeholder}
        </Text>
        <Icon name="fwd" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: 'rgba(15,16,14,0.42)', justifyContent: 'flex-end' }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.sheet,
              borderTopRightRadius: radii.sheet,
              paddingTop: 10,
              paddingBottom: 28,
              paddingHorizontal: 20,
            }}
          >
            <View style={{ width: 40, height: 5, borderRadius: 999, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 14 }} />
            {label ? (
              <Text variant="title" style={{ marginBottom: 8 }}>
                {label}
              </Text>
            ) : null}
            {options.map((opt) => {
              const on = opt.value === value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange?.(opt.value);
                    setOpen(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.line,
                  }}
                >
                  <Text variant={on ? 'bodyStrong' : 'body'} color={on ? colors.primary : colors.ink}>
                    {opt.label}
                  </Text>
                  {on ? <Icon name="check" size={18} color={colors.primary} strokeWidth={2.4} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
