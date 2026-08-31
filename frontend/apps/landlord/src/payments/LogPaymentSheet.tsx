import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar,
  BottomSheet,
  Button,
  Card,
  Icon,
  Input,
  Text,
  colors,
  radii,
  spacing,
  useToast,
} from '@ile-eko/ui';
import {
  api,
  initialsOf,
  naira,
  useLogPayment,
  useUpload,
  type PaymentReceiptDTO,
  type PropertyDTO,
  type TenantDTO,
} from '@ile-eko/core';
import { pickImages } from '../media/pickImages';

type PaymentMethod = NonNullable<PaymentReceiptDTO['method']>;

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Cash' },
  { id: 'transfer', label: 'Bank transfer' },
  { id: 'card', label: 'POS / card' },
  { id: 'other', label: 'Mobile / other' },
];

export interface LogPaymentSheetProps {
  tenant: TenantDTO | null;
  property: PropertyDTO | undefined;
  onClose: () => void;
}

/** Shared contextual payment form used by payment and tenant-detail entry points. */
export function LogPaymentSheet({
  tenant,
  property,
  onClose,
}: LogPaymentSheetProps): React.ReactElement {
  const { showToast } = useToast();
  const logPayment = useLogPayment();
  const upload = useUpload();

  const name = tenant?.fullName ?? 'No tenant';
  const where = property ? `${property.propertyTitle}, ${property.area}` : undefined;
  const initials = tenant ? initialsOf(tenant.fullName) : '—';

  const { data: paymentsEnvelope } = useQuery<{ items: PaymentReceiptDTO[] }>({
    queryKey: ['payments', 'tenant', tenant?.id],
    enabled: Boolean(tenant),
    queryFn: () =>
      api.get<{ items: PaymentReceiptDTO[] }>('/payments', { query: { tenantId: tenant!.id } }),
  });
  const leaseId = tenant?.leaseId ?? paymentsEnvelope?.items?.[0]?.leaseId;

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [period, setPeriod] = useState('Current cycle');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receiptKey, setReceiptKey] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const seedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (tenant && seedRef.current !== tenant.id) {
      seedRef.current = tenant.id;
      setAmount(String(tenant.rentAmount ?? ''));
      setMethod('transfer');
      setPeriod('Current cycle');
      setDate(new Date().toISOString().slice(0, 10));
      setReceiptKey(null);
      setTouched(false);
    }
    if (!tenant) seedRef.current = null;
  }, [tenant]);

  const num = Number(amount.replace(/[^\d]/g, ''));
  const err = !num ? 'Enter an amount' : num < 1000 ? 'Amount looks too small' : '';

  async function attachReceipt(): Promise<void> {
    if (!tenant) return;
    const picked = await pickImages();
    if (picked.status === 'denied') {
      showToast('Photo library access is off', 'alert');
      return;
    }
    if (picked.status === 'cancelled') return;
    const image = picked.images[0];
    if (!image) return;
    try {
      const { objectKey } = await upload.mutateAsync({
        kind: 'receipt',
        resourceId: tenant.id,
        uri: image.uri,
        ...(image.mimeType ? { mimeType: image.mimeType } : {}),
        ...(image.sizeBytes !== undefined ? { sizeBytes: image.sizeBytes } : {}),
        ...(image.fileName ? { fileName: image.fileName } : {}),
      });
      setReceiptKey(objectKey);
      showToast('Receipt attached');
    } catch {
      showToast("Couldn't upload the receipt", 'alert');
    }
  }

  function confirm(): void {
    setTouched(true);
    if (err) return;
    if (!leaseId) {
      showToast('No active lease to log against', 'alert');
      return;
    }
    logPayment.mutate(
      {
        leaseId,
        amount: num,
        paidAt: date,
        method,
        periodCovered: period,
        ...(receiptKey ? { receiptKey } : {}),
      },
      {
        onSuccess: () => {
          onClose();
          showToast('Payment logged');
        },
        onError: () => showToast('Could not log payment', 'alert'),
      },
    );
  }

  return (
    <BottomSheet visible={tenant !== null} onClose={onClose} title="Log payment" scroll>
      <Card
        flat
        padding={0}
        style={{
          marginTop: spacing.lg,
          marginBottom: spacing.lg,
          paddingVertical: 11,
          paddingHorizontal: 13,
          backgroundColor: colors.surface2,
          borderWidth: 0,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <Avatar initials={initials} size={40} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {name}
            </Text>
            {where ? (
              <Text variant="caption" color={colors.muted} numberOfLines={1}>
                {where}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>

      <Input
        label="Amount received"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
        error={touched && err ? err : undefined}
      />

      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
        <Input
          label="Payment date"
          value={date}
          onChangeText={setDate}
          containerStyle={{ flex: 1 }}
        />
        <Input
          label="Period covered"
          value={period}
          onChangeText={setPeriod}
          containerStyle={{ flex: 1 }}
        />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13, marginBottom: 7 }}>
          Method
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9 }}>
          {METHODS.map((option) => {
            const selected = option.id === method;
            return (
              <Pressable
                key={option.id}
                onPress={() => setMethod(option.id)}
                style={{
                  flexGrow: 1,
                  flexBasis: '47%',
                  minHeight: 46,
                  borderRadius: radii.md,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.line,
                  backgroundColor: selected ? colors.primaryTint : colors.surface,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                }}
              >
                {selected ? (
                  <Icon name="check" size={15} color={colors.primary} strokeWidth={2.4} />
                ) : null}
                <Text variant="captionStrong" color={selected ? colors.primary : colors.ink}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13, marginBottom: 7 }}>
          Receipt
        </Text>
        {receiptKey ? (
          <View
            style={{
              minHeight: 56,
              paddingHorizontal: 14,
              borderRadius: radii.input,
              borderWidth: 1.6,
              borderColor: colors.ok,
              backgroundColor: colors.surface2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <Icon name="checkCircle" size={19} color={colors.ok} strokeWidth={2.2} />
            <Text variant="captionStrong" color={colors.ok} style={{ flex: 1 }}>
              Receipt attached
            </Text>
            <Pressable onPress={() => setReceiptKey(null)} hitSlop={10}>
              <Text variant="captionStrong" color={colors.muted}>
                Remove
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => void attachReceipt()}
            disabled={upload.isPending || !tenant}
            style={{
              minHeight: 56,
              borderRadius: radii.input,
              borderWidth: 1.6,
              borderStyle: 'dashed',
              borderColor: colors.line,
              backgroundColor: colors.surface2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              opacity: upload.isPending ? 0.6 : 1,
            }}
          >
            {upload.isPending ? (
              <ActivityIndicator color={colors.muted} />
            ) : (
              <Icon name="image" size={19} color={colors.muted} />
            )}
            <Text variant="captionStrong" color={colors.muted}>
              {upload.isPending ? 'Uploading receipt…' : 'Attach receipt photo'}
            </Text>
          </Pressable>
        )}
      </View>

      <Button
        title={num > 0 ? `Log ${naira(num)}` : 'Enter payment amount'}
        disabled={Boolean(err)}
        onPress={confirm}
        loading={logPayment.isPending}
        style={{ marginTop: spacing.lg }}
      />
    </BottomSheet>
  );
}
