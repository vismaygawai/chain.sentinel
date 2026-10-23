# Chain Sentinel — Hackathon Judging Criteria Map

**Hackathon**: ELECTROTHON 8.0  
**Team**: WWHS?  
**Devfolio Submission**: https://devfolio.co/projects/chain-sentinel-f7cf  

This document serves as an explicit cross-reference connecting each hackathon evaluation criterion directly to implemented modules in the `ChainSentinel` codebase.

---

## 1. Hackathon Track & Tooling Alignment

| Evaluation Pillar | Hackathon Requirement | Chain Sentinel Implementation | File Cross-Reference |
| :--- | :--- | :--- | :--- |
| **ADK-TS Adoption** | Multi-agent AI built using `@iqai/adk` | Specialized agents constructed with ADK-TS `AgentBuilder` and custom runner pipelines | `packages/agents-core/src/agents/plannerAgent.ts`<br>`packages/agents-core/src/agents/governanceAgent.ts`<br>`packages/agents-core/src/lib/agentFactory.ts` |
| **ATP Tokenization** | Integration with Agent Tokenization Platform | Registered agent identity, capabilities manifest, status endpoints, and automated registration scripts | `apps/api/src/services/atpService.ts`<br>`apps/api/src/routes/atp.ts`<br>`scripts/deploy-atp.ts`<br>`docs/ATP-DEPLOYMENT.md` |
| **DeFi Impact** | Real-world protection for lending, treasuries, and wallets | Live Aave V3 lending position monitoring, liquidation distance math, and debt rebalancing | `packages/agents-core/src/tools/defiTools.ts`<br>`packages/agents-core/src/workflows/scanPositionWorkflow.ts`<br>`apps/api/src/routes/scan.ts` |
| **Cross-Agent Correlation** | Autonomous intelligence & threat discovery | Alert Correlator engine combining mempool WhaleWatch and LiquidShield debt triggers | `packages/agents-core/src/correlation/alertCorrelator.ts`<br>`apps/api/src/websocket/liveFeed.ts` |
| **Safety & Verification** | AI alignment without rogue financial executions | Dual-arbitration model: LLM strategic reasoning backed by deterministic hard safety vetos | `packages/agents-core/src/agents/governanceAgent.ts`<br>`packages/agents-core/src/policies/conservative.ts` |
| **Frontend & Design** | Stark Neo-Brutalist UX with interactive reveal | Rigid grid, Cabinet Grotesk typography, zero-blur hard shadows, hover-reveals, social proof marquee | `apps/web/src/app/page.tsx`<br>`apps/web/src/app/dashboard/page.tsx`<br>`apps/web/src/components/*` |

---

## 2. Core Technical Innovations

### A. Sub-Second Compound Threat Detection
Traditional alerts monitor single metrics in isolation. Chain Sentinel's `alertCorrelator.ts` detects the lethal convergence of two distinct events:
1. Large token dump or borrow in the mempool (`WhaleWatch`).
2. Lending collateral health factor hovering near liquidation cliff (`LiquidShield`).
When both intersect for a wallet within a 15-minute sliding window, a `CompoundAlert` is emitted with priority escalation.

### B. Deterministic Safety Circuit Breaker
Unlike naive AI agent implementations that give full execution authority to an LLM, Chain Sentinel utilizes a **Deterministic Governance Circuit**:
- If total treasury exposure exceeds $1,000,000 USD and Risk Level is `HIGH`, emergency debt reduction actions are locked in mathematically.
- The LLM cannot override or dismiss safety policies, guaranteeing protection against prompt injection or hallucinations.

### C. True Monorepo Architecture
Unified `pnpm` monorepo containing:
- Shared TypeScript configuration (`tsconfig.base.json`)
- Clean workspace dependency tree
- Automated GitHub Actions CI/CD workflows (`ci.yaml`, `lint.yaml`)
- Comprehensive scripts for building, testing, seeding, and deploying.
