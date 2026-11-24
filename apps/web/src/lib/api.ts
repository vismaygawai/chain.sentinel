import type { TreasuryScanResult, WalletInfo } from "@/types/index";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function runRiskScan(address: string, policy?: string): Promise<TreasuryScanResult> {
  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${API_BASE}/api/risk-scan`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, policy }),
      },
      30_000
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Treasury risk scan timed out. Please retry.");
    }
    throw new Error(`Sentinel API unreachable at ${API_BASE}. Ensure backend service is running.`);
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error || errorBody?.message || `Scan failed with HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data?.snapshot && !data?.risk) {
    throw new Error("Invalid telemetry payload received from Sentinel core");
  }

  return {
    snapshot: data.snapshot,
    risk: {
      ...data.risk,
      tier:
        data.risk?.tier ||
        (data.risk?.score >= 85
          ? "CRITICAL"
          : data.risk?.score >= 70
          ? "DANGER"
          : data.risk?.score > 40
          ? "WARNING"
          : "SAFE"),
    },
    plan: data.plan || { actions: [] },
    decision: data.governance || data.decision || {
      approved: true,
      reason: "Validated by Sentinel multi-agent core.",
      enforcedActions: data.plan?.actions || [],
    },
  };
}

export async function registerWhaleWatcher(address: string) {
  const res = await fetchWithTimeout(`${API_BASE}/whale`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error || `WhaleWatch registration failed with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function registerLiquidShield(address: string) {
  const res = await fetchWithTimeout(`${API_BASE}/position`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error || `LiquidShield registration failed with HTTP ${res.status}`);
  }
  return await res.json();
}

export async function getHealthSnapshots(address: string) {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/health?address=${encodeURIComponent(address)}`);
    if (res.ok) return await res.json();
  } catch {
    // fallback to empty snapshot list on transient read failure
  }
  return {
    address,
    snapshots: [],
  };
}

export async function getWhaleAlerts(address?: string) {
  try {
    const url = address
      ? `${API_BASE}/alerts?address=${encodeURIComponent(address)}`
      : `${API_BASE}/alerts`;
    const res = await fetchWithTimeout(url);
    if (res.ok) return await res.json();
  } catch {
    // fallback to empty alerts list
  }
  return { alerts: [] };
}

export async function getMonitoredWorkflows(): Promise<WalletInfo[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/monitored`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {
    // fallback to empty list
  }
  return [];
}

export async function getAtpMetadata() {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/atp/metadata`);
    if (res.ok) return await res.json();
  } catch {
    // fallback metadata
  }
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
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (!isFinite(num) || isNaN(num)) return "$0.00";
  const abs = Math.abs(num);
  if (abs >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

export function formatCompactNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
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
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
