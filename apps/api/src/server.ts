import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { ENV } from './config/env.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { registerLiveFeed } from './websocket/liveFeed.ts';
import { healthRoutes } from './routes/health.ts';
import { scanRoutes } from './routes/scan.ts';
import { atpRoutes } from './routes/atp.ts';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    trustProxy: true,
    logger: {
      level: ENV.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  // CORS
  await server.register(cors, {
    origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // WebSockets for Real-time Alert Streaming
  await server.register(websocket);

  // Rate Limiter
  await server.register(rateLimit, {
    max: 150,
    timeWindow: '1 minute',
  });

  // Error Handler
  server.setErrorHandler(errorHandler);

  // Live WebSocket Feed
  await registerLiveFeed(server);

  // Modular HTTP Routes
  await server.register(healthRoutes);
  await server.register(scanRoutes);
  await server.register(atpRoutes);

  return server;
}
