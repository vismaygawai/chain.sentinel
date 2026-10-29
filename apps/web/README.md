# Chain Sentinel Web Console

The **Chain Sentinel Web Console** is a high-performance Next.js 15 operations dashboard built for real-time DeFi treasury surveillance, multi-agent exposure arbitration, and autonomous liquidation defense.

## Core Capabilities

- **Command Matrix & Surveillance HUD**: Real-time telemetry, continuous WebSocket alert stream, and active Agent Tokenization Platform (`cSNT`) registration badges.
- **On-Chain Risk & Exposure Scoring**: Interactive breakdown of treasury solvency, concentration, and Aave V3 lending health factor.
- **Dynamic Asset Allocation**: Interactive neo-brutalist asset distribution charts with compact token balance metrics.
- **Live Event Stream**: Real-time mempool whale activity and lending liquidation risk signals correlated in sliding time windows.
- **Autonomous Governance Simulation**: Visual execution of ADK-TS multi-agent defensive plans with policy constraints (Conservative, Balanced, Aggressive).

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Styling**: Tailwind CSS with Neo-Brutalist design language (hard borders, high contrast, zero-blur hard shadows)
- **Web3 / Cryptography**: Ethers.js v6
- **Real-Time Streaming**: Fastify WebSocket feed with automated heartbeat & replay buffers
- **AI Agent Integration**: `@iqai/adk` multi-agent pipeline

## Local Development

From the repository root:

```bash
# Start frontend together with the API and agent workers
pnpm dev

# Or run frontend only
pnpm --filter web dev
```

The console will be accessible at [http://localhost:3000](http://localhost:3000).
