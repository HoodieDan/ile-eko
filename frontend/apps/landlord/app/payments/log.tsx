import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
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
} from '@ile-eko/ui';
import { properties, summary, naira, nairaShort, type Property, type PropertyStatus } from '@/data/mock';

type Filter = 'all' | PropertyStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'due', label: 'Due soon' },
  { id: 'paid', label: 'Paid' },
  { id: 'vacant', label: 'Vacant' },
];

export default function LogPayment(): React.ReactElement {
  const router = useRouter();

  const [filter, setFilter] = useState<Filter>('all');
  const [target, setTarget] = useState<Property | null>(null);

  const collected = summary.collected;
  const outstanding = summary.overdueAmt + summary.dueAmt;

  const counts = useMemo<Record<Filter, number>>(() => {
    const c: Record<Filter, number> = { all: properties.length, paid: 0, due: 0, overdue: 0, vacant: 0 };
    properties.forEach((p) => {
      const st = p.status ?? 'vacant';
      c[st] += 1;
    });
    return c;
  }, []);

  const riskProp = useMemo(() => properties.find((p) => p.status === 'overdue'), []);

  const list = useMemo(
    () => properties.filter((p) => (filter === 'all' ? true : (p.status ?? 'vacant') === filter)),
    [filter],
  );

  const activeFilter = FILTERS.find((f) => f.id === filter);

  return (
    <Screen scroll padded bottomSpace={120}>
      <AppBar title="Rent & payments" subtitle="Current cycle · 2025 – 2026" onBack={() => router.back()} />

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
      {riskProp && riskProp.tenant ? (
        <AICard onPress={() => router.push(`/properties/${riskProp.id}`)} style={{ marginTop: spacing.md }}>
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
                {riskProp.tenant.name} is {riskProp.risk ?? 0}% likely to default
              </Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 3 }}>
                {riskProp.address}, {riskProp.area}
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
        contentContainerStyle={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: 2 }}
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
              <Text variant="captionStrong" color={on ? colors.onPrimary : colors.ink} style={{ fontSize: 11, opacity: 0.7 }}>
                {counts[f.id]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List / empty */}
      <View style={{ marginTop: spacing.lg }}>
        {list.length === 0 ? (
          <EmptyState
            icon="checkCircle"
            title="All clear here"
            message={`No properties match "${activeFilter ? activeFilter.label : ''}".`}
          />
        ) : (
          <View style={{ gap: spacing.md }}>
            {list.map((p) => {
              const st = p.status ?? 'vacant';
              const actionable = st === 'overdue' || st === 'due';
              const days = st === 'overdue' ? p.overdueDays : st === 'due' ? p.lease?.daysToDue : undefined;
              return (
                <Card key={p.id} padding={14}>
                  <Pressable
                    onPress={() => router.push(`/properties/${p.id}`)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                  >
                    {st === 'vacant' || !p.tenant ? (
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
                      <Avatar initials={p.tenant.initials} size={46} />
                    )}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {p.tenant ? p.tenant.name : 'No tenant'}
                      </Text>
                      <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
                        {p.area} · {nairaShort(p.rent)}/yr
                      </Text>
                    </View>
                    <StatusChip status={st} days={days ?? undefined} />
                  </Pressable>
                  {actionable ? (
                    <Button
                      title={`Record ${naira(p.rent)} payment`}
                      icon="plus"
                      size="sm"
                      onPress={() => setTarget(p)}
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
        property={target}
        onClose={() => setTarget(null)}
      />
    </Screen>
  );
}

interface MethodOption {
  id: string;
  label: string;
}

const METHODS: MethodOption[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'transfer', label: 'Bank transfer' },
  { id: 'pos', label: 'POS / card' },
  { id: 'mobile', label: 'Mobile money' },
];

const MARK_OPTIONS: { v: string; l: string }[] = [
  { v: 'confirmed', l: 'Confirmed' },
  { v: 'partial', l: 'Partial' },
];

interface LogPaymentSheetProps {
  property: Property | null;
  onClose: () => void;
}

function LogPaymentSheet({ property, onClose }: LogPaymentSheetProps): React.ReactElement {
  const { showToast } = useToast();

  const baseRent = property ? property.rent : 0;
  const name = property?.tenant ? property.tenant.name : 'No tenant';
  const where = property ? `${property.address}, ${property.area}` : undefined;
  const initials = property?.tenant ? property.tenant.initials : '—';

  const [amount, setAmount] = useState(String(baseRent));
  const [method, setMethod] = useState('transfer');
  const [period, setPeriod] = useState('2025 – 2026 (annual)');
  const [date, setDate] = useState('2026-06-02');
  const [status, setStatus] = useState('confirmed');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Re-seed the amount whenever a new property opens the sheet.
  const seedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (property && seedRef.current !== property.id) {
      seedRef.current = property.id;
      setAmount(String(property.rent));
      setMethod('transfer');
      setPeriod('2025 – 2026 (annual)');
      setDate('2026-06-02');
      setStatus('confirmed');
      setTouched(false);
      setSubmitting(false);
    }
    if (!property) seedRef.current = null;
  }, [property]);

  const num = Number(amount.replace(/[^\d]/g, ''));
  const err = !num ? 'Enter an amount' : num < 1000 ? 'Amount looks too small' : '';

  function confirm(): void {
    setTouched(true);
    if (err) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
      showToast('Payment logged');
    }, 1000);
  }

  return (
    <BottomSheet visible={property !== null} onClose={onClose} title="Log payment" scroll>
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
                {on ? <Icon name="check" size={15} color={colors.primary} strokeWidth={2.4} /> : null}
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
        loading={submitting}
        style={{ marginTop: spacing.lg }}
      />
    </BottomSheet>
  );
}
