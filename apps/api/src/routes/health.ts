import type { FastifyInstance } from 'fastify';
import { prisma, alertCorrelator } from '../../../../packages/agents-core/src/index.ts';
import { getClientCount, getReplayBufferSize } from '../websocket/liveFeed.ts';
import { atpService } from '../services/atpService.ts';

export async function healthRoutes(server: FastifyInstance) {
  // Root index endpoint
  server.get('/', async () => {
    return {
      status: 'ok',
      service: 'Chain Sentinel API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  });

  // Primary health check
  server.get('/health', async () => {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });

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
