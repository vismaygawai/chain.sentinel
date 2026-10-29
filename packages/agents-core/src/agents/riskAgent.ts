import { z } from 'zod';
import { createAgent } from '../lib/agentFactory.ts';
import type { RiskTier } from '../queues/scanQueue.ts';
import { classifyTier } from '../queues/scanQueue.ts';
import type { RiskResult, TreasurySnapshot } from '../types.ts';
import { fetchAaveUserAccountData } from '../tools/defiTools.ts';
import { threatVectorStore } from '../memory/vectorStore.ts';
import { getPolicy } from '../policies/index.ts';

export const RiskSignalSchema = z.object({
  address: z.string(),
  score: z.number().min(0).max(100),
  level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  tier: z.enum(['SAFE', 'WARNING', 'DANGER', 'CRITICAL']),
  healthFactor: z.number().optional(),
  issues: z.array(z.string()),
  narrative: z.string(),
  source: z.enum(['deterministic', 'llm-enriched']),
});

export interface RiskAssessment extends RiskResult {
  address: string;
  healthFactor?: number;
  tier: RiskTier;
  score: number;
  narrative: string;
  source: 'deterministic' | 'llm-enriched';
}

export function deterministicScore(address: string, healthFactor?: number): RiskAssessment {
  const hf = healthFactor && healthFactor > 0 ? healthFactor : 0;
  const hasDebt = hf > 0;
  const tier = hasDebt ? classifyTier(hf) : 'SAFE';
  let score: number;
  if (!hasDebt) score = 10;
  else if (hf < 1.0) score = 100;
  else if (hf < 1.1) score = 95;
  else if (hf < 1.3) score = 75;
  else if (hf < 2.0) score = 40;
  else score = 15;

  const level: 'LOW' | 'MEDIUM' | 'HIGH' =
    tier === 'CRITICAL' || tier === 'DANGER' ? 'HIGH' : tier === 'WARNING' ? 'MEDIUM' : 'LOW';

  const issues: string[] = [];
  if (hasDebt && hf < 1.3) {
    issues.push(`Low Aave V3 health factor: ${hf.toFixed(2)} (liquidation threshold at 1.00)`);
  }

  return {
    address,
    healthFactor: hasDebt ? hf : undefined,
    tier,
    score,
    narrative: hasDebt
      ? `Health factor ${hf.toFixed(2)} classified as ${tier} (${score}/100 risk score).`
      : `No active borrow debt. Treasury profile in safe baseline state (${score}/100 score).`,
    source: 'deterministic',
    level,
    issues,
  };
}

export async function llmEnrich(assessment: RiskAssessment): Promise<RiskAssessment> {
  if (assessment.healthFactor && assessment.healthFactor > 0 && assessment.healthFactor < 1.1) {
    const res = {
      ...assessment,
      narrative: `CRITICAL: Health factor at ${assessment.healthFactor.toFixed(4)} — immediate debt repayment required.`,
    };
    return RiskSignalSchema.parse(res);
  }
  const similar = threatVectorStore.querySimilar(assessment.narrative, 1)[0];
  const enrichedNarrative =
    similar && similar.similarity > 0.25
      ? `${assessment.narrative} Pattern matches ${similar.incident.protocol} (${similar.incident.type}): ${similar.incident.recommendedMitigation}.`
      : assessment.narrative;

  const res = { ...assessment, narrative: enrichedNarrative, source: 'llm-enriched' as const };
  return RiskSignalSchema.parse(res);
}

export async function assessRisk(
  addressOrSnapshot: string | TreasurySnapshot,
  healthFactorOrPolicy?: number | string
): Promise<RiskAssessment> {
  if (typeof addressOrSnapshot === 'object' && addressOrSnapshot.totalUsdValue !== undefined) {
    const snapshot = addressOrSnapshot;
    const policyName = typeof healthFactorOrPolicy === 'string' ? healthFactorOrPolicy : 'CONSERVATIVE';
    const policy = getPolicy(policyName);

    let hf: number | undefined = undefined;
    let hasDebt = false;
    try {
      const aaveData = await fetchAaveUserAccountData(snapshot.address);
      hasDebt = aaveData.totalDebtUSD > 0;
      if (hasDebt && aaveData.healthFactor > 0) {
        hf = aaveData.healthFactor;
      }
    } catch {
      // If Aave account data fails to fetch, wallet has no active lending debt
    }

    // Calculate max single-asset concentration
    let maxAssetPct = 0;
    let dominantToken = 'ETH';
    if (snapshot.totalUsdValue > 0) {
      for (const pos of snapshot.positions) {
        const pct = (pos.usdValue / snapshot.totalUsdValue) * 100;
        if (pct > maxAssetPct) {
          maxAssetPct = pct;
          dominantToken = pos.token;
        }
      }
    }

    const issues: string[] = [];
    let score = 15;

    if (hasDebt && hf !== undefined && hf < policy.minHealthFactor) {
      score += hf < 1.15 ? 65 : hf < 1.35 ? 45 : 25;
      issues.push(
        `Health factor ${hf.toFixed(2)} is below ${policy.name} policy minimum (${policy.minHealthFactor.toFixed(2)})`
      );
    }

    if (snapshot.totalUsdValue > 0 && maxAssetPct > policy.maxSingleAssetConcentrationPct) {
      const stableTokens = ['USDT', 'USDC', 'DAI'];
      const concentrationPenalty = stableTokens.includes(dominantToken) ? 10 : 25;
      score += concentrationPenalty;
      issues.push(
        `${dominantToken} concentration (${maxAssetPct.toFixed(1)}%) exceeds ${policy.name} limit (${policy.maxSingleAssetConcentrationPct}%)`
      );
    }

    score = Math.min(100, Math.max(5, score));
    const level: 'LOW' | 'MEDIUM' | 'HIGH' = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';
    const tier: RiskTier =
      score >= 85 ? 'CRITICAL' : score >= 70 ? 'DANGER' : score >= 40 ? 'WARNING' : 'SAFE';

    const base: RiskAssessment = {
      address: snapshot.address,
      healthFactor: hasDebt ? hf : undefined,
      tier,
      score,
      narrative:
        issues.length > 0
          ? `Detected ${issues.length} policy violation(s) under ${policy.name} profile.`
          : `Treasury reserves ($${snapshot.totalUsdValue.toLocaleString()}) comply with ${policy.name} risk bounds.`,
      source: 'deterministic',
      level,
      issues,
    };

    return llmEnrich(base);
  }

  const targetAddress =
    typeof addressOrSnapshot === 'string'
      ? addressOrSnapshot
      : (addressOrSnapshot as TreasurySnapshot).address || '';

  const base = deterministicScore(
    targetAddress,
    typeof healthFactorOrPolicy === 'number' ? healthFactorOrPolicy : undefined
  );
  return llmEnrich(base);
}

export { assessRisk as analyzeRisk };
export async function initRiskAgent() {}

export const riskAgent = createAgent({
  name: 'ls_risk',
  instructions:
    'You are the LiquidShield Risk Agent. Run deterministicScore() to classify risk from health factor and concentration, then enrich with threat vector similarity.',
});
