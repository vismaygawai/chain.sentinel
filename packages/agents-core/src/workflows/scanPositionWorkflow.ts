import type { WalletProfile, PositionSnapshot } from '../types.ts';
import { assessRisk } from '../agents/riskAgent.ts';
import { recommendAction } from '../agents/actionAgent.ts';
import { evaluateAlert } from '../agents/lsGovernanceAgent.ts';
import * as alertCorrelator from '../correlation/alertCorrelator.ts';
import * as aaveTools from '../tools/aaveTools.ts';
import * as healthHistory from '../memory/healthHistory.ts';
import { enqueue, dequeueNext, updateTier } from '../queues/scanQueue.ts';

const walletProfiles = new Map<string, WalletProfile>();

export async function registerPosition(address: string): Promise<void> {
    const key = address.toLowerCase();
    if (!walletProfiles.has(key)) {
        walletProfiles.set(key, { address: key });
        
        // Persist to local DB shim if not already there
        import('../index.ts').then(async ({ prisma }) => {
            const existing = await prisma.wallet.findMany();
            if (!existing.some((w: any) => w.address.toLowerCase() === key)) {
                await prisma.wallet.create({ data: { address: key, type: 'POSITION' } });
                console.log(`[scanPositionWorkflow] Persisted ${key} to local_db.json`);
            }
        });
    }
    const hf = await aaveTools.getHealthFactor(address);
    enqueue(address, hf);
    console.log(`[scanPositionWorkflow] Position registered: ${key}, HF: ${hf}`);
}

export async function processPosition(address: string): Promise<void> {
    const key = address.toLowerCase();
    const snapshot = await aaveTools.getPositionSnapshot(address);
    const hf = parseFloat(snapshot.healthFactor);

    await healthHistory.append(address, snapshot);
    updateTier(address, hf);

    const history = await healthHistory.getHistory(address);
    const profile = walletProfiles.get(key) || { address: key };
    profile.lastLSSnapshot = history;
    walletProfiles.set(key, profile);

    const risk = await assessRisk(address, hf);
    if (risk.score < 20) return;

    await recommendAction(snapshot);
    const confidence = risk.source === 'deterministic' ? 0.8 : 0.6;
    const decision = await evaluateAlert(address, hf, confidence);
    if (!decision.allowed) {
        console.log(`[scanPositionWorkflow] Alert rejected: ${decision.reason}`);
        return;
    }
    alertCorrelator.ingestLiquidationAlert(snapshot);
    console.log(`[scanPositionWorkflow] Alert emitted for ${key}, HF: ${hf}, tier: ${risk.tier}`);
}

export async function runScanLoop(): Promise<void> {
    const entry = dequeueNext();
    if (!entry) return;
    await processPosition(entry.address);
}

export function getWalletProfile(address: string): WalletProfile | undefined {
    return walletProfiles.get(address.toLowerCase());
}

export function startWorkflow(intervalMs = 1000): () => void {
    console.log(`[scanPositionWorkflow] LiquidShield workflow started (poll every ${intervalMs}ms)`);
    let isRunning = true;
    async function loop() {
        if (!isRunning) return;
        try {
            await runScanLoop();
        } catch (err) {
            console.error('[scanPositionWorkflow] Pipeline error:', err);
        } finally {
            if (isRunning) {
                setTimeout(loop, intervalMs);
            }
        }
    }
    loop();
    return () => { isRunning = false; };
}
