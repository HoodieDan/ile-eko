import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
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
import { activityLog, type ActivityEntry } from '@/data/mock';

type TypeFilter = 'all' | ActivityEntry['type'];

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

function groupOf(entry: ActivityEntry): DayGroup {
  if (entry.when.startsWith('Today')) return 'Today';
  if (entry.when.startsWith('Yesterday')) return 'Yesterday';
  return 'Earlier';
}

interface Kind {
  icon: IconName;
  fg: string;
  bg: string;
}

const KIND: Record<ActivityEntry['type'], Kind> = {
  payment: { icon: 'wallet', fg: colors.ok, bg: colors.okTint },
  tenant: { icon: 'user', fg: colors.info, bg: colors.infoTint },
  image: { icon: 'image', fg: colors.primary, bg: colors.primaryTint },
  status: { icon: 'layers', fg: colors.warn, bg: colors.warnTint },
  maintenance: { icon: 'settings', fg: colors.neutral, bg: colors.neutralTint },
};

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

  const people = useMemo<string[]>(
    () => ['all', ...Array.from(new Set(activityLog.map((a) => a.who)))],
    [],
  );

  const groups = useMemo<{ day: DayGroup; items: ActivityEntry[] }[]>(() => {
    const list = activityLog.filter(
      (a) => (type === 'all' || a.type === type) && (who === 'all' || a.who === who),
    );
    return GROUP_ORDER.map((day) => ({
      day,
      items: list.filter((a) => groupOf(a) === day),
    })).filter((g) => g.items.length > 0);
  }, [type, who]);

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
            label={pn === 'all' ? 'All caretakers' : (pn.split(' ')[0] ?? pn)}
            active={who === pn}
            onPress={() => setWho(pn)}
          />
        ))}
        <View
          style={{
            minHeight: 36,
            paddingHorizontal: 14,
            borderRadius: radii.pill,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Icon name="calendar" size={13} color={colors.muted} />
          <Text variant="caption" color={colors.muted}>
            Last 7 days
          </Text>
        </View>
      </View>

      {/* grouped feed */}
      {groups.length === 0 ? (
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
                const k = KIND[entry.type];
                const last = i === group.items.length - 1;
                return (
                  <Pressable
                    key={entry.id}
                    onPress={() => router.push(`/properties/${entry.propertyId}`)}
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
                        {entry.action}
                      </Text>
                      <Text
                        variant="caption"
                        color={colors.muted}
                        numberOfLines={1}
                        style={{ marginTop: 2 }}
                      >
                        {entry.detail}
                      </Text>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.sm,
                          marginTop: 6,
                        }}
                      >
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                        >
                          <Avatar initials={entry.initials} size={18} />
                          <Text variant="captionStrong" color={colors.muted}>
                            {entry.who}
                          </Text>
                        </View>
                        <Text variant="caption" color={colors.muted}>
                          · {entry.when}
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
                            <Text
                              variant="captionStrong"
                              color={colors.aiDeep}
                              style={{ flex: 1 }}
                            >
                              {entry.flag}
                            </Text>
                          </View>
                        </AICard>
                      ) : null}
                    </View>

                    <Icon
                      name="fwd"
                      size={16}
                      color={colors.muted}
                      style={{ marginTop: 4 }}
                    />
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
