import type { WhaleScanResult, WalletProfile } from '../types.ts';
import { startScanner, onLargeTransaction } from '../agents/scannerAgent.ts';
import { classifyIntent } from '../agents/intentAgent.ts';
import { formatAlert, routeToCorrelator } from '../agents/alertAgent.ts';
import { evaluateAlert } from '../agents/wwGovernanceAgent.ts';
import * as walletHistory from '../memory/walletHistory.ts';
import { prisma, MAX_PERSISTED_WALLETS } from '../database.ts';

const registeredWallets = new Set<string>();
const walletProfiles = new Map<string, WalletProfile>();

export async function registerWallet(address: string): Promise<void> {
  const key = address.toLowerCase();
  if (registeredWallets.has(key)) return;
  if (registeredWallets.size >= MAX_PERSISTED_WALLETS) {
    throw new Error(`WhaleWatch monitoring capacity (${MAX_PERSISTED_WALLETS}) reached`);
  }
  registeredWallets.add(key);
  walletProfiles.set(key, { address: key });

  try {
    const existing = await prisma.wallet.findMany();
    const record = existing.find((w) => w.address.toLowerCase() === key);
    if (!record || (!record.isWhale && !record.types?.includes('WHALE'))) {
      await prisma.wallet.create({ data: { address: key, type: 'WHALE' } });
      console.log(`[watchWalletWorkflow] Persisted ${key} to local store`);
    }
  } catch (err) {
    console.warn('[watchWalletWorkflow] Persistence error:', err instanceof Error ? err.message : String(err));
  }

  await walletHistory.backfill(address);
  console.log(`[watchWalletWorkflow] Wallet registered and backfilled: ${key}`);
}

export async function processTransaction(scan: WhaleScanResult): Promise<void> {
  const addr = scan.address.toLowerCase();
  // Only process transactions for explicitly registered surveillance targets
  if (!registeredWallets.has(addr)) {
    return;
  }
  await walletHistory.append(scan.address, scan);
  const intentResult = await classifyIntent(scan.address);
  const alert = await formatAlert(scan, intentResult.intent, intentResult.label);
  if (!alert) return;

  const confidence = intentResult.source === 'local' ? 0.9 : 0.75;
  const decision = await evaluateAlert(scan.address, confidence);
  if (!decision.allowed) {
    console.log(`[watchWalletWorkflow] Alert rejected: ${decision.reason}`);
    return;
  }

  const enrichedScan: WhaleScanResult = {
    ...scan,
    intent: intentResult.intent,
    label: intentResult.label || scan.label,
  };
  await routeToCorrelator(alert);

  const profile = walletProfiles.get(addr);
  if (profile) {
    profile.lastWWSnapshot = enrichedScan;
    walletProfiles.set(addr, profile);
  }
  console.log(`[watchWalletWorkflow] Alert processed: ${scan.txHash} (${intentResult.intent})`);
}

export function getWalletProfile(address: string): WalletProfile | undefined {
  return walletProfiles.get(address.toLowerCase());
}

export function startWorkflow(): () => void {
  onLargeTransaction((scan) => {
    processTransaction(scan).catch((err) => {
      console.error('[watchWalletWorkflow] Pipeline error:', err);
    });
  });
  return startScanner();
}
