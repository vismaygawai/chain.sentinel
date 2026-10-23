export * from './conservative.ts';
export * from './balanced.ts';
export * from './aggressive.ts';
export { WW_POLICIES } from './wwPolicies.ts';
export { LS_POLICIES } from './lsPolicies.ts';

import { CONSERVATIVE_POLICY, type TreasuryPolicy } from './conservative.ts';
import { BALANCED_POLICY } from './balanced.ts';
import { AGGRESSIVE_POLICY } from './aggressive.ts';

export const POLICIES: Record<string, TreasuryPolicy> = {
  CONSERVATIVE: CONSERVATIVE_POLICY,
  BALANCED: BALANCED_POLICY,
  AGGRESSIVE: AGGRESSIVE_POLICY,
};

export function getPolicy(name: string): TreasuryPolicy {
  return POLICIES[name.toUpperCase()] || BALANCED_POLICY;
}
