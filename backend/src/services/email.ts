import { Resend } from 'resend';
import { env, hasResend, isTest } from '../config/env';
import { logger } from '../config/logger';

let client: Resend | null = null;
function resend(): Resend {
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}

export interface SendResult {
  /** true when the provider accepted the message. */
  sent: boolean;
  /** Why it wasn't sent (unconfigured / provider error) — surfaced to the caller. */
  reason?: string;
}

/**
 * Send a transactional email. Never throws: callers (e.g. team invites) must
 * still succeed and fall back to a share link when mail can't be delivered.
 * No-ops under test so the suite never hits the provider.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendResult> {
  if (isTest) return { sent: false, reason: 'test' };
  if (!hasResend) return { sent: false, reason: 'email not configured' };
  try {
    const { error } = await resend().emails.send({
      from: env.EMAIL_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.text ? { text: opts.text } : {}),
    });
    if (error) {
      logger.warn({ err: error, to: opts.to }, 'email send rejected');
      return { sent: false, reason: error.message ?? 'provider error' };
    }
    return { sent: true };
  } catch (err) {
    logger.warn({ err, to: opts.to }, 'email send failed');
    return { sent: false, reason: 'provider error' };
  }
}

const shell = (body: string): string => `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#F1EDE4;padding:28px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px">
    <div style="font-size:20px;font-weight:700;color:#0F3D2E;margin-bottom:18px">Ilé Èkó</div>
    ${body}
    <hr style="border:none;border-top:1px solid #E7E2D6;margin:24px 0" />
    <div style="font-size:12px;color:#5A6A62">Ilé Èkó — Lagos rental management.</div>
  </div>
</div>`;

/** Caretaker team invitation. */
export function caretakerInviteEmail(opts: {
  inviteeName: string;
  landlordName: string;
  inviteUrl: string;
  propertyCount: number;
}): { subject: string; html: string; text: string } {
  const subject = `${opts.landlordName} invited you to manage ${opts.propertyCount} propert${
    opts.propertyCount === 1 ? 'y' : 'ies'
  } on Ilé Èkó`;
  const html = shell(`
    <p style="font-size:15px;color:#12211B;line-height:22px">
      Hello ${opts.inviteeName},<br /><br />
      <strong>${opts.landlordName}</strong> has invited you to help manage
      ${opts.propertyCount} propert${opts.propertyCount === 1 ? 'y' : 'ies'} on Ilé Èkó.
      You'll only be able to see and do what they've permitted.
    </p>
    <p style="margin:24px 0">
      <a href="${opts.inviteUrl}"
         style="background:#0F3D2E;color:#fff;text-decoration:none;padding:13px 22px;border-radius:12px;font-weight:600;display:inline-block">
        Accept invitation
      </a>
    </p>
    <p style="font-size:13px;color:#5A6A62;line-height:20px">
      This invitation expires in 7 days. If the button doesn't work, copy this link:<br />
      <span style="word-break:break-all">${opts.inviteUrl}</span>
    </p>`);
  const text = `${opts.landlordName} invited you to manage ${opts.propertyCount} property(ies) on Ilé Èkó.\nAccept: ${opts.inviteUrl}\n(Expires in 7 days.)`;
  return { subject, html, text };
}
