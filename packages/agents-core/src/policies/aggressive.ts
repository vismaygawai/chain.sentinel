import type { TreasuryPolicy } from './conservative.ts';

export const AGGRESSIVE_POLICY: TreasuryPolicy = {
  name: 'AGGRESSIVE',
  minHealthFactor: 1.25,
  maxSingleAssetConcentrationPct: 75,
  maxBorrowLTV: 0.8,
  liquidationBufferPct: 10,
  autoRebalanceTriggerHF: 1.15,
  alertThreshold: 'CRITICAL',
  cooldownPeriodMs: 300_000, // 5 minutes
  requireMultiSigApproval: false,
};
