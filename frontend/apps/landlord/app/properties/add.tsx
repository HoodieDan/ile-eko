import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  AppBar,
  Text,
  Input,
  Select,
  SegmentedControl,
  Switch,
  Button,
  Card,
  Icon,
  colors,
  spacing,
  useToast,
  type SelectOption,
  type SegmentOption,
} from '@ile-eko/ui';
import { useCreateProperty, type PaymentFrequency, type PropertyType } from '@ile-eko/core';

type Freq = PaymentFrequency;
type Occupancy = 'occupied' | 'vacant' | 'mixed';

const AREA_OPTIONS: SelectOption[] = [
  'Lekki Phase 1',
  'Ikoyi',
  'Victoria Island',
  'Yaba',
  'Surulere',
  'Gbagada',
  'Magodo',
  'Maryland',
  'Ajah',
  'Ikeja',
].map((a) => ({ value: a, label: a }));

// Derive the LGA from the selected area (§ Lagos administrative mapping).
const LGA_BY_AREA: Record<string, string> = {
  'Lekki Phase 1': 'Eti-Osa',
  Ikoyi: 'Eti-Osa',
  'Victoria Island': 'Eti-Osa',
  Ajah: 'Eti-Osa',
  Yaba: 'Lagos Mainland',
  Surulere: 'Surulere',
  Gbagada: 'Kosofe',
  Magodo: 'Kosofe',
  Maryland: 'Kosofe',
  Ikeja: 'Ikeja',
};

const TYPE_OPTIONS: SelectOption[] = [
  { value: 'self-contained', label: 'Self-contain' },
  { value: 'mini-flat', label: 'Mini flat' },
  { value: 'one-bedroom', label: '1 bedroom' },
  { value: 'two-bedroom', label: '2 bedroom' },
  { value: 'three-bedroom', label: '3 bedroom' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'shop', label: 'Shop / commercial' },
  { value: 'office', label: 'Office' },
  { value: 'other', label: 'Other' },
];

const FREQ_OPTIONS: SegmentOption<Freq>[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'biannual', label: 'Bi-annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
];

const OCCUPANCY_OPTIONS: SegmentOption<Occupancy>[] = [
  { value: 'occupied', label: 'Occupied' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'mixed', label: 'Mixed' },
];

interface PropertyFormState {
  title: string;
  address: string;
  area: string;
  type: string;
  desc: string;
  multi: boolean;
  freq: Freq;
  occupancy: Occupancy;
}

function PhotoUpload(): React.ReactElement {
  const tones = [198, 28, 88];
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Pressable
        style={{
          width: 92,
          height: 92,
          borderRadius: 14,
          borderWidth: 1.6,
          borderColor: colors.line,
          borderStyle: 'dashed',
          backgroundColor: colors.surface2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="upload" size={22} color={colors.muted} />
        <Text variant="caption" color={colors.muted} style={{ marginTop: 4, fontSize: 10.5 }}>
          Add photo
        </Text>
      </Pressable>
      {tones.map((t, i) => (
        <View
          key={t}
          style={{
            width: 92,
            height: 92,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: colors.primaryTint,
            justifyContent: 'flex-end',
            padding: 6,
          }}
        >
          <Text variant="label" color={colors.muted} style={{ fontSize: 8.5 }}>
            PHOTO {i + 1}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function AddProperty(): React.ReactElement {
  const router = useRouter();
  const { showToast } = useToast();
  const createProperty = useCreateProperty();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PropertyFormState>({
    title: '',
    address: '',
    area: 'Lekki Phase 1',
    type: 'three-bedroom',
    desc: '',
    multi: false,
    freq: 'annual',
    occupancy: 'vacant',
  });

  const set = <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await createProperty.mutateAsync({
        propertyTitle: form.title.trim() || form.address.trim() || 'Untitled property',
        address: form.address.trim(),
        area: form.area,
        lga: LGA_BY_AREA[form.area] ?? 'Lagos',
        propertyType: form.type as PropertyType,
        ...(form.desc.trim() ? { description: form.desc.trim() } : {}),
        paymentFrequency: form.freq,
        hasUnits: form.multi,
      });
      showToast('Property added');
      router.back();
    } catch {
      setSubmitting(false);
      showToast('Could not add property');
    }
  };

  return (
    <Screen scroll padded bottomSpace={120}>
      <AppBar title="Add property" onBack={() => router.back()} />

      <View style={{ gap: spacing.lg, marginTop: spacing.sm }}>
        <Input
          label="Property title"
          value={form.title}
          onChangeText={(t) => set('title', t)}
          placeholder="e.g. 14 Admiralty Way"
        />

        <Input
          label="Full address"
          value={form.address}
          onChangeText={(t) => set('address', t)}
          placeholder="Street, area, city"
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Select
            label="Area"
            value={form.area}
            options={AREA_OPTIONS}
            onChange={(v) => set('area', v)}
            containerStyle={{ flex: 1 }}
          />
          <Select
            label="Property type"
            value={form.type}
            options={TYPE_OPTIONS}
            onChange={(v) => set('type', v)}
            containerStyle={{ flex: 1 }}
          />
        </View>

        <Input
          label="Description"
          value={form.desc}
          onChangeText={(t) => set('desc', t)}
          placeholder="Key features, condition, amenities…"
          multiline
        />

        <View style={{ gap: 7 }}>
          <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13 }}>
            Photos
          </Text>
          <PhotoUpload />
        </View>

        <Card flat padding={14}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text variant="bodyStrong" color={colors.ink} style={{ fontSize: 14.5 }}>
                Has multiple units?
              </Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
                A block of flats or shared compound
              </Text>
            </View>
            <Switch value={form.multi} onValueChange={(v) => set('multi', v)} />
          </View>
        </Card>

        <View style={{ gap: 7 }}>
          <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13 }}>
            Payment frequency
          </Text>
          <SegmentedControl
            options={FREQ_OPTIONS}
            value={form.freq}
            onChange={(v) => set('freq', v)}
          />
        </View>

        <View style={{ gap: 7 }}>
          <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13 }}>
            Occupancy status
          </Text>
          <SegmentedControl
            options={OCCUPANCY_OPTIONS}
            value={form.occupancy}
            onChange={(v) => set('occupancy', v)}
          />
        </View>
      </View>

      <View style={{ marginTop: spacing['2xl'] }}>
        <Button
          title="Save property"
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
