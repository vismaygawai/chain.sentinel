import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma, alertCorrelator } from '../../../../packages/agents-core/src/index.ts';
import { getClientCount, getReplayBufferSize } from '../websocket/liveFeed.ts';
import { atpService } from '../services/atpService.ts';
import { ScanController } from '../controllers/scanController.ts';
import type { HealthQuery, SystemMetricsResponse } from '../types/api.ts';

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

  // Primary health check (handles both server health check and optional ?address= position health query)
  server.get<{ Querystring: HealthQuery }>('/health', async (request: FastifyRequest<{ Querystring: HealthQuery }>, reply: FastifyReply) => {
    if (request.query && request.query.address) {
      return ScanController.getHealth(request, reply);
    }
    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });

  server.get('/healthz', async () => {
    try {
      await prisma.wallet.findMany();
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

  server.get('/metrics', async (): Promise<SystemMetricsResponse> => {
    const atpStatus = atpService.getStatus();
    const correlatorStats = alertCorrelator.windowStats();
    return {
      uptime: process.uptime(),
      alerts: {
        whaleTotal: correlatorStats.activeWhaleAlerts,
        liquidationTotal: correlatorStats.activeLiquidationAlerts,
      },
      correlator: correlatorStats,
      websocket: {
        connectedClients: getClientCount(),
        replayBufferSize: getReplayBufferSize(),
      },
      atp: {
        registered: atpStatus.status === 'ACTIVE' || atpStatus.status === 'REGISTERED',
        agentId: atpStatus.agentId,
      },
    };
  });
}
