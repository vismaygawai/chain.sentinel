import { createAgent } from '../lib/agentFactory.ts';
import * as walletTools from '../tools/walletTools.ts';
import { threatVectorStore } from '../memory/vectorStore.ts';

export type IntentClassification =
    | 'CEX_DEPOSIT'
    | 'ACCUMULATION'
    | 'DISTRIBUTION'
    | 'UNKNOWN';

export interface IntentResult {
    address: string;
    label: string | null;
    intent: IntentClassification;
    source: 'local' | 'llm';
}

const INTENT_PATTERNS = [
    { regex: /hot\s?wallet|cex|coinbase|binance|kraken|kucoin|bybit|okx|huobi|gate\.io|bitfinex/i, intent: 'CEX_DEPOSIT' },
    { regex: /treasury|dao|foundation|exploiter|hacker|multisig|vault/i, intent: 'ACCUMULATION' },
    { regex: /distributor|airdrop|deployer|router/i, intent: 'DISTRIBUTION' },
] as const;

function inferIntentFromLabel(label: string): IntentClassification {
    for (const { regex, intent } of INTENT_PATTERNS) {
        if (regex.test(label)) {
            return intent;
        }
    }
    return 'UNKNOWN';
}

export async function classifyIntent(address: string): Promise<IntentResult> {
    const label = walletTools.lookupLabel(address);
    if (label) {
        const intent = inferIntentFromLabel(label);
        return { address, label, intent: intent === 'UNKNOWN' ? 'ACCUMULATION' : intent, source: 'local' };
    }

    // Query threat vector store for matching historical patterns
    const similar = threatVectorStore.querySimilar(address, 1)[0];
    if (similar && similar.similarity > 0.2) {
        return {
            address,
            label: `${similar.incident.protocol} Pattern`,
            intent: 'DISTRIBUTION',
            source: 'llm',
        };
    }

    return { address, label: 'Mempool Whale', intent: 'DISTRIBUTION', source: 'local' };
}

export const intentAgent = createAgent({
    name: 'ww_intent',
    instructions: 'You are the WhaleWatch Intent Agent. Classify the intent behind whale wallet movements. Always check knownAddresses.json first — never call the LLM if a local label exists. For unknown addresses, classify as: CEX_DEPOSIT, ACCUMULATION, DISTRIBUTION, or UNKNOWN. Never block the alert pipeline on an LLM response.',
    tools: [walletTools.lookupLabel],
});
