import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, View } from 'react-native';
import {
  Screen,
  AppBar,
  Text,
  Card,
  AICard,
  AILabel,
  Chip,
  StatusChip,
  Avatar,
  Button,
  Icon,
  IconButton,
  BottomSheet,
  Timeline,
  TimelineItem,
  EmptyState,
  PropertyThumb,
  useToast,
  colors,
  spacing,
  radii,
  type StatusKind,
} from '@ile-eko/ui';
import {
  useTenant,
  useProperty,
  useEvictTenant,
  naira,
  initialsOf,
  type TenantDTO,
  type PaymentReceiptDTO,
} from '@ile-eko/core';
import { openTenantContact, type TenantContactChannel } from '@/contact/tenantContact';
import { LogPaymentSheet } from '@/payments/LogPaymentSheet';

type RiskBand = NonNullable<TenantDTO['risk']>['band'];

const RISK_STYLE: Record<RiskBand, { label: string; color: string; tint: string }> = {
  low: { label: 'Low', color: colors.ok, tint: colors.okTint },
  medium: { label: 'Watch', color: colors.warn, tint: colors.warnTint },
  high: { label: 'High', color: colors.danger, tint: colors.dangerTint },
};

const METHOD_LABEL: Record<PaymentReceiptDTO['method'], string> = {
  cash: 'Cash',
  transfer: 'Bank transfer',
  card: 'POS / card',
  other: 'Other',
};

function tenantChip(status: TenantDTO['status']): StatusKind {
  if (status === 'up-to-date') return 'paid';
  if (status === 'no-lease') return 'pending';
  return status;
}

