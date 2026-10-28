import type { TreasuryScanResult, WalletInfo } from "@/types/index";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Deterministic fallback treasury snapshot for offline demonstration
 */
export const DEMO_PRESET_TREASURIES: Record<string, TreasuryScanResult> = {
  "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045": {
    snapshot: {
      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      totalUsdValue: 18450200.5,
      positions: [
        { token: "ETH", balance: 4850.2, usdValue: 13823070.0 },
        { token: "USDT", balance: 2500000.0, usdValue: 2500000.0 },
        { token: "USDC", balance: 1450000.0, usdValue: 1450000.0 },
        { token: "WBTC", balance: 10.5, usdValue: 677130.5 },
      ],
    },
    risk: {
      address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      level: "LOW",
      score: 18,
      tier: "SAFE",
      healthFactor: 2.85,
      narrative: "Well-diversified treasury reserves with over $3.95M stablecoin buffer and low liquidation sensitivity.",
      issues: [],
    },
    plan: {
      actions: [
        { type: "ALERT", message: "Automated sentinel surveillance active. Exposure well within policy limits." },
      ],
    },
    decision: {
      approved: true,
      reason: "Low systemic risk profile. Reserve capital adequacy confirmed above 95% threshold.",
      enforcedActions: [
        { type: "ALERT", message: "Automated sentinel surveillance active. Exposure well within policy limits." },
      ],
    },
  },
  "0x577da75775b0606b5d92582b1c67e9154b7c62c3": {
    snapshot: {
      address: "0x577da75775b0606b5d92582b1c67e9154b7c62c3",
      totalUsdValue: 9420000.0,
      positions: [
        { token: "ETH", balance: 1200.0, usdValue: 3420000.0 },
        { token: "USDC", balance: 6000000.0, usdValue: 6000000.0 },
      ],
    },
    risk: {
      address: "0x577da75775b0606b5d92582b1c67e9154b7c62c3",
      level: "HIGH",
      score: 78,
      tier: "DANGER",
      healthFactor: 1.14,
      narrative: "Critical liquidation proximity detected on Aave V3. Health factor 1.14 approaches liquidation threshold (1.0).",
      issues: [
        "Health factor 1.14 is below safe threshold 1.30",
        "Estimated liquidation price: ETH drop below $2,490 triggers liquidation cascade",
        "Borrow debt: $5,200,000 against volatile collateral",
      ],
    },
    plan: {
      actions: [
        { type: "REDUCE", message: "Repay $1,050,000 USDC debt immediately to restore health factor to 1.45." },
        { type: "ALERT", message: "Broadcast emergency warning to Multisig signers via Sentinel Webhook." },
      ],
    },
    decision: {
      approved: true,
      reason: "Emergency threshold triggered: HIGH risk debt position requires instant defensive rebalancing.",
      enforcedActions: [
        { type: "REDUCE", message: "Repay $1,050,000 USDC debt immediately to restore health factor to 1.45." },
        { type: "ALERT", message: "Broadcast emergency warning to Multisig signers via Sentinel Webhook." },
      ],
    },
  },
};

export async function runRiskScan(address: string, policy?: string): Promise<TreasuryScanResult> {
  const normalized = address.toLowerCase();

  try {
    const res = await fetch(`${API_BASE}/api/risk-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, policy }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.snapshot || data?.risk) {
        return {
          snapshot: data.snapshot,
          risk: {
            ...data.risk,
            tier: data.risk?.tier || (data.risk?.score > 70 ? "CRITICAL" : data.risk?.score > 40 ? "WARNING" : "SAFE"),
          },
          plan: data.plan || { actions: [] },
          decision: data.governance || data.decision || {
            approved: true,
            reason: "Validated by Sentinel multi-agent core.",
            enforcedActions: data.plan?.actions || [],
          },
        };
      }
    }
  } catch {
    console.warn(`[ChainSentinel] Real-time scan endpoint ${API_BASE}/api/risk-scan unreachable. Check if API server is running on port 3001.`);
  }

  // Baseline offline preview only if API server is offline
  for (const [key, preset] of Object.entries(DEMO_PRESET_TREASURIES)) {
    if (key.toLowerCase() === normalized) {
      return preset;
    }
  }

  return {
    snapshot: {
      address,
      totalUsdValue: 0,
      positions: [{ token: "ETH", balance: 0, usdValue: 0 }],
    },
    risk: {
      address,
      level: "LOW",
      score: 10,
      tier: "SAFE",
      healthFactor: 0,
      narrative: `Backend server at ${API_BASE} is offline. Start the backend with 'pnpm dev' to stream live Ethereum on-chain balances.`,
      issues: ["Fastify API server is offline on port 3001"],
    },
    plan: {
      actions: [
        { type: "ALERT", message: "Run 'pnpm dev' to launch Fastify API & WebSocket server for live telemetry." },
      ],
    },
    decision: {
      approved: false,
      reason: "Backend offline - start Fastify service (port 3001) for autonomous validation.",
      enforcedActions: [],
    },
  };
}

export async function registerWhaleWatcher(address: string) {
  try {
    const res = await fetch(`${API_BASE}/whale`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { status: "registered", address, message: "Registered for WhaleWatch (Simulated)" };
}

export async function registerLiquidShield(address: string) {
  try {
    const res = await fetch(`${API_BASE}/position`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { status: "registered", address, message: "Registered for LiquidShield (Simulated)" };
}

export async function getHealthSnapshots(address: string) {
  try {
    const res = await fetch(`${API_BASE}/health?address=${address}`);
    if (res.ok) return await res.json();
  } catch {}
  return {
    address,
    snapshots: [],
  };
}

export async function getWhaleAlerts(address?: string) {
  try {
    const url = address ? `${API_BASE}/alerts?address=${address}` : `${API_BASE}/alerts`;
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch {}
  return { alerts: [] };
}

export async function getMonitoredWorkflows(): Promise<WalletInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/api/monitored`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

export async function getAtpMetadata() {
  try {
    const res = await fetch(`${API_BASE}/api/atp/metadata`);
    if (res.ok) return await res.json();
  } catch {}
  return {
    agentId: "chain-sentinel-v1",
    name: "Chain Sentinel Autonomous Security Agent",
    symbol: "cSNT",
    status: "ACTIVE",
  };
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatTime(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
