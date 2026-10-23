# Chain Sentinel — ATP (Agent Tokenization Platform) Deployment Guide

This guide details how Chain Sentinel integrates with the **Agent Tokenization Platform (ATP)** to provide verifiable, tokenized autonomous security agents for decentralized finance.

---

## 1. Why Tokenize Security Agents on ATP?

Autonomous AI agents in Web3 require verifiable execution guarantees, economic sustainability, and transparent accountability:

1. **Autonomous Operational Funding**: Holding or staking the Sentinel agent token (**`cSNT`**) grants a DeFi treasury or DAO a continuous surveillance quota.
2. **Deterministic Governance Enforcement**: Actions arbitrated by the multi-agent system are cryptographically signed and anchored against the agent’s registered on-chain identity.
3. **Decentralized Multi-Agent Coordination**: Other autonomous agents on ATP can query Chain Sentinel's risk oracle to verify protocol solvency before depositing capital.

---

## 2. Agent Metadata Specification

The Sentinel agent metadata is structured to conform with ATP Agent Registry v1 specifications:

```json
{
  "agentId": "chain-sentinel-v1",
  "name": "Chain Sentinel Autonomous Security Agent",
  "symbol": "cSNT",
  "version": "1.0.0",
  "framework": "@iqai/adk-ts",
  "contractTarget": "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
  "capabilities": [
    "aave-v3-liquidation-protection",
    "mempool-whale-tracking",
    "multi-agent-governance-arbitration",
    "compound-threat-correlation",
    "autonomous-debt-rebalance"
  ],
  "arbitrationPolicy": "CONSERVATIVE",
  "metadataUri": "ipfs://bafybeihdwdcefgh4dqkjv67uzcmw7ojee6xwghe5vf4q23kxy",
  "status": "ACTIVE"
}
```

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Configure Environment Variables
Ensure `.env` contains valid credentials:
```bash
ATP_ENDPOINT=https://api.atp.network/v1
ATP_API_KEY=your_atp_api_key_here
ATP_AGENT_ID=chain-sentinel-v1
```

### Step 2: Run Automated ATP Registration Script
Execute the registration script:
```bash
pnpm deploy:atp
```

### Step 3: Verify Registration via API
Query the Fastify backend to verify agent liveness:
```bash
curl http://localhost:3001/api/atp/status
```

Expected Output:
```json
{
  "connected": true,
  "endpoint": "https://api.atp.network/v1",
  "agentId": "chain-sentinel-v1",
  "status": "ACTIVE"
}
```

---

## 4. Autonomous Tokenized Rebalancing Workflow

When an emergency threat is detected:
1. **Threat Signal Emitted**: Health Factor drops below policy boundary (e.g., 1.15).
2. **Quota Verification**: ATP smart contract verifies treasury holds sufficient `cSNT` quota.
3. **Autonomous Execution**: Multi-agent consensus generates an authorized debt repayment transaction.
4. **Receipt Anchored**: The transaction hash and agent reasoning trace are published to ATP.
