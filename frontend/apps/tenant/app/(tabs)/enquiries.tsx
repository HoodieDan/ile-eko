import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Card,
  Chip,
  EmptyState,
  PropertyThumb,
  colors,
  spacing,
  radii,
} from '@ile-eko/ui';
import { sentEnquiries, getListing, naira, type SentEnquiry } from '@/data/mock';

function EnquiryCard({
  enquiry,
  onOpen,
}: {
  enquiry: SentEnquiry;
  onOpen: (listingId: string) => void;
}): React.ReactElement | null {
  const listing = getListing(enquiry.listingId);
  if (!listing) return null;

  const replied = enquiry.status === 'replied';
  const landlordFirst = listing.landlord.split(' ')[0] ?? listing.landlord;

  return (
    <Card padding={14} flat onPress={() => onOpen(listing.id)}>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <PropertyThumb size={52} radius={12} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.sm,
            }}
          >
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {listing.title}
            </Text>
            <Text variant="caption" color={colors.muted}>
              {enquiry.when}
            </Text>
          </View>
          <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
            {listing.area} · {naira(listing.rent)}/yr
          </Text>
          <View style={{ marginTop: 7 }}>
            {replied ? (
              <Chip tone="ok" icon="checkCircle" label="Landlord replied" />
            ) : (
              <Chip tone="warn" icon="clock" label="Sent · awaiting reply" />
            )}
          </View>
        </View>
      </View>

      <View
        style={{
          marginTop: spacing.md,
          paddingVertical: 10,
          paddingHorizontal: 13,
          borderRadius: radii.md,
          backgroundColor: colors.surface2,
        }}
      >
        <Text variant="body" color={colors.muted} style={{ lineHeight: 19 }}>
          “{enquiry.message}”
        </Text>
      </View>

      {enquiry.reply ? (
        <View
          style={{
            marginTop: spacing.sm,
            paddingVertical: 10,
            paddingHorizontal: 13,
            borderRadius: radii.md,
            backgroundColor: colors.primaryTint,
          }}
        >
          <Text variant="body" color={colors.ink} style={{ lineHeight: 19 }}>
            <Text variant="bodyStrong" color={colors.ink}>
              {landlordFirst}:{' '}
            </Text>
            {enquiry.reply}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export default function Enquiries(): React.ReactElement {
  const router = useRouter();

  const open = (listingId: string): void => {
    router.push(`/listing/${listingId}`);
  };

  return (
    <Screen scroll padded bottomSpace={120}>
      <View style={{ paddingTop: spacing.xs }}>
        <Text variant="h1">Enquiries</Text>
        <Text variant="body" color={colors.muted} style={{ marginTop: 3 }}>
          Messages you&apos;ve sent to landlords
        </Text>
      </View>

      {sentEnquiries.length === 0 ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <EmptyState
            icon="message"
            title="No enquiries yet"
            message="Contact a landlord from any listing to start."
          />
        </View>
      ) : (
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          {sentEnquiries.map((e) => (
            <EnquiryCard key={e.id} enquiry={e} onOpen={open} />
          ))}
        </View>
      )}
    </Screen>
  );
}
