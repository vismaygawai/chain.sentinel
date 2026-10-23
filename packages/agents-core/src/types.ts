import type { RiskTier } from './queues/scanQueue.ts';

export interface WhaleScanResult {
    address: string;
    amount: string;
    token: string;
    timestamp: number;
    txHash: string;
    label?: string;
    intent?: string;
}

export interface PositionSnapshot {
    walletAddress: string;
    healthFactor: string;
    collateral: string;
    debt: string;
    protocol: string;
    timestamp?: number;
}

export interface WalletProfile {
    address: string;
    lastWWSnapshot?: WhaleScanResult;
    lastLSSnapshot?: PositionSnapshot[];
}

export interface CompoundAlert {
    walletAddress: string;
    wwAlert?: WhaleScanResult | undefined;
    lsAlert?: PositionSnapshot | undefined;
    isCorrelated: boolean;
    combinedUrgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface KnownAddressInfo {
    address: string;
    label: string;
    type: string;
}

export interface AgentConfig {
    name: string;
    instructions: string;
    tools?: any[];
}

// Treasury Workflow Types
export interface TreasurySnapshot {
  address: string;
  totalUsdValue: number;
  positions: Array<{ token: string; balance: number; usdValue: number }>;
}

export interface RiskResult {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  issues: string[];
  tier?: RiskTier;
  healthFactor?: number;
  narrative?: string;
}

export interface ProtectionPlan {
  actions: Array<{ type: 'ALERT' | 'REDUCE' | 'DIVERSIFY'; message: string }>;
}

export interface GovernanceDecision {
  approved: boolean;
  reason: string;
  enforcedActions: Array<{ type: 'ALERT' | 'REDUCE' | 'DIVERSIFY'; message: string }>;
}
