import type { Href } from 'expo-router';

/**
 * The API emits `ileeko://…` URLs because push notifications are opened by the
 * OS, which needs a real scheme. Inside the app those must NOT go through
 * `Linking.openURL` — the scheme isn't registered in Expo Go (and even in a dev
 * build it's a pointless round trip through the OS), so it throws
 * "Unable to open URL". Translate them to in-app routes instead.
 */

/** `ileeko://tenants/abc` → `['tenants', 'abc']`; also accepts a bare `/tenants/abc`. */
function segmentsOf(url: string): string[] {
  const withoutScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  return withoutScheme.split('?')[0]!.split('/').filter(Boolean);
}

/**
 * Resolve an API deep link to a route this app actually has.
 * Returns `null` for anything unrecognised so callers can hide the affordance
 * rather than navigate somewhere wrong.
 */
export function resolveDeepLink(url: string | undefined): Href | null {
  if (!url) return null;
  const [host, id] = segmentsOf(url);
  if (!host) return null;

  switch (host) {
    // No standalone payments screen: overdue rent lives on the tenant list,
    // pre-filtered to the people who need chasing.
    case 'payments':
      return { pathname: '/tenants', params: { filter: 'action' } };
    case 'tenants':
      return id ? { pathname: '/tenants/[id]', params: { id } } : '/tenants';
    case 'properties':
      return id ? { pathname: '/properties/[id]', params: { id } } : '/(tabs)/properties';
    case 'enquiries':
      return id ? { pathname: '/enquiries/[id]', params: { id } } : '/enquiries';
    case 'activity':
      return '/activity';
    case 'team':
      return '/(tabs)/team';
    case 'ai':
      return '/(tabs)/ai';
    default:
      return null;
  }
}
