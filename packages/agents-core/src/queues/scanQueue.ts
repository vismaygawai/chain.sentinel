/**
 * Risk-tiered priority queue for LiquidShield scan scheduling.
 * 
 * Tiers (based on Aave health factor):
 *   CRITICAL  HF < 1.10  → scan every 12s   (1 Ethereum block)
 *   DANGER    HF < 1.30  → scan every 30s
 *   WARNING   HF < 2.00  → scan every 2 min
 *   SAFE      HF ≥ 2.00  → scan every 10 min
 */

export type RiskTier = 'CRITICAL' | 'DANGER' | 'WARNING' | 'SAFE'

export const TIER_INTERVALS: Record<RiskTier, number> = {
    CRITICAL: 12_000,
    DANGER: 30_000,
    WARNING: 120_000,
    SAFE: 600_000,
} as const

export interface QueueEntry {
    address: string
    tier: RiskTier
    intervalMs: number
    nextScanAt: number
}

const queue: Map<string, QueueEntry> = new Map()

export function classifyTier(healthFactor: number): RiskTier {
    if (healthFactor < 1.1) return 'CRITICAL'
    if (healthFactor < 1.3) return 'DANGER'
    if (healthFactor < 2.0) return 'WARNING'
    return 'SAFE'
}

export function enqueue(address: string, healthFactor: number): void {
    const tier = classifyTier(healthFactor)
    const intervalMs = TIER_INTERVALS[tier]
    queue.set(address.toLowerCase(), {
        address: address.toLowerCase(),
        tier,
        intervalMs,
        nextScanAt: Date.now(),
    })
}

export function dequeueNext(): QueueEntry | undefined {
    const now = Date.now()
    let earliest: QueueEntry | undefined
    for (const entry of queue.values()) {
        if (entry.nextScanAt <= now) {
            if (!earliest || entry.nextScanAt < earliest.nextScanAt) {
                earliest = entry
            }
        }
    }
    if (earliest) {
        earliest.nextScanAt = now + earliest.intervalMs
        queue.set(earliest.address, earliest)
    }
    return earliest
}

export function updateTier(address: string, healthFactor: number): void {
    const key = address.toLowerCase()
    const existing = queue.get(key)
    const newTier = classifyTier(healthFactor)
    const newInterval = TIER_INTERVALS[newTier]
    if (existing) {
        if (newInterval < existing.intervalMs) {
            existing.nextScanAt = Math.min(existing.nextScanAt, Date.now() + newInterval)
        }
        existing.tier = newTier
        existing.intervalMs = newInterval
        queue.set(key, existing)
    } else {
        enqueue(address, healthFactor)
    }
}

export function remove(address: string): boolean {
    return queue.delete(address.toLowerCase())
}

export function size(): number {
    return queue.size
}

export function snapshot(): QueueEntry[] {
    return Array.from(queue.values()).sort((a, b) => a.nextScanAt - b.nextScanAt)
}
