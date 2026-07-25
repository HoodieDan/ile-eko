import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  AICard,
  AILabel,
  AppBar,
  Avatar,
  BottomSheet,
  Button,
  Card,
  EmptyState,
  Icon,
  Input,
  Screen,
  StatusChip,
  Text,
  colors,
  spacing,
  radii,
  useToast,
  type StatusKind,
} from '@ile-eko/ui';
import {
  api,
  useProperties,
  usePaymentsSummary,
  useTenants,
  useLogPayment,
  initialsOf,
  naira,
  nairaShort,
  type TenantDTO,
  type PropertyDTO,
  type PaymentReceiptDTO,
} from '@ile-eko/core';

type PaymentMethod = NonNullable<PaymentReceiptDTO['method']>;
type Filter = 'all' | 'overdue' | 'due' | 'paid' | 'vacant';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'due', label: 'Due soon' },
  { id: 'paid', label: 'Paid' },
  { id: 'vacant', label: 'No lease' },
];

const EMPTY_SUMMARY = {
  collected: 0,
  rollAnnual: 0,
  overdueAmt: 0,
  dueAmt: 0,
  vacantAmt: 0,
  occupied: 0,
  total: 0,
  occupancyPct: 0,
  collectedPct: 0,
};

/** Which filter bucket a tenant's lifecycle status belongs to. */
function bucketOf(status: TenantDTO['status']): Filter | null {
  if (status === 'overdue') return 'overdue';
  if (status === 'due') return 'due';
  if (status === 'up-to-date') return 'paid';
  if (status === 'no-lease') return 'vacant';
  return null; // 'partial' shows under "All" only
}

function tenantChip(status: TenantDTO['status']): StatusKind {
  if (status === 'up-to-date') return 'paid';
  if (status === 'no-lease') return 'vacant';
  return status;
}

function daysUntil(iso?: string): number | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return Math.round((d.getTime() - Date.now()) / 86_400_000);
}

