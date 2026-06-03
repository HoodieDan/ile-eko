import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@ile-eko/core';
import {
  Screen,
  Text,
  Card,
  Avatar,
  Chip,
  Icon,
  colors,
  spacing,
  radii,
  heroGradient,
  type IconName,
} from '@ile-eko/ui';
import { landlord, tenants, enquiries } from '@/data/mock';

interface AccountRow {
  icon: IconName;
  label: string;
  sub: string;
  route?: string;
  soon?: boolean;
  badge?: number;
}

function RowTile({ name }: { name: IconName }): React.ReactElement {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: radii.md,
        backgroundColor: colors.surface2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} size={20} color={colors.ink} />
    </View>
  );
}

export default function AccountTab(): React.ReactElement {
  const router = useRouter();
  const { logout } = useAuth();

  const unread = enquiries.filter((e) => !e.read).length;

  const rows: AccountRow[] = [
    { icon: 'user', label: 'Account & profile', sub: landlord.name },
    { icon: 'users', label: 'Tenants', sub: `${tenants.length} across your portfolio`, route: '/tenants' },
    {
      icon: 'message',
      label: 'Enquiries',
      sub: `${unread} unread from the marketplace`,
      route: '/enquiries',
      badge: unread,
    },
    { icon: 'idcard', label: 'Verification & KYC', sub: 'Verified · NIN on file' },
    { icon: 'building', label: 'Marketplace listings', sub: "Vacant units you've published", soon: true },
    { icon: 'doc', label: 'Documents & leases', sub: 'Agreements, receipts', soon: true },
    { icon: 'settings', label: 'Settings & security', sub: 'Password, devices' },
  ];

  const handleSignOut = async (): Promise<void> => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <Screen scroll padded bottomSpace={120}>
      <Text variant="display" style={{ fontSize: 28, marginTop: 6, marginBottom: spacing.lg }}>
        Account
      </Text>

      {/* Hero-gradient profile card */}
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: radii.card, padding: spacing.lg }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar initials={landlord.initials} size={50} tone="solid" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h3" color="#FFFFFF" numberOfLines={1}>
              {landlord.name}
            </Text>
            <Text variant="caption" color="rgba(255,255,255,0.82)" numberOfLines={1}>
              Managing from {landlord.location}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Account rows */}
      <Card padding={0} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.lg }}>
        {rows.map((r, i) => (
          <Pressable
            key={r.label}
            onPress={r.route ? () => router.push(r.route as never) : undefined}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 15,
              minHeight: 44,
              borderBottomWidth: i < rows.length - 1 ? 1 : 0,
              borderBottomColor: colors.line,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, flexShrink: 1 }}>
              <RowTile name={r.icon} />
              <View style={{ flexShrink: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {r.label}
                </Text>
                <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
                  {r.sub}
                </Text>
              </View>
            </View>
            {r.soon ? (
              <Chip label="Soon" tone="neutral" />
            ) : r.badge ? (
              <View
                style={{
                  minWidth: 20,
                  height: 20,
                  paddingHorizontal: 6,
                  borderRadius: radii.pill,
                  backgroundColor: colors.danger,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="captionStrong" color="#FFFFFF" style={{ fontSize: 11 }}>
                  {r.badge}
                </Text>
              </View>
            ) : (
              <Icon name="fwd" size={18} color={colors.muted} />
            )}
          </Pressable>
        ))}
      </Card>

      {/* Sign out — ghost button colored danger */}
      <Pressable
        onPress={() => {
          void handleSignOut();
        }}
        style={({ pressed }) => ({
          minHeight: 52,
          borderRadius: radii.button,
          paddingHorizontal: spacing.xl,
          marginTop: spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 9,
          backgroundColor: colors.surface2,
          transform: [{ scale: pressed ? 0.978 : 1 }],
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
