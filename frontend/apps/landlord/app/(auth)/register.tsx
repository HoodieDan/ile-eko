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
const PHONE_RE = /^0\d{10}$/;

type FieldKey = 'name' | 'email' | 'phone' | 'password';

export default function Register(): React.ReactElement {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Record<FieldKey, boolean>>({
    name: false,
    email: false,
    phone: false,
    password: false,
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const nameErr = !name.trim() ? 'Enter your full name' : '';
  const emailErr = !email
    ? 'Enter your email'
    : !EMAIL_RE.test(email)
      ? "That doesn't look like a valid email"
      : '';
  const phoneErr = !PHONE_RE.test(phone.replace(/\s/g, ''))
    ? 'Enter a valid Nigerian number (e.g. 0803…)'
    : '';
  const passwordErr = !password
    ? 'Enter your password'
    : password.length < 6
      ? 'At least 6 characters'
      : '';

  async function onSubmit(): Promise<void> {
    setTouched({ name: true, email: true, phone: true, password: true });
    setFormError('');
    if (nameErr || emailErr || phoneErr || passwordErr) return;
    try {
      setLoading(true);
      await register({ name: name.trim(), email, password, role: 'landlord' });
      router.replace('/(tabs)');
    } catch {
      setFormError('Something went wrong. Please try again.');
      showToast('Could not create your account', 'alert');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll padded bottomSpace={spacing['3xl']}>
      <AppBar onBack={() => router.back()} right={<Logo size={30} showText={false} />} />

      <View style={{ marginTop: spacing['2xl'] }}>
        <Text variant="display" color={colors.ink} style={{ fontSize: 30, lineHeight: 32 }}>
          Create your account
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
        value="register"
        onChange={(v) => {
          if (v === 'login') router.replace('/(auth)/login');
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
          label="Full name"
          icon="user"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          placeholder="Adeola Balogun"
          error={touched.name ? nameErr : undefined}
        />
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
          label="Phone number"
          icon="phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="0803 000 0000"
          error={touched.phone ? phoneErr : undefined}
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

        <Card
          flat
          padding={13}
          style={{
            borderColor: 'transparent',
            backgroundColor: colors.surface2,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.md,
          }}
        >
          <View style={{ marginTop: 1 }}>
            <Icon name="idcard" size={18} color={colors.muted} />
          </View>
          <Text variant="caption" color={colors.muted} style={{ flex: 1, lineHeight: 18 }}>
            Caretakers added by a landlord verify with their{' '}
            <Text variant="caption" color={colors.ink} style={{ fontWeight: '600' }}>
              phone number or NIN
            </Text>{' '}
            at this step.
          </Text>
        </Card>

        <Button title="Create account" iconRight="fwd" loading={loading} onPress={onSubmit} />
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
