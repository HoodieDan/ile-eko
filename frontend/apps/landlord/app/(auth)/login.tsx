import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@ile-eko/core';
import {
  Screen,
  AppBar,
  Logo,
  Text,
  Input,
  Button,
  Card,
  Icon,
  SegmentedControl,
  useToast,
  colors,
  spacing,
} from '@ile-eko/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login(): React.ReactElement {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const emailErr = !email
    ? 'Enter your email'
    : !EMAIL_RE.test(email)
      ? "That doesn't look like a valid email"
      : '';
  const passwordErr = !password
    ? 'Enter your password'
    : password.length < 6
      ? 'At least 6 characters'
      : '';

  async function onSubmit(): Promise<void> {
    setTouched({ email: true, password: true });
    setFormError('');
    if (emailErr || passwordErr) return;
    if (password.toLowerCase() === 'wrong') {
      setFormError('Incorrect email or password. Please try again.');
      return;
    }
    try {
      setLoading(true);
      await login({ email, password });
      router.replace('/(tabs)');
    } catch {
      setFormError('Something went wrong. Please try again.');
      showToast('Could not sign you in', 'alert');
    } finally {
      setLoading(false);
    }
  }

  function useDemo(): void {
    setEmail('adeola@balogun.ng');
    setPassword('demo1234');
    setTouched({ email: false, password: false });
    setFormError('');
  }

  return (
    <Screen scroll padded bottomSpace={spacing['3xl']}>
      <AppBar onBack={() => router.back()} right={<Logo size={30} showText={false} />} />

      <View style={{ marginTop: spacing['2xl'] }}>
        <Text variant="display" color={colors.ink} style={{ fontSize: 30, lineHeight: 32 }}>
          Welcome back
        </Text>
        <Text variant="body" color={colors.muted} style={{ marginTop: spacing.sm }}>
          Manage your Lagos portfolio, rent and team.
        </Text>
      </View>

      <SegmentedControl
        style={{ marginTop: spacing['2xl'] }}
        options={[
          { value: 'login', label: 'Log in' },
          { value: 'register', label: 'Register' },
        ]}
        value="login"
        onChange={(v) => {
          if (v === 'register') router.replace('/(auth)/register');
        }}
      />

      <View style={{ marginTop: spacing['2xl'], gap: spacing.lg }}>
        {formError ? (
          <Card
            flat
            padding={14}
            style={{
              borderColor: colors.danger,
              backgroundColor: colors.dangerTint,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            <Icon name="alert" size={20} color={colors.danger} strokeWidth={2} />
            <Text variant="captionStrong" color={colors.danger} style={{ flex: 1 }}>
              {formError}
            </Text>
          </Card>
        ) : null}

        <Input
          label="Email"
          icon="mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="you@example.com"
          error={touched.email ? emailErr : undefined}
        />
        <Input
          label="Password"
          icon="lock"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          error={touched.password ? passwordErr : undefined}
        />

        <View style={{ alignItems: 'flex-end', marginTop: -spacing.xs }}>
          <Button
            title="Forgot password?"
            variant="ghost"
            size="sm"
            fullWidth={false}
            style={{ backgroundColor: 'transparent', paddingHorizontal: spacing.xs }}
          />
        </View>

        <Button title="Log in" iconRight="fwd" loading={loading} onPress={onSubmit} />
        <Button title="Use demo account" variant="ghost" disabled={loading} onPress={useDemo} />
      </View>

      <View style={{ flex: 1, minHeight: spacing.xl }} />

      <Text
        variant="caption"
        color={colors.muted}
        center
        style={{ marginTop: spacing['2xl'], lineHeight: 18 }}
      >
        By continuing you agree to our Terms & Privacy Policy.
      </Text>
      <Text
        variant="caption"
        color={colors.muted}
        center
        style={{ marginTop: spacing.xs, lineHeight: 18, opacity: 0.7 }}
      >
        Demo: password{' '}
        <Text variant="caption" color={colors.ink} style={{ fontWeight: '600' }}>
          wrong
        </Text>{' '}
        triggers the error state.
      </Text>
    </Screen>
  );
}
