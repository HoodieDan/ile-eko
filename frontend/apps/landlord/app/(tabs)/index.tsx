import { router } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEnquiries, useProperties, useTenants } from '@ile-eko/core';
import {
  AICard,
  Body,
  Button,
  Caption,
  Card,
  Display,
  Heading,
  ListRow,
  Overline,
  StatCard,
  StatusPill,
  useTheme,
} from '@ile-eko/ui';

function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export default function Dashboard(): React.ReactElement {
  const theme = useTheme();
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const { data: enquiries = [] } = useEnquiries();

  const portfolioValue = properties.reduce((sum, p) => sum + (p.rentAmount ?? 0), 0);
  const vacantCount = properties.filter((p) => p.status === 'vacant').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Overline color={theme.colors.textMuted}>Today</Overline>
          <Display style={{ marginTop: theme.spacing.xs }}>Good morning.</Display>
        </View>

        <AICard
          eyebrow="AI briefing"
          title="3 things to know"
          body={`Your portfolio earns about ${formatNGN(
            portfolioValue,
          )} a year. ${vacantCount} unit${vacantCount === 1 ? '' : 's'} ${
            vacantCount === 1 ? 'is' : 'are'
          } vacant. One enquiry is awaiting your reply.`}
          footer={
            <Button
              label="Open assistant"
              variant="secondary"
              onPress={() => router.push('/(tabs)/ai')}
            />
          }
        />

        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <StatCard label="Portfolio" value={`${properties.length}`} hint="properties" />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard
              label="Vacant"
              value={`${vacantCount}`}
              hint={vacantCount > 0 ? 'needs attention' : 'all occupied'}
              trend={vacantCount > 0 ? 'down' : 'up'}
            />
          </View>
        </View>

        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            <Heading level={3}>Upcoming & overdue</Heading>
            <Button
              label="Log payment"
              variant="ghost"
              size="sm"
              onPress={() => router.push('/payments/log')}
            />
          </View>
          <Card padding="none">
            {tenants.length === 0 ? (
              <View style={{ padding: theme.spacing.lg }}>
                <Body color={theme.colors.textMuted}>No tenants yet.</Body>
              </View>
            ) : (
              tenants.slice(0, 4).map((t) => (
                <ListRow
                  key={t.id}
                  title={t.fullName}
                  subtitle={`Due ${new Date(t.paymentDueDate).toLocaleDateString()}`}
                  trailing={<StatusPill state="pending" />}
                  onPress={() => router.push(`/tenants/${t.id}` as never)}
                />
              ))
            )}
          </Card>
        </View>

        <View>
          <Heading level={3} style={{ marginBottom: theme.spacing.md }}>
            Enquiries
          </Heading>
          <Card padding="none">
            {enquiries.length === 0 ? (
              <View style={{ padding: theme.spacing.lg }}>
                <Body color={theme.colors.textMuted}>You're all caught up.</Body>
              </View>
            ) : (
              enquiries.map((e) => (
                <ListRow
                  key={e.id}
                  title={e.message.slice(0, 60) + (e.message.length > 60 ? '…' : '')}
                  subtitle={new Date(e.createdAt).toLocaleString()}
                  trailing={<StatusPill state="pending" label="New" />}
                  onPress={() => router.push(`/enquiries/${e.id}` as never)}
                />
              ))
            )}
          </Card>
        </View>

        <View>
          <Heading level={3} style={{ marginBottom: theme.spacing.md }}>
            Recent activity
          </Heading>
          <Card>
            <Caption color={theme.colors.textMuted}>
              Activity log will populate as you log payments, add tenants and respond to enquiries.
            </Caption>
            <View style={{ marginTop: theme.spacing.md }}>
              <Button
                label="View activity"
                variant="ghost"
                onPress={() => router.push('/activity')}
              />
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
