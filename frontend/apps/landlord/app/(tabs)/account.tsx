import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@ile-eko/core';
import { Body, Button, Heading, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — Account tab
export default function AccountTab(): React.ReactElement {
  const theme = useTheme();
  const { logout } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Heading level={1}>Account</Heading>
        <Body color={theme.colors.textMuted}>
          Profile, billing, notifications, app settings. {/* TODO: Claude Design */}
        </Body>
        <Button label="Sign out" variant="secondary" onPress={() => logout()} />
      </View>
    </SafeAreaView>
  );
}
