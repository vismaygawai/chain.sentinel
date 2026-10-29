import { createAgent } from '../lib/agentFactory.ts'
import type { WhaleScanResult } from '../types.ts'
import type { IntentClassification } from './intentAgent.ts'
import { getRedisClient } from '../redis.ts'

export interface WhaleAlert {
    txHash: string
    address: string
    amount: string
    token: string
    timestamp: number
    intent: IntentClassification
    label: string | null
}

export async function formatAlert(
    scan: WhaleScanResult,
    intent: IntentClassification,
    label: string | null,
): Promise<WhaleAlert | null> {
    const redis = getRedisClient()
    const key = `dedup:tx:${scan.txHash}`
    const isNew = await redis.set(key, '1', 'EX', 3600, 'NX')
    if (!isNew) return null
    return {
        txHash: scan.txHash,
        address: scan.address,
        amount: scan.amount,
        token: scan.token,
        timestamp: scan.timestamp,
        intent,
        label,
    }
}

export async function routeToCorrelator(alert: WhaleAlert): Promise<void> {
    const { ingestWhaleAlert } = await import('../correlation/alertCorrelator.ts')
    ingestWhaleAlert({
        address: alert.address,
        amount: alert.amount,
        token: alert.token,
        timestamp: alert.timestamp,
        txHash: alert.txHash,
        intent: alert.intent,
        label: alert.label || undefined,
    })
    console.log(`[alertAgent] Routed alert to correlator: ${alert.txHash} (${alert.intent})`)
}

export const alertAgent = createAgent({
    name: 'ww_alert',
    instructions: 'You are the WhaleWatch Alert Agent. Format WhaleScanResult + intent into structured WhaleAlert objects. Deduplicate alerts by txHash — never emit the same transaction twice. Route all alerts to the alertCorrelator agent, never directly to WebSocket.',
})
