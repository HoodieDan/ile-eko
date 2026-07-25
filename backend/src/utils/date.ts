import type { PaymentFrequency } from '../contracts/enums';

/**
 * Date-only Lagos-calendar values (§5.5). Stored as a Date at UTC midnight and
 * exposed as 'YYYY-MM-DD' strings so a rent deadline never shifts across a day
 * due to timezone. Only true instants (paidAt) use full timestamps.
 */
export function toDateOnly(input: Date | string): Date {
  const d = typeof input === 'string' ? new Date(input) : input;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function dateOnlyString(input: Date | string): string {
  const d = toDateOnly(input);
  return d.toISOString().slice(0, 10);
}

const MONTHS_PER_PERIOD: Record<PaymentFrequency, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  annual: 12,
};

/** Add one billing period to a date-only value. */
export function addPeriod(date: Date, freq: PaymentFrequency): Date {
  const d = toDateOnly(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + MONTHS_PER_PERIOD[freq], d.getUTCDate()));
}
