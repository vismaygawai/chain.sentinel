import { createAgent, type AgentInstance } from '../lib/agentFactory.ts';
import type { RiskResult, ProtectionPlan } from "../types.ts";
import { callQwenLLM, extractJSON } from "../tools/treasuryTools.ts";
import { getPolicy } from "../policies/index.ts";

/**
 * Protection Planning Agent using ADK
 * Generates mitigation strategies based on risk assessment and selected policy
 */

let plannerAgent: AgentInstance | null = null;

export async function initPlannerAgent() {
  if (plannerAgent) return;

  plannerAgent = createAgent({
    name: "protection_planner_agent",
    instructions: `You are a DeFi treasury protection strategist.
Based on risk assessment and governance policy, create a protection plan using only:
- ALERT: notify operators
- REDUCE: reduce risky exposure
- DIVERSIFY: diversify across assets

Return STRICT JSON ONLY:
{
  "actions": [
    { "type": "ALERT" | "REDUCE" | "DIVERSIFY", "message": string }
  ]
}`
  });

  console.log("[plannerAgent] Initialized (createAgent/Gemini)");
}

export async function generateProtectionPlan(
  risk: RiskResult,
  policyName: string = 'CONSERVATIVE'
): Promise<ProtectionPlan> {
  const policy = getPolicy(policyName);

  try {
    // Ensure agent is initialized
    if (!plannerAgent) {
      await initPlannerAgent();
    }

    // Use ADK runner with specific protection strategy prompt
    const prompt = `TASK: Design protection strategy based on detected risks and policy constraints.

POLICY APPLIED:
- Name: ${policy.name}
- Target Min Health Factor: ${policy.minHealthFactor}
- Max Single Asset Concentration: ${policy.maxSingleAssetConcentrationPct}%
- Liquidation Buffer: ${policy.liquidationBufferPct}%
- MultiSig Required: ${policy.requireMultiSigApproval}

CURRENT RISK ASSESSMENT:
- Risk Level: ${risk.level}
- Risk Score: ${risk.score}/100
- Identified Issues: ${(risk.issues || []).join(" | ")}

STRATEGY GUIDELINES:
- HIGH risk: Always recommend ALERT (notify) and REDUCE (cut exposure to under ${policy.maxSingleAssetConcentrationPct}%)
- MEDIUM risk: Recommend DIVERSIFY (maintain ${policy.liquidationBufferPct}% buffer) and ALERT
- LOW risk: Recommend light DIVERSIFY or steady-state ALERT

ACTION TYPES:
- ALERT: Notify treasury managers of risks
- REDUCE: Lower exposure to risky positions
- DIVERSIFY: Add more assets to spread risk

OUTPUT ONLY THIS JSON:
{"actions":[{"type":"ALERT"|"REDUCE"|"DIVERSIFY","message":"specific action description"}]}`;

    let response = '';
    if (process.env.GEMINI_API_KEY && plannerAgent) {
      try {
        response = await plannerAgent.ask(prompt);
      } catch (adkErr) {
        console.warn("[plannerAgent] ADK agent execution failed, attempting fallback:", adkErr);
      }
    }

    if (!response) {
      response = await callQwenLLM(prompt);
    }
    console.log("[plannerAgent] LLM response received");

    const parsed = extractJSON<ProtectionPlan>(response);

    // Validate structure
    if (
      Array.isArray(parsed.actions) &&
      parsed.actions.every(
        (a: any) =>
          a.type && ["ALERT", "REDUCE", "DIVERSIFY"].includes(a.type) && a.message
      )
    ) {
      console.log("[plannerAgent] Protection plan generated from LLM");
      return parsed;
    }
  } catch (err) {
    console.warn("[plannerAgent] LLM planner fallback activated:", err instanceof Error ? err.message : String(err));
  }

  // Deterministic fallback based on risk level and policy
  console.log(`[plannerAgent] Protection plan generated from deterministic rules (${policy.name} policy)`);
  if (risk.level === "HIGH") {
    return {
      actions: [
        {
          type: "ALERT",
          message: `High risk exposure detected under ${policy.name} policy. Immediate operator review required.`
        },
        {
          type: "REDUCE",
          message: `Reduce concentration in top asset to under ${policy.maxSingleAssetConcentrationPct}% of treasury.`
        }
      ]
    };
  }

  if (risk.level === "MEDIUM") {
    return {
      actions: [
        {
          type: "DIVERSIFY",
          message: `Consider reallocating into stable assets to preserve ${policy.liquidationBufferPct}% safety buffer.`
        },
        {
          type: "ALERT",
          message: `Treasury risk is moderate under ${policy.name} policy. Monitor market volatility.`
        }
      ]
    };
  }

  return {
    actions: [
      {
        type: "ALERT",
        message: `Treasury is stable within ${policy.name} policy bounds. Monitor regularly.`
      }
    ]
  };
}
