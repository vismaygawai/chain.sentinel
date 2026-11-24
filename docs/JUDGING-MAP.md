# CHAIN.SENTINEL — Architecture & Capability Cross-Reference

**Project**: CHAIN.SENTINEL  
**Author & Maintainer**: Vismay  
**Repository**: https://github.com/vismaygawai/chain.sentinel

This document maps each core platform capability directly to implemented modules in the `CHAIN.SENTINEL` repository.

---

## 1. Capability & Module Matrix

| Capability | Technical Requirement | CHAIN.SENTINEL Implementation | File Cross-Reference |
| :--- | :--- | :--- | :--- |
| **ADK-TS Adoption** | Multi-agent AI built using `@iqai/adk` | Specialized agents constructed with ADK-TS `AgentBuilder` and deterministic failsafes | `packages/agents-core/src/agents/plannerAgent.ts`<br>`packages/agents-core/src/agents/governanceAgent.ts`<br>`packages/agents-core/src/lib/agentFactory.ts` |
| **ATP Tokenization** | Integration with Agent Tokenization Platform | Registered agent identity, capabilities manifest, status endpoints, and registration script | `apps/api/src/services/atpService.ts`<br>`apps/api/src/routes/atp.ts`<br>`scripts/deploy-atp.ts`<br>`docs/ATP-DEPLOYMENT.md` |
| **DeFi Impact** | Real-world protection for lending, treasuries, and wallets | Live Aave V3 lending position monitoring, liquidation distance math, and debt repayment calculation | `packages/agents-core/src/tools/defiTools.ts`<br>`packages/agents-core/src/workflows/scanPositionWorkflow.ts`<br>`apps/api/src/routes/scan.ts` |
| **Cross-Agent Correlation** | Autonomous intelligence & threat discovery | Alert Correlator engine combining WhaleWatch and LiquidShield triggers | `packages/agents-core/src/correlation/alertCorrelator.ts`<br>`apps/api/src/websocket/liveFeed.ts` |
| **Safety & Verification** | AI alignment without rogue financial executions | Dual-arbitration model: LLM strategic reasoning backed by deterministic hard safety rules | `packages/agents-core/src/agents/governanceAgent.ts`<br>`packages/agents-core/src/policies/conservative.ts` |
| **Frontend & Design** | Stark Neo-Brutalist UX with interactive telemetry | Rigid grid, Cabinet Grotesk typography, zero-blur hard shadows, hover-reveals | `apps/web/src/app/page.tsx`<br>`apps/web/src/app/dashboard/page.tsx`<br>`apps/web/src/components/*` |

---

## 2. Core Technical Innovations

### A. Compound Threat Detection
`alertCorrelator.ts` detects the convergence of two distinct events for the same address within a 15-minute sliding window:
1. Large token transfer detected by `WhaleWatch` (`>= $500,000`).
2. Lending collateral health factor risk detected by `LiquidShield`.
When both intersect within the sliding window, a `CompoundAlert` is emitted with escalated urgency.

### B. Deterministic Safety Circuit Breaker
CHAIN.SENTINEL separates advisory LLM planning from deterministic enforcement:
- If total treasury exposure exceeds $1,000,000 USD and Risk Level is `HIGH`, mandatory defensive `REDUCE` and `ALERT` actions are enforced deterministically.
- The LLM cannot bypass hard policy limits or override safety vetoes.

### C. Unified Monorepo Architecture
`pnpm` workspace monorepo containing:
- Shared strict TypeScript configuration (`tsconfig.base.json`)
- Modular workspace boundaries (`apps/api`, `apps/web`, `packages/agents-core`)
- Automated GitHub Actions CI & Lint workflows (`ci.yaml`, `lint.yaml`)
- Scripts for building, testing, seeding, and ATP registration.
