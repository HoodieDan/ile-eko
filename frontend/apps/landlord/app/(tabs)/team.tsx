import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Eyebrow,
  Card,
  Chip,
  Avatar,
  Button,
  Icon,
  Divider,
  useToast,
  colors,
  spacing,
  radii,
  type ChipTone,
  type IconName,
} from '@ile-eko/ui';
import { caretakers, activityLog, type Caretaker } from '@/data/mock';

const STATUS_META: Record<Caretaker['status'], { tone: ChipTone; icon: IconName; label: string }> = {
  active: { tone: 'ok', icon: 'check', label: 'Active' },
  pending: { tone: 'warn', icon: 'clock', label: 'Pending' },
  revoked: { tone: 'neutral', icon: 'x', label: 'Revoked' },
};

function caretakerSubtitle(c: Caretaker): string {
  if (c.status === 'pending') return 'Invite sent · awaiting acceptance';
  if (c.status === 'revoked') return 'Access removed';
  const propLabel = `${c.propertyCount} ${c.propertyCount === 1 ? 'property' : 'properties'}`;
  const shown = c.areas.slice(0, 2).join(', ');
  const more = c.areas.length > 2 ? '…' : '';
  return `${propLabel} · ${shown}${more}`;
}

export default function TeamTab(): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const recent = activityLog.slice(0, 3);

  return (
    <Screen scroll padded bottomSpace={120}>
      <View style={{ paddingTop: spacing.xs }}>
        <Text variant="h1">Team</Text>
        <Text variant="caption" color={colors.muted} style={{ marginTop: 3 }}>
          Caretakers act on the ground with the permissions you set.
        </Text>
      </View>

      <Button
        title="Invite Caretaker"
        variant="primary"
        icon="plus"
        fullWidth
        onPress={() => showToast('Invite sent')}
        style={{ marginTop: spacing.lg }}
      />

      {/* Roster */}
      <View style={{ marginTop: spacing.xl, marginBottom: 11 }}>
        <Eyebrow>{`Caretakers · ${caretakers.length}`}</Eyebrow>
      </View>
      <View style={{ gap: spacing.md }}>
        {caretakers.map((c) => {
          const meta = STATUS_META[c.status];
          return (
            <Card
              key={c.id}
              padding={15}
              onPress={() => showToast(`Editing ${c.name}`)}
              style={{ opacity: c.status === 'revoked' ? 0.62 : 1 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                <Avatar initials={c.initials} size={48} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text variant="h3" numberOfLines={1} style={{ flex: 1 }}>
                      {c.name}
                    </Text>
                    <Chip tone={meta.tone} icon={meta.icon} label={meta.label} />
                  </View>
                  <Text
                    variant="caption"
                    color={colors.muted}
                    numberOfLines={1}
                    style={{ marginTop: 3 }}
                  >
                    {caretakerSubtitle(c)}
                  </Text>
                </View>
                <Icon name="fwd" size={18} color={colors.muted} />
              </View>
            </Card>
          );
        })}
      </View>

      {/* Oversight */}
      <View style={{ marginTop: spacing['2xl'], marginBottom: 11 }}>
        <Eyebrow>Oversight</Eyebrow>
      </View>
      <View style={{ gap: spacing.md }}>
        <Card padding={14} onPress={() => router.push('/activity')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: colors.primaryTint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="activity" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Activity log</Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
                Every caretaker action, timestamped
              </Text>
            </View>
            <Icon name="fwd" size={18} color={colors.muted} />
          </View>
        </Card>

        <Card padding={14} onPress={() => router.push('/activity')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: colors.surface2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="eye" size={20} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Preview caretaker view</Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
                See exactly what Musa can do
              </Text>
            </View>
            <Icon name="fwd" size={18} color={colors.muted} />
          </View>
        </Card>
      </View>

      {/* Recent activity preview */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing['2xl'],
          marginBottom: 11,
        }}
      >
        <Eyebrow>Recent activity</Eyebrow>
        <Pressable onPress={() => router.push('/activity')} hitSlop={8}>
          <Text variant="captionStrong" color={colors.primary}>
            See full log
          </Text>
        </Pressable>
      </View>
      <Card padding={0} style={{ paddingHorizontal: spacing.lg }}>
        {recent.map((a, i) => (
          <View key={a.id}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: 13 }}>
              <Avatar initials={a.initials} size={34} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="captionStrong" style={{ fontSize: 13.5 }}>
                  {a.action}
                </Text>
                <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
                  {a.detail}
                </Text>
                {a.flag ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}>
                    <Icon name="spark" size={12} color={colors.aiDeep} fill />
                    <Text variant="captionStrong" color={colors.aiDeep} style={{ fontSize: 11.5, flex: 1 }}>
                      {a.flag}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text variant="caption" color={colors.muted} style={{ fontSize: 11.5 }}>
                {a.ago}
              </Text>
            </View>
            {i < recent.length - 1 ? <Divider /> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}
