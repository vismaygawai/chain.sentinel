import { ENV } from '../config/env.ts';
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
    this.registeredMetadata = {
      agentId: `cs-${Date.now().toString(36)}`,
      name: payload.agentName || 'Chain Sentinel Agent',
      symbol: 'cSNT',
      description: 'Autonomous AI Security Agent deployed via ATP platform',
      version: '1.0.0',
      treasuryAddress: payload.treasuryAddress,
      policyProfile: payload.policyProfile || 'BALANCED',
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
