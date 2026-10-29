import type { WhaleScanResult, WalletProfile } from '../types.ts';
import { startScanner, onLargeTransaction } from '../agents/scannerAgent.ts';
import { classifyIntent } from '../agents/intentAgent.ts';
import { formatAlert } from '../agents/alertAgent.ts';
import { evaluateAlert } from '../agents/wwGovernanceAgent.ts';
import * as alertCorrelator from '../correlation/alertCorrelator.ts';
import * as walletHistory from '../memory/walletHistory.ts';

const registeredWallets = new Set<string>();
const walletProfiles = new Map<string, WalletProfile>();

export async function registerWallet(address: string): Promise<void> {
    const key = address.toLowerCase();
    if (registeredWallets.has(key)) return;
    registeredWallets.add(key);
    walletProfiles.set(key, { address: key });
    
    // Persist to local DB shim if not already there
    import('../index.ts').then(async ({ prisma }) => {
        const existing = await prisma.wallet.findMany();
        if (!existing.some((w: any) => w.address.toLowerCase() === key)) {
            await prisma.wallet.create({ data: { address: key, type: 'WHALE' } });
            console.log(`[watchWalletWorkflow] Persisted ${key} to local_db.json`);
        }
    });

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
    alertCorrelator.ingestWhaleAlert(scan);
    const profile = walletProfiles.get(addr);
    if (profile) {
        profile.lastWWSnapshot = scan;
        walletProfiles.set(addr, profile);
    }
    console.log(`[watchWalletWorkflow] Alert processed: ${scan.txHash} (${intentResult.intent})`);
}

export function getWalletProfile(address: string): WalletProfile | undefined {
    return walletProfiles.get(address.toLowerCase());
}

export function startWorkflow(): void {
    onLargeTransaction((scan) => {
        processTransaction(scan).catch((err) => {
            console.error('[watchWalletWorkflow] Pipeline error:', err);
        });
    });
    startScanner();
}
