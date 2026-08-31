import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Screen,
  AppBar,
  Input,
  Select,
  SegmentedControl,
  Button,
  Text,
  colors,
  spacing,
  useToast,
  type SelectOption,
  type SegmentOption,
} from '@ile-eko/ui';
import {
  useProperties,
  useCreateTenant,
  useCreateLease,
  useTenant,
  useUpdateTenant,
  type PaymentFrequency,
} from '@ile-eko/core';

type Schedule = PaymentFrequency;

const SCHEDULE_OPTIONS: SegmentOption<Schedule>[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'biannual', label: 'Bi-annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
];

interface TenantFormState {
  name: string;
  phone: string;
  email: string;
  property: string;
  start: string;
  end: string;
  rent: string;
  schedule: Schedule;
  moveIn: string;
}

interface TenantFormErrors {
  name: string;
  phone: string;
  rent: string;
}

function validate(f: TenantFormState, editing = false): TenantFormErrors {
  const rentDigits = f.rent.replace(/[^\d]/g, '');
  return {
    name: f.name.trim() ? '' : 'Required',
    phone: /^0\d{10}$/.test(f.phone.replace(/\s/g, '')) ? '' : 'Valid NG number',
    rent: editing || Number(rentDigits) ? '' : 'Required',
  };
}

export default function AddTenant(): React.ReactElement {
  const router = useRouter();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const editing = Boolean(editId);
  const { showToast } = useToast();
  const { data: properties = [] } = useProperties();
  const createTenant = useCreateTenant();
  const createLease = useCreateLease();
  const updateTenant = useUpdateTenant();
  const { data: existing, isError: existingError, refetch: refetchExisting } = useTenant(editId);

  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [form, setForm] = useState<TenantFormState>({
    name: '',
    phone: '',
    email: '',
    property: '',
    start: '',
    end: '',
    rent: '',
    schedule: 'annual',
    moveIn: '',
  });
  const hydratedTenantId = React.useRef<string | null>(null);

  useEffect(() => {
    if (!existing || hydratedTenantId.current === existing.id) return;
    hydratedTenantId.current = existing.id;
    setForm((prev) => ({
      ...prev,
      name: existing.fullName,
      phone: existing.phone,
      email: existing.email ?? '',
    }));
  }, [existing]);

  const propertyOptions = useMemo<SelectOption[]>(
    () => properties.map((p) => ({ value: p.id, label: `${p.propertyTitle} · ${p.area}` })),
    [properties],
  );

  const set = <K extends keyof TenantFormState>(key: K, value: TenantFormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const errors = validate(form, editing);

  const handleSave = async (): Promise<void> => {
    setTouched(true);
    if (errors.name || errors.phone || errors.rent) return;
    setSubmitting(true);
    try {
      if (editId) {
        await updateTenant.mutateAsync({
          id: editId,
          input: {
            fullName: form.name.trim(),
            phone: form.phone.replace(/\s/g, ''),
            email: form.email.trim() || undefined,
          },
        });
        showToast('Tenant details updated');
        router.back();
        return;
      }
      const tenant = await createTenant.mutateAsync({
        fullName: form.name.trim(),
        phone: form.phone.replace(/\s/g, ''),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
      });
      // A lease needs a property + dates; create one when the landlord supplied them.
      if (form.property && form.start && form.end) {
        await createLease.mutateAsync({
          tenantId: tenant.id,
          propertyId: form.property,
          startDate: form.start,
          endDate: form.end,
          billingAmount: Number(form.rent.replace(/[^\d]/g, '')),
          schedule: form.schedule,
        });
      }
      showToast('Tenant added');
      router.back();
    } catch {
      setSubmitting(false);
      showToast(editing ? 'Could not update tenant' : 'Could not add tenant');
    }
  };

  if (editing && existingError) {
    return (
      <Screen padded>
        <AppBar title="Edit tenant" onBack={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          <Text variant="title" center>
            Couldn't load this tenant
          </Text>
          <Button title="Try again" variant="secondary" onPress={() => void refetchExisting()} />
        </View>
      </Screen>
    );
  }

  if (editing && (!existing || hydratedTenantId.current !== existing.id)) {
    return (
      <Screen padded>
        <AppBar title="Edit tenant" onBack={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded bottomSpace={120}>
      <AppBar title={editing ? 'Edit tenant' : 'Add tenant'} onBack={() => router.back()} />

      <View style={{ gap: spacing.lg, marginTop: spacing.sm }}>
        <Input
          label="Full name"
          value={form.name}
          onChangeText={(t) => set('name', t)}
          placeholder="e.g. Adebayo Williams"
          icon="user"
          autoCapitalize="words"
          error={touched ? errors.name : undefined}
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Input
            label="Phone"
            value={form.phone}
            onChangeText={(t) => set('phone', t)}
            placeholder="0803 000 0000"
            keyboardType="phone-pad"
            error={touched ? errors.phone : undefined}
            containerStyle={{ flex: 1 }}
          />
          <Input
            label="Email"
            value={form.email}
            onChangeText={(t) => set('email', t)}
            placeholder="name@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={{ flex: 1 }}
          />
        </View>

        {!editing ? (
          <>
            <Select
              label="Assign to property / unit"
              value={form.property}
              options={propertyOptions}
              onChange={(v) => set('property', v)}
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Input
                label="Lease start"
                value={form.start}
                onChangeText={(t) => set('start', t)}
                placeholder="dd/mm/yyyy"
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Lease end"
                value={form.end}
                onChangeText={(t) => set('end', t)}
                placeholder="dd/mm/yyyy"
                containerStyle={{ flex: 1 }}
              />
            </View>

            <Input
              label="Annual rent"
              value={form.rent}
              onChangeText={(t) => set('rent', t)}
              placeholder="₦0"
              keyboardType="numeric"
              error={touched ? errors.rent : undefined}
            />

            <View style={{ gap: 7 }}>
              <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13 }}>
                Payment schedule
              </Text>
              <SegmentedControl
                options={SCHEDULE_OPTIONS}
                value={form.schedule}
                onChange={(v) => set('schedule', v)}
              />
            </View>

            <Input
              label="Move-in date"
              value={form.moveIn}
              onChangeText={(t) => set('moveIn', t)}
              placeholder="dd/mm/yyyy"
            />
          </>
        ) : null}
      </View>

      <View style={{ marginTop: spacing['2xl'] }}>
        <Button
          title={editing ? 'Save changes' : 'Save tenant'}
          icon="check"
          variant="primary"
          fullWidth
          loading={submitting}
          onPress={() => {
            void handleSave();
          }}
        />
      </View>
    </Screen>
  );
}
