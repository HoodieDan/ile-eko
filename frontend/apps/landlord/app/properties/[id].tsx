import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  AICard,
  AILabel,
  AppBar,
  Avatar,
  BottomSheet,
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  Eyebrow,
  heroGradient,
  Icon,
  IconButton,
  type IconName,
  SegmentedControl,
  StatusChip,
  type StatusKind,
  Switch,
  Text,
  Timeline,
  TimelineItem,
  colors,
  radii,
  spacing,
  useToast,
} from '@ile-eko/ui';
import {
  api,
  useProperty,
  useTenants,
  useActivity,
  useLogPayment,
  naira,
  nairaShort,
  initialsOf,
  timeAgo,
  type PropertyDTO,
  type TenantDTO,
  type PaymentReceiptDTO,
  type ActivityLogDTO,
} from '@ile-eko/core';

const HERO_GRADIENT: readonly [string, string] = [heroGradient[0], heroGradient[1]];

type SectionId = 'overview' | 'units' | 'tenants' | 'payments' | 'activity';

interface UnitDTO {
  id: string;
  propertyId: string;
  label: string;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number;
  status: 'vacant' | 'occupied' | 'partial' | 'pending';
}

interface RentSuggestion {
  suggestedRent: number;
  deltaPct: number;
  rationale: string;
  comparables: { area: string; rent: number }[];
  degraded?: boolean;
}

/** Occupancy → the status pill the UI renders (matches the dashboard mapping). */
function occupancyChip(status: PropertyDTO['status']): StatusKind {
  if (status === 'vacant') return 'vacant';
  if (status === 'partial') return 'due';
  return 'paid';
}

function tenantChip(status: TenantDTO['status']): StatusKind {
  if (status === 'up-to-date') return 'paid';
  if (status === 'no-lease') return 'vacant';
  return status;
}

type RiskBand = NonNullable<TenantDTO['risk']>['band'];
const RISK_TONE: Record<RiskBand, { label: string; fg: string; bg: string }> = {
  low: { label: 'Low', fg: colors.ok, bg: colors.okTint },
  medium: { label: 'Watch', fg: colors.warn, bg: colors.warnTint },
  high: { label: 'High', fg: colors.danger, bg: colors.dangerTint },
};

function activityIcon(category: ActivityLogDTO['category']): IconName {
  switch (category) {
    case 'payment':
      return 'wallet';
    case 'image':
      return 'image';
    case 'lease':
    case 'tenant':
      return 'doc';
    case 'maintenance':
      return 'settings';
    default:
      return 'building';
  }
}

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function KeyFact({
  icon,
  label,
  value,
  bordered,
}: {
  icon: IconName;
  label: string;
  value: string;
  bordered?: boolean;
}): React.ReactElement {
  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.md,
        borderLeftWidth: bordered ? 1 : 0,
        borderRightWidth: bordered ? 1 : 0,
        borderColor: colors.line,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <Icon name={icon} size={13} color={colors.muted} strokeWidth={2} />
        <Text variant="captionStrong" color={colors.muted} style={{ fontSize: 11 }}>
          {label}
        </Text>
      </View>
      <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 15, marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="caption" color={colors.muted}>
        {label}
      </Text>
      <Text variant="bodyStrong" style={{ marginTop: 3 }}>
        {value}
      </Text>
    </View>
  );
}

function RiskCard({ risk }: { risk: NonNullable<TenantDTO['risk']> }): React.ReactElement {
  const m = RISK_TONE[risk.band];
  return (
    <AICard>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AILabel>Default risk</AILabel>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            paddingVertical: 5,
            paddingHorizontal: 10,
            backgroundColor: m.bg,
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: m.fg }} />
          <Text variant="captionStrong" color={m.fg}>
            {m.label}
          </Text>
        </View>
      </View>
      <Text variant="body" color={colors.ink} style={{ marginTop: spacing.sm, lineHeight: 21 }}>
        {risk.reason}
      </Text>
    </AICard>
  );
}

