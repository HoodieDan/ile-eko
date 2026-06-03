import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Heading, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — Register
export default function Register(): React.ReactElement {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ padding: theme.spacing.xl }}>
        <Heading level={1}>Create account</Heading>
        <Body color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
          {/* TODO: build to match Claude Design — Register */}
          Landlord-only registration. Step-by-step onboarding goes here.
        </Body>
      </View>
    </SafeAreaView>
  );
}
