import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Heading, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — Add tenant form
export default function AddTenant(): React.ReactElement {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.xl }}>
        <Heading level={1}>Add tenant</Heading>
        <Body color={theme.colors.textMuted}>{/* TODO */}</Body>
      </View>
    </SafeAreaView>
  );
}
