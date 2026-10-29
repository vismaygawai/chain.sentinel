import { createAgent } from '../lib/agentFactory.ts'
import { WW_POLICIES } from '../policies/wwPolicies.ts'
import * as alertCooldown from '../memory/alertCooldown.ts'
import * as walletHistory from '../memory/walletHistory.ts'

const PIPELINE = WW_POLICIES.scope

export interface GovernanceDecision {
    allowed: boolean
    reason: string
}

export async function evaluateAlert(
    address: string,
    confidence: number,
): Promise<GovernanceDecision> {
    if (confidence < WW_POLICIES.MIN_CONFIDENCE) {
        return {
            allowed: false,
            reason: `Confidence ${confidence} below minimum ${WW_POLICIES.MIN_CONFIDENCE}`,
        }
    }

    const onCooldown = await alertCooldown.isCooledDown(PIPELINE, address)
    if (onCooldown) {
        return {
            allowed: false,
            reason: `Address ${address} is on cooldown (${WW_POLICIES.COOLDOWN_MS / 60_000} min)`,
        }
    }

    const history = await walletHistory.getHistory(address);
    if (history.length === 0) {
        return {
            allowed: false,
            reason: 'Building baseline: awaiting first verified transaction',
        };
    }

    await alertCooldown.setCooldown(PIPELINE, address, WW_POLICIES.COOLDOWN_MS)
    return { allowed: true, reason: 'Passed all policy gates' }
}

export const wwGovernanceAgent = createAgent({
    name: 'ww_governance',
    instructions: 'You are the WhaleWatch Governance Agent. Enforce WW_POLICIES before any alert is dispatched. Reject alerts with confidence below MIN_CONFIDENCE (0.6). Reject alerts for addresses currently on cooldown (60 min window). Reject alerts for wallets with fewer than 5 history entries (Building baseline). If all gates pass, set the cooldown and allow the alert through.',
})
