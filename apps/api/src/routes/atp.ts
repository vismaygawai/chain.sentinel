import type { FastifyInstance } from 'fastify';
import { getAddress, isAddress } from 'ethers';
import { constantTimeEqual, sanitizeText } from 'agents-core';
import { atpService } from '../services/atpService.ts';
import { ENV } from '../config/env.ts';
import type { AtpRegisterRequestBody } from '../types/api.ts';

export async function atpRoutes(server: FastifyInstance) {
  // Get Agent Tokenization Status
  server.get('/api/atp/status', async () => {
    return atpService.getStatus();
  });

  // Get Published ATP Agent Metadata & Capabilities
  server.get('/api/atp/metadata', async () => {
    return atpService.getAgentMetadata();
  });

  // Register New Agent Tokenization Instance (Protected with constant-time SHA-256 API key verification)
  server.post<{ Body: AtpRegisterRequestBody }>(
    '/api/atp/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['treasuryAddress'],
          additionalProperties: false,
          properties: {
            agentName: { type: 'string', minLength: 1, maxLength: 100 },
            treasuryAddress: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
            initialTokenSupply: { type: 'number', minimum: 0 },
            policyProfile: { type: 'string', enum: ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] },
          },
        },
      },
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      if (!ENV.ATP_API_KEY) {
        return reply.status(503).send({
          error: 'ATP registration disabled: server ATP_API_KEY is not configured',
        });
      }

      const apiKeyHeader = request.headers['x-api-key'];
      if (typeof apiKeyHeader !== 'string' || apiKeyHeader.length === 0) {
        return reply.status(401).send({ error: 'Unauthorized: Missing x-api-key header' });
      }

      if (!constantTimeEqual(apiKeyHeader, ENV.ATP_API_KEY)) {
        return reply.status(401).send({ error: 'Unauthorized: Invalid x-api-key header' });
      }

      const body = request.body;
      if (!body || !body.treasuryAddress || !isAddress(body.treasuryAddress)) {
        return reply.status(400).send({
          error: 'A valid EVM treasury address is required for ATP registration',
        });
      }

      const registered = await atpService.registerAgent({
        agentName: sanitizeText(body.agentName, 100) || 'Chain Sentinel Agent',
        treasuryAddress: getAddress(body.treasuryAddress.toLowerCase()),
        initialTokenSupply: body.initialTokenSupply,
        policyProfile: body.policyProfile,
      });
      return reply.status(201).send(registered);
    }
  );
}
