import { Linking } from 'react-native';

export type TenantContactChannel = 'call' | 'message';

/** Build a device-safe tel/sms URL without changing the stored display value. */
export function tenantContactUrl(
  channel: TenantContactChannel,
  phone: string | undefined,
): string | null {
  const compact = phone
    ?.trim()
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '');
  if (!compact || !/\d/.test(compact)) return null;
  return `${channel === 'call' ? 'tel' : 'sms'}:${compact}`;
}

/** Open the native dialler or message composer; false lets the screen explain failure. */
export async function openTenantContact(
  channel: TenantContactChannel,
  phone: string | undefined,
): Promise<boolean> {
  const url = tenantContactUrl(channel, phone);
  if (!url) return false;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
