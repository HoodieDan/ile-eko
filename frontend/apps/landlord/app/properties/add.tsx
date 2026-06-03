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

type Freq = 'year' | 'biannual' | 'quarter' | 'month';
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

const TYPE_OPTIONS: SelectOption[] = [
  'Flat',
  'Duplex',
  'Detached house',
  'Semi-detached',
  'Self-contain',
  'Shop / commercial',
  'Land',
  'Block of flats',
].map((t) => ({ value: t, label: t }));

const FREQ_OPTIONS: SegmentOption<Freq>[] = [
  { value: 'year', label: 'Annual' },
  { value: 'biannual', label: 'Bi-annual' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'month', label: 'Monthly' },
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
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<PropertyFormState>({
    title: '',
    address: '',
    area: 'Lekki Phase 1',
    type: '3-bed flat',
    desc: '',
    multi: false,
    freq: 'year',
    occupancy: 'vacant',
  });

  const set = <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (): void => {
    setSubmitting(true);
    showToast('Property added');
    router.back();
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <SegmentedControl options={FREQ_OPTIONS} value={form.freq} onChange={(v) => set('freq', v)} />
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
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}
