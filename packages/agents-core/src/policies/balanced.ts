import type { TreasuryPolicy } from './conservative.ts';

export const BALANCED_POLICY: TreasuryPolicy = {
  name: 'BALANCED',
  minHealthFactor: 1.5,
  maxSingleAssetConcentrationPct: 55,
  maxBorrowLTV: 0.65,
  liquidationBufferPct: 20,
  autoRebalanceTriggerHF: 1.35,
  alertThreshold: 'DANGER',
  cooldownPeriodMs: 900_000, // 15 minutes
  requireMultiSigApproval: false,
};
