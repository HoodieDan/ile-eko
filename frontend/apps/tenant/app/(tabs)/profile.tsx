import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  AICard,
  Avatar,
  Card,
  Eyebrow,
  Icon,
  Screen,
  SegmentedControl,
  Text,
  colors,
  heroGradient,
  type IconName,
} from '@ile-eko/ui';
import { useAuth } from '@ile-eko/core';
import { areas, profile } from '@/data/mock';

const BUDGETS: ReadonlyArray<readonly [number, number, string]> = [
  [0, 600000, '≤ ₦600k'],
  [600000, 1200000, '₦600k–₦1.2M'],
  [1200000, 2500000, '₦1.2M–₦2.5M'],
  [2500000, 9e9, '₦2.5M+'],
];

const SIZE_OPTIONS = [
  { value: 'Studio / 1-bed', label: 'Studio / 1-bed' },
  { value: '2–3 bedroom', label: '2–3 bedroom' },
  { value: '4+ bedroom', label: '4+ bedroom' },
  { value: 'Any size', label: 'Any size' },
] as const;

type SizeValue = (typeof SIZE_OPTIONS)[number]['value'];

interface InfoRow {
  ic: IconName;
  label: string;
  value: string;
  chevron?: boolean;
}

export default function Profile(): React.ReactElement {
  const router = useRouter();
  const { logout } = useAuth();

  const [budget, setBudget] = useState<string>('₦600k–₦1.2M');
  const [areaSet, setAreaSet] = useState<Set<string>>(new Set(profile.areas));
  const isValidSize = SIZE_OPTIONS.some((o) => o.value === profile.size);
  const [size, setSize] = useState<SizeValue>(isValidSize ? (profile.size as SizeValue) : 'Any size');

  const toggleArea = (a: string): void => {
    setAreaSet((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  };

  const onLogout = async (): Promise<void> => {
    await logout();
    router.replace('/(auth)/login');
  };

  const infoRows: InfoRow[] = [
    { ic: 'phone', label: 'Phone', value: profile.phone },
    { ic: 'mail', label: 'Email', value: profile.email },
    { ic: 'settings', label: 'Settings & privacy', value: '', chevron: true },
  ];

  return (
    <Screen scroll padded bottomSpace={120}>
      <Text variant="h1" style={{ marginTop: 6, marginBottom: 16 }}>
        Profile
      </Text>

      {/* Header card — forest-green hero with avatar + identity */}
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 18 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar initials={profile.initials} size={50} tone="accent" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="title" color={colors.onPrimary} numberOfLines={1}>
              {profile.name}
            </Text>
            <Text
              variant="caption"
              color="rgba(255,255,255,0.85)"
              numberOfLines={1}
              style={{ marginTop: 2 }}
            >
              {profile.email}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* AI nudge — preferences power recommendations */}
      <AICard padding={14} style={{ marginTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="spark" size={18} color={colors.aiDeep} fill />
          <Text variant="caption" color={colors.ink} style={{ flex: 1, lineHeight: 18 }}>
            These preferences power your{' '}
            <Text variant="captionStrong" color={colors.ink}>
              Recommended for you
            </Text>{' '}
            matches.
          </Text>
        </View>
      </AICard>

      {/* Budget (per year) */}
      <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Budget (per year)</Eyebrow>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {BUDGETS.map(([, , label]) => {
          const on = budget === label;
          return (
            <Pressable
              key={label}
              onPress={() => setBudget(label)}
              style={{
                minHeight: 40,
                paddingHorizontal: 14,
                borderRadius: 999,
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: on ? colors.primary : colors.line,
                backgroundColor: on ? colors.primary : colors.surface,
              }}
            >
              <Text variant="captionStrong" color={on ? colors.onPrimary : colors.ink}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Preferred areas */}
      <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Preferred areas</Eyebrow>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {areas.map((a) => {
          const on = areaSet.has(a);
          return (
            <Pressable
              key={a}
              onPress={() => toggleArea(a)}
              style={{
                minHeight: 40,
                paddingHorizontal: 13,
                borderRadius: 999,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1.5,
                borderColor: on ? colors.primary : colors.line,
                backgroundColor: on ? colors.primaryTint : colors.surface,
              }}
            >
              {on ? <Icon name="check" size={13} color={colors.primary} strokeWidth={2.6} /> : null}
              <Text variant="captionStrong" color={on ? colors.primary : colors.ink}>
                {a}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Property size */}
      <Eyebrow style={{ marginTop: 22, marginBottom: 10 }}>Property size</Eyebrow>
      <SegmentedControl
        options={SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        value={size}
        onChange={(v) => setSize(v)}
      />

      {/* Account */}
      <Eyebrow style={{ marginTop: 24, marginBottom: 10 }}>Account</Eyebrow>
      <Card padding={0} style={{ paddingHorizontal: 16 }}>
        {infoRows.map((row, i) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 13,
              borderBottomWidth: i === infoRows.length - 1 ? 0 : 1,
              borderBottomColor: colors.line,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={row.ic} size={17} color={colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={colors.muted}>
                {row.label}
              </Text>
              {row.value ? (
                <Text variant="bodyStrong" style={{ marginTop: 1 }}>
                  {row.value}
                </Text>
              ) : null}
            </View>
            {row.chevron ? <Icon name="fwd" size={18} color={colors.muted} /> : null}
          </View>
        ))}
      </Card>

      {/* Sign out */}
      <Pressable
        onPress={onLogout}
        style={({ pressed }) => ({
          minHeight: 52,
          marginTop: 16,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          backgroundColor: colors.surface2,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Icon name="logout" size={19} color={colors.danger} strokeWidth={2} />
        <Text variant="button" color={colors.danger}>
          Sign out
        </Text>
      </Pressable>
    </Screen>
  );
}
