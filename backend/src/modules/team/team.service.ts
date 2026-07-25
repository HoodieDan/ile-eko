import { createHash, randomBytes } from 'node:crypto';
import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { withTxn } from '../../utils/withTxn';
import { hashPassword } from '../../utils/password';
import {
  Property,
  Session,
  TeamInvitation,
  TeamMembership,
  User,
  type MembershipDoc,
} from '../../models';
import { emitActivity } from '../../services/activityLog';
import type {
  AcceptInviteInput,
  CaretakerSummaryDTO,
  InviteInput,
  RolePermissionDTO,
  UpdateCaretakerInput,
} from '../../contracts';

interface Actor {
  userId: string;
  name: string;
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

const PERM_KEYS = [
  'canLogPayments',
  'canEditTenants',
  'canUploadImages',
  'canManageUnits',
  'canEditProperty',
] as const;

function fullPerms(partial: Partial<Record<(typeof PERM_KEYS)[number], boolean>> = {}) {
  return Object.fromEntries(PERM_KEYS.map((k) => [k, Boolean(partial[k])])) as Record<
    (typeof PERM_KEYS)[number],
    boolean
  >;
}

function presentMembership(m: MembershipDoc): RolePermissionDTO {
  return {
    id: m.id,
    propertyId: String(m.propertyId),
    caretakerUserId: String(m.caretakerId),
    invitedBy: String(m.landlordId),
    role: m.role as 'caretaker' | 'viewer',
    canLogPayments: m.canLogPayments,
    canEditTenants: m.canEditTenants,
    canUploadImages: m.canUploadImages,
    canManageUnits: m.canManageUnits,
    canEditProperty: m.canEditProperty,
    status: m.status as 'active' | 'revoked',
    createdAt: (m.createdAt as Date).toISOString(),
    updatedAt: (m.updatedAt as Date).toISOString(),
  };
}

/** Create an invitation (§5.7a). Returns the raw token for the share-link fallback. */
export async function invite(
  landlordId: string,
  actor: Actor,
  input: InviteInput,
): Promise<{ invitationId: string; token: string; shareUrl: string }> {
  // All granted properties must belong to the landlord.
  for (const g of input.grants) {
    if (!Types.ObjectId.isValid(g.propertyId)) throw AppError.badRequest('Invalid propertyId');
    const owned = await Property.findOne({ _id: g.propertyId, landlordId }).lean();
    if (!owned) throw AppError.forbidden('Cannot grant access to a property you do not own');
  }

  const token = randomBytes(32).toString('hex');
  const invitation = await TeamInvitation.create({
    landlordId,
    inviteName: input.name,
    ...(input.email ? { inviteEmail: input.email } : {}),
    ...(input.phone ? { invitePhone: input.phone } : {}),
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    grants: input.grants.map((g) => ({
      propertyId: new Types.ObjectId(g.propertyId),
      role: g.role,
      permissions: fullPerms(g.permissions),
    })),
    status: 'pending',
  });

  await withTxn(async (session) => {
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'team.invited',
      entityId: invitation._id,
      description: `Invited ${input.name} to the team`,
    });
  });

  // Delivery via email/SMS lands in M6; for now the landlord shares the link.
  return { invitationId: invitation.id, token, shareUrl: `ileeko://invite/${token}` };
}

export async function resend(landlordId: string, invitationId: string): Promise<{ token: string }> {
  const inv = await TeamInvitation.findOne({ _id: invitationId, landlordId, status: 'pending' });
  if (!inv) throw AppError.notFound('Invitation not found');
  const token = randomBytes(32).toString('hex');
  inv.tokenHash = hashToken(token);
  inv.expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  inv.resendCount += 1;
  await inv.save();
  return { token };
}

