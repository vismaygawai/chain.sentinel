import { AgentBuilder } from "@iqai/adk";
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

  // ✅ Use common factory (Switching to Gemini as requested)
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

    // ✅ Use ADK runner with specific protection strategy prompt
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

    const response = await callQwenLLM(prompt);
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

  // ✅ ADK-style deterministic fallback
  const actions: Array<{ type: "ALERT" | "REDUCE" | "DIVERSIFY"; message: string }> = [];

  if (risk.level === "HIGH") {
    actions.push({ type: "ALERT", message: "Immediate risk detected. Manual review required." });
    actions.push({ type: "REDUCE", message: "Reduce high-risk exposure positions immediately." });
  }

  if (risk.level === "MEDIUM") {
    actions.push({ type: "DIVERSIFY", message: "Diversify treasury across multiple stable assets." });
  }

  if ((risk.level === "LOW" || risk.tier === "SAFE")) {
    actions.push({ type: "ALERT", message: "Treasury is stable. Monitor regularly." });
  }

  console.log("✅ Protection plan from deterministic fallback");
  return { actions };
}
