import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AICard,
  AILabel,
  AppBar,
  Avatar,
  BottomSheet,
  Button,
  Card,
  Chip,
  type ChipTone,
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
  type Listing,
  type PaymentLine,
  type Property,
  type Tenant,
  type Unit,
  enquiriesForProperty,
  getProperty,
  getTenant,
  listings,
  naira,
  nairaShort,
  tenants,
  tenantsForProperty,
} from '@/data/mock';

const HERO_GRADIENT: readonly [string, string] = [heroGradient[0], heroGradient[1]];

type SectionId = 'overview' | 'units' | 'tenants' | 'payments' | 'activity';

const PAY_STATE: Record<PaymentLine['state'], { tone: ChipTone; icon: IconName; label: string }> = {
  paid: { tone: 'ok', icon: 'check', label: 'Paid' },
  confirmed: { tone: 'ok', icon: 'check', label: 'Confirmed' },
  late: { tone: 'warn', icon: 'clock', label: 'Late' },
  overdue: { tone: 'danger', icon: 'alert', label: 'Overdue' },
  due: { tone: 'warn', icon: 'clock', label: 'Due' },
  pending: { tone: 'warn', icon: 'clock', label: 'Pending' },
  partial: { tone: 'info', icon: 'half', label: 'Partial' },
};

