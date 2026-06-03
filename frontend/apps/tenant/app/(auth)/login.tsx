import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@ile-eko/core';
import { Body, Button, Heading, Input, useTheme, useToast } from '@ile-eko/ui';

export default function Login(): React.ReactElement {
  const theme = useTheme();
  const toast = useToast();
  const { login } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    try {
      setLoading(true);
      await login({ email, password });
      // Return the user to whatever they were doing — Enquire, Save, etc.
      if (redirect) {
        router.replace(redirect as never);
      } else {
        router.back();
      }
    } catch {
      toast.show('Could not sign you in', 'danger');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, padding: theme.spacing.xl }}>
        <Heading level={1}>Sign in to continue</Heading>
        <Body color={theme.colors.textMuted} style={{ marginTop: theme.spacing.sm }}>
          You only need an account to enquire about a home or save a listing.
        </Body>
        <View style={{ marginTop: theme.spacing['2xl'], gap: theme.spacing.lg }}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          <Button label="Continue" fullWidth loading={loading} onPress={onSubmit} />
          <Button label="Cancel" variant="ghost" fullWidth onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
