import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@ile-eko/core';
import { Body, Button, Heading, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — Profile
export default function Profile(): React.ReactElement {
  const theme = useTheme();
  const { status, logout } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Heading level={1}>Profile</Heading>
        {status === 'authenticated' ? (
          <Button label="Sign out" variant="secondary" onPress={() => logout()} />
        ) : (
          <Button label="Sign in" onPress={() => router.push('/(auth)/onboarding')} />
        )}
        <Body color={theme.colors.textMuted}>{/* TODO: Claude Design */}</Body>
      </View>
    </SafeAreaView>
  );
}