/** Accept an invitation → create/link the caretaker + materialize memberships (§5.7a). */
export async function accept(input: AcceptInviteInput): Promise<{ token: string; userId: string }> {
  const inv = await TeamInvitation.findOne({ tokenHash: hashToken(input.inviteToken), status: 'pending' });
  if (!inv || inv.expiresAt.getTime() < Date.now()) throw AppError.badRequest('Invalid or expired invitation');

  return withTxn(async (session) => {
    // Find or create the caretaker user.
    let user = inv.inviteEmail
      ? await User.findOne({ email: inv.inviteEmail }).session(session)
      : null;
    if (!user) {
      if (!input.password) throw AppError.badRequest('Password is required for a new account');
      const [created] = await User.create(
        [
          {
            fullName: input.name ?? inv.inviteName ?? 'Caretaker',
            email: inv.inviteEmail ?? `caretaker-${inv.id}@invite.ile-eko`,
            password: await hashPassword(input.password),
            ...(inv.invitePhone ? { phoneNumber: inv.invitePhone } : {}),
            role: 'caretaker',
            isVerified: true,
          },
        ],
        { session },
      );
      user = created!;
    }

    for (const g of inv.grants) {
      await TeamMembership.updateOne(
        { caretakerId: user.id, propertyId: g.propertyId },
        {
          $set: {
            landlordId: inv.landlordId,
            role: g.role,
            ...g.permissions,
            status: 'active',
          },
        },
        { upsert: true, session },
      );
    }

    inv.status = 'accepted';
    inv.set('acceptedUserId', user.id);
    inv.set('acceptedAt', new Date());
    await inv.save({ session });

    await emitActivity(session, {
      actorId: user.id,
      actorName: user.fullName,
      landlordId: inv.landlordId,
      action: 'team.joined',
      entityId: user._id,
      description: `${user.fullName} joined the team`,
    });

    // Issue a session for the accepting device.
    const { signToken } = await import('../../utils/jwt');
    const { durationToMs } = await import('../../utils/duration');
    const { env } = await import('../../config/env');
    const [s] = await Session.create(
      [{ userId: user.id, expiresAt: new Date(Date.now() + durationToMs(env.JWT_EXPIRES_IN)) }],
      { session },
    );
    const token = signToken({ sub: user.id, role: 'caretaker', sid: s!.id });
    return { token, userId: user.id };
  });
}

export async function listCaretakers(landlordId: string): Promise<CaretakerSummaryDTO[]> {
  const memberships = await TeamMembership.find({ landlordId }).lean();
  const byCaretaker = new Map<string, { propertyIds: Set<string>; anyActive: boolean }>();
  for (const m of memberships) {
    const cid = String(m.caretakerId);
    const entry = byCaretaker.get(cid) ?? { propertyIds: new Set(), anyActive: false };
    entry.propertyIds.add(String(m.propertyId));
    if (m.status === 'active') entry.anyActive = true;
    byCaretaker.set(cid, entry);
  }
  const result: CaretakerSummaryDTO[] = [];
  for (const [cid, entry] of byCaretaker) {
    const user = await User.findById(cid).lean();
    const props = await Property.find({ _id: { $in: [...entry.propertyIds] } }, { area: 1 }).lean();
    result.push({
      id: cid,
      name: user?.fullName ?? 'Caretaker',
      ...(user?.email ? { email: user.email } : {}),
      status: entry.anyActive ? 'active' : 'revoked',
      propertyCount: entry.propertyIds.size,
      areas: [...new Set(props.map((p) => p.area).filter(Boolean))] as string[],
    });
  }
  return result;
}

export async function getCaretaker(landlordId: string, caretakerId: string): Promise<RolePermissionDTO[]> {
  const memberships = await TeamMembership.find({ landlordId, caretakerId });
  if (memberships.length === 0) throw AppError.notFound('Caretaker not found');
  return memberships.map(presentMembership);
}

export async function updateCaretaker(
  landlordId: string,
  actor: Actor,
  caretakerId: string,
  input: UpdateCaretakerInput,
): Promise<RolePermissionDTO> {
  const membership = await TeamMembership.findOne({ landlordId, caretakerId, propertyId: input.propertyId });
  if (!membership) throw AppError.notFound('Membership not found');

  if (input.permissions) Object.assign(membership, fullPerms(input.permissions));
  if (input.status) membership.status = input.status;
  await membership.save();

  if (input.status === 'revoked') {
    // Revoke the caretaker's sessions if they have no remaining active memberships.
    const remaining = await TeamMembership.countDocuments({ caretakerId, status: 'active' });
    if (remaining === 0) {
      await Session.updateMany(
        { userId: caretakerId, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } },
      );
    }
    await withTxn(async (session) => {
      await emitActivity(session, {
        actorId: actor.userId,
        actorName: actor.name,
        landlordId,
        action: 'team.removed',
        entityId: caretakerId,
        description: 'Caretaker access revoked',
      });
    });
  }
  return presentMembership(membership);
}
