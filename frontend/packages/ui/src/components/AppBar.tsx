import React from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '../tokens/colors';
import { Text } from './Text';
import { IconButton } from './Button';

export interface AppBarProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Top app bar — optional back, title/subtitle, trailing action slot. */
export function AppBar({ title, subtitle, onBack, right, onDark = false, style }: AppBarProps): React.ReactElement {
  const fg = onDark ? '#FFFFFF' : colors.ink;
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, minHeight: 56 },
        style,
      ]}
    >
      {onBack ? (
        <IconButton name="back" variant="ghost" onPress={onBack} color={fg} style={{ marginLeft: -10 }} />
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <Text variant="title" color={fg} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text variant="caption" color={onDark ? 'rgba(255,255,255,0.7)' : colors.muted} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bg?: string;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Extra bottom padding so content clears a tab bar / FAB. */
  bottomSpace?: number;
}

/**
 * Safe-area screen scaffold. `scroll` wraps content in a hidden-scrollbar
 * ScrollView; `padded` adds the standard 20px horizontal gutter.
 */
export function Screen({
  children,
  scroll = false,
  padded = false,
  bg = colors.bg,
  edges = ['top'],
  contentContainerStyle,
  bottomSpace = 0,
}: ScreenProps): React.ReactElement {
  const pad: StyleProp<ViewStyle> = [
    padded ? { paddingHorizontal: 20 } : null,
    bottomSpace ? { paddingBottom: bottomSpace } : null,
    contentContainerStyle,
  ];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={pad}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad]}>{children}</View>
      )}
    </SafeAreaView>
  );
}
