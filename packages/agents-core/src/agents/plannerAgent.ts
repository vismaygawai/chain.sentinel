import { createAgent } from '../lib/agentFactory.ts';
import type { RiskResult, ProtectionPlan } from "../types.ts";
import { callQwenLLM, extractJSON } from "../tools/treasuryTools.ts";

/**
 * Protection Planning Agent using ADK
 * Generates mitigation strategies based on risk assessment
 */

let plannerAgent: any = null;
let plannerRunner: any = null;

export async function initPlannerAgent() {
  if (plannerAgent && plannerRunner) return;

  const built = createAgent({
    name: "protection_planner_agent",
    instructions: `You are a DeFi treasury protection strategist.
Based on risk assessment, create a protection plan using only:
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

  plannerAgent = built;
  plannerRunner = built.runner;
  console.log("✅ Planner Agent initialized (createAgent/Gemini)");
}

export async function generateProtectionPlan(risk: RiskResult): Promise<ProtectionPlan> {
  try {
    // Ensure agent is initialized
    if (!plannerRunner) {
      await initPlannerAgent();
    }

    // Use ADK runner with specific protection strategy prompt
    const prompt = `TASK: Design protection strategy based on detected risks.

CURRENT RISK ASSESSMENT:
- Risk Level: ${risk.level}
- Risk Score: ${risk.score}/100
- Identified Issues: ${(risk.issues || []).join(" | ")}

STRATEGY GUIDELINES:
- HIGH risk: Always recommend ALERT (notify) and REDUCE (cut exposure)
- MEDIUM risk: Recommend DIVERSIFY (spread assets) and ALERT
- LOW risk: Recommend light DIVERSIFY or no action needed

ACTION TYPES:
- ALERT: Notify treasury managers of risks
- REDUCE: Lower exposure to risky positions
- DIVERSIFY: Add more assets to spread risk

OUTPUT ONLY THIS JSON:
{"actions":[{"type":"ALERT"|"REDUCE"|"DIVERSIFY","message":"specific action description"}]}`;

    let response = '';
    if (process.env.GEMINI_API_KEY && (plannerAgent || plannerRunner)) {
      try {
        if (typeof plannerAgent?.run === 'function') {
          const res = await plannerAgent.run(prompt);
          response = typeof res === 'string' ? res : (res?.text || JSON.stringify(res));
        } else if (typeof plannerRunner?.run === 'function') {
          const res = await plannerRunner.run(prompt);
          response = typeof res === 'string' ? res : (res?.text || JSON.stringify(res));
        }
      } catch (adkErr) {
        console.warn("⚠️ ADK agent execution failed, falling back to Qwen:", adkErr);
      }
    }

    if (!response) {
      response = await callQwenLLM(prompt);
    }
    console.log("[DEBUG] Raw Planner LLM response:", response);

    const parsed = extractJSON<ProtectionPlan>(response);

    // Validate structure
    if (
      Array.isArray(parsed.actions) &&
      parsed.actions.every(
        (a: any) =>
          a.type && ["ALERT", "REDUCE", "DIVERSIFY"].includes(a.type) && a.message
      )
    ) {
      console.log("✅ Protection plan from LLM");
      return parsed;
    }
  } catch (err) {
    console.warn("⚠️ LLM planner failed, using deterministic fallback:", err);
  }

  // Deterministic fallback based on risk level
  console.log("✅ Protection plan from deterministic fallback");
  if (risk.level === "HIGH") {
    return {
      actions: [
        {
          type: "ALERT",
          message: "High risk exposure detected. Immediate review required."
        },
        {
          type: "REDUCE",
          message: "Reduce concentration in top asset to under 50% of treasury."
        }
      ]
    };
  }

  if (risk.level === "MEDIUM") {
    return {
      actions: [
        {
          type: "DIVERSIFY",
          message: "Consider reallocating 20% into stable assets (USDC, DAI)."
        },
        {
          type: "ALERT",
          message: "Treasury risk is moderate. Monitor market volatility."
        }
      ]
    };
  }

  return {
    actions: [
      {
        type: "ALERT",
        message: "Treasury is stable. Monitor regularly."
      }
    ]
  };
}
