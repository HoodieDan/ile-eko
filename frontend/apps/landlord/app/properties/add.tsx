import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Heading, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — Add property form
export default function AddProperty(): React.ReactElement {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Heading level={1}>Add property</Heading>
        <Body color={theme.colors.textMuted}>{/* TODO */}</Body>
      </View>
    </SafeAreaView>
  );
}
