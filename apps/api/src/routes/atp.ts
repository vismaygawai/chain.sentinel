import type { FastifyInstance } from 'fastify';
import { isAddress } from 'ethers';
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

  // Register New Agent Tokenization Instance
  server.post<{ Body: AtpRegisterRequestBody }>('/api/atp/register', async (request, reply) => {
    if (ENV.ATP_API_KEY) {
      const apiKeyHeader = request.headers['x-api-key'];
      if (apiKeyHeader !== ENV.ATP_API_KEY) {
        return reply.status(401).send({ error: 'Unauthorized: Invalid or missing x-api-key header' });
      }
    }
    const body = request.body;
    if (!body || !body.treasuryAddress || !isAddress(body.treasuryAddress)) {
      return reply.status(400).send({ error: 'A valid EVM treasury address is required for ATP registration' });
    }
    const registered = await atpService.registerAgent(body);
    return reply.status(201).send(registered);
  });
}
