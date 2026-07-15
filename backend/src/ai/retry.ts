import { AIUnavailableError } from './engine';

function isRetryable(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err).toLowerCase();
  return /timeout|aborted|rate.?limit|429|5\d\d|econn|network/.test(msg);
}

/** Wrap an AI call with a hard timeout + bounded retries (§7). Falls through to AIUnavailable. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? Number(process.env.AI_TIMEOUT_MS ?? 30_000);
  const retries = opts.retries ?? 2;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new AIUnavailableError('timeout')), timeoutMs)),
      ]);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === retries) break;
    }
  }
  throw lastErr;
}
