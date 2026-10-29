import { ethers } from "ethers";
import { watchTreasury } from "../agents/watcherAgent.ts";
import { analyzeRisk, initRiskAgent } from "../agents/riskAgent.ts";
import { generateProtectionPlan, initPlannerAgent } from "../agents/plannerAgent.ts";
import { enforceGovernance, initGovernanceAgent } from "../agents/governanceAgent.ts";

/**
 * Treasury Governance Workflow using ADK Agents
 * Orchestrates the complete on-chain treasury analysis and protection pipeline
 */

export async function runTreasuryWorkflow(address: string, policy?: string) {
  try {
    console.log("[treasuryWorkflow] Starting Treasury Governance Workflow (ADK-driven)");

    // Initialize all ADK agents
    await initRiskAgent();
    await initPlannerAgent();
    await initGovernanceAgent();

    // 1. Watch Treasury (Real On-Chain Data)
    console.log("[treasuryWorkflow] Reading on-chain treasury...");
    const snapshot = await watchTreasury(address);
    console.log(`[treasuryWorkflow] Treasury snapshot acquired for ${snapshot.address}`);

    // 2. Risk Analysis (ADK Agent)
    console.log("[treasuryWorkflow] Analyzing risk with ADK Risk Agent...");
    const risk = await analyzeRisk(snapshot, policy);
    console.log(`[treasuryWorkflow] Risk Level: ${risk.level} (Score: ${risk.score}/100)`);

    // 3. Protection Planning (ADK Agent)
    console.log("[treasuryWorkflow] Generating protection plan with ADK Planner Agent...");
    const plan = await generateProtectionPlan(risk, policy);
    console.log(`[treasuryWorkflow] Generated ${plan.actions.length} protection actions`);

    // 4. Governance Enforcement (ADK Agent)
    console.log("[treasuryWorkflow] Enforcing governance with ADK Governance Agent...");
    const governance = await enforceGovernance({
      risk,
      plan,
      totalUsdValue: snapshot.totalUsdValue,
      policy,
    });
    console.log(`[treasuryWorkflow] Governance Decision: ${governance.approved ? "APPROVED" : "BLOCKED"}`);

    console.log("[treasuryWorkflow] Treasury Governance Workflow Complete\n");

    return {
      snapshot,
      risk,
      plan,
      governance,
      decision: governance
    };
  } catch (err) {
    console.error("[treasuryWorkflow] Workflow error:", err);

    const fallbackGovernance = {
      approved: false,
      reason: "Emergency shutdown due to system failure.",
      enforcedActions: [
        {
          type: "ALERT",
          message: "Automation disabled due to internal error."
        }
      ]
    };

    return {
      snapshot: null,
      risk: {
        level: "HIGH",
        score: 0,
        issues: ["System failure during treasury analysis"]
      },
      plan: {
        actions: [
          {
            type: "ALERT",
            message: "Emergency mode: treasury analysis unavailable."
          }
        ]
      },
      governance: fallbackGovernance,
      decision: fallbackGovernance
    };
  }
}
