import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@ile-eko/core';
import { Body, Button, EmptyState, Heading, useTheme } from '@ile-eko/ui';

// TODO: build to match Claude Design — Saved listings
export default function Saved(): React.ReactElement {
  const theme = useTheme();
  const { status } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ padding: theme.spacing.xl }}>
        <Heading level={1}>Saved</Heading>
      </View>
      {status !== 'authenticated' ? (
        <EmptyState
          title="Sign in to save listings"
          description="Saved homes follow you across devices."
          action={
            <Button
              label="Sign in"
              onPress={() =>
                router.push({
                  pathname: '/(auth)/login',
                  params: { redirect: '/(tabs)/saved' },
                } as never)
              }
            />
          }
        />
      ) : (
        <Body color={theme.colors.textMuted} style={{ padding: theme.spacing.xl }}>
          {/* TODO: Claude Design */}No saved listings yet.
        </Body>
      )}
    </SafeAreaView>
  );
}
