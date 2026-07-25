import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
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
import {
  naira,
  timeAgo,
  useAuth,
  useListing,
  useMyEnquiries,
  type EnquiryDTO,
} from '@ile-eko/core';

function EnquiryCard({
  enquiry,
  onOpen,
}: {
  enquiry: EnquiryDTO;
  onOpen: (listingId: string) => void;
}): React.ReactElement {
  const { data: listing } = useListing(enquiry.listingId);

  const replied = enquiry.status === 'replied';
  const landlordName = listing?.landlordName ?? '';
  const landlordFirst = landlordName.split(' ')[0] ?? landlordName;

  return (
    <Card padding={14} flat onPress={() => onOpen(enquiry.listingId)}>
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
              {listing?.title ?? 'Listing'}
            </Text>
            <Text variant="caption" color={colors.muted}>
              {timeAgo(enquiry.createdAt)}
            </Text>
          </View>
          {listing ? (
            <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
              {listing.area} · {naira(listing.rent)}/yr
            </Text>
          ) : null}
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
            {landlordFirst ? (
              <Text variant="bodyStrong" color={colors.ink}>
                {landlordFirst}:{' '}
              </Text>
            ) : null}
            {enquiry.reply}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export default function Enquiries(): React.ReactElement | null {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status !== 'authenticated') return <Redirect href="/(auth)/login" />;
  return <EnquiriesContent />;
}

function EnquiriesContent(): React.ReactElement {
  const router = useRouter();
  const { data: enquiries = [], isLoading } = useMyEnquiries();

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

      {isLoading ? (
        <View style={{ paddingTop: 60, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : enquiries.length === 0 ? (
        <View style={{ marginTop: spacing['3xl'] }}>
          <EmptyState
            icon="message"
            title="No enquiries yet"
            message="Contact a landlord from any listing to start."
          />
        </View>
      ) : (
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          {enquiries.map((e) => (
            <EnquiryCard key={e.id} enquiry={e} onOpen={open} />
          ))}
        </View>
      )}
    </Screen>
  );
}
