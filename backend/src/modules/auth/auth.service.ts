import { Types } from 'mongoose';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { hashPassword, verifyPassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { durationToMs } from '../../utils/duration';
import { Session, User, type UserDoc } from '../../models';
import { presentUser, presentSessionInfo } from '../../presenters/user';
import { globalCapabilities } from '../../rbac/capabilities';
import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  SessionDTO,
  SessionInfoDTO,
} from '../../contracts';

async function issueSession(user: UserDoc, deviceLabel?: string): Promise<{ token: string }> {
  const expiresAt = new Date(Date.now() + durationToMs(env.JWT_EXPIRES_IN));
  const session = await Session.create({
    userId: user._id,
    ...(deviceLabel ? { deviceLabel } : {}),
    expiresAt,
  });
  const token = signToken({ sub: user.id, role: user.role, sid: session.id });
  return { token };
}

export async function register(
  input: RegisterInput,
  deviceLabel?: string,
): Promise<AuthResponse> {
  const email = input.email.toLowerCase();
  const existing = await User.findOne({ email }).lean();
  if (existing) throw AppError.conflict('An account with this email already exists');

  const user = await User.create({
    fullName: input.name,
    email,
    password: await hashPassword(input.password),
    ...(input.phone ? { phoneNumber: input.phone } : {}),
    role: input.role, // RegisterableRole (landlord | tenant) — enforced by the contract
    lastLogin: new Date(),
  });

  const { token } = await issueSession(user, deviceLabel);
  return { token, user: presentUser(user) };
}

export async function login(input: LoginInput, deviceLabel?: string): Promise<AuthResponse> {
  const query = input.email
    ? { email: input.email.toLowerCase() }
    : { phoneNumber: input.phone };
  const user = await User.findOne(query).select('+password');
  if (!user || user.isDisabled) throw AppError.unauthorized('Invalid credentials');

  const ok = await verifyPassword(input.password, user.password);
  if (!ok) throw AppError.unauthorized('Invalid credentials');

  user.lastLogin = new Date();
  await user.save();

  const { token } = await issueSession(user, deviceLabel);
  return { token, user: presentUser(user) };
}

export function sessionDTO(user: UserDoc): SessionDTO {
  return { user: presentUser(user), capabilities: globalCapabilities(user.role) };
}

export async function logout(sessionId: string): Promise<void> {
  await Session.updateOne({ _id: sessionId }, { $set: { revokedAt: new Date() } });
}

export async function listSessions(
  userId: string,
  currentSid: string,
): Promise<SessionInfoDTO[]> {
  const sessions = await Session.find({
    userId: new Types.ObjectId(userId),
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  }).sort({ lastSeenAt: -1 });
  return sessions.map((s) => presentSessionInfo(s, currentSid));
}

export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const res = await Session.updateOne(
    { _id: sessionId, userId: new Types.ObjectId(userId) },
    { $set: { revokedAt: new Date() } },
  );
  if (res.matchedCount === 0) throw AppError.notFound('Session not found');
}

export async function registerPush(sessionId: string, expoPushToken: string): Promise<void> {
  await Session.updateOne({ _id: sessionId }, { $set: { expoPushToken } });
}

/** Change password → revoke OTHER sessions (keep the current device signed in). */
export async function changePassword(
  user: UserDoc,
  currentSid: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const ok = await verifyPassword(currentPassword, user.password);
  if (!ok) throw AppError.unauthorized('Current password is incorrect');

  user.password = await hashPassword(newPassword);
  await user.save();

  await Session.updateMany(
    { userId: user._id, _id: { $ne: currentSid }, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}
