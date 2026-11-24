import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { ENV, parseAllowedOrigins } from './config/env.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { registerLiveFeed } from './websocket/liveFeed.ts';
import { healthRoutes } from './routes/health.ts';
import { scanRoutes } from './routes/scan.ts';
import { atpRoutes } from './routes/atp.ts';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    trustProxy: true,
    bodyLimit: 16 * 1024, // 16 KB max request payload
    ajv: {
      customOptions: {
        removeAdditional: false,
      },
    },
    logger: {
      level: ENV.NODE_ENV === 'development' ? 'info' : 'warn',
    },
  });

  // Strict CORS configuration (never reflect arbitrary Origin headers)
  const allowedOrigins = parseAllowedOrigins(ENV.CORS_ORIGIN);
  if (allowedOrigins === '*' && ENV.NODE_ENV === 'production') {
    server.log.warn('CORS_ORIGIN is set to "*" in production. Configure explicit frontend origins.');
  }

  await server.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
    credentials: false,
  });

  // Security headers on all HTTP responses
  server.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('X-DNS-Prefetch-Control', 'off');
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    reply.header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    if (ENV.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  });

  // WebSockets for real-time alert streaming with bounded payload
  await server.register(websocket, {
    options: {
      maxPayload: 4096,
    },
  });

  // Global Rate Limiter
  await server.register(rateLimit, {
    max: 150,
    timeWindow: '1 minute',
  });

  // Centralized Error Handler
  server.setErrorHandler(errorHandler);

  // Live WebSocket Feed
  await registerLiveFeed(server);

  // Modular HTTP Routes
  await server.register(healthRoutes);
  await server.register(scanRoutes);
  await server.register(atpRoutes);

  return server;
}
