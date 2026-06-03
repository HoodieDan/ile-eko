import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Display, useTheme } from '@ile-eko/ui';

export default function Onboarding(): React.ReactElement {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          flex: 1,
          padding: theme.spacing.xl,
          justifyContent: 'space-between',
        }}
      >
        <View />
        <View>
          <Display>Ilé Èkó.</Display>
          <Body
            color={theme.colors.textMuted}
            style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing['2xl'] }}
          >
            Manage your Lagos properties, tenants and rent — with an AI assistant that knows
            your portfolio.
          </Body>
          <Button
            label="Sign in"
            fullWidth
            onPress={() => router.push('/(auth)/login')}
          />
          <View style={{ height: theme.spacing.md }} />
          <Button
            label="Create account"
            variant="secondary"
            fullWidth
            onPress={() => router.push('/(auth)/register')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
