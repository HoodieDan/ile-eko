import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import * as authService from './auth.service';
import { presentUser } from '../../presenters/user';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  RegisterPushInput,
} from '../../contracts';

function deviceLabel(req: Request): string | undefined {
  return req.get('x-device-label') ?? req.get('user-agent') ?? undefined;
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body as RegisterInput, deviceLabel(req));
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginInput, deviceLabel(req));
  res.status(200).json(result);
}

export async function session(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw AppError.unauthorized();
  res.status(200).json(authService.sessionDTO(req.auth.user));
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw AppError.unauthorized();
  await authService.logout(req.auth.sessionId);
  res.status(200).json({ ok: true });
}

export async function listSessions(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw AppError.unauthorized();
  const items = await authService.listSessions(req.auth.userId, req.auth.sessionId);
  res.status(200).json({ items, total: items.length });
}

export async function revokeSession(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw AppError.unauthorized();
  await authService.revokeSession(req.auth.userId, req.params.id as string);
  res.status(200).json({ ok: true });
}

export async function registerPush(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw AppError.unauthorized();
  const { expoPushToken } = req.body as RegisterPushInput;
  await authService.registerPush(req.auth.sessionId, expoPushToken);
  res.status(200).json({ ok: true });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  if (!req.auth) throw AppError.unauthorized();
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;
  await authService.changePassword(
    req.auth.user,
    req.auth.sessionId,
    currentPassword,
    newPassword,
  );
  res.status(200).json({ ok: true, user: presentUser(req.auth.user) });
}
