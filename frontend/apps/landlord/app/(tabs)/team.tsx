import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
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
  useCaretaker,
  useActivity,
  useInviteCaretaker,
  useRevokeCaretakerAccess,
  useUpdateCaretakerAccess,
  useProperties,
  initialsOf,
  timeAgo,
  type CaretakerSummaryDTO,
  type CaretakerMembershipDTO,
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
  const [manageTarget, setManageTarget] = useState<CaretakerSummaryDTO | null>(null);

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
                onPress={() => setManageTarget(c)}
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
                  <Icon name="fwd" size={18} color={colors.muted} />
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
      <ManageCaretakerSheet caretaker={manageTarget} onClose={() => setManageTarget(null)} />
    </Screen>
  );
}

interface InviteCaretakerSheetProps {
  visible: boolean;
  onClose: () => void;
}

function InviteCaretakerSheet({ visible, onClose }: InviteCaretakerSheetProps): React.ReactElement {
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

interface AccessDraft {
  status: 'active' | 'revoked';
  permissions: PermissionFlags;
}

function permissionsFrom(membership: CaretakerMembershipDTO): PermissionFlags {
  return {
    canLogPayments: membership.canLogPayments,
    canEditTenants: membership.canEditTenants,
    canUploadImages: membership.canUploadImages,
    canManageUnits: membership.canManageUnits,
    canEditProperty: membership.canEditProperty,
  };
}

function ManageCaretakerSheet({
  caretaker,
  onClose,
}: {
  caretaker: CaretakerSummaryDTO | null;
  onClose: () => void;
}): React.ReactElement {
  const { showToast } = useToast();
  const { data: memberships = [], isLoading } = useCaretaker(caretaker?.id);
  const { data: properties = [] } = useProperties();
  const updateAccess = useUpdateCaretakerAccess();
  const revokeAll = useRevokeCaretakerAccess();
  const [drafts, setDrafts] = useState<Record<string, AccessDraft>>({});
  const draftCaretakerId = React.useRef<string | null>(null);
  const hydratedCaretakerId = React.useRef<string | null>(null);

  const propertyById = useMemo(
    () => new Map(properties.map((property) => [property.id, property])),
    [properties],
  );
  const visibleMemberships = caretaker
    ? memberships.filter((membership) => membership.caretakerUserId === caretaker.id)
    : [];
  const draftValues =
    caretaker && draftCaretakerId.current === caretaker.id ? Object.values(drafts) : [];
  const displayedStatus: CaretakerSummaryDTO['status'] =
    draftValues.length > 0
      ? draftValues.some((draft) => draft.status === 'active')
        ? 'active'
        : 'revoked'
      : (caretaker?.status ?? 'revoked');

  React.useEffect(() => {
    if (!caretaker) {
      draftCaretakerId.current = null;
      hydratedCaretakerId.current = null;
      setDrafts({});
      return;
    }
    if (draftCaretakerId.current !== caretaker.id) {
      draftCaretakerId.current = caretaker.id;
      hydratedCaretakerId.current = null;
      setDrafts({});
    }
    const caretakerMemberships = memberships.filter(
      (membership) => membership.caretakerUserId === caretaker.id,
    );
    if (caretakerMemberships.length === 0 || hydratedCaretakerId.current === caretaker.id) return;
    hydratedCaretakerId.current = caretaker.id;
    setDrafts(
      Object.fromEntries(
        caretakerMemberships.map((membership) => [
          membership.id,
          { status: membership.status, permissions: permissionsFrom(membership) },
        ]),
      ),
    );
  }, [caretaker, memberships]);

  const setStatus = (membershipId: string, active: boolean): void => {
    setDrafts((current) => ({
      ...current,
      [membershipId]: {
        ...(current[membershipId] ?? { permissions: NO_PERMISSIONS, status: 'revoked' }),
        status: active ? 'active' : 'revoked',
      },
    }));
  };

  const setPermission = (
    membershipId: string,
    permission: keyof PermissionFlags,
    enabled: boolean,
  ): void => {
    setDrafts((current) => {
      const draft = current[membershipId];
      if (!draft) return current;
      return {
        ...current,
        [membershipId]: {
          ...draft,
          permissions: { ...draft.permissions, [permission]: enabled },
        },
      };
    });
  };

  const saveMembership = async (membership: CaretakerMembershipDTO): Promise<void> => {
    if (!caretaker) return;
    const draft = drafts[membership.id];
    if (!draft) return;
    try {
      await updateAccess.mutateAsync({
        caretakerId: caretaker.id,
        propertyId: membership.propertyId,
        status: draft.status,
        permissions: membership.role === 'viewer' ? NO_PERMISSIONS : draft.permissions,
      });
      showToast('Caretaker access updated');
    } catch {
      showToast("Couldn't update caretaker access", 'alert');
    }
  };

  const confirmRevokeAll = (): void => {
    if (!caretaker) return;
    const caretakerId = caretaker.id;
    Alert.alert(
      'Revoke all access?',
      `${caretaker.name} will be signed out and lose access to every assigned property.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke all access',
          style: 'destructive',
          onPress: () => {
            revokeAll.mutate(caretakerId, {
              onSuccess: () => {
                if (draftCaretakerId.current !== caretakerId) return;
                setDrafts((current) =>
                  Object.fromEntries(
                    Object.entries(current).map(([id, draft]) => [
                      id,
                      { ...draft, status: 'revoked' },
                    ]),
                  ),
                );
                showToast('All caretaker access revoked');
              },
              onError: () => {
                if (draftCaretakerId.current !== caretakerId) return;
                showToast("Couldn't revoke caretaker access", 'alert');
              },
            });
          },
        },
      ],
    );
  };

  return (
    <BottomSheet
      visible={caretaker !== null}
      onClose={onClose}
      title="Manage caretaker"
      subtitle="Access and permissions are set separately for each property."
      scroll
    >
      <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
        {caretaker ? (
          <Card flat padding={14} style={{ backgroundColor: colors.surface2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Avatar initials={initialsOf(caretaker.name)} size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {caretaker.name}
                </Text>
                <Text variant="caption" color={colors.muted} numberOfLines={1}>
                  {caretaker.email ?? 'No email available'}
                </Text>
              </View>
              <Chip
                tone={STATUS_META[displayedStatus].tone}
                icon={STATUS_META[displayedStatus].icon}
                label={STATUS_META[displayedStatus].label}
              />
            </View>
          </Card>
        ) : null}

        {isLoading ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : visibleMemberships.length === 0 ? (
          <EmptyState
            icon="building"
            title="No property access"
            message="This caretaker has no property memberships to manage."
          />
        ) : (
          visibleMemberships.map((membership) => {
            const draft = drafts[membership.id];
            const property = propertyById.get(membership.propertyId);
            if (!draft) return null;
            return (
              <Card key={membership.id} padding={14}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.md,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {property?.propertyTitle ?? 'Property'}
                    </Text>
                    <Text variant="caption" color={colors.muted} numberOfLines={1}>
                      {property?.area ?? 'Assigned property'} ·{' '}
                      {membership.role === 'viewer' ? 'Viewer' : 'Caretaker'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text variant="captionStrong" color={colors.muted}>
                      Access
                    </Text>
                    <Switch
                      value={draft.status === 'active'}
                      onValueChange={(active) => setStatus(membership.id, active)}
                    />
                  </View>
                </View>

                {membership.role === 'caretaker' ? (
                  <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
                    {PERMISSION_ROWS.map((row) => (
                      <View
                        key={row.key}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: spacing.md,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text variant="captionStrong">{row.label}</Text>
                          <Text variant="caption" color={colors.muted}>
                            {row.hint}
                          </Text>
                        </View>
                        <Switch
                          value={draft.permissions[row.key]}
                          disabled={draft.status === 'revoked'}
                          onValueChange={(enabled) =>
                            setPermission(membership.id, row.key, enabled)
                          }
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.md }}>
                    Viewers can see this property but cannot make changes.
                  </Text>
                )}

                <Button
                  title="Save property access"
                  variant="secondary"
                  size="sm"
                  loading={updateAccess.isPending}
                  onPress={() => void saveMembership(membership)}
                  style={{ marginTop: spacing.lg }}
                />
              </Card>
            );
          })
        )}

        {draftValues.some((draft) => draft.status === 'active') ? (
          <Button
            title="Revoke all access"
            variant="destructive"
            icon="x"
            loading={revokeAll.isPending}
            onPress={confirmRevokeAll}
          />
        ) : null}
      </View>
    </BottomSheet>
  );
}
