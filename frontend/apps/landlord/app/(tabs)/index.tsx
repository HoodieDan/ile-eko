import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  Icon,
  IconButton,
  Button,
  Card,
  AICard,
  AILabel,
  StatCard,
  StatusChip,
  PropertyThumb,
  Avatar,
  Chip,
  colors,
  heroGradient,
  type StatusKind,
} from '@ile-eko/ui';
import {
  landlord,
  summary,
  briefing,
  properties,
  enquiries,
  activityLog,
  nairaShort,
  naira,
} from '@/data/mock';

const HERO_GRADIENT: readonly [string, string] = [heroGradient[0], heroGradient[1]];

/** A status's share of the annual roll, as a percentage (for the hero meter). */
function segPct(amt: number): number {
  return summary.rollAnnual > 0 ? (amt / summary.rollAnnual) * 100 : 0;
}

/** Legend dot + label for the hero collection meter. */
function Legend({ color, label }: { color: string; label: string }): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color }} />
      <Text variant="caption" color="rgba(255,255,255,0.9)" style={{ fontSize: 11.5 }}>
        {label}
      </Text>
    </View>
  );
}

export default function Dashboard(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Upcoming & overdue rent: overdue first, then due soon, then nearest upcoming.
  const order: Record<string, number> = { overdue: 0, due: 1, paid: 3, vacant: 4 };
  const rentRows = properties
    .filter((p) => p.status !== 'vacant')
    .sort((a, b) => {
      const oa = order[a.status ?? ''] ?? 2;
      const ob = order[b.status ?? ''] ?? 2;
      if (oa !== ob) return oa - ob;
      return (a.lease?.daysToDue ?? 0) - (b.lease?.daysToDue ?? 0);
    })
    .slice(0, 3);

  const newEnquiries = enquiries.filter((e) => !e.read).length;
  const enquiryNames = enquiries
    .slice(0, 3)
    .map((e) => e.tenant.split(' ')[0] ?? e.tenant)
    .join(', ');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ---- gradient hero (bleeds up behind the status bar) ---- */}
        <LinearGradient
          colors={HERO_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            paddingHorizontal: 24,
            paddingTop: insets.top + 22,
            paddingBottom: 34,
          }}
        >
          {/* greeting row */}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}
            >
              <Avatar initials={landlord.initials} tone="solid" size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="caption" color="rgba(255,255,255,0.78)">
                  Good evening,
                </Text>
                <Text variant="title" color="#FFFFFF" numberOfLines={1} style={{ fontSize: 19 }}>
                  {landlord.first} Balogun
                </Text>
              </View>
            </View>
            <View style={{ position: 'relative' }}>
              <IconButton
                name="bell"
                variant="ghost"
                color="#FFFFFF"
                onPress={() => router.push('/enquiries')}
                style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 9,
                  right: 10,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.accent,
                  borderWidth: 2,
                  borderColor: colors.primaryDeep,
                }}
              />
            </View>
          </View>

          {/* collection summary */}
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="label" color="rgba(255,255,255,0.78)">
                  Collected this cycle
                </Text>
                <Text
                  variant="display"
                  color="#FFFFFF"
                  style={{ fontSize: 36, lineHeight: 40, marginTop: 4 }}
                >
                  {naira(summary.collected)}
                </Text>
              </View>
              <Text
                variant="caption"
                color="rgba(255,255,255,0.82)"
                style={{ textAlign: 'right', paddingBottom: 6 }}
              >
                of {nairaShort(summary.rollAnnual)}
                {'\n'}annual roll
              </Text>
            </View>

            {/* segmented collection meter */}
            <View
              style={{
                marginTop: 14,
                height: 8,
                borderRadius: 999,
                overflow: 'hidden',
                flexDirection: 'row',
                backgroundColor: 'rgba(255,255,255,0.18)',
              }}
            >
              <View style={{ width: `${segPct(summary.collected)}%`, backgroundColor: '#FFFFFF' }} />
              <View
                style={{ width: `${segPct(summary.overdueAmt)}%`, backgroundColor: colors.danger }}
              />
              <View style={{ width: `${segPct(summary.dueAmt)}%`, backgroundColor: colors.accent }} />
              <View
                style={{
                  width: `${segPct(summary.vacantAmt)}%`,
                  backgroundColor: 'rgba(255,255,255,0.32)',
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
              <Legend color="#FFFFFF" label={`Paid ${nairaShort(summary.collected)}`} />
              <Legend color={colors.danger} label={`Overdue ${nairaShort(summary.overdueAmt)}`} />
              <Legend color={colors.accent} label={`Due ${nairaShort(summary.dueAmt)}`} />
              <Legend color="rgba(255,255,255,0.45)" label={`Vacant ${nairaShort(summary.vacantAmt)}`} />
            </View>
          </View>
        </LinearGradient>

        {/* ---- body ---- */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {/* portfolio summary band */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard
              label="Properties"
              value={`${summary.total}`}
              sub={`${summary.occupied} occupied`}
              style={{ flex: 1 }}
            />
            <StatCard
              label="Occupancy"
              value={`${summary.occupied}/${summary.total}`}
              sub={`${summary.occupancyPct}% filled`}
              style={{ flex: 1 }}
            />
            <StatCard
              label="Annual roll"
              value={nairaShort(summary.rollAnnual)}
              sub="across portfolio"
              style={{ flex: 1 }}
            />
          </View>

          {/* AI briefing */}
          <AICard onPress={() => router.push('/ai')} padding={18} style={{ marginTop: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <AILabel>Today&apos;s AI briefing</AILabel>
              <Chip label="1 needs action" tone="ai" solid />
            </View>
            <Text variant="title" style={{ fontSize: 17, lineHeight: 21, marginTop: 11 }}>
              {briefing.headline}
            </Text>
            <Text variant="caption" color={colors.muted} style={{ marginTop: 7, lineHeight: 20 }}>
              {briefing.points[0]}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 13 }}>
              <Text variant="captionStrong" color={colors.aiDeep}>
                Open assistant
              </Text>
              <Icon name="fwd" size={15} color={colors.aiDeep} />
            </View>
          </AICard>

          {/* upcoming & overdue rent */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 24,
              marginBottom: 13,
            }}
          >
            <Text variant="h2" style={{ fontSize: 20 }}>
              Upcoming &amp; overdue rent
            </Text>
            <Button
              title="See all"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => router.push('/payments/log')}
            />
          </View>
          <Card padding={0} style={{ paddingHorizontal: 16 }}>
            {rentRows.map((p, i) => {
              const status = (p.status ?? 'vacant') as StatusKind;
              const overdue = status === 'overdue';
              const due = status === 'due';
              const days = overdue ? p.overdueDays : due ? p.lease?.daysToDue : undefined;
              const tenantName = p.tenant?.name ?? p.address;
              const tenantInitials = p.tenant?.initials ?? '—';
              return (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/properties/${p.id}`)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 13,
                    borderBottomWidth: i < rentRows.length - 1 ? 1 : 0,
                    borderBottomColor: colors.line,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Avatar initials={tenantInitials} size={42} tone={overdue ? 'danger' : 'tint'} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14.5 }}>
                      {tenantName}
                    </Text>
                    <Text
                      variant="caption"
                      color={colors.muted}
                      numberOfLines={1}
                      style={{ marginTop: 1 }}
                    >
                      {p.area} · {nairaShort(p.rent)}/yr
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <StatusChip status={status} days={days ?? undefined} />
                    {!overdue && !due && p.lease?.nextDue ? (
                      <Text variant="caption" color={colors.muted} style={{ fontSize: 11, marginTop: 5 }}>
                        {p.lease.nextDue}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </Card>

          {/* marketplace enquiries */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 24,
              marginBottom: 13,
            }}
          >
            <Text variant="h2" style={{ fontSize: 20 }}>
              Enquiries
            </Text>
            <Button
              title="See all"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => router.push('/enquiries')}
            />
          </View>
          <Card padding={15} onPress={() => router.push('/enquiries')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: colors.primaryTint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="message" size={21} color={colors.primary} />
                {newEnquiries > 0 ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      minWidth: 18,
                      height: 18,
                      paddingHorizontal: 5,
                      borderRadius: 999,
                      backgroundColor: colors.danger,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: colors.surface,
                    }}
                  >
                    <Text variant="captionStrong" color="#FFFFFF" style={{ fontSize: 10.5 }}>
                      {newEnquiries}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="bodyStrong" style={{ fontSize: 14.5 }}>
                  {newEnquiries > 0
                    ? `${newEnquiries} new ${newEnquiries === 1 ? 'enquiry' : 'enquiries'}`
                    : 'Marketplace enquiries'}
                </Text>
                <Text
                  variant="caption"
                  color={colors.muted}
                  numberOfLines={1}
                  style={{ marginTop: 1, fontSize: 12.5 }}
                >
                  From the tenant app · {enquiryNames}
                </Text>
              </View>
              <Icon name="fwd" size={18} color={colors.muted} />
            </View>
          </Card>

          {/* your properties */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 24,
              marginBottom: 13,
            }}
          >
            <Text variant="h2" style={{ fontSize: 20 }}>
              Your properties
            </Text>
            <Text variant="captionStrong" color={colors.muted} style={{ fontSize: 13 }}>
              {properties.length} total
            </Text>
          </View>
          <View style={{ gap: 12 }}>
            {properties.map((p) => {
              const status = (p.status ?? 'vacant') as StatusKind;
              const days =
                status === 'overdue'
                  ? p.overdueDays
                  : status === 'due'
                    ? p.lease?.daysToDue
                    : undefined;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/properties/${p.id}`)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 13,
                    backgroundColor: colors.surface,
                    borderRadius: 18,
                    padding: 11,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <PropertyThumb size={64} radius={13} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="title" numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 19 }}>
                      {p.address}
                    </Text>
                    <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                      {p.area} · {p.type}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 8,
                      }}
                    >
                      <Text variant="bodyStrong">
                        {naira(p.rent)}
                        <Text variant="caption" color={colors.muted}>
                          {' '}
                          /yr
                        </Text>
                      </Text>
                      <StatusChip status={status} days={days ?? undefined} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* caretaker activity */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 24,
              marginBottom: 13,
            }}
          >
            <Text variant="h2" style={{ fontSize: 20 }}>
              Caretaker activity
            </Text>
            <Button
              title="See all"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => router.push('/team')}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          >
            {activityLog.slice(0, 3).map((a) => {
              const firstName = a.who.split(' ')[0] ?? a.who;
              return (
                <Card key={a.id} padding={15} style={{ minWidth: 210 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <Avatar initials={a.initials} size={34} />
                    <Text variant="captionStrong" style={{ fontSize: 12.5 }}>
                      {firstName}
                    </Text>
                    <Text variant="caption" color={colors.muted} style={{ marginLeft: 'auto', fontSize: 11 }}>
                      {a.ago}
                    </Text>
                  </View>
                  <Text variant="bodyStrong" style={{ fontSize: 13.5, marginTop: 11 }}>
                    {a.action}
                  </Text>
                  <Text variant="caption" color={colors.muted} style={{ marginTop: 3, lineHeight: 17 }}>
                    {a.detail}
                  </Text>
                </Card>
              );
            })}
          </ScrollView>

          {/* add a property */}
          <Button
            title="Add a property"
            variant="secondary"
            icon="plus"
            fullWidth
            onPress={() => router.push('/properties/add')}
            style={{ marginTop: 18 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
