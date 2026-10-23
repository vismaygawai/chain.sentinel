export type IntentClassification =
  | 'CEX_DEPOSIT'
  | 'ACCUMULATION'
  | 'DISTRIBUTION'
  | 'UNKNOWN';

export interface WhaleScanResult {
  address: string;
  amount: string;
  token: string;
  timestamp: number;
  txHash: string;
  label?: string;
  intent?: IntentClassification;
}

export type RiskTier = 'SAFE' | 'WARNING' | 'DANGER' | 'CRITICAL';

export interface PositionSnapshot {
  walletAddress: string;
  healthFactor: string;
  collateral: string;
  debt: string;
  protocol: string;
  timestamp?: number;
}

export interface WalletInfo {
  address: string;
  label?: string | null;
  intent?: IntentClassification;
  lastAlertTime?: number | null;
  historyCount?: number;
  type?: string;
  ww?: {
    active: boolean;
    lastAlert?: WhaleScanResult;
  };
  ls?: {
    active: boolean;
    lastSnapshot?: PositionSnapshot[];
  };
}

export interface LiquidShieldPosition {
  address: string;
  label?: string | null;
  protocol?: string;
  snapshots: PositionSnapshot[];
}

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CompoundAlert {
  walletAddress: string;
  wwAlert?: WhaleScanResult;
  lsAlert?: PositionSnapshot;
  isCorrelated: boolean;
  combinedUrgency: UrgencyLevel;
}

export interface SnapshotPosition {
  token: string;
  balance: number;
  usdValue: number;
}

export interface Snapshot {
  address: string;
  totalUsdValue: number;
  positions: SnapshotPosition[];
}

export interface RiskResult {
  address?: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  score: number;
  tier?: RiskTier;
  healthFactor?: number;
  narrative?: string;
  issues: string[];
}

export interface PlanAction {
  type: 'ALERT' | 'REDUCE' | 'DIVERSIFY' | string;
  message: string;
}

export interface ProtectionPlan {
  actions: PlanAction[];
}

export interface GovernanceDecision {
  approved: boolean;
  reason: string;
  enforcedActions: PlanAction[];
}

// Backward-compatibility aliases
export type Risk = RiskResult;
export type Plan = ProtectionPlan;
export type Governance = GovernanceDecision;

export interface TreasuryScanResult {
  snapshot: Snapshot | null;
  risk: RiskResult;
  plan: ProtectionPlan;
  decision?: GovernanceDecision;
  governance?: GovernanceDecision;
}
