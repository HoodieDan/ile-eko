import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  AppBar,
  Text,
  Eyebrow,
  Card,
  AICard,
  Avatar,
  Icon,
  EmptyState,
  colors,
  spacing,
  radii,
  type IconName,
} from '@ile-eko/ui';
import { useActivity, initialsOf, timeAgo, type ActivityLogDTO } from '@ile-eko/core';

type Category = ActivityLogDTO['category'];
type TypeFilter = 'all' | Category;

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Payments' },
  { id: 'tenant', label: 'Tenants' },
  { id: 'image', label: 'Images' },
  { id: 'status', label: 'Status' },
  { id: 'maintenance', label: 'Repairs' },
];

type DayGroup = 'Today' | 'Yesterday' | 'Earlier';
const GROUP_ORDER: DayGroup[] = ['Today', 'Yesterday', 'Earlier'];

function groupOf(iso: string): DayGroup {
  const then = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = then.getTime();
  if (t >= startOfToday) return 'Today';
  if (t >= startOfToday - 86_400_000) return 'Yesterday';
  return 'Earlier';
}

interface Kind {
  icon: IconName;
  fg: string;
  bg: string;
}

function kindOf(category: Category): Kind {
  switch (category) {
    case 'payment':
      return { icon: 'wallet', fg: colors.ok, bg: colors.okTint };
    case 'tenant':
      return { icon: 'user', fg: colors.info, bg: colors.infoTint };
    case 'image':
      return { icon: 'image', fg: colors.primary, bg: colors.primaryTint };
    case 'status':
      return { icon: 'layers', fg: colors.warn, bg: colors.warnTint };
    case 'maintenance':
      return { icon: 'settings', fg: colors.neutral, bg: colors.neutralTint };
    default:
      return { icon: 'activity', fg: colors.primary, bg: colors.primaryTint };
  }
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: radii.pill,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : colors.line,
        backgroundColor: active ? colors.primary : colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant="captionStrong" color={active ? colors.onAccent : colors.ink}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function Activity(): React.ReactElement {
  const router = useRouter();
  const [type, setType] = useState<TypeFilter>('all');
  const [who, setWho] = useState<string>('all');

  const { data: activityLog = [], isLoading } = useActivity();

  const people = useMemo<string[]>(
    () => ['all', ...Array.from(new Set(activityLog.map((a) => a.actorName)))],
    [activityLog],
  );

  const groups = useMemo<{ day: DayGroup; items: ActivityLogDTO[] }[]>(() => {
    const list = activityLog.filter(
      (a) => (type === 'all' || a.category === type) && (who === 'all' || a.actorName === who),
    );
    return GROUP_ORDER.map((day) => ({
      day,
      items: list.filter((a) => groupOf(a.createdAt) === day),
    })).filter((g) => g.items.length > 0);
  }, [activityLog, type, who]);

  return (
    <Screen scroll padded bottomSpace={120}>
      <AppBar title="Activity log" onBack={() => router.back()} />

      {/* type filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.xl }}
        style={{ marginHorizontal: -spacing.xl, marginTop: spacing.sm }}
      >
        {TYPE_FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            label={f.label}
            active={type === f.id}
            onPress={() => setType(f.id)}
          />
        ))}
      </ScrollView>

      {/* who filters */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginTop: spacing.md,
          alignItems: 'center',
        }}
      >
        {people.map((pn) => (
          <FilterChip
            key={pn}
            label={pn === 'all' ? 'Everyone' : (pn.split(' ')[0] ?? pn)}
            active={who === pn}
            onPress={() => setWho(pn)}
          />
        ))}
      </View>

      {/* grouped feed */}
      {isLoading ? (
        <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <View style={{ marginTop: spacing.xl }}>
          <EmptyState
            icon="activity"
            title="No activity"
            message="Nothing matches these filters."
          />
        </View>
      ) : (
        groups.map((group) => (
          <View key={group.day} style={{ marginTop: spacing.lg }}>
            <Eyebrow style={{ marginBottom: spacing.md }}>{group.day}</Eyebrow>
            <Card padding={0} style={{ paddingHorizontal: spacing.lg }}>
              {group.items.map((entry, i) => {
                const k = kindOf(entry.category);
                const last = i === group.items.length - 1;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() =>
                      entry.propertyId ? router.push(`/properties/${entry.propertyId}`) : undefined
                    }
                    style={{
                      flexDirection: 'row',
                      gap: spacing.md,
                      alignItems: 'flex-start',
                      paddingVertical: 14,
                      borderBottomWidth: last ? 0 : 1,
                      borderBottomColor: colors.line,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        backgroundColor: k.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon name={k.icon} size={18} color={k.fg} strokeWidth={2.1} />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="bodyStrong" color={colors.ink} style={{ fontSize: 13.5 }}>
                        {entry.description}
                      </Text>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.sm,
                          marginTop: 6,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Avatar initials={initialsOf(entry.actorName)} size={18} />
                          <Text variant="captionStrong" color={colors.muted}>
                            {entry.actorName}
                          </Text>
                        </View>
                        <Text variant="caption" color={colors.muted}>
                          · {timeAgo(entry.createdAt)}
                        </Text>
                      </View>

                      {entry.flag != null ? (
                        <AICard padding={0} style={{ marginTop: 9, borderRadius: radii.md }}>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: spacing.sm,
                              paddingVertical: 9,
                              paddingHorizontal: 11,
                            }}
                          >
                            <Icon name="spark" size={14} color={colors.aiDeep} fill />
                            <Text variant="captionStrong" color={colors.aiDeep} style={{ flex: 1 }}>
                              {entry.flag}
                            </Text>
                          </View>
                        </AICard>
                      ) : null}
                    </View>

                    <Icon name="fwd" size={16} color={colors.muted} style={{ marginTop: 4 }} />
                  </Pressable>
                );
              })}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}
