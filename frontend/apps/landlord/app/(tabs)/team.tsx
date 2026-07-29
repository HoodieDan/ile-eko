import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  Text,
  Eyebrow,
  BottomSheet,
  Card,
  Checkbox,
  Chip,
  Avatar,
  Button,
  Icon,
  Input,
  Divider,
  EmptyState,
  SegmentedControl,
  Switch,
  useToast,
  colors,
  spacing,
  radii,
  type ChipTone,
  type IconName,
  type SegmentOption,
} from '@ile-eko/ui';
import {
  useCaretakers,
  useActivity,
  useInviteCaretaker,
  useProperties,
  initialsOf,
  timeAgo,
  type CaretakerSummaryDTO,
  type InviteCaretakerInput,
} from '@ile-eko/core';

const STATUS_META: Record<
  CaretakerSummaryDTO['status'],
  { tone: ChipTone; icon: IconName; label: string }
> = {
  active: { tone: 'ok', icon: 'check', label: 'Active' },
  pending: { tone: 'warn', icon: 'clock', label: 'Pending' },
  revoked: { tone: 'neutral', icon: 'x', label: 'Revoked' },
};

function caretakerSubtitle(c: CaretakerSummaryDTO): string {
  if (c.status === 'pending') return 'Invite sent · awaiting acceptance';
  if (c.status === 'revoked') return 'Access removed';
  const propLabel = `${c.propertyCount} ${c.propertyCount === 1 ? 'property' : 'properties'}`;
  const shown = c.areas.slice(0, 2).join(', ');
  const more = c.areas.length > 2 ? '…' : '';
  return shown ? `${propLabel} · ${shown}${more}` : propLabel;
}

type CaretakerRole = 'caretaker' | 'viewer';

const ROLE_OPTIONS: SegmentOption<CaretakerRole>[] = [
  { value: 'caretaker', label: 'Caretaker' },
  { value: 'viewer', label: 'Viewer' },
];

/** Per-property permission flags (§5.7 CaretakerPermissions). */
interface PermissionFlags {
  canLogPayments: boolean;
  canEditTenants: boolean;
  canUploadImages: boolean;
  canManageUnits: boolean;
  canEditProperty: boolean;
}

const NO_PERMISSIONS: PermissionFlags = {
  canLogPayments: false,
  canEditTenants: false,
  canUploadImages: false,
  canManageUnits: false,
  canEditProperty: false,
};

const PERMISSION_ROWS: { key: keyof PermissionFlags; label: string; hint: string }[] = [
  { key: 'canLogPayments', label: 'Log payments', hint: 'Record rent received' },
  { key: 'canEditTenants', label: 'Edit tenants', hint: 'Update tenant details' },
  { key: 'canUploadImages', label: 'Upload images', hint: 'Add property photos' },
  { key: 'canManageUnits', label: 'Manage units', hint: 'Add or edit units' },
  { key: 'canEditProperty', label: 'Edit property', hint: 'Change property details' },
];

