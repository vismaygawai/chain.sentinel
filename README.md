# Chain Sentinel -- Real-Time On-Chain Intelligence & Defense Platform

> Autonomous multi-agent on-chain defensive layer for DeFi treasuries and wallets.
> Built by WWHS? for ELECTROTHON 8.0.
> Devfolio Project Link: https://devfolio.co/projects/chain-sentinel-f7cf

---

## 1. The Mission: Prevent Loss, Do Not React To It

Decentralized Finance operates at block speed. When lending collateral devalues or a whale triggers a multi-million-dollar cascade, human operational response is fundamentally too slow. By the time a risk manager receives a manual notification, the collateral is already liquidated.

Chain Sentinel introduces an autonomous, preventive defense layer:
- WhaleWatch Mempool Radar: Intercepts transactions exceeding $500,000 USD before block inclusion and classifies intent (Accumulation, Distribution, CEX Deposit).
- LiquidShield Aave V3 Engine: Continuous on-chain health factor monitoring with distance-to-liquidation analytics and automated partial debt repayment calculations.
- Cross-Agent Threat Correlator: Discovers compound risks when whale dumps intersect with at-risk lending positions within a sliding window.
- ADK-TS Multi-Agent Consensus: Specialized autonomous agents built with @iqai/adk (Watcher, Risk, Planner, Governance) backed by deterministic safety vetoes.
- ATP Tokenized Security Quotas: Registered with the Agent Tokenization Platform (cSNT) for verifiable autonomous execution.
- Neo-Brutalist Operations Matrix: High-contrast, rigid-grid Next.js 16 dashboard featuring oversized Cabinet Grotesk typography, zero-blur hard shadows, and interactive hover-reveals.

---

## 2. Project Context & Team

- Project: Chain Sentinel
- Team: WWHS?
- Hackathon: ELECTROTHON 8.0
- Devfolio Submission: https://devfolio.co/projects/chain-sentinel-f7cf
- Repository: https://github.com/vismaygawai/ChainSentinel

---

## 3. Monorepo Architecture

Retaining an optimized, production-hardened pnpm workspace:

```text
ChainSentinel/
├── .github/
│   └── workflows/
│       ├── ci.yaml                   # Automated PR/push build & test workflow
│       └── lint.yaml                 # Code style & ESLint workflow
├── apps/
│   ├── web/                          # Next.js 16 Neo-Brutalist security dashboard
│   │   ├── src/app/                  # App Router: landing page & command matrix
│   │   ├── src/components/           # Asymmetric cards, hover-reveals, charts
│   │   ├── src/hooks/                # Live WebSocket & reactive risk scan hooks
│   │   └── src/types/                # Shared UI & protocol DTO definitions
│   └── api/                          # Fastify REST & WebSocket microservice
│       ├── src/config/               # Multi-chain RPC configs & token registries
│       ├── src/controllers/          # Scan, whale watch & position controllers
│       ├── src/routes/               # Modular routes (/api/risk-scan, /alerts, /atp)
│       ├── src/services/             # ATP & Treasury orchestration services
│       └── src/websocket/            # Real-time threat feed with replay buffer
├── packages/
│   └── agents-core/                  # ADK-TS multi-agent engine
│       ├── src/agents/               # Watcher, Risk, Planner, Governance agents
│       ├── src/correlation/          # Sliding-window compound alert correlator
│       ├── src/memory/               # Cosine-similarity threat vector store
│       ├── src/policies/             # Conservative, Balanced, Aggressive risk models
│       ├── src/queues/               # Risk-tiered prioritized scan queue
│       └── src/tools/                # Aave V3, Ethers v6, & price oracles
├── docs/                             # Comprehensive specifications
│   ├── ARCHITECTURE.md               # Complete multi-agent architecture & diagrams
│   ├── API-DOCS.md                   # REST endpoints & WebSocket event protocol
│   ├── ATP-DEPLOYMENT.md             # Agent Tokenization Platform registration guide
│   ├── DEMO-SCRIPT.md                # 3-minute hackathon judging walkthrough
│   ├── JUDGING-MAP.md                # Hackathon track & criteria cross-reference
│   └── ROADMAP.md                    # Protocols roadmap (Q1-Q4)
├── scripts/                          # Developer tooling & deployment scripts
│   ├── build-all.ts                  # Unified monorepo build runner
│   ├── deploy-atp.ts                 # ATP registration & tokenization script
│   ├── seed-demo-data.ts             # Test wallets & high-exposure demo seeder
│   └── check-node.js                 # Node >= 20 environment validator
├── bin/                              # Archived legacy components & temporary artifacts
├── .env.example                      # Consolidated environment configuration template
├── package.json                      # Workspace root scripts & pnpm engines
├── pnpm-workspace.yaml               # Monorepo workspace boundaries
├── tsconfig.base.json                # Shared strict TypeScript configuration
└── README.md                         # Monorepo overview, quickstart & architecture
```

