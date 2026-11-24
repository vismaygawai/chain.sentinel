import { ENV } from '../config/env.ts';
import { sanitizeText } from 'agents-core';
import type { AtpRegisterRequestBody } from '../types/api.ts';

export interface AtpAgentMetadata {
  agentId: string;
  name: string;
  symbol: string;
  description: string;
  version: string;
  treasuryAddress: string;
  policyProfile: string;
  capabilities: string[];
  registeredAt: string;
  status: 'ACTIVE' | 'REGISTERED' | 'STANDBY';
}

const VALID_PROFILES = new Set(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE']);

export class AtpService {
  private registeredMetadata: AtpAgentMetadata = {
    agentId: ENV.ATP_AGENT_ID,
    name: 'Chain Sentinel Autonomous Security Agent',
    symbol: 'cSNT',
    description: 'Autonomous multi-agent on-chain intelligence & defensive liquidation prevention for DeFi treasuries.',
    version: '1.0.0',
    treasuryAddress: process.env.ATP_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    policyProfile: 'CONSERVATIVE',
    capabilities: [
      'aave-v3-liquidation-protection',
      'mempool-whale-tracking',
      'multi-agent-governance-arbitration',
      'threat-vector-similarity-matching',
      'auto-rebalance-signals',
    ],
    registeredAt: new Date().toISOString(),
    status: 'ACTIVE',
  };

  public async registerAgent(payload: AtpRegisterRequestBody): Promise<AtpAgentMetadata> {
    const safeName = sanitizeText(payload.agentName, 100) || 'Chain Sentinel Agent';
    const rawPolicy = String(payload.policyProfile || 'BALANCED').toUpperCase();
    const policyProfile = VALID_PROFILES.has(rawPolicy) ? rawPolicy : 'BALANCED';

    this.registeredMetadata = {
      agentId: `cs-${Date.now().toString(36)}`,
      name: safeName,
      symbol: 'cSNT',
      description: 'Autonomous AI Security Agent deployed via ATP platform',
      version: '1.0.0',
      treasuryAddress: payload.treasuryAddress,
      policyProfile,
      capabilities: [
        'aave-v3-liquidation-protection',
        'mempool-whale-tracking',
        'multi-agent-governance-arbitration',
      ],
      registeredAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    return this.registeredMetadata;
  }

  public getAgentMetadata(): AtpAgentMetadata {
    return this.registeredMetadata;
  }

  public getStatus() {
    return {
      connected: true,
      endpoint: ENV.ATP_ENDPOINT,
      agentId: this.registeredMetadata.agentId,
      status: this.registeredMetadata.status,
    };
  }
}

export const atpService = new AtpService();
