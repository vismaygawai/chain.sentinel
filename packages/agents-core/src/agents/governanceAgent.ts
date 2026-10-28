import { createAgent } from '../lib/agentFactory.ts';
import type { RiskResult, ProtectionPlan, GovernanceDecision } from "../types.ts";
import { callQwenLLM, extractJSON } from "../tools/treasuryTools.ts";

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
Enforce strict security and financial safety rules.
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
  console.log("✅ Governance Agent initialized (createAgent/Gemini)");
}

export async function enforceGovernance(
  input: {
    risk: RiskResult;
    plan: ProtectionPlan;
    totalUsdValue: number;
  }
): Promise<GovernanceDecision> {
  const { risk, plan, totalUsdValue } = input;

  // HARD SAFETY RULE: Never override via LLM if HIGH risk on large treasury
  if (risk.level === "HIGH" && totalUsdValue > 1_000_000) {
    console.log("🚨 Hard safety rule triggered: HIGH risk + large treasury");
    return {
      approved: false,
      reason: "CRITICAL: High risk on large treasury. Manual intervention required.",
      enforcedActions: [
        {
          type: "ALERT",
          message: "🔴 Governance blocked all automation due to critical risk."
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

RISK SUMMARY:
- Level: ${risk.level}
- Score: ${risk.score}/100  
- Treasury: $${(totalUsdValue / 1e6).toFixed(2)}M

PROPOSED PROTECTION ACTIONS:
${plan.actions.map((a, i) => `${i + 1}. ${a.type}: "${a.message}"`).join("\n")}

ENFORCEMENT RULES:
- HIGH risk + treasury >$1M = Block (safety override)
- MEDIUM risk = Approve protective actions (REDUCE, DIVERSIFY, ALERT)
- LOW risk = Approve most actions
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
        console.warn("⚠️ ADK governance execution failed, falling back to Qwen:", adkErr);
      }
    }

    if (!response) {
      response = await callQwenLLM(prompt);
    }
    console.log("[DEBUG] Raw Governance LLM response:", response);

    const parsed = extractJSON<GovernanceDecision>(response);

    // Validate and normalize
    if (parsed && typeof parsed.approved === "boolean") {
      console.log(`✅ Governance decision from LLM: ${parsed.approved ? "APPROVED" : "BLOCKED"}`);
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
    console.warn("⚠️ LLM governance failed, using deterministic fallback:", err);
  }

  // ADK-style deterministic fallback
  if (risk.level === "MEDIUM") {
    console.log("✅ Governance decision from deterministic rule (MEDIUM risk)");
    return {
      approved: true,
      reason: "Moderate risk detected. Safe actions approved.",
      enforcedActions: plan.actions.filter((a: any) => ["DIVERSIFY", "ALERT"].includes(a.type))
    };
  }

  if (risk.level === "LOW" || risk.tier === "SAFE") {
    console.log("✅ Governance decision from deterministic rule (LOW risk)");
    return {
      approved: true,
      reason: "Low risk treasury. All protection actions approved.",
      enforcedActions: plan.actions
    };
  }

  console.log("✅ Governance decision from deterministic rule (fallback)");
  return {
    approved: false,
    reason: "Unrecognized risk state. Governance blocked.",
    enforcedActions: [
      {
        type: "ALERT",
        message: "Governance fallback activated."
      }
    ]
  };
}
