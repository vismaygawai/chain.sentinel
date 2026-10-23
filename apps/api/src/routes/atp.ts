import type { FastifyInstance } from 'fastify';
import { atpService } from '../services/atpService.ts';
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
    const body = request.body;
    if (!body || !body.treasuryAddress) {
      return reply.status(400).send({ error: 'Treasury address is required for ATP registration' });
    }
    const registered = await atpService.registerAgent(body);
    return reply.status(201).send(registered);
  });
}