function MarketplaceCard({
  listed: initialListed,
  onOpenEnquiries,
}: {
  listed: boolean;
  onOpenEnquiries: () => void;
}): React.ReactElement {
  const [listed, setListed] = React.useState(initialListed);

  return (
    <Card padding={16}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1, minWidth: 0 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: listed ? colors.primary : colors.surface2,
            }}
          >
            <Icon name="building" size={19} color={listed ? '#FFFFFF' : colors.muted} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="bodyStrong" style={{ fontSize: 14.5 }} numberOfLines={1}>
              {listed ? 'Listed on marketplace' : 'Not listed'}
            </Text>
            <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }} numberOfLines={1}>
              {listed ? 'Visible in the tenant app' : 'Publish to start receiving enquiries'}
            </Text>
          </View>
        </View>
        <Switch value={listed} onValueChange={setListed} />
      </View>

      {listed ? (
        <Button
          title="View enquiries"
          variant="secondary"
          size="sm"
          icon="message"
          iconRight="fwd"
          onPress={onOpenEnquiries}
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </Card>
  );
}

export default function PropertyDetail(): React.ReactElement | null {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: p, isLoading } = useProperty(id);
  const { data: tenantsHere = [] } = useTenants(id);
  const { data: activity = [] } = useActivity(id ? { propertyId: id } : undefined);

  const { data: unitsEnvelope } = useQuery<{ items: UnitDTO[] }>({
    queryKey: ['property', id, 'units'],
    enabled: Boolean(id),
    queryFn: () => api.get<{ items: UnitDTO[] }>(`/properties/${id}/units`),
  });
  const units = unitsEnvelope?.items ?? [];

  const { data: suggestion } = useQuery<RentSuggestion>({
    queryKey: ['property', id, 'rent-suggestion'],
    enabled: Boolean(id),
    queryFn: () => api.get<RentSuggestion>(`/properties/${id}/rent-suggestion`),
  });

  // Property payments = receipts for any tenant living here (payments carry tenantId).
  const { data: paymentsEnvelope } = useQuery<{ items: PaymentReceiptDTO[] }>({
    queryKey: ['payments', 'all'],
    queryFn: () => api.get<{ items: PaymentReceiptDTO[] }>('/payments'),
  });

  const multi = !!p?.hasUnits;
  const [section, setSection] = React.useState<SectionId>('overview');
  const [logVisible, setLogVisible] = React.useState(false);
  const logPayment = useLogPayment();

  React.useEffect(() => {
    if (p) setSection(p.hasUnits ? 'units' : 'overview');
  }, [p]);

  if (isLoading && !p) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!p) return null;

  const occupancy = occupancyChip(p.status);
  const tenant = tenantsHere[0];
  const listed = (p.listings?.length ?? 0) > 0;

  const tenantById = new Map(tenantsHere.map((t) => [t.id, t]));
  const tenantIds = new Set(tenantsHere.map((t) => t.id));
  const payments = (paymentsEnvelope?.items ?? []).filter((pay) => tenantIds.has(pay.tenantId));

  const sections: { value: SectionId; label: string }[] = multi
    ? [
        { value: 'units', label: 'Units' },
        { value: 'tenants', label: 'Tenants' },
        { value: 'payments', label: 'Payments' },
        { value: 'activity', label: 'Activity' },
      ]
    : [
        { value: 'overview', label: 'Overview' },
        { value: 'payments', label: 'Payments' },
        { value: 'activity', label: 'Activity' },
      ];

  const openLog = (): void => setLogVisible(true);

  const leaseIdForLog = payments[0]?.leaseId;

  const confirmLog = (): void => {
    if (!leaseIdForLog) {
      showToast('No active lease to log against');
      setLogVisible(false);
      return;
    }
    logPayment.mutate(
      { leaseId: leaseIdForLog, amount: p.rentAmount ?? 0, method: 'transfer' },
      {
        onSuccess: () => {
          setLogVisible(false);
          showToast('Payment logged');
        },
        onError: () => showToast('Could not log payment'),
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      {/* Hero header (bleeds up behind the status bar) */}
      <View>
        <LinearGradient
          colors={HERO_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 230 + insets.top,
            paddingTop: insets.top,
            justifyContent: 'space-between',
          }}
        >
          <AppBar
            onDark
            onBack={() => router.back()}
            right={
              <IconButton
                name="settings"
                variant="ghost"
                color="#FFFFFF"
                onPress={() => router.push('/properties/add')}
              />
            }
          />
          <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
            <Icon name="building" size={58} color="rgba(255,255,255,0.16)" strokeWidth={1.4} />
          </View>
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: 30 }}>
            <StatusChip status={occupancy} />
          </View>
        </LinearGradient>
      </View>

      <View style={{ flex: 1, marginTop: -18 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.bg,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
          }}
        >
          <View style={{ flex: 1 }}>
            {/* scrolling body */}
            <Body
              p={p}
              multi={multi}
              tenant={tenant}
              tenantsHere={tenantsHere}
              tenantById={tenantById}
              units={units}
              payments={payments}
              activity={activity}
              suggestion={suggestion}
              listed={listed}
              section={section}
              sections={sections}
              onSection={setSection}
              onLog={openLog}
              onOpenTenant={(tid: string) => router.push(`/tenants/${tid}`)}
              onEnquiries={() => router.push('/enquiries')}
              onListUnit={openLog}
              onMessageTenant={() => router.push('/tenants')}
            />
          </View>

          {/* Sticky action bar */}
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.md,
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: spacing.xl,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.line,
            }}
          >
            <IconButton
              name="settings"
              variant="ghost"
              size={52}
              onPress={() => router.push('/properties/add')}
            />
            {p.status === 'vacant' && !multi ? (
              <Button title="List this unit" icon="door" onPress={openLog} style={{ flex: 1 }} />
            ) : (
              <Button title="Log payment" icon="plus" onPress={openLog} style={{ flex: 1 }} />
            )}
          </View>
        </View>
      </View>

      {/* Log payment sheet */}
      <BottomSheet visible={logVisible} onClose={() => setLogVisible(false)} title="Log payment">
        <View style={{ marginTop: spacing.lg }}>
          <Card
            flat
            padding={13}
            style={{
              backgroundColor: colors.surface2,
              borderWidth: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
            }}
          >
            <Avatar initials={tenant ? initialsOf(tenant.fullName) : '—'} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {tenant?.fullName ?? 'No tenant'}
              </Text>
              <Text variant="caption" color={colors.muted} numberOfLines={1}>
                {p.propertyTitle}, {p.area}
              </Text>
            </View>
          </Card>

          <View style={{ marginTop: spacing.lg }}>
            <Text
              variant="captionStrong"
              color={colors.ink}
              style={{ fontSize: 13, marginBottom: 7 }}
            >
              Amount received
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 54,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: colors.line,
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
              }}
            >
              <Text variant="bodyStrong" color={colors.muted} style={{ fontSize: 16 }}>
                ₦
              </Text>
              <Text variant="bodyStrong" style={{ flex: 1, fontSize: 16, marginLeft: 6 }}>
                {(p.rentAmount ?? 0).toLocaleString('en-NG')}
              </Text>
            </View>
          </View>

          <Button
            title={`Confirm ${naira(p.rentAmount ?? 0)}`}
            loading={logPayment.isPending}
            onPress={confirmLog}
            style={{ marginTop: spacing.xl }}
          />
          <Text variant="caption" color={colors.muted} center style={{ marginTop: spacing.md }}>
            A receipt will be sent to the tenant automatically.
          </Text>
        </View>
      </BottomSheet>
    </View>
  );
}

