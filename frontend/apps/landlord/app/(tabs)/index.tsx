import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
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
  Skeleton,
  colors,
  heroGradient,
  type StatusKind,
} from '@ile-eko/ui';
import {
  useAuth,
  useDashboard,
  useBriefing,
  useProperties,
  naira,
  nairaShort,
  initialsOf,
  timeAgo,
} from '@ile-eko/core';

const HERO_GRADIENT: readonly [string, string] = [heroGradient[0], heroGradient[1]];

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

/** Occupancy → the payment-style chip the UI renders. */
function occupancyChip(status: 'vacant' | 'occupied' | 'partial'): StatusKind {
  if (status === 'vacant') return 'vacant';
  if (status === 'partial') return 'due';
  return 'paid';
}

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

  const { user } = useAuth();
  const { data: dash, isLoading } = useDashboard();
  const { data: brief, isPending: briefPending } = useBriefing();
  const { data: props = [] } = useProperties();

  const name = user?.name ?? 'there';
  const first = name.split(' ')[0] ?? name;
  const summary = dash?.summary ?? EMPTY_SUMMARY;
  const upcoming = (dash?.upcoming ?? []).slice(0, 3);
  const activity = (dash?.activity ?? []).slice(0, 3);
  const newEnquiries = dash?.enquiriesUnread ?? 0;
  // Only claim there's nothing to brief once the request has actually settled —
  // showing the empty copy mid-fetch reads as "you have no portfolio".
  const briefing = brief ?? { headline: 'Nothing needs your attention today.', points: [] };

  const segPct = (amt: number): number =>
    summary.rollAnnual > 0 ? (amt / summary.rollAnnual) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ---- gradient hero ---- */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <Avatar initials={initialsOf(name)} tone="solid" size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="caption" color="rgba(255,255,255,0.78)">
                  Good evening,
                </Text>
                <Text variant="title" color="#FFFFFF" numberOfLines={1} style={{ fontSize: 19 }}>
                  {first}
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
              {newEnquiries > 0 ? (
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
              ) : null}
            </View>
          </View>

          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="label" color="rgba(255,255,255,0.78)">
                  Collected this cycle
                </Text>
                <Text variant="display" color="#FFFFFF" style={{ fontSize: 36, lineHeight: 40, marginTop: 4 }}>
                  {naira(summary.collected)}
                </Text>
              </View>
              <Text variant="caption" color="rgba(255,255,255,0.82)" style={{ textAlign: 'right', paddingBottom: 6 }}>
                of {nairaShort(summary.rollAnnual)}
                {'\n'}annual roll
              </Text>
            </View>

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
              <View style={{ width: `${segPct(summary.overdueAmt)}%`, backgroundColor: colors.danger }} />
              <View style={{ width: `${segPct(summary.dueAmt)}%`, backgroundColor: colors.accent }} />
              <View style={{ width: `${segPct(summary.vacantAmt)}%`, backgroundColor: 'rgba(255,255,255,0.32)' }} />
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
          {isLoading && !dash ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <StatCard label="Properties" value={`${summary.total}`} sub={`${summary.occupied} occupied`} style={{ flex: 1 }} />
            <StatCard
              label="Occupancy"
              value={`${summary.occupied}/${summary.total}`}
              sub={`${summary.occupancyPct}% filled`}
              style={{ flex: 1 }}
            />
            <StatCard label="Annual roll" value={nairaShort(summary.rollAnnual)} sub="across portfolio" style={{ flex: 1 }} />
          </View>

          {/* AI briefing */}
          <AICard onPress={() => router.push('/ai')} padding={18} style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <AILabel>Today&apos;s AI briefing</AILabel>
              {!briefPending && briefing.points.length > 0 ? (
                <Chip label={`${briefing.points.length} insights`} tone="ai" solid />
              ) : null}
            </View>
            {briefPending ? (
              <View style={{ gap: 8, marginTop: 13 }}>
                <Skeleton height={17} width="82%" />
                <Skeleton height={13} width="64%" />
              </View>
            ) : (
              <>
                <Text variant="title" style={{ fontSize: 17, lineHeight: 21, marginTop: 11 }}>
                  {briefing.headline}
                </Text>
                {briefing.points[0] ? (
                  <Text
                    variant="caption"
                    color={colors.muted}
                    style={{ marginTop: 7, lineHeight: 20 }}
                  >
                    {briefing.points[0]}
                  </Text>
                ) : null}
              </>
            )}
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
            <Button title="See all" variant="ghost" size="sm" fullWidth={false} onPress={() => router.push('/payments/log')} />
          </View>
          <Card padding={0} style={{ paddingHorizontal: 16 }}>
            {upcoming.length === 0 ? (
              <Text variant="caption" color={colors.muted} style={{ paddingVertical: 16 }}>
                No upcoming or overdue rent.
              </Text>
            ) : (
              upcoming.map((u, i) => {
                const chip: StatusKind = u.status === 'overdue' ? 'overdue' : 'due';
                return (
                  <Pressable
                    key={u.tenantId + u.dueDate}
                    onPress={() => router.push(`/properties/${u.propertyId}`)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 13,
                      borderBottomWidth: i < upcoming.length - 1 ? 1 : 0,
                      borderBottomColor: colors.line,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Avatar initials={initialsOf(u.tenantName)} size={42} tone={u.status === 'overdue' ? 'danger' : 'tint'} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="bodyStrong" numberOfLines={1} style={{ fontSize: 14.5 }}>
                        {u.tenantName}
                      </Text>
                      <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
                        {u.propertyTitle} · {nairaShort(u.amount)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <StatusChip status={chip} days={Math.abs(u.daysToDue)} />
                    </View>
                  </Pressable>
                );
              })
            )}
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
            <Button title="See all" variant="ghost" size="sm" fullWidth={false} onPress={() => router.push('/enquiries')} />
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
                <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 1, fontSize: 12.5 }}>
                  From the tenant app
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
              {props.length} total
            </Text>
          </View>
          <View style={{ gap: 12 }}>
            {props.map((p) => (
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
                <PropertyThumb size={64} radius={13} imageUrl={p.images[0]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="title" numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 19 }}>
                    {p.propertyTitle}
                  </Text>
                  <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                    {p.area} · {p.propertyType}
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
                      {naira(p.rentAmount ?? 0)}
                      <Text variant="caption" color={colors.muted}> /yr</Text>
                    </Text>
                    <StatusChip status={occupancyChip(p.status)} />
                  </View>
                </View>
              </Pressable>
            ))}
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
              Recent activity
            </Text>
            <Button title="See all" variant="ghost" size="sm" fullWidth={false} onPress={() => router.push('/activity')} />
          </View>
          {activity.length === 0 ? (
            <Card padding={15}>
              <Text variant="caption" color={colors.muted}>
                No activity yet.
              </Text>
            </Card>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 4 }}>
              {activity.map((a) => (
                <Card key={a.id} padding={15} style={{ minWidth: 210 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                    <Avatar initials={initialsOf(a.actorName)} size={34} />
                    <Text variant="captionStrong" style={{ fontSize: 12.5 }}>
                      {a.actorName.split(' ')[0]}
                    </Text>
                    <Text variant="caption" color={colors.muted} style={{ marginLeft: 'auto', fontSize: 11 }}>
                      {timeAgo(a.createdAt)}
                    </Text>
                  </View>
                  <Text variant="bodyStrong" style={{ fontSize: 13.5, marginTop: 11 }}>
                    {a.description}
                  </Text>
                </Card>
              ))}
            </ScrollView>
          )}

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
