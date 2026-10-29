import type { TreasuryScanResult, WalletInfo } from "@/types/index";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function runRiskScan(address: string, policy?: string): Promise<TreasuryScanResult> {
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

export function formatCompactUSD(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(num) || isNaN(num)) return "$0.00";
  const abs = Math.abs(num);
  if (abs >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export function formatCompactNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(num) || isNaN(num)) return "0";
  const abs = Math.abs(num);
  if (abs >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num < 0.0001 && num > 0
    ? "<0.0001"
    : num.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function formatTime(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
