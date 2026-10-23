import type { FastifyInstance } from 'fastify';
import { prisma, alertCorrelator } from '../../../../packages/agents-core/src/index.ts';
import { getClientCount, getReplayBufferSize } from '../websocket/liveFeed.ts';
import { atpService } from '../services/atpService.ts';

export async function healthRoutes(server: FastifyInstance) {
  server.get('/healthz', async () => {
    try {
      await prisma.user.count();
      return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'degraded', database: 'fallback-storage', timestamp: new Date().toISOString() };
    }
  });

  server.get('/ready', async () => {
    return {
      ready: true,
      service: 'Chain Sentinel API',
      version: '1.0.0',
    };
  });

  server.get('/metrics', async () => {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      correlator: alertCorrelator.windowStats(),
      websocket: {
        connectedClients: getClientCount(),
        replayBufferSize: getReplayBufferSize(),
      },
      atp: atpService.getStatus(),
    };
  });
}
