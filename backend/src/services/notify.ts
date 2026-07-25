import { Session, Notification } from '../models';
import { isTest } from '../config/env';
import { logger } from '../config/logger';

export interface NotifyInput {
  userId: string;
  type: 'overdue' | 'activity' | 'ai' | 'rent-due' | 'lease';
  title: string;
  body: string;
  deepLink?: string;
  propertyId?: string;
  dedupeKey?: string;
}

/** Create a notification (deduped) and push it (at-least-once, best-effort — §5.13/§6.15). */
export async function notify(input: NotifyInput): Promise<boolean> {
  try {
    await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      ...(input.deepLink ? { deepLink: input.deepLink } : {}),
      ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
      createdAt: new Date(),
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return false; // already notified (dedupe)
    throw err;
  }
  await sendPush(input.userId, input.title, input.body).catch((err) => logger.warn({ err }, 'push failed'));
  return true;
}

/** Send an Expo push to the user's registered device tokens. No-op in tests / when unconfigured. */
export async function sendPush(userId: string, title: string, body: string): Promise<void> {
  if (isTest) return;
  const sessions = await Session.find(
    { userId, revokedAt: { $exists: false }, expoPushToken: { $exists: true } },
    { expoPushToken: 1 },
  ).lean();
  const tokens = sessions.map((s) => s.expoPushToken).filter(Boolean) as string[];
  if (tokens.length === 0) return;

  const messages = tokens.map((to) => ({ to, title, body, sound: 'default' }));
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(process.env.EXPO_ACCESS_TOKEN ? { authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
    },
    body: JSON.stringify(messages),
  });
  // Drop tokens Expo reports as unregistered (receipt handling, simplified).
  const json = (await res.json().catch(() => null)) as { data?: Array<{ status?: string; details?: { error?: string } }> } | null;
  const bad = new Set<number>();
  json?.data?.forEach((d, i) => {
    if (d?.details?.error === 'DeviceNotRegistered') bad.add(i);
  });
  if (bad.size) {
    const drop = [...bad].map((i) => tokens[i]);
    await Session.updateMany({ expoPushToken: { $in: drop } }, { $unset: { expoPushToken: '' } });
  }
}