function cap(s?: string): string {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: 'phone' | 'mail';
  label: string;
  value: string;
  last?: boolean;
}): React.ReactElement {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radii.sm,
          backgroundColor: colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={17} color={colors.muted} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="caption" color={colors.muted}>
          {label}
        </Text>
        <Text variant="bodyMedium" style={{ marginTop: 1 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Fact({ k, v }: { k: string; v: string }): React.ReactElement {
  return (
    <View style={{ width: '48%' }}>
      <Text variant="caption" color={colors.muted}>
        {k}
      </Text>
      <Text variant="bodyStrong" style={{ marginTop: 3 }}>
        {v}
      </Text>
    </View>
  );
}

export default function TenantDetailScreen(): React.ReactElement | null {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { showToast } = useToast();
  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const [logPaymentVisible, setLogPaymentVisible] = React.useState(false);
  const evictTenant = useEvictTenant();

  const { data: t, isLoading, isError, refetch } = useTenant(id);
  const { data: prop } = useProperty(t?.propertyId ?? t?.previousPropertyId);

  const contact = async (channel: TenantContactChannel): Promise<void> => {
    const opened = await openTenantContact(channel, t?.phone);
    if (!opened) {
      showToast(
        channel === 'call' ? "Couldn't open the phone dialler" : "Couldn't open messages",
        'alert',
      );
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AppBar title="Tenant" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  // Error or not-found: never a blank screen — always a way back plus a retry.
  if (isError || !t) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <AppBar title="Tenant" onBack={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl }}>
          <EmptyState
            icon="alert"
            title="Couldn't load this tenant"
            message="Check your connection and try again."
          />
          <Button title="Try again" variant="secondary" onPress={() => void refetch()} />
        </View>
      </View>
    );
  }

  const risk = t.risk ? RISK_STYLE[t.risk.band] : null;

  const confirmEviction = (): void => {
    Alert.alert(
      'Evict tenant?',
      `This ends ${t.fullName}'s active lease and makes the property or unit vacant. Payment history will be kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Evict tenant',
          style: 'destructive',
          onPress: () => {
            evictTenant.mutate(t.id, {
              onSuccess: () => {
                setSettingsVisible(false);
                showToast('Tenant moved to eviction history');
              },
              onError: () => showToast('Could not evict tenant', 'alert'),
            });
          },
        },
      ],
    );
  };

  return (
    <>
      <Screen scroll padded bottomSpace={t.lifecycle === 'current' ? 140 : 40}>
        <AppBar
          title="Tenant"
          onBack={() => router.back()}
          right={
            <IconButton
              name="settings"
              variant="surface"
              accessibilityLabel="Tenant settings"
              onPress={() => setSettingsVisible(true)}
            />
          }
        />

        {/* Identity */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.lg,
            marginTop: spacing.md,
          }}
        >
          <Avatar initials={initialsOf(t.fullName)} size={62} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h2" numberOfLines={1}>
              {t.fullName}
            </Text>
            <View style={{ marginTop: spacing.xs, flexDirection: 'row' }}>
              {t.lifecycle === 'evicted' ? (
                <Chip label="Evicted" tone="danger" icon="door" />
              ) : t.lifecycle === 'unassigned' ? (
                <Chip label="Unassigned" tone="warn" icon="alert" />
              ) : (
                <StatusChip status={tenantChip(t.status)} />
              )}
            </View>
          </View>
        </View>

        {/* Assigned property */}
        {prop ? (
          <Card
            flat
            padding={13}
            onPress={() => router.push(`/properties/${prop.id}`)}
            style={{
              marginTop: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            <PropertyThumb size={48} radius={radii.md} imageUrl={prop.images[0]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="label" color={colors.muted}>
                RENTS
              </Text>
              <Text variant="bodyStrong" numberOfLines={1} style={{ marginTop: 1 }}>
                {prop.propertyTitle}
              </Text>
              <Text variant="caption" color={colors.muted} numberOfLines={1}>
                {prop.area} · {prop.propertyType}
              </Text>
            </View>
            <Icon name="fwd" size={18} color={colors.muted} />
          </Card>
        ) : null}

        {/* Contact actions */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Call"
              variant="secondary"
              size="sm"
              icon="phone"
              onPress={() => void contact('call')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Message"
              variant="secondary"
              size="sm"
              icon="message"
              onPress={() => void contact('message')}
            />
          </View>
        </View>

        {/* Contact details */}
        <Card padding={0} style={{ marginTop: spacing.md, paddingHorizontal: spacing.lg }}>
          <InfoRow icon="phone" label="Phone" value={t.phone} />
          <InfoRow icon="mail" label="Email" value={t.email ?? '—'} last />
        </Card>

        {/* AI default risk */}
        {risk && t.lifecycle === 'current' ? (
          <AICard style={{ marginTop: spacing['2xl'] }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AILabel>Default risk</AILabel>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: radii.pill,
                  backgroundColor: risk.tint,
                }}
              >
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: radii.pill,
                    backgroundColor: risk.color,
                  }}
                />
                <Text variant="captionStrong" color={risk.color}>
                  {risk.label}
                </Text>
              </View>
            </View>
            <Text
              variant="body"
              color={colors.ink}
              style={{ marginTop: spacing.sm, lineHeight: 21 }}
            >
              {t.risk?.reason}
            </Text>
          </AICard>
        ) : null}

        {/* Lease & rent */}
        <Text variant="title" style={{ marginTop: spacing['2xl'], marginBottom: spacing.md }}>
          {t.lifecycle === 'current'
            ? 'Lease & rent'
            : t.lifecycle === 'evicted'
              ? 'Former tenancy'
              : 'Tenancy'}
        </Text>
        {t.lifecycle === 'current' ? (
          <Card>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                rowGap: spacing.lg,
                justifyContent: 'space-between',
              }}
            >
              <Fact k="Annual rent" v={naira(t.rentAmount ?? 0)} />
              <Fact k="Schedule" v={cap(t.paymentSchedule)} />
              <Fact k="Lease start" v={fmtDate(t.leaseStartDate)} />
              <Fact k="Lease end" v={fmtDate(t.leaseEndDate)} />
              <Fact k="Next due" v={fmtDate(t.paymentDueDate)} />
              <Fact k="Property" v={prop?.area ?? '—'} />
            </View>
          </Card>
        ) : (
          <Card>
            <Text variant="bodyStrong">
              {t.lifecycle === 'evicted'
                ? (prop?.propertyTitle ?? 'Previous property')
                : 'No property assigned'}
            </Text>
            <Text variant="caption" color={colors.muted} style={{ marginTop: 4 }}>
              {t.lifecycle === 'evicted'
                ? 'The lease has ended. Payment history remains available below.'
                : 'Add a lease when this tenant moves into a property or unit.'}
            </Text>
          </Card>
        )}

        {/* Payment history */}
        <Text variant="title" style={{ marginTop: spacing['2xl'], marginBottom: spacing.md }}>
          Payment history
        </Text>
        <Card>
          {t.history.length === 0 ? (
            <Text variant="caption" color={colors.muted}>
              No payments logged yet.
            </Text>
          ) : (
            <Timeline>
              {t.history.map((h, i) => {
                const last = i === t.history.length - 1;
                return (
                  <TimelineItem key={h.id} icon="check" iconColor={colors.ok} last={last}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: spacing.md,
                      }}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>
                          {h.periodCovered ?? 'Rent payment'}
                        </Text>
                        <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
                          {fmtDate(h.paidAt)} · {METHOD_LABEL[h.method]}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text variant="bodyStrong">{naira(h.amount)}</Text>
                        <View style={{ marginTop: 3 }}>
                          <Chip label="Confirmed" tone="ok" icon="check" />
                        </View>
                      </View>
                    </View>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </Card>
      </Screen>

      {t.lifecycle === 'current' ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: spacing.xl,
            paddingTop: spacing.md,
            paddingBottom: spacing['2xl'],
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.line,
          }}
        >
          <Button
            title="Log payment"
            variant="primary"
            icon="plus"
            onPress={() => setLogPaymentVisible(true)}
          />
        </View>
      ) : null}

      <LogPaymentSheet
        tenant={logPaymentVisible ? t : null}
        property={prop ?? undefined}
        onClose={() => setLogPaymentVisible(false)}
      />

      <BottomSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        title="Tenant settings"
      >
        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          <Button
            title="Edit tenant details"
            variant="secondary"
            icon="settings"
            onPress={() => {
              setSettingsVisible(false);
              router.push({ pathname: '/tenants/add', params: { id: t.id } });
            }}
          />
          {t.lifecycle === 'current' ? (
            <Button
              title="Evict tenant"
              variant="destructive"
              icon="door"
              loading={evictTenant.isPending}
              onPress={confirmEviction}
            />
          ) : null}
          {t.lifecycle === 'current' ? (
            <Text variant="caption" color={colors.muted} center>
              Eviction preserves the tenant and payment history.
            </Text>
          ) : null}
        </View>
      </BottomSheet>
    </>
  );
}
