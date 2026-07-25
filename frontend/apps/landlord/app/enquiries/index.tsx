import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  AppBar,
  Text,
  Eyebrow,
  Avatar,
  EmptyState,
  colors,
  radii,
  spacing,
} from '@ile-eko/ui';
import { useEnquiryInbox, initialsOf, timeAgo, type EnquiryInboxDTO } from '@ile-eko/core';

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier'] as const;
type Group = (typeof GROUP_ORDER)[number];

interface GroupBucket {
  group: Group;
  items: EnquiryInboxDTO[];
}

function groupOf(iso: string): Group {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = new Date(iso).getTime();
  if (t >= startOfToday) return 'Today';
  if (t >= startOfToday - 86_400_000) return 'Yesterday';
  return 'Earlier';
}

// Design: color-mix(in srgb, var(--primary) 5%, var(--surface)) — a faint
// brand wash over the white card to flag unread enquiries.
const UNREAD_BG = 'rgba(30,110,82,0.05)';

function EnquiryRow({ enquiry }: { enquiry: EnquiryInboxDTO }): React.ReactElement {
  const router = useRouter();
  const read = enquiry.read;

  return (
    <Pressable
      onPress={() => router.push(`/enquiries/${enquiry.id}`)}
      style={{
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'flex-start',
        padding: 13,
        paddingHorizontal: 15,
        borderRadius: radii.card,
        backgroundColor: colors.surface,
        overflow: 'hidden',
      }}
    >
      {!read ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: UNREAD_BG,
          }}
        />
      ) : null}
      <Avatar initials={initialsOf(enquiry.tenantName)} size={44} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {enquiry.tenantName}
          </Text>
          <Text variant="caption" color={colors.muted}>
            {timeAgo(enquiry.createdAt)}
          </Text>
        </View>
        <Text variant="caption" color={colors.muted} numberOfLines={1} style={{ marginTop: 1 }}>
          {`Re: ${enquiry.targetLabel}`}
        </Text>
        <Text
          variant="body"
          color={read ? colors.muted : colors.ink}
          numberOfLines={2}
          style={{ marginTop: 5, lineHeight: 19 }}
        >
          {enquiry.snippet}
        </Text>
      </View>
      {!read ? (
        <View
          style={{
            width: 9,
            height: 9,
            borderRadius: radii.pill,
            backgroundColor: colors.primary,
            marginTop: 5,
          }}
        />
      ) : null}
    </Pressable>
  );
}

export default function EnquiriesInbox(): React.ReactElement {
  const router = useRouter();
  const { data, isLoading } = useEnquiryInbox();

  const items = data?.items ?? [];
  const unread = data?.unreadCount ?? 0;

  const groups: GroupBucket[] = GROUP_ORDER.map((group) => ({
    group,
    items: items.filter((e) => groupOf(e.createdAt) === group),
  })).filter((bucket) => bucket.items.length > 0);

  return (
    <Screen scroll padded bottomSpace={120}>
      <AppBar title="Enquiries" onBack={() => router.back()} />

      <Text variant="body" color={colors.muted} style={{ marginBottom: spacing.lg }}>
        {`From the Ilé Èkó marketplace${unread ? ` · ${unread} unread` : ''}`}
      </Text>

      {isLoading ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <EmptyState
          icon="message"
          title="No enquiries yet"
          message="List a vacant unit to start receiving enquiries from tenants."
        />
      ) : (
        groups.map(({ group, items: bucket }) => (
          <View key={group} style={{ marginBottom: spacing.lg }}>
            <Eyebrow style={{ marginBottom: spacing.md }}>{group}</Eyebrow>
            <View style={{ gap: spacing.md }}>
              {bucket.map((e) => (
                <EnquiryRow key={e.id} enquiry={e} />
              ))}
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
