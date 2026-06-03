import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
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
import { properties } from '@/data/mock';

type Schedule = 'year' | 'biannual' | 'quarter' | 'month';

const PROPERTY_OPTIONS: SelectOption[] = [
  ...properties.map((p) => ({ value: p.id, label: `${p.address} · ${p.area}` })),
  { value: 'p6-u3', label: 'Harmony Court · Flat 3 (vacant)' },
];

const SCHEDULE_OPTIONS: SegmentOption<Schedule>[] = [
  { value: 'year', label: 'Annual' },
  { value: 'biannual', label: 'Bi-annual' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'month', label: 'Monthly' },
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

function validate(f: TenantFormState): TenantFormErrors {
  const rentDigits = f.rent.replace(/[^\d]/g, '');
  return {
    name: f.name.trim() ? '' : 'Required',
    phone: /^0\d{10}$/.test(f.phone.replace(/\s/g, '')) ? '' : 'Valid NG number',
    rent: Number(rentDigits) ? '' : 'Required',
  };
}

export default function AddTenant(): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);
  const [form, setForm] = useState<TenantFormState>({
    name: '',
    phone: '',
    email: '',
    property: 'p5',
    start: '',
    end: '',
    rent: '',
    schedule: 'year',
    moveIn: '',
  });

  const set = <K extends keyof TenantFormState>(key: K, value: TenantFormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const errors = validate(form);

  const handleSave = (): void => {
    setTouched(true);
    if (errors.name || errors.phone || errors.rent) return;
    setSubmitting(true);
    showToast('Tenant added');
    router.back();
  };

  return (
    <Screen scroll padded bottomSpace={120}>
      <AppBar title="Add tenant" onBack={() => router.back()} />

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

        <Select
          label="Assign to property / unit"
          value={form.property}
          options={PROPERTY_OPTIONS}
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
      </View>

      <View style={{ marginTop: spacing['2xl'] }}>
        <Button
          title="Save tenant"
          icon="check"
          variant="primary"
          fullWidth
          loading={submitting}
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}
