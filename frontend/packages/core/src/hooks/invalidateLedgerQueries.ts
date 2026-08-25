import type { QueryClient } from '@tanstack/react-query';

/**
 * Every committed ledger mutation can change tenant status/risk, payment
 * history, property occupancy panels, portfolio totals, activity and AI copy.
 * Keep that dependency map in one place so landlord entry points stay in sync.
 */
export async function invalidateLedgerQueries(qc: QueryClient): Promise<void> {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ['tenants'] }),
    qc.invalidateQueries({ queryKey: ['tenant'] }),
    qc.invalidateQueries({ queryKey: ['payments'] }),
    qc.invalidateQueries({ queryKey: ['properties'] }),
    qc.invalidateQueries({ queryKey: ['property'] }),
    qc.invalidateQueries({ queryKey: ['dashboard'] }),
    qc.invalidateQueries({ queryKey: ['activity'] }),
    qc.invalidateQueries({ queryKey: ['ai', 'briefing'] }),
    qc.invalidateQueries({ queryKey: ['ai', 'briefs'] }),
  ]);
}