---

## 4. Quickstart Guide

### 4.1 Prerequisites
- Node.js: >= 20.0.0
- pnpm: >= 9.0.0

### 4.2 Installation
```bash
# Clone the repository
git clone https://github.com/vismaygawai/ChainSentinel.git
cd ChainSentinel

# Install workspace dependencies
pnpm install
```

### 4.3 Environment Setup
```bash
cp .env.example .env
```
Configure your keys in .env (Google Gemini AI API key, Ethereum RPC URL, Alchemy API key, ATP endpoint).

### 4.4 Running Locally
```bash
# Start all services concurrently (Frontend on :3000, API on :3001)
pnpm dev

# Or run individual services:
pnpm --filter api dev      # Fastify API & WebSocket service
pnpm --filter web dev      # Next.js 16 Web Dashboard
```

### 4.5 Running Tests & Builds
```bash
# Run multi-agent governance and ADK-TS test suite
pnpm test

# Typecheck backend and agent core
pnpm typecheck

# Build web application for production
pnpm build
```

### 4.6 Demo Scripts & ATP Deployment
```bash
# Seed realistic demo wallets and lending positions
pnpm seed

# Register Chain Sentinel agent on the Agent Tokenization Platform (ATP)
pnpm deploy:atp
```

---

## 5. Design System & UI Specification

The frontend adheres strictly to a Neo-Brutalist aesthetic:
- Rigid Grid: Visual structural borders (border-2 border-black), 40px grid matrix.
- Zero-Blur Hard Shadows: High-impact contrast (box-shadow: 4px 4px 0px #000, 8px 8px 0px #000).
- Typography: Oversized Cabinet Grotesk headlines (72px+), Satoshi body text, and Instrument Serif italic editorial accents.
- Color Palette: Stark white (#ffffff), near-black (#0a0a0a), and electric blue (#0096ff).
- Interactive Hover-Reveal: Cards reveal hidden technical breakdowns, risk vectors, simulation diffs, and agent decision trees on hover.
- Asymmetric Shapes: Bento-style grid with asymmetric column spans and punchy hover scaling.

---

## 6. Documentation Index

- Architecture & Multi-Agent Design: docs/ARCHITECTURE.md
- REST & WebSocket API Reference: docs/API-DOCS.md
- ATP Deployment & Tokenomics: docs/ATP-DEPLOYMENT.md
- Hackathon Demo & Judging Walkthrough: docs/DEMO-SCRIPT.md
- Hackathon Judging Criteria Map: docs/JUDGING-MAP.md
- Protocol Roadmap: docs/ROADMAP.md

---

## 7. License & Credits

Chain Sentinel is open-source software under the MIT License.
Built for ELECTROTHON 8.0 by WWHS?
Devfolio Link: https://devfolio.co/projects/chain-sentinel-f7cf
