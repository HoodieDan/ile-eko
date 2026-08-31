import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import {
  api,
  useCreateProperty,
  useProperty,
  useUpdateProperty,
  useUpload,
  type PaymentFrequency,
  type PropertyType,
} from '@ile-eko/core';
import { pickImages, type PickedImage } from '../../src/media/pickImages';

type Freq = PaymentFrequency;

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

interface PropertyFormState {
  title: string;
  address: string;
  area: string;
  type: string;
  desc: string;
  /** Annual rent in whole Naira, kept digits-only. */
  rent: string;
  bedrooms: string;
  bathrooms: string;
  multi: boolean;
  freq: Freq;
}

/** Strips everything but digits so the rent stays an integer-Naira string. */
function digitsOnly(t: string): string {
  return t.replace(/[^0-9]/g, '');
}

interface PhotoUploadProps {
  photos: PickedImage[];
  onAdd: () => void;
  onRemove: (uri: string) => void;
  disabled?: boolean;
}

/**
 * Photos are picked locally and only uploaded after the property exists —
 * `/uploads/sign` enforces ownership of a real resourceId (§9).
 */
function PhotoUpload({
  photos,
  onAdd,
  onRemove,
  disabled = false,
}: PhotoUploadProps): React.ReactElement {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      <Pressable
        onPress={onAdd}
        disabled={disabled}
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
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Icon name="upload" size={22} color={colors.muted} />
        <Text variant="caption" color={colors.muted} style={{ marginTop: 4, fontSize: 10.5 }}>
          Add photo
        </Text>
      </Pressable>
      {photos.map((photo) => (
        <View
          key={photo.uri}
          style={{
            width: 92,
            height: 92,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: colors.surface2,
          }}
        >
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} />
          <Pressable
            onPress={() => onRemove(photo.uri)}
            disabled={disabled}
            hitSlop={8}
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: 'rgba(15,16,14,0.62)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="x" size={13} color="#FFFFFF" strokeWidth={2.6} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export default function AddProperty(): React.ReactElement {
  const router = useRouter();
  const { id: editId } = useLocalSearchParams<{ id?: string }>();
  const editing = Boolean(editId);
  const { showToast } = useToast();
  const createProperty = useCreateProperty();
  const updateProperty = useUpdateProperty();
  const { data: existing, isError: existingError, refetch: refetchExisting } = useProperty(editId);
  const upload = useUpload();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photos, setPhotos] = useState<PickedImage[]>([]);
  const [form, setForm] = useState<PropertyFormState>({
    title: '',
    address: '',
    area: 'Lekki Phase 1',
    type: 'three-bedroom',
    desc: '',
    rent: '',
    bedrooms: '',
    bathrooms: '',
    multi: false,
    freq: 'annual',
  });
  const hydratedPropertyId = React.useRef<string | null>(null);

  useEffect(() => {
    if (!existing || hydratedPropertyId.current === existing.id) return;
    hydratedPropertyId.current = existing.id;
    setForm({
      title: existing.propertyTitle,
      address: existing.address,
      area: existing.area,
      type: existing.propertyType,
      desc: existing.description,
      rent: existing.rentAmount != null ? String(existing.rentAmount) : '',
      bedrooms: existing.bedrooms != null ? String(existing.bedrooms) : '',
      bathrooms: existing.bathrooms != null ? String(existing.bathrooms) : '',
      multi: existing.hasUnits,
      freq: existing.paymentFrequency,
    });
  }, [existing]);

  const set = <K extends keyof PropertyFormState>(key: K, value: PropertyFormState[K]): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const rentAmount = form.rent ? Number(form.rent) : 0;
  const titleErr = form.title.trim() ? '' : 'Give this property a title';
  const addressErr = form.address.trim() ? '' : 'Enter the full address';
  const rentRequired = !editing || existing?.rentAmount != null;
  const rentErr = !rentRequired || rentAmount > 0 ? '' : 'Enter the annual rent';
  const invalid = Boolean(titleErr || addressErr || rentErr);

  const addPhotos = async (): Promise<void> => {
    const result = await pickImages({ multiple: true });
    if (result.status === 'denied') {
      showToast('Photo library access is off', 'alert');
      return;
    }
    if (result.status === 'cancelled') return;
    setPhotos((prev) => {
      const seen = new Set(prev.map((p) => p.uri));
      return [...prev, ...result.images.filter((p) => !seen.has(p.uri))];
    });
  };

  const removePhoto = (uri: string): void => {
    setPhotos((prev) => prev.filter((p) => p.uri !== uri));
  };

  /**
   * Uploads the picked photos against the freshly-created property and persists
   * the returned object keys. Returns false if anything failed — the property
   * itself is already saved either way, so we never discard the user's work.
   */
  const attachPhotos = async (propertyId: string): Promise<boolean> => {
    try {
      const keys: string[] = [];
      for (const photo of photos) {
        const { objectKey } = await upload.mutateAsync({
          kind: 'property',
          resourceId: propertyId,
          uri: photo.uri,
          ...(photo.mimeType ? { mimeType: photo.mimeType } : {}),
          ...(photo.sizeBytes !== undefined ? { sizeBytes: photo.sizeBytes } : {}),
          ...(photo.fileName ? { fileName: photo.fileName } : {}),
        });
        keys.push(objectKey);
      }
      await api.patch(`/properties/${propertyId}`, {
        images: editing ? [...(existing?.images ?? []), ...keys] : keys,
      });
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async (): Promise<void> => {
    setSubmitted(true);
    if (invalid) {
      showToast('Check the highlighted fields', 'alert');
      return;
    }
    setSubmitting(true);
    try {
      const bedrooms = form.bedrooms ? Number(form.bedrooms) : undefined;
      const bathrooms = form.bathrooms ? Number(form.bathrooms) : undefined;
      const input = {
        propertyTitle: form.title.trim(),
        address: form.address.trim(),
        area: form.area,
        lga:
          existing && form.area === existing.area
            ? existing.lga
            : (LGA_BY_AREA[form.area] ?? 'Lagos'),
        propertyType: form.type as PropertyType,
        description: form.desc.trim(),
        ...(form.rent ? { rentAmount } : {}),
        ...(bedrooms !== undefined ? { bedrooms } : {}),
        ...(bathrooms !== undefined ? { bathrooms } : {}),
        paymentFrequency: form.freq,
        hasUnits: form.multi,
      };
      const saved = editId
        ? await updateProperty.mutateAsync({ id: editId, input })
        : await createProperty.mutateAsync(input);

      if (photos.length > 0) {
        setUploadingPhotos(true);
        const ok = await attachPhotos(saved.id);
        setUploadingPhotos(false);
        showToast(
          ok
            ? editing
              ? 'Property updated'
              : 'Property added'
            : `Property ${editing ? 'updated' : 'added'}, but the photos didn't upload`,
        );
      } else {
        showToast(editing ? 'Property updated' : 'Property added');
      }
      router.back();
    } catch {
      setSubmitting(false);
      setUploadingPhotos(false);
      showToast(editing ? 'Could not update property' : 'Could not add property');
    }
  };

  if (editing && existingError) {
    return (
      <Screen padded>
        <AppBar title="Edit property" onBack={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
          <Text variant="title" center>
            Couldn't load this property
          </Text>
          <Button title="Try again" variant="secondary" onPress={() => void refetchExisting()} />
        </View>
      </Screen>
    );
  }

  if (editing && (!existing || hydratedPropertyId.current !== existing.id)) {
    return (
      <Screen padded>
        <AppBar title="Edit property" onBack={() => router.back()} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll padded bottomSpace={120}>
      <AppBar title={editing ? 'Edit property' : 'Add property'} onBack={() => router.back()} />

      <View style={{ gap: spacing.lg, marginTop: spacing.sm }}>
        <Input
          label="Property title"
          value={form.title}
          onChangeText={(t) => set('title', t)}
          placeholder="e.g. 14 Admiralty Way"
          error={submitted ? titleErr || undefined : undefined}
        />

        <Input
          label="Full address"
          value={form.address}
          onChangeText={(t) => set('address', t)}
          placeholder="Street, area, city"
          error={submitted ? addressErr || undefined : undefined}
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
          label="Annual rent"
          icon="wallet"
          value={form.rent}
          onChangeText={(t) => set('rent', digitsOnly(t))}
          placeholder="₦0"
          keyboardType="number-pad"
          error={submitted ? rentErr || undefined : undefined}
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Input
            label="Bedrooms"
            value={form.bedrooms}
            onChangeText={(t) => set('bedrooms', digitsOnly(t))}
            placeholder="0"
            keyboardType="number-pad"
            containerStyle={{ flex: 1 }}
          />
          <Input
            label="Bathrooms"
            value={form.bathrooms}
            onChangeText={(t) => set('bathrooms', digitsOnly(t))}
            placeholder="0"
            keyboardType="number-pad"
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
          <PhotoUpload
            photos={photos}
            onAdd={() => {
              void addPhotos();
            }}
            onRemove={removePhoto}
            disabled={submitting}
          />
          {editing && existing?.images.length ? (
            <Text variant="caption" color={colors.muted}>
              {existing.images.length} existing {existing.images.length === 1 ? 'photo' : 'photos'}{' '}
              will be kept.
            </Text>
          ) : null}
          {photos.length > 0 ? (
            <Text variant="caption" color={colors.muted}>
              {uploadingPhotos
                ? 'Uploading photos…'
                : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} will upload once the property is saved.`}
            </Text>
          ) : null}
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
            <Switch value={form.multi} onValueChange={(v) => set('multi', v)} disabled={editing} />
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
      </View>

      <View style={{ marginTop: spacing['2xl'] }}>
        <Button
          title={uploadingPhotos ? 'Uploading photos…' : editing ? 'Save changes' : 'Save property'}
          icon="check"
          variant="primary"
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={() => {
            void handleSave();
          }}
        />
      </View>
    </Screen>
  );
}