interface BodyProps {
  p: PropertyDTO;
  multi: boolean;
  tenant: TenantDTO | undefined;
  tenantsHere: TenantDTO[];
  tenantById: Map<string, TenantDTO>;
  units: UnitDTO[];
  payments: PaymentReceiptDTO[];
  activity: ActivityLogDTO[];
  suggestion: RentSuggestion | undefined;
  listed: boolean;
  section: SectionId;
  sections: { value: SectionId; label: string }[];
  onSection: (s: SectionId) => void;
  onLog: () => void;
  onOpenTenant: (id: string) => void;
  onEnquiries: () => void;
  onListUnit: () => void;
  onMessageTenant: () => void;
}

function Body({
  p,
  multi,
  tenant,
  tenantsHere,
  tenantById,
  units,
  payments,
  activity,
  suggestion,
  listed,
  section,
  sections,
  onSection,
  onLog,
  onOpenTenant,
  onEnquiries,
  onListUnit,
  onMessageTenant,
}: BodyProps): React.ReactElement {
  const delta = suggestion?.deltaPct ?? 0;
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: 12,
      }}
    >
      {/* Title + address */}
      <View>
        <Text variant="title" style={{ fontSize: 24, lineHeight: 27 }}>
          {p.propertyTitle}
        </Text>
        <Text variant="body" color={colors.muted} style={{ marginTop: 4 }}>
          {p.area} · {p.lga}, Lagos
        </Text>
      </View>

      {/* Key facts */}
      <Card padding={14} style={{ marginTop: spacing.lg }}>
        <View style={{ flexDirection: 'row' }}>
          <KeyFact
            icon="home"
            label="Type"
            value={multi ? `${p.unitCount} units` : p.propertyType}
          />
          <KeyFact icon="grid" label="Area" value={p.area} bordered />
          <KeyFact
            icon="wallet"
            label={multi ? 'Total roll' : 'Annual rent'}
            value={nairaShort(p.rentAmount ?? 0)}
          />
        </View>
      </Card>

      {/* AI suggested rent */}
      {suggestion ? (
        <AICard
          padding={13}
          onPress={onListUnit}
          style={{
            marginTop: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: colors.ai,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="spark" size={19} color={colors.onAi} fill />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AILabel>Smart pricing</AILabel>
            <Text variant="bodyStrong" style={{ fontSize: 14.5, marginTop: 2 }} numberOfLines={1}>
              Suggested rent: {naira(suggestion.suggestedRent)}
              {multi ? ' / vacant unit' : ''}
            </Text>
          </View>
          <Chip tone="ai" solid icon="trend" label={`${delta >= 0 ? '+' : ''}${delta}%`} />
        </AICard>
      ) : null}

      {/* Marketplace listing status (vacant / has vacancy) */}
      {(p.status === 'vacant' || p.status === 'partial') && (
        <View style={{ marginTop: spacing.md }}>
          <MarketplaceCard listed={listed} onOpenEnquiries={onEnquiries} />
        </View>
      )}

      {/* Section tabs */}
      <SegmentedControl
        options={sections}
        value={section}
        onChange={onSection}
        style={{ marginTop: spacing.lg }}
      />

      <View style={{ marginTop: spacing.lg }}>
        {/* UNITS */}
        {section === 'units' && (
          <View style={{ gap: 11 }}>
            {units.length === 0 ? (
              <EmptyState icon="layers" title="No units yet" message="Add units to this property." />
            ) : (
              units.map((u) => {
                const ut = tenantsHere.find((t) => t.unitId === u.id);
                return (
                  <Card
                    key={u.id}
                    padding={14}
                    onPress={() => (ut ? onOpenTenant(ut.id) : onListUnit())}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                  >
                    <View
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor:
                          u.status === 'vacant' ? colors.surface2 : colors.primaryTint,
                      }}
                    >
                      <Text
                        variant="bodyStrong"
                        color={u.status === 'vacant' ? colors.muted : colors.primary}
                        style={{ fontSize: 13 }}
                      >
                        {u.label.replace('Flat ', 'F')}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14.5 }} numberOfLines={1}>
                        {u.label}
                      </Text>
                      <Text
                        variant="caption"
                        color={colors.muted}
                        style={{ marginTop: 1 }}
                        numberOfLines={1}
                      >
                        {u.bedrooms} bed · {u.bathrooms} bath · {ut?.fullName ?? 'No tenant'}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: spacing.sm,
                        }}
                      >
                        <Text variant="bodyStrong" style={{ fontSize: 13.5 }}>
                          {naira(u.rentAmount)}
                          <Text variant="caption" color={colors.muted}>
                            {' '}
                            /yr
                          </Text>
                        </Text>
                        <StatusChip status={u.status === 'vacant' ? 'vacant' : 'occupied'} />
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </View>
        )}

        {/* TENANTS */}
        {section === 'tenants' &&
          (tenantsHere.length > 0 ? (
            <View style={{ gap: 11 }}>
              {tenantsHere.map((t) => (
                <Card
                  key={t.id}
                  padding={13}
                  onPress={() => onOpenTenant(t.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                >
                  <Avatar initials={initialsOf(t.fullName)} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 14.5 }} numberOfLines={1}>
                      {t.fullName}
                    </Text>
                    <Text
                      variant="caption"
                      color={colors.muted}
                      style={{ marginTop: 1 }}
                      numberOfLines={1}
                    >
                      {t.leaseEndDate ? `ends ${fmtDate(t.leaseEndDate)}` : 'No active lease'}
                    </Text>
                  </View>
                  <StatusChip status={tenantChip(t.status)} />
                </Card>
              ))}
            </View>
          ) : (
            <EmptyState
              icon="users"
              title="No tenants yet"
              message="Assign a tenant to start tracking rent."
            />
          ))}

        {/* PAYMENTS */}
        {section === 'payments' && (
          <View>
            {payments.length === 0 ? (
              <EmptyState
                icon="wallet"
                title="No payments yet"
                message="Logged rent payments will appear here."
              />
            ) : (
              <Card padding={0} style={{ paddingHorizontal: spacing.lg }}>
                {payments.map((pay, i) => (
                  <View key={pay.id}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: 13,
                      }}
                    >
                      <View style={{ flex: 1, minWidth: 0, paddingRight: spacing.sm }}>
                        <Text variant="bodyMedium" numberOfLines={1}>
                          {pay.periodCovered ??
                            tenantById.get(pay.tenantId)?.fullName ??
                            'Rent payment'}
                        </Text>
                        <Text
                          variant="caption"
                          color={colors.muted}
                          style={{ marginTop: 2 }}
                          numberOfLines={1}
                        >
                          {fmtDate(pay.paidAt)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                          {naira(pay.amount)}
                        </Text>
                        <Chip tone="ok" icon="check" label="Confirmed" />
                      </View>
                    </View>
                    {i < payments.length - 1 ? <Divider /> : null}
                  </View>
                ))}
              </Card>
            )}
            <Button
              title="Log a payment"
              variant="secondary"
              icon="plus"
              onPress={onLog}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {/* ACTIVITY */}
        {section === 'activity' && (
          <Card>
            {activity.length === 0 ? (
              <Text variant="caption" color={colors.muted}>
                No activity yet.
              </Text>
            ) : (
              <Timeline>
                {activity.map((a, i) => (
                  <TimelineItem
                    key={a.id}
                    icon={activityIcon(a.category)}
                    iconColor={colors.primary}
                    last={i === activity.length - 1}
                  >
                    <Text variant="bodyMedium">{a.description}</Text>
                    <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
                      {a.actorName} · {timeAgo(a.createdAt)}
                    </Text>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Card>
        )}

        {/* OVERVIEW (single-unit) */}
        {section === 'overview' &&
          (tenant ? (
            <View style={{ gap: spacing.lg }}>
              <Card padding={16} onPress={() => onOpenTenant(tenant.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Avatar initials={initialsOf(tenant.fullName)} size={48} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="h3" numberOfLines={1}>
                      {tenant.fullName}
                    </Text>
                    <Text
                      variant="caption"
                      color={colors.muted}
                      style={{ marginTop: 1 }}
                      numberOfLines={1}
                    >
                      {tenant.leaseEndDate
                        ? `Tenant · lease ends ${fmtDate(tenant.leaseEndDate)}`
                        : 'Tenant'}
                    </Text>
                  </View>
                  <Icon name="fwd" size={18} color={colors.muted} />
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
                  <Button
                    title="Call"
                    variant="secondary"
                    size="sm"
                    icon="phone"
                    onPress={() => onOpenTenant(tenant.id)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Message"
                    variant="secondary"
                    size="sm"
                    icon="message"
                    onPress={onMessageTenant}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>

              {/* Default risk (AI) */}
              {tenant.risk ? <RiskCard risk={tenant.risk} /> : null}

              {/* Rent + lease facts (2×2 grid) */}
              <Card>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Fact label="Annual rent" value={naira(tenant.rentAmount ?? 0)} />
                  <Fact
                    label="Schedule"
                    value={tenant.paymentSchedule ? tenant.paymentSchedule : '—'}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
                  <Fact label="Lease start" value={fmtDate(tenant.leaseStartDate) || '—'} />
                  <Fact label="Lease end" value={fmtDate(tenant.leaseEndDate) || '—'} />
                </View>
              </Card>
            </View>
          ) : (
            <Card padding={24}>
              <EmptyState
                icon="door"
                title="Vacant"
                message="No tenant assigned. List it on the marketplace or add a tenant directly."
                action={{ label: 'List this unit', onPress: onListUnit }}
              />
            </Card>
          ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}