export default function LogPayment(): React.ReactElement {
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>('all');
  const [target, setTarget] = useState<TenantDTO | null>(null);

  const { data: summary = EMPTY_SUMMARY } = usePaymentsSummary();
  const { data: tenants = [], isLoading } = useTenants();
  const { data: properties = [] } = useProperties();

  const propById = useMemo(() => {
    const map = new Map<string, PropertyDTO>();
    for (const p of properties) map.set(p.id, p);
    return map;
  }, [properties]);

  const collected = summary.collected;
  const outstanding = summary.overdueAmt + summary.dueAmt;

  const counts = useMemo<Record<Filter, number>>(() => {
    const c: Record<Filter, number> = { all: tenants.length, paid: 0, due: 0, overdue: 0, vacant: 0 };
    for (const t of tenants) {
      const b = bucketOf(t.status);
      if (b) c[b] += 1;
    }
    return c;
  }, [tenants]);

  const riskTenant = useMemo(() => tenants.find((t) => t.risk?.band === 'high'), [tenants]);
  const riskProp = riskTenant?.propertyId ? propById.get(riskTenant.propertyId) : undefined;

  const list = useMemo(
    () => tenants.filter((t) => (filter === 'all' ? true : bucketOf(t.status) === filter)),
    [tenants, filter],
  );

  const activeFilter = FILTERS.find((f) => f.id === filter);

  return (
    <Screen scroll padded bottomSpace={120}>
      <AppBar
        title="Rent & payments"
        subtitle="Current cycle"
        onBack={() => router.back()}
      />

      {/* Summary tiles */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
        <Card padding={16} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Icon name="checkCircle" size={16} color={colors.ok} strokeWidth={2.2} />
            <Text variant="label" color={colors.ok}>
              Collected
            </Text>
          </View>
          <Text variant="display" style={{ fontSize: 23, lineHeight: 27, marginTop: 8 }}>
            {naira(collected)}
          </Text>
        </Card>
        <Card padding={16} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Icon name="clock" size={16} color={colors.danger} strokeWidth={2.2} />
            <Text variant="label" color={colors.danger}>
              Outstanding
            </Text>
          </View>
          <Text variant="display" style={{ fontSize: 23, lineHeight: 27, marginTop: 8 }}>
            {outstanding ? naira(outstanding) : '₦0'}
          </Text>
        </Card>
      </View>

      {/* AI default-prediction banner */}
      {riskTenant ? (
        <AICard
          onPress={() =>
            router.push(
              riskTenant.propertyId
                ? `/properties/${riskTenant.propertyId}`
                : `/tenants/${riskTenant.id}`,
            )
          }
          style={{ marginTop: spacing.md }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: colors.ai,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="spark" size={20} color={colors.onAi} fill />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AILabel>Default prediction</AILabel>
              <Text variant="bodyStrong" style={{ marginTop: 5 }}>
                {riskTenant.fullName} is {riskTenant.risk?.score ?? 0}% likely to default
              </Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 3 }}>
                {riskProp ? `${riskProp.propertyTitle}, ${riskProp.area}` : 'Review this tenant'}
              </Text>
            </View>
            <Icon name="fwd" size={18} color={colors.aiDeep} style={{ marginTop: 4 }} />
          </View>
        </AICard>
      ) : null}

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -spacing.xl, marginTop: spacing.lg }}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingBottom: 2,
        }}
      >
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={{
                minHeight: 44,
                paddingHorizontal: 15,
                borderRadius: radii.pill,
                borderWidth: 1.5,
                borderColor: on ? colors.primary : colors.line,
                backgroundColor: on ? colors.primary : colors.surface,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <Text variant="captionStrong" color={on ? colors.onPrimary : colors.ink}>
                {f.label}
              </Text>
              <Text
                variant="captionStrong"
                color={on ? colors.onPrimary : colors.ink}
                style={{ fontSize: 11, opacity: 0.7 }}
              >
                {counts[f.id]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List / empty */}
      <View style={{ marginTop: spacing.lg }}>
        {isLoading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : list.length === 0 ? (
          <EmptyState
            icon="checkCircle"
            title="All clear here"
            message={`No tenants match "${activeFilter ? activeFilter.label : ''}".`}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {list.map((t) => {
              const prop = t.propertyId ? propById.get(t.propertyId) : undefined;
              const actionable = t.status === 'overdue' || t.status === 'due' || t.status === 'partial';
              const dd = daysUntil(t.paymentDueDate);
              const days =
                t.status === 'overdue' && dd != null
                  ? Math.abs(dd)
                  : t.status === 'due' && dd != null
                    ? dd
                    : undefined;
              return (
                <Card key={t.id} padding={14}>
                  <Pressable
                    onPress={() => router.push(`/tenants/${t.id}`)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                  >
                    {t.status === 'no-lease' ? (
                      <View
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: radii.md,
                          backgroundColor: colors.surface2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon name="door" size={20} color={colors.muted} />
                      </View>
                    ) : (
                      <Avatar initials={initialsOf(t.fullName)} size={46} />
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {t.fullName}
                      </Text>
                      <Text
                        variant="caption"
                        color={colors.muted}
                        numberOfLines={1}
                        style={{ marginTop: 1 }}
                      >
                        {prop ? `${prop.area} · ` : ''}
                        {nairaShort(t.rentAmount ?? 0)}/yr
                      </Text>
                    </View>
                    <StatusChip status={tenantChip(t.status)} days={days} />
                  </Pressable>
                  {actionable ? (
                    <Button
                      title={`Record ${naira(t.rentAmount ?? 0)} payment`}
                      icon="plus"
                      size="sm"
                      onPress={() => setTarget(t)}
                      style={{ marginTop: spacing.md }}
                    />
                  ) : null}
                </Card>
              );
            })}
          </View>
        )}
      </View>

      {/* Log payment sheet */}
      <LogPaymentSheet
        tenant={target}
        property={target?.propertyId ? propById.get(target.propertyId) : undefined}
        onClose={() => setTarget(null)}
      />
    </Screen>
  );
}

interface MethodOption {
  id: PaymentMethod;
  label: string;
}

const METHODS: MethodOption[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'transfer', label: 'Bank transfer' },
  { id: 'card', label: 'POS / card' },
  { id: 'other', label: 'Mobile / other' },
];

const MARK_OPTIONS: { v: string; l: string }[] = [
  { v: 'confirmed', l: 'Confirmed' },
  { v: 'partial', l: 'Partial' },
];

interface LogPaymentSheetProps {
  tenant: TenantDTO | null;
  property: PropertyDTO | undefined;
  onClose: () => void;
}

function LogPaymentSheet({ tenant, property, onClose }: LogPaymentSheetProps): React.ReactElement {
  const { showToast } = useToast();
  const logPayment = useLogPayment();

  const name = tenant?.fullName ?? 'No tenant';
  const where = property ? `${property.propertyTitle}, ${property.area}` : undefined;
  const initials = tenant ? initialsOf(tenant.fullName) : '—';

  // A payment needs a leaseId: use the tenant's active lease (works for a first
  // payment), falling back to the most recent receipt's lease.
  const { data: paymentsEnvelope } = useQuery<{ items: PaymentReceiptDTO[] }>({
    queryKey: ['payments', 'tenant', tenant?.id],
    enabled: Boolean(tenant),
    queryFn: () =>
      api.get<{ items: PaymentReceiptDTO[] }>('/payments', { query: { tenantId: tenant!.id } }),
  });
  const leaseId = tenant?.leaseId ?? paymentsEnvelope?.items?.[0]?.leaseId;

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [period, setPeriod] = useState('Current cycle');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('confirmed');
  const [touched, setTouched] = useState(false);

  // Re-seed the amount whenever a new tenant opens the sheet.
  const seedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (tenant && seedRef.current !== tenant.id) {
      seedRef.current = tenant.id;
      setAmount(String(tenant.rentAmount ?? ''));
      setMethod('transfer');
      setPeriod('Current cycle');
      setDate(new Date().toISOString().slice(0, 10));
      setStatus('confirmed');
      setTouched(false);
    }
    if (!tenant) seedRef.current = null;
  }, [tenant]);

  const num = Number(amount.replace(/[^\d]/g, ''));
  const err = !num ? 'Enter an amount' : num < 1000 ? 'Amount looks too small' : '';

  function confirm(): void {
    setTouched(true);
    if (err) return;
    if (!leaseId) {
      showToast('No active lease to log against');
      return;
    }
    logPayment.mutate(
      {
        leaseId,
        amount: num,
        paidAt: date,
        method,
        periodCovered: period,
      },
      {
        onSuccess: () => {
          onClose();
          showToast('Payment logged');
        },
        onError: () => showToast('Could not log payment'),
      },
    );
  }

  return (
    <BottomSheet visible={tenant !== null} onClose={onClose} title="Log payment" scroll>
      {/* Tenant / property card */}
      <Card
        flat
        padding={0}
        style={{
          marginTop: spacing.lg,
          marginBottom: spacing.lg,
          paddingVertical: 11,
          paddingHorizontal: 13,
          backgroundColor: colors.surface2,
          borderWidth: 0,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <Avatar initials={initials} size={40} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {name}
            </Text>
            <Text variant="caption" color={colors.muted} numberOfLines={1}>
              {where}
            </Text>
          </View>
        </View>
      </Card>

      {/* Amount */}
      <Input
        label="Amount received"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
        error={touched && err ? err : undefined}
      />

      {/* Payment date / Period covered */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
        <Input
          label="Payment date"
          value={date}
          onChangeText={setDate}
          containerStyle={{ flex: 1 }}
        />
        <Input
          label="Period covered"
          value={period}
          onChangeText={setPeriod}
          containerStyle={{ flex: 1 }}
        />
      </View>

      {/* Method */}
      <View style={{ marginTop: spacing.lg }}>
        <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13, marginBottom: 7 }}>
          Method
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
          {METHODS.map((m) => {
            const on = m.id === method;
            return (
              <Pressable
                key={m.id}
                onPress={() => setMethod(m.id)}
                style={{
                  flexGrow: 1,
                  flexBasis: '47%',
                  minHeight: 46,
                  borderRadius: radii.md,
                  borderWidth: 1.5,
                  borderColor: on ? colors.primary : colors.line,
                  backgroundColor: on ? colors.primaryTint : colors.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                }}
              >
                {on ? (
                  <Icon name="check" size={15} color={colors.primary} strokeWidth={2.4} />
                ) : null}
                <Text variant="captionStrong" color={on ? colors.primary : colors.ink}>
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Receipt */}
      <View style={{ marginTop: spacing.lg }}>
        <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13, marginBottom: 7 }}>
          Receipt
        </Text>
        <Pressable
          style={{
            minHeight: 56,
            borderRadius: radii.input,
            borderWidth: 1.6,
            borderStyle: 'dashed',
            borderColor: colors.line,
            backgroundColor: colors.surface2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
          }}
        >
          <Icon name="image" size={19} color={colors.muted} />
          <Text variant="captionStrong" color={colors.muted}>
            Attach receipt photo
          </Text>
        </Pressable>
      </View>

      {/* Mark as */}
      <View style={{ marginTop: spacing.lg }}>
        <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13, marginBottom: 7 }}>
          Mark as
        </Text>
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surface2,
            borderRadius: radii.md,
            padding: 4,
            gap: 4,
          }}
        >
          {MARK_OPTIONS.map((o) => {
            const on = status === o.v;
            return (
              <Pressable
                key={o.v}
                onPress={() => setStatus(o.v)}
                style={[
                  {
                    flex: 1,
                    minHeight: 42,
                    borderRadius: 9,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? colors.surface : 'transparent',
                  },
                  on
                    ? {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.12,
                        shadowRadius: 2,
                        elevation: 1,
                      }
                    : null,
                ]}
              >
                <Text variant="captionStrong" color={on ? colors.ink : colors.muted}>
                  {o.l}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        title={`Log ${naira(num)}`}
        onPress={confirm}
        loading={logPayment.isPending}
        style={{ marginTop: spacing.lg }}
      />
    </BottomSheet>
  );
}
