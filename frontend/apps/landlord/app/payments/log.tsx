import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogPayment, useProperties, useTenants } from '@ile-eko/core';
import {
  Body,
  Button,
  Heading,
  Input,
  SegmentedControl,
  Select,
  useTheme,
  useToast,
} from '@ile-eko/ui';

type PaymentMethod = 'cash' | 'transfer' | 'card' | 'other';

export default function LogPayment(): React.ReactElement {
  const theme = useTheme();
  const toast = useToast();
  const { data: properties = [] } = useProperties();
  const { data: tenants = [] } = useTenants();
  const logPayment = useLogPayment();

  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [notes, setNotes] = useState('');

  const filteredTenants = propertyId ? tenants.filter((t) => t.propertyId === propertyId) : tenants;

  async function onSubmit() {
    if (!propertyId || !tenantId) {
      toast.show('Choose a property and a tenant', 'warning');
      return;
    }
    const parsed = Number(amount.replace(/[^0-9.]/g, ''));
    if (!parsed || parsed <= 0) {
      toast.show('Enter a valid amount', 'warning');
      return;
    }
    await logPayment.mutateAsync({
      propertyId,
      tenantId,
      amount: parsed,
      amountPaid: parsed,
      method,
      notes: notes || undefined,
    });
    toast.show('Payment logged', 'success');
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Heading level={1}>Log payment</Heading>
        <Body color={theme.colors.textMuted}>
          Record a rent payment against a tenant. This will create an activity entry.
        </Body>

        <Select
          label="Property"
          value={propertyId}
          onChange={(v) => {
            setPropertyId(v);
            setTenantId(null);
          }}
          options={properties.map((p) => ({ label: p.propertyTitle, value: p.id }))}
        />

        <Select
          label="Tenant"
          value={tenantId}
          onChange={setTenantId}
          options={filteredTenants.map((t) => ({ label: t.fullName, value: t.id }))}
        />

        <Input
          label="Amount (₦)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="0"
        />

        <View>
          <Body strong style={{ marginBottom: theme.spacing.xs }}>
            Method
          </Body>
          <SegmentedControl<PaymentMethod>
            value={method}
            onChange={setMethod}
            options={[
              { label: 'Transfer', value: 'transfer' },
              { label: 'Cash', value: 'cash' },
              { label: 'Card', value: 'card' },
              { label: 'Other', value: 'other' },
            ]}
          />
        </View>

        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional"
          multiline
        />

        <Button
          label="Log payment"
          fullWidth
          loading={logPayment.isPending}
          onPress={onSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