/** Shape the API returns from POST /team/invite. */
interface InviteResult {
  invitationId: string;
  token: string;
  shareUrl: string;
  emailed: boolean;
  emailError?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function TeamTab(): React.ReactElement {
  const router = useRouter();
  const { data: caretakers = [], isLoading } = useCaretakers();
  const { data: activity = [] } = useActivity();
  const recent = activity.slice(0, 3);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <Screen scroll padded bottomSpace={120}>
      <View style={{ paddingTop: spacing.xs }}>
        <Text variant="h1">Team</Text>
        <Text variant="caption" color={colors.muted} style={{ marginTop: 3 }}>
          Caretakers act on the ground with the permissions you set.
        </Text>
      </View>

      <Button
        title="Invite Caretaker"
        variant="primary"
        icon="plus"
        fullWidth
        onPress={() => setInviteOpen(true)}
        style={{ marginTop: spacing.lg }}
      />

      {/* Roster */}
      <View style={{ marginTop: spacing.xl, marginBottom: 11 }}>
        <Eyebrow>{`Caretakers · ${caretakers.length}`}</Eyebrow>
      </View>
      {isLoading ? (
        <View style={{ paddingVertical: 32, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : caretakers.length === 0 ? (
        <EmptyState
          icon="users"
          title="No caretakers yet"
          message="Invite a caretaker to help manage your properties on the ground."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {caretakers.map((c) => {
            const meta = STATUS_META[c.status];
            return (
              <Card
                key={c.id}
                padding={15}
                style={{ opacity: c.status === 'revoked' ? 0.62 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                  <Avatar initials={initialsOf(c.name)} size={48} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Text variant="h3" numberOfLines={1} style={{ flex: 1 }}>
                        {c.name}
                      </Text>
                      <Chip tone={meta.tone} icon={meta.icon} label={meta.label} />
                    </View>
                    <Text
                      variant="caption"
                      color={colors.muted}
                      numberOfLines={1}
                      style={{ marginTop: 3 }}
                    >
                      {caretakerSubtitle(c)}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* Oversight */}
      <View style={{ marginTop: spacing['2xl'], marginBottom: 11 }}>
        <Eyebrow>Oversight</Eyebrow>
      </View>
      <View style={{ gap: spacing.md }}>
        <Card padding={14} onPress={() => router.push('/activity')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: colors.primaryTint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="activity" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Activity log</Text>
              <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
                Every caretaker action, timestamped
              </Text>
            </View>
            <Icon name="fwd" size={18} color={colors.muted} />
          </View>
        </Card>
      </View>

      {/* Recent activity preview */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: spacing['2xl'],
          marginBottom: 11,
        }}
      >
        <Eyebrow>Recent activity</Eyebrow>
        <Pressable onPress={() => router.push('/activity')} hitSlop={8}>
          <Text variant="captionStrong" color={colors.primary}>
            See full log
          </Text>
        </Pressable>
      </View>
      {recent.length === 0 ? (
        <Card padding={15}>
          <Text variant="caption" color={colors.muted}>
            No activity yet.
          </Text>
        </Card>
      ) : (
        <Card padding={0} style={{ paddingHorizontal: spacing.lg }}>
          {recent.map((a, i) => (
            <View key={a.id}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: spacing.md,
                  paddingVertical: 13,
                }}
              >
                <Avatar initials={initialsOf(a.actorName)} size={34} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="captionStrong" style={{ fontSize: 13.5 }}>
                    {a.description}
                  </Text>
                  <Text
                    variant="caption"
                    color={colors.muted}
                    numberOfLines={1}
                    style={{ marginTop: 1 }}
                  >
                    {a.actorName}
                  </Text>
                  {a.flag ? (
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }}
                    >
                      <Icon name="spark" size={12} color={colors.aiDeep} fill />
                      <Text
                        variant="captionStrong"
                        color={colors.aiDeep}
                        style={{ fontSize: 11.5, flex: 1 }}
                      >
                        {a.flag}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text variant="caption" color={colors.muted} style={{ fontSize: 11.5 }}>
                  {timeAgo(a.createdAt)}
                </Text>
              </View>
              {i < recent.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </Card>
      )}

      <InviteCaretakerSheet visible={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Screen>
  );
}

interface InviteCaretakerSheetProps {
  visible: boolean;
  onClose: () => void;
}

function InviteCaretakerSheet({
  visible,
  onClose,
}: InviteCaretakerSheetProps): React.ReactElement {
  const { showToast } = useToast();
  const invite = useInviteCaretaker();
  const { data: properties = [], isLoading: propsLoading } = useProperties();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<CaretakerRole>('caretaker');
  const [selected, setSelected] = useState<string[]>([]);
  const [perms, setPerms] = useState<PermissionFlags>(NO_PERMISSIONS);
  const [submitted, setSubmitted] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const nameErr = name.trim() ? '' : 'Enter a name';
  const emailErr = !email.trim()
    ? 'Enter an email so we can send the invite'
    : EMAIL_RE.test(email.trim())
      ? ''
      : 'That email does not look right';
  const phoneErr = !phone.trim() || phone.trim().length >= 7 ? '' : 'Phone number looks too short';
  const propsErr = selected.length === 0 ? 'Pick at least one property' : '';
  const invalid = Boolean(nameErr || emailErr || phoneErr || propsErr);

  const grants = useMemo(
    () =>
      selected.map((propertyId) => ({
        propertyId,
        role,
        permissions: role === 'viewer' ? NO_PERMISSIONS : perms,
      })),
    [selected, role, perms],
  );

  function reset(): void {
    setName('');
    setEmail('');
    setPhone('');
    setRole('caretaker');
    setSelected([]);
    setPerms(NO_PERMISSIONS);
    setSubmitted(false);
    setShareUrl(null);
  }

  function close(): void {
    reset();
    onClose();
  }

  function toggleProperty(id: string): void {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function submit(): Promise<void> {
    setSubmitted(true);
    if (invalid) {
      showToast('Check the highlighted fields', 'alert');
      return;
    }
    try {
      const input: InviteCaretakerInput = {
        name: name.trim(),
        email: email.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        grants,
      };
      const result = await invite.mutateAsync(input);
      if (result.emailed) {
        showToast(`Invitation emailed to ${email.trim()}`);
        close();
        return;
      }
      // Email did not go out — keep the sheet open so the link can be shared.
      setShareUrl(result.shareUrl);
      showToast('Invite created — share the link');
    } catch {
      showToast("Couldn't send the invitation");
    }
  }

  const showPermissions = role === 'caretaker';

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title={shareUrl ? 'Share this invite' : 'Invite caretaker'}
      subtitle={
        shareUrl
          ? 'We could not email it — send this link instead.'
          : 'They get access only to what you grant.'
      }
      scroll
    >
      {shareUrl ? (
        <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
          <Card flat padding={14} style={{ backgroundColor: colors.surface2 }}>
            <Text variant="caption" color={colors.muted}>
              Invitation link
            </Text>
            <Text selectable variant="body" style={{ marginTop: 6 }}>
              {shareUrl}
            </Text>
          </Card>
          <Text variant="caption" color={colors.muted}>
            Press and hold the link to select and copy it.
          </Text>
          <Button title="Done" icon="check" fullWidth onPress={close} />
        </View>
      ) : (
        <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Musa Bello"
            error={submitted ? nameErr || undefined : undefined}
          />
          <Input
            label="Email"
            icon="mail"
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={submitted ? emailErr || undefined : undefined}
          />
          <Input
            label="Phone (optional)"
            icon="phone"
            value={phone}
            onChangeText={setPhone}
            placeholder="080…"
            keyboardType="phone-pad"
            error={submitted ? phoneErr || undefined : undefined}
          />

          <View style={{ gap: 7 }}>
            <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13 }}>
              Role
            </Text>
            <SegmentedControl options={ROLE_OPTIONS} value={role} onChange={setRole} />
            <Text variant="caption" color={colors.muted}>
              {role === 'viewer'
                ? 'Viewers can see the properties you grant, but change nothing.'
                : 'Caretakers can act on the ground with the permissions below.'}
            </Text>
          </View>

          <View style={{ gap: 9 }}>
            <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13 }}>
              Properties
            </Text>
            {propsLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : properties.length === 0 ? (
              <Text variant="caption" color={colors.muted}>
                Add a property first — access is granted per property.
              </Text>
            ) : (
              <View style={{ gap: 11 }}>
                {properties.map((p) => (
                  <Checkbox
                    key={p.id}
                    checked={selected.includes(p.id)}
                    onChange={() => toggleProperty(p.id)}
                    label={`${p.propertyTitle} · ${p.area}`}
                  />
                ))}
              </View>
            )}
            {submitted && propsErr ? (
              <Text variant="caption" color={colors.danger}>
                {propsErr}
              </Text>
            ) : null}
          </View>

          {showPermissions ? (
            <View style={{ gap: 9 }}>
              <Text variant="captionStrong" color={colors.ink} style={{ fontSize: 13 }}>
                Permissions
              </Text>
              {PERMISSION_ROWS.map((row) => (
                <Card key={row.key} flat padding={13}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text variant="bodyStrong" style={{ fontSize: 14.5 }}>
                        {row.label}
                      </Text>
                      <Text variant="caption" color={colors.muted} style={{ marginTop: 1 }}>
                        {row.hint}
                      </Text>
                    </View>
                    <Switch
                      value={perms[row.key]}
                      onValueChange={(v) => setPerms((prev) => ({ ...prev, [row.key]: v }))}
                    />
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          <Button
            title="Send invitation"
            icon="send"
            variant="primary"
            fullWidth
            loading={invite.isPending}
            onPress={() => {
              void submit();
            }}
          />
        </View>
      )}
    </BottomSheet>
  );
}