function PayState({ state }: { state: PaymentLine['state'] }): React.ReactElement {
  const m = PAY_STATE[state];
  return <Chip tone={m.tone} icon={m.icon} label={m.label} />;
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

const RISK_TONE: Record<Tenant['risk']['level'], { fg: string; bg: string }> = {
  Low: { fg: colors.ok, bg: colors.okTint },
  Watch: { fg: colors.warn, bg: colors.warnTint },
  High: { fg: colors.danger, bg: colors.dangerTint },
};

function RiskCard({ risk }: { risk: Tenant['risk'] }): React.ReactElement {
  const m = RISK_TONE[risk.level];
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
            {risk.level}
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
  property,
  listing,
  onOpenEnquiries,
}: {
  property: Property;
  listing: Listing | undefined;
  onOpenEnquiries: () => void;
}): React.ReactElement {
  const base = listing ?? { listed: false, views: 0, enquiries: 0, since: '' };
  const [listed, setListed] = React.useState(base.listed);
  const enqCount = enquiriesForProperty(property.id).length || base.enquiries;

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
              {listed ? `Published ${base.since} · tenant app` : 'Publish to start receiving enquiries'}
            </Text>
          </View>
        </View>
        <Switch value={listed} onValueChange={setListed} />
      </View>

      {listed ? (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.lg }}>
            <Card flat padding={0} style={{ flex: 1, backgroundColor: colors.surface2, borderWidth: 0, paddingVertical: 11, paddingHorizontal: 13 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="eye" size={14} color={colors.muted} />
                <Eyebrow>Views</Eyebrow>
              </View>
              <Text variant="display" style={{ fontSize: 20, lineHeight: 24, marginTop: 4 }}>
                {base.views}
              </Text>
            </Card>
            <Card flat padding={0} style={{ flex: 1, backgroundColor: colors.surface2, borderWidth: 0, paddingVertical: 11, paddingHorizontal: 13 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="message" size={14} color={colors.muted} />
                <Eyebrow>Enquiries</Eyebrow>
              </View>
              <Text variant="display" style={{ fontSize: 20, lineHeight: 24, marginTop: 4 }}>
                {enqCount}
              </Text>
            </Card>
          </View>
          {enqCount > 0 ? (
            <Button
              title={`View ${enqCount} ${enqCount === 1 ? 'enquiry' : 'enquiries'}`}
              variant="secondary"
              size="sm"
              icon="message"
              iconRight="fwd"
              onPress={onOpenEnquiries}
              style={{ marginTop: spacing.md }}
            />
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

export default function PropertyDetail(): React.ReactElement | null {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const p: Property | undefined = id ? getProperty(id) : undefined;

  const multi = !!p?.multiUnit;
  const [section, setSection] = React.useState<SectionId>(multi ? 'units' : 'overview');
  const [logVisible, setLogVisible] = React.useState(false);
  const [logAmount, setLogAmount] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (p) {
      setSection(p.multiUnit ? 'units' : 'overview');
      setLogAmount(naira(p.rent));
    }
  }, [p]);

  if (!p) return null;

  const occupancy: StatusKind = (p.occupancy ?? p.status ?? 'vacant') as StatusKind;
  const tenantsHere = tenantsForProperty(p.id);
  const tenant = tenantsHere[0];
  const listing = listings[p.id];

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

  const activity: { action: string; when: string; icon: IconName }[] =
    p.activity?.map((a) => ({ action: a.action, when: a.when, icon: a.icon as IconName })) ?? [
      { action: 'Rent payment confirmed', when: tenant?.leaseStart ?? 'Recently', icon: 'wallet' },
      { action: 'Lease agreement uploaded', when: tenant?.leaseStart ?? '—', icon: 'doc' },
      { action: 'Property added to portfolio', when: 'Earlier', icon: 'building' },
    ];

  const openLog = (): void => {
    setLogAmount(naira(p.rent));
    setLogVisible(true);
  };

  const confirmLog = (): void => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setLogVisible(false);
      showToast('Payment logged');
    }, 700);
  };

  // Resolve a property's tenant ref to its full record by name (the
  // PropertyTenantRef only carries a display name), falling back to the tenant
  // list when there's no match.
  const openTenantByName = (name: string): void => {
    const match = tenants.find((t) => t.name === name);
    router.push(match ? `/tenants/${match.id}` : '/tenants');
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
          style={{ height: 230 + insets.top, paddingTop: insets.top, justifyContent: 'space-between' }}
        >
          <AppBar
            onDark
            onBack={() => router.back()}
            right={
              <IconButton name="settings" variant="ghost" color="#FFFFFF" onPress={() => router.push('/properties/add')} />
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
              occupancy={occupancy}
              tenant={tenant}
              tenantsHere={tenantsHere}
              listing={listing}
              activity={activity}
              section={section}
              sections={sections}
              onSection={setSection}
              onLog={openLog}
              onOpenTenant={(tid: string) => router.push(`/tenants/${tid}`)}
              onOpenTenantByName={openTenantByName}
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
            {occupancy === 'vacant' && !multi ? (
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
            style={{ backgroundColor: colors.surface2, borderWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
          >
            <Avatar initials={tenant?.initials ?? p.tenant?.initials ?? '—'} size={40} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {tenant?.name ?? p.tenant?.name ?? 'No tenant'}
              </Text>
              <Text variant="caption" color={colors.muted} numberOfLines={1}>
                {p.address}, {p.area}
              </Text>
            </View>
          </Card>

          <View style={{ marginTop: spacing.lg }}>
            <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13, marginBottom: 7 }}>
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
                {logAmount.replace('₦', '')}
              </Text>
            </View>
          </View>

          <Button
            title={`Confirm ${logAmount}`}
            loading={submitting}
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
  p: Property;
  multi: boolean;
  occupancy: StatusKind;
  tenant: Tenant | undefined;
  tenantsHere: Tenant[];
  listing: Listing | undefined;
  activity: { action: string; when: string; icon: IconName }[];
  section: SectionId;
  sections: { value: SectionId; label: string }[];
  onSection: (s: SectionId) => void;
  onLog: () => void;
  onOpenTenant: (id: string) => void;
  onOpenTenantByName: (name: string) => void;
  onEnquiries: () => void;
  onListUnit: () => void;
  onMessageTenant: () => void;
}

function Body({
  p,
  multi,
  occupancy,
  tenant,
  tenantsHere,
  listing,
  activity,
  section,
  sections,
  onSection,
  onLog,
  onOpenTenant,
  onOpenTenantByName,
  onEnquiries,
  onListUnit,
  onMessageTenant,
}: BodyProps): React.ReactElement {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: 12 }}
    >
        {/* Title + address */}
        <View>
          <Text variant="title" style={{ fontSize: 24, lineHeight: 27 }}>
            {p.address}
          </Text>
          <Text variant="body" color={colors.muted} style={{ marginTop: 4 }}>
            {p.area} · {p.lga ?? 'Lagos'}, Lagos
          </Text>
        </View>

        {/* Key facts */}
        <Card padding={14} style={{ marginTop: spacing.lg }}>
          <View style={{ flexDirection: 'row' }}>
            <KeyFact icon="home" label="Type" value={multi ? `${p.unitCount ?? 0} units` : p.type} />
            <KeyFact icon="grid" label="Area" value={p.area} bordered />
            <KeyFact icon="wallet" label={multi ? 'Total roll' : 'Annual rent'} value={nairaShort(p.rent)} />
          </View>
        </Card>

        {/* AI suggested rent */}
        <AICard
          padding={13}
          onPress={onListUnit}
          style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
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
              Suggested rent: {naira(p.aiPrice)}
              {multi ? ' / vacant unit' : ''}
            </Text>
          </View>
          <Chip tone="ai" solid icon="trend" label={`+${p.aiDelta}%`} />
        </AICard>

        {/* Marketplace listing status (vacant / has vacancy) */}
        {(occupancy === 'vacant' || occupancy === 'mixed') && (
          <View style={{ marginTop: spacing.md }}>
            <MarketplaceCard property={p} listing={listing} onOpenEnquiries={onEnquiries} />
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
              {(p.units ?? []).map((u: Unit) => {
                const ut = u.tenantId ? getTenant(u.tenantId) : undefined;
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
                        backgroundColor: u.status === 'vacant' ? colors.surface2 : colors.primaryTint,
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
                      <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }} numberOfLines={1}>
                        {u.beds} bed · {u.baths} bath · {ut?.name ?? 'No tenant'}
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
                          {naira(u.rent)}
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
              })}
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
                    <Avatar initials={t.initials} size={44} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14.5 }} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }} numberOfLines={1}>
                        {t.unit ? `${t.unit} · ` : ''}ends {t.leaseEnd.split(' ').slice(1).join(' ')}
                      </Text>
                    </View>
                    <StatusChip status={t.status} />
                  </Card>
                ))}
              </View>
            ) : (
              <EmptyState icon="users" title="No tenants yet" message="Assign a tenant to start tracking rent." />
            ))}

          {/* PAYMENTS */}
          {section === 'payments' && (
            <View>
              <Card padding={0} style={{ paddingHorizontal: spacing.lg }}>
                {p.payments.map((pay, i) => (
                  <View key={`${pay.label}-${i}`}>
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
                          {pay.label}
                        </Text>
                        <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                          {pay.date}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text variant="bodyStrong" style={{ fontSize: 14 }}>
                          {naira(pay.amount)}
                        </Text>
                        <PayState state={pay.state} />
                      </View>
                    </View>
                    {i < p.payments.length - 1 ? <Divider /> : null}
                  </View>
                ))}
              </Card>
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
              <Timeline>
                {activity.map((a, i) => (
                  <TimelineItem
                    key={`${a.action}-${i}`}
                    icon={a.icon}
                    iconColor={colors.primary}
                    last={i === activity.length - 1}
                  >
                    <Text variant="bodyMedium">{a.action}</Text>
                    <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
                      {a.when}
                    </Text>
                  </TimelineItem>
                ))}
              </Timeline>
            </Card>
          )}

          {/* OVERVIEW (single-unit) */}
          {section === 'overview' &&
            (tenant ? (
              <View style={{ gap: spacing.lg }}>
                <Card padding={16} onPress={() => onOpenTenantByName(tenant.name)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Avatar initials={tenant.initials} size={48} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="h3" numberOfLines={1}>
                        {tenant.name}
                      </Text>
                      <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }} numberOfLines={1}>
                        Tenant · lease ends {tenant.leaseEnd}
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
                <RiskCard risk={tenant.risk} />

                {/* Rent + lease facts (2×2 grid) */}
                <Card>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <Fact label="Annual rent" value={naira(tenant.rent)} />
                    <Fact label="Schedule" value={tenant.schedule} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 16 }}>
                    <Fact label="Lease start" value={tenant.leaseStart} />
                    <Fact label="Lease end" value={tenant.leaseEnd} />
                  </View>
                </Card>
              </View>
            ) : (
              <Card padding={24}>
                <EmptyState
                  icon="door"
                  title={`Vacant${p.vacantDays ? ` for ${p.vacantDays} days` : ''}`}
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
