import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Body, Caption } from './Typography';

export interface SelectOption<T extends string> {
  label: string;
  value: T;
}

export interface SelectProps<T extends string> {
  label?: string;
  value: T | null;
  onChange: (next: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
}: SelectProps<T>): React.ReactElement {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View>
      {label ? (
        <Body strong style={{ marginBottom: theme.spacing.xs }}>
          {label}
        </Body>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md,
          },
        ]}
      >
        <Body color={current ? theme.colors.text : theme.colors.textSubtle}>
          {current?.label ?? placeholder}
        </Body>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Caption color={theme.colors.textMuted} style={{ padding: theme.spacing.lg }}>
              {label ?? 'Select an option'}
            </Caption>
            <ScrollView style={{ maxHeight: 320 }}>
              {options.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: pressed
                        ? theme.colors.surfaceMuted
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Body>{opt.label}</Body>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    borderWidth: 1,
    justifyContent: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: { maxHeight: '70%' },
  option: { padding: 16 },
});
