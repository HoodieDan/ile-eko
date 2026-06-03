import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@ile-eko/core';
import {
  Button,
  Input,
  Logo,
  SegmentedControl,
  Text,
  colors,
  spacing,
} from '@ile-eko/ui';

type AuthMode = 'login' | 'register';
type AuthVia = 'email' | 'phone';

export default function Login(): React.ReactElement {
  const router = useRouter();
  const { login, register } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [mode, setMode] = useState<AuthMode>('login');
  const [via, setVia] = useState<AuthVia>('email');
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const nameErr = mode === 'register' && !name.trim() ? 'Required' : '';
  const idErr = !id.trim() ? 'Required' : '';
  const passwordErr = !password
    ? 'Enter a password'
    : password.length < 6
      ? 'At least 6 characters'
      : '';

  function onModeChange(next: AuthMode): void {
    setMode(next);
    setTouched(false);
    setAuthError('');
  }

  async function onSubmit(): Promise<void> {
    setTouched(true);
    setAuthError('');
    if (idErr || passwordErr || nameErr) return;
    try {
      setLoading(true);
      const email = via === 'email' ? id.trim() : `${id.trim()}@phone.ile-eko`;
      if (mode === 'register') {
        await register({ name: name.trim(), email, password, role: 'tenant' });
      } else {
        await login({ email, password });
      }
      if (redirect) {
        router.replace(redirect as never);
      } else {
        router.replace('/(tabs)/explore');
      }
    } catch {
      setAuthError('We could not sign you in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, padding: spacing.xl, paddingBottom: spacing['2xl'] }}
      >
        <View style={{ marginTop: spacing.lg }}>
          <Logo size={34} />
        </View>

        <View style={{ marginTop: spacing['3xl'] }}>
          <Text variant="display" color={colors.ink} style={{ fontSize: 30, lineHeight: 32 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text variant="body" color={colors.muted} style={{ marginTop: spacing.sm }}>
            Find and enquire about verified Lagos homes.
          </Text>
        </View>

        <SegmentedControl<AuthMode>
          value={mode}
          onChange={onModeChange}
          options={[
            { value: 'login', label: 'Log in' },
            { value: 'register', label: 'Sign up' },
          ]}
          style={{ marginTop: spacing['2xl'] }}
        />

        <View style={{ marginTop: spacing['2xl'], gap: spacing.lg }}>
          {mode === 'register' ? (
            <Input
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Adaeze Obi"
              icon="user"
              error={touched && nameErr ? nameErr : undefined}
            />
          ) : null}

          <View style={{ gap: spacing.sm }}>
            <Text variant="captionStrong" color={colors.muted}>
              Sign in with
            </Text>
            <SegmentedControl<AuthVia>
              value={via}
              onChange={setVia}
              options={[
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone' },
              ]}
            />
          </View>

          <Input
            label={via === 'email' ? 'Email address' : 'Phone number'}
            value={id}
            onChangeText={setId}
            placeholder={via === 'email' ? 'you@example.com' : '0803 000 0000'}
            icon={via === 'email' ? 'mail' : 'phone'}
            keyboardType={via === 'email' ? 'email-address' : 'phone-pad'}
            autoCapitalize="none"
            autoCorrect={false}
            error={touched && idErr ? idErr : undefined}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            icon="lock"
            secureTextEntry
            autoCapitalize="none"
            error={touched && passwordErr ? passwordErr : undefined}
          />

          {authError ? (
            <Text variant="captionStrong" color={colors.danger}>
              {authError}
            </Text>
          ) : null}

          <Button
            title={mode === 'login' ? 'Log in' : 'Create account'}
            variant="primary"
            iconRight="fwd"
            loading={loading}
            onPress={onSubmit}
          />
        </View>

        <View style={{ flex: 1, minHeight: spacing.xl }} />

        <Text
          variant="caption"
          color={colors.muted}
          center
          style={{ marginTop: spacing['2xl'], lineHeight: 18 }}
        >
          Looking to list a property? Download{' '}
          <Text variant="captionStrong" color={colors.ink}>
            Ilé Èkó for Landlords
          </Text>
          .
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
