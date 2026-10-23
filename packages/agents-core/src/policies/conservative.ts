export interface TreasuryPolicy {
  name: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  minHealthFactor: number;
  maxSingleAssetConcentrationPct: number;
  maxBorrowLTV: number;
  liquidationBufferPct: number;
  autoRebalanceTriggerHF: number;
  alertThreshold: 'WARNING' | 'DANGER' | 'CRITICAL';
  cooldownPeriodMs: number;
  requireMultiSigApproval: boolean;
}

export const CONSERVATIVE_POLICY: TreasuryPolicy = {
  name: 'CONSERVATIVE',
  minHealthFactor: 2.0,
  maxSingleAssetConcentrationPct: 35,
  maxBorrowLTV: 0.5,
  liquidationBufferPct: 30,
  autoRebalanceTriggerHF: 1.8,
  alertThreshold: 'WARNING',
  cooldownPeriodMs: 1_800_000, // 30 minutes
  requireMultiSigApproval: true,
};
