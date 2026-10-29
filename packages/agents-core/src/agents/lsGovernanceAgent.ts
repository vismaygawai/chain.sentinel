import { createAgent } from '../lib/agentFactory.ts'
import { LS_POLICIES } from '../policies/lsPolicies.ts'
import * as alertCooldown from '../memory/alertCooldown.ts'

const PIPELINE = 'ls'

export interface LSGovernanceDecision {
    allowed: boolean
    reason: string
    criticalOverride: boolean
}

export async function evaluateAlert(
    address: string,
    healthFactor: number,
    confidence: number,
): Promise<LSGovernanceDecision> {
    if (healthFactor < 1.1 && LS_POLICIES.CRITICAL_OVERRIDE) {
        const onCriticalCooldown = await alertCooldown.isCooledDown(`${PIPELINE}:critical`, address);
        if (onCriticalCooldown) {
            return {
                allowed: false,
                reason: `Address ${address} is on critical alert cooldown`,
                criticalOverride: true,
            };
        }
        await alertCooldown.setCooldown(`${PIPELINE}:critical`, address, 60_000);
        return {
            allowed: true,
            reason: `CRITICAL_OVERRIDE: HF ${healthFactor.toFixed(4)} < 1.1 — emergency alert dispatched`,
            criticalOverride: true,
        };
    }

    if (confidence < LS_POLICIES.MIN_CONFIDENCE) {
        return {
            allowed: false,
            reason: `Confidence ${confidence} below minimum ${LS_POLICIES.MIN_CONFIDENCE}`,
            criticalOverride: false,
        }
    }

    const onCooldown = await alertCooldown.isCooledDown(PIPELINE, address)
    if (onCooldown) {
        return {
            allowed: false,
            reason: `Address ${address} is on cooldown (${LS_POLICIES.COOLDOWN_MS / 60_000} min)`,
            criticalOverride: false,
        }
    }

    await alertCooldown.setCooldown(PIPELINE, address, LS_POLICIES.COOLDOWN_MS)
    return {
        allowed: true,
        reason: 'Passed all policy gates',
        criticalOverride: false,
    }
}

export const lsGovernanceAgent = createAgent({
    name: 'ls_governance',
    instructions: 'You are the LiquidShield Governance Agent. Enforce LS_POLICIES before any alert is dispatched. If HF < 1.1 and CRITICAL_OVERRIDE is true: bypass ALL checks immediately. Otherwise: reject if confidence < MIN_CONFIDENCE (0.4). Reject if address is on cooldown (5 min window). If all gates pass, set cooldown and allow the alert through.',
})
