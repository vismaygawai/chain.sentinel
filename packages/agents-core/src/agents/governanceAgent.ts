import { createAgent } from '../lib/agentFactory.ts';
import type { RiskResult, ProtectionPlan, GovernanceDecision } from "../types.ts";
import { callQwenLLM, extractJSON } from "../tools/treasuryTools.ts";
import { getPolicy } from "../policies/index.ts";

/**
 * Governance Enforcement Agent using ADK
 * Applies hard safety rules + LLM-based policy enforcement
 */

let governanceAgent: any = null;
let governanceRunner: any = null;

export async function initGovernanceAgent() {
  if (governanceAgent && governanceRunner) return;

  const built = createAgent({
    name: "governance_enforcement_agent",
    instructions: `You are the final safety authority for Chain Sentinel.
Enforce strict security and financial safety rules based on treasury risk policies.
Block unsafe actions. Approve only protective ones.

Return STRICT JSON ONLY:
{
  "approved": boolean,
  "reason": string,
  "enforcedActions": [
    { "type": "ALERT" | "REDUCE" | "DIVERSIFY", "message": string }
  ]
}`
  });

  governanceAgent = built;
  governanceRunner = built.runner;
  console.log("[governanceAgent] Initialized (createAgent/Gemini)");
}

export async function enforceGovernance(
  input: {
    risk: RiskResult;
    plan: ProtectionPlan;
    totalUsdValue: number;
    policy?: string;
  }
): Promise<GovernanceDecision> {
  const { risk, plan, totalUsdValue, policy: policyName } = input;
  const policy = getPolicy(policyName || 'CONSERVATIVE');

  // HARD SAFETY RULE: Require manual multisig or block if high risk on significant treasury
  if (risk.level === "HIGH" && (totalUsdValue > 1_000_000 || policy.requireMultiSigApproval)) {
    console.log(`[governanceAgent] Hard safety rule triggered: HIGH risk on $${(totalUsdValue / 1e6).toFixed(2)}M treasury under ${policy.name} policy`);
    return {
      approved: false,
      reason: `CRITICAL: High risk under ${policy.name} policy (${policy.requireMultiSigApproval ? 'Multi-Sig Required' : 'Exposure Limit Exceeded'}). Manual governance intervention required.`,
      enforcedActions: [
        {
          type: "ALERT",
          message: `Governance blocked automated execution under ${policy.name} policy due to high risk threshold.`
        }
      ]
    };
  }

  try {
    // Ensure agent is initialized
    if (!governanceRunner) {
      await initGovernanceAgent();
    }

    const prompt = `TASK: Make final safety approval decision for treasury.

POLICY ENFORCEMENT:
- Policy Name: ${policy.name}
- Target Min Health Factor: ${policy.minHealthFactor}
- Max Single Asset Concentration: ${policy.maxSingleAssetConcentrationPct}%
- MultiSig Required for High Value: ${policy.requireMultiSigApproval}

RISK SUMMARY:
- Level: ${risk.level}
- Score: ${risk.score}/100  
- Treasury: $${(totalUsdValue / 1e6).toFixed(2)}M

PROPOSED PROTECTION ACTIONS:
${plan.actions.map((a, i) => `${i + 1}. ${a.type}: "${a.message}"`).join("\n")}

ENFORCEMENT RULES:
- HIGH risk + treasury >$1M = Block (safety override)
- MEDIUM risk = Approve protective actions (REDUCE, DIVERSIFY, ALERT)
- LOW risk = Approve actions within policy guidelines
- Never approve risky actions on large treasuries

OUTPUT ONLY THIS JSON:
{"approved":true|false,"reason":"brief explanation of decision","enforcedActions":[{"type":"ALERT"|"REDUCE"|"DIVERSIFY","message":"action to enforce"}]}`;

    let response = '';
    if (process.env.GEMINI_API_KEY && (governanceAgent || governanceRunner)) {
      try {
        if (typeof governanceAgent?.run === 'function') {
          const res = await governanceAgent.run(prompt);
          response = typeof res === 'string' ? res : (res?.text || JSON.stringify(res));
        } else if (typeof governanceRunner?.run === 'function') {
          const res = await governanceRunner.run(prompt);
          response = typeof res === 'string' ? res : (res?.text || JSON.stringify(res));
        }
      } catch (adkErr) {
        console.warn("[governanceAgent] ADK governance execution failed, attempting fallback:", adkErr);
      }
    }

    if (!response) {
      response = await callQwenLLM(prompt);
    }
    console.log("[governanceAgent] LLM response received");

    const parsed = extractJSON<GovernanceDecision>(response);

    // Validate and normalize
    if (parsed && typeof parsed.approved === "boolean") {
      console.log(`[governanceAgent] Governance decision from LLM: ${parsed.approved ? "APPROVED" : "BLOCKED"}`);
      return {
        approved: parsed.approved,
        reason: parsed.reason || "No reason provided",
        enforcedActions: (parsed.enforcedActions || []).map((a: any) => ({
          type: ["ALERT", "REDUCE", "DIVERSIFY"].includes(a.type) ? a.type : "ALERT",
          message: String(a.message)
        }))
      };
    }
  } catch (err) {
    console.warn("[governanceAgent] LLM governance fallback activated:", err instanceof Error ? err.message : String(err));
  }

  // ADK-style deterministic fallback
  if (risk.level === "MEDIUM") {
    console.log(`[governanceAgent] Governance decision from deterministic rule (MEDIUM risk, ${policy.name} policy)`);
    return {
      approved: true,
      reason: `Moderate risk detected. Protective actions approved under ${policy.name} policy guidelines.`,
      enforcedActions: plan.actions.filter((a: any) => ["DIVERSIFY", "ALERT"].includes(a.type))
    };
  }

  if (risk.level === "LOW" || risk.tier === "SAFE") {
    console.log(`[governanceAgent] Governance decision from deterministic rule (LOW risk, ${policy.name} policy)`);
    return {
      approved: true,
      reason: `Low risk treasury. All protection actions approved under ${policy.name} policy.`,
      enforcedActions: plan.actions
    };
  }

  console.log("[governanceAgent] Governance decision from deterministic rule (default fallback)");
  return {
    approved: false,
    reason: `Unrecognized risk state under ${policy.name} policy. Governance blocked automation.`,
    enforcedActions: [
      {
        type: "ALERT",
        message: "Governance fallback activated."
      }
    ]
  };
}
