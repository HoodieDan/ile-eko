import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';
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
  Timeline,
  TimelineItem,
  PropertyThumb,
  useToast,
  colors,
  spacing,
  radii,
  type ChipTone,
  type IconName,
} from '@ile-eko/ui';
import { getTenant, getProperty, naira, type PaymentState, type TenantRisk } from '@/data/mock';

const RISK_STYLE: Record<TenantRisk['level'], { color: string; tint: string }> = {
  Low: { color: colors.ok, tint: colors.okTint },
  Watch: { color: colors.warn, tint: colors.warnTint },
  High: { color: colors.danger, tint: colors.dangerTint },
};

const PAY_STATE: Record<
  PaymentState,
  { tone: ChipTone; icon: IconName; label: string; dot: string }
> = {
  paid: { tone: 'ok', icon: 'check', label: 'Paid', dot: colors.ok },
  confirmed: { tone: 'ok', icon: 'check', label: 'Confirmed', dot: colors.ok },
  late: { tone: 'warn', icon: 'clock', label: 'Late', dot: colors.warn },
  overdue: { tone: 'danger', icon: 'alert', label: 'Overdue', dot: colors.danger },
  due: { tone: 'warn', icon: 'clock', label: 'Due', dot: colors.warn },
  pending: { tone: 'warn', icon: 'clock', label: 'Pending', dot: colors.warn },
  partial: { tone: 'info', icon: 'half', label: 'Partial', dot: colors.info },
};

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

  const t = getTenant(id);
  if (!t) return null;

  const prop = getProperty(t.propertyId);
  const risk = RISK_STYLE[t.risk.level];

  return (
    <>
      <Screen scroll padded bottomSpace={140}>
        <AppBar
          title="Tenant"
          onBack={() => router.back()}
          right={<IconButton name="settings" variant="surface" />}
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
          <Avatar initials={t.initials} size={62} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h2" numberOfLines={1}>
              {t.name}
            </Text>
            <View style={{ marginTop: spacing.xs, flexDirection: 'row' }}>
              <StatusChip status={t.status} />
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
            <PropertyThumb size={48} radius={radii.md} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="label" color={colors.muted}>
                RENTS
              </Text>
              <Text variant="bodyStrong" numberOfLines={1} style={{ marginTop: 1 }}>
                {prop.address}
                {t.unit ? ` · ${t.unit}` : ''}
              </Text>
              <Text variant="caption" color={colors.muted} numberOfLines={1}>
                {t.area} · {t.type}
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
              onPress={() => showToast(`Calling ${t.name}`)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Message"
              variant="secondary"
              size="sm"
              icon="message"
              onPress={() => showToast(`Message to ${t.name}`)}
            />
          </View>
        </View>

        {/* Contact details */}
        <Card padding={0} style={{ marginTop: spacing.md, paddingHorizontal: spacing.lg }}>
          <InfoRow icon="phone" label="Phone" value={t.phone} />
          <InfoRow icon="mail" label="Email" value={t.email} last />
        </Card>

        {/* AI default risk */}
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
                {t.risk.level}
              </Text>
            </View>
          </View>
          <Text variant="body" color={colors.ink} style={{ marginTop: spacing.sm, lineHeight: 21 }}>
            {t.risk.reason}
          </Text>
        </AICard>

        {/* Lease & rent */}
        <Text variant="title" style={{ marginTop: spacing['2xl'], marginBottom: spacing.md }}>
          Lease & rent
        </Text>
        <Card>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              rowGap: spacing.lg,
              justifyContent: 'space-between',
            }}
          >
            <Fact k="Annual rent" v={naira(t.rent)} />
            <Fact k="Schedule" v={t.schedule} />
            <Fact k="Lease start" v={t.leaseStart} />
            <Fact k="Lease end" v={t.leaseEnd} />
            <Fact k="Moved in" v={t.moveIn} />
            <Fact k="Property" v={t.area} />
          </View>
        </Card>

        {/* Payment history */}
        <Text variant="title" style={{ marginTop: spacing['2xl'], marginBottom: spacing.md }}>
          Payment history
        </Text>
        <Card>
          <Timeline>
            {t.history.map((h, i) => {
              const m = PAY_STATE[h.state];
              const last = i === t.history.length - 1;
              return (
                <TimelineItem key={`${h.period}-${i}`} icon={m.icon} iconColor={m.dot} last={last}>
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
                        {h.period}
                      </Text>
                      <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
                        {h.date}
                        {h.method && h.method !== '—' ? ` · ${h.method}` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="bodyStrong">{naira(h.amount)}</Text>
                      <View style={{ marginTop: 3 }}>
                        <Chip label={m.label} tone={m.tone} icon={m.icon} />
                      </View>
                    </View>
                  </View>
                </TimelineItem>
              );
            })}
          </Timeline>
        </Card>
      </Screen>

      {/* Sticky log-payment action */}
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
          onPress={() => router.push('/payments/log')}
        />
      </View>
    </>
  );
}
