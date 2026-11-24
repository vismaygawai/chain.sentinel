import type { FastifyInstance } from 'fastify';
import { ScanController } from '../controllers/scanController.ts';
import { CHAINS } from '../config/chains.ts';
import { MONITORED_TOKENS } from '../config/tokens.ts';
import { pricingService } from '../services/pricingService.ts';
import type {
  RiskScanRequestBody,
  WhaleRegisterRequestBody,
  PositionRegisterRequestBody,
  AlertsQuery,
  HealthQuery,
} from '../types/api.ts';

const EVM_ADDRESS_PATTERN = '^0x[a-fA-F0-9]{40}$';

const addressBodySchema = {
  type: 'object',
  required: ['address'],
  additionalProperties: false,
  properties: {
    address: { type: 'string', pattern: EVM_ADDRESS_PATTERN },
  },
} as const;

export async function scanRoutes(server: FastifyInstance) {
  // Treasury Risk Scan (stricter per-client rate limit for RPC/ADK pipeline)
  server.post<{ Body: RiskScanRequestBody }>(
    '/api/risk-scan',
    {
      schema: {
        body: {
          type: 'object',
          required: ['address'],
          additionalProperties: false,
          properties: {
            address: { type: 'string', pattern: EVM_ADDRESS_PATTERN },
            policy: { type: 'string', enum: ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'] },
          },
        },
      },
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    ScanController.runRiskScan
  );

  // WhaleWatch Registration & Alerts
  server.post<{ Body: WhaleRegisterRequestBody }>(
    '/whale',
    {
      schema: { body: addressBodySchema },
      config: {
        rateLimit: {
          max: 15,
          timeWindow: '1 minute',
        },
      },
    },
    ScanController.registerWhale
  );

  server.get<{ Querystring: AlertsQuery }>(
    '/alerts',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            address: { type: 'string', pattern: EVM_ADDRESS_PATTERN },
          },
        },
      },
    },
    ScanController.getAlerts
  );

  // LiquidShield Registration & Health Snapshots
  server.post<{ Body: PositionRegisterRequestBody }>(
    '/position',
    {
      schema: { body: addressBodySchema },
      config: {
        rateLimit: {
          max: 15,
          timeWindow: '1 minute',
        },
      },
    },
    ScanController.registerPosition
  );

  server.get<{ Querystring: HealthQuery }>(
    '/position/health',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['address'],
          additionalProperties: false,
          properties: {
            address: { type: 'string', pattern: EVM_ADDRESS_PATTERN },
          },
        },
      },
    },
    ScanController.getHealth
  );

  // Monitored Workflows Overview
  server.get('/api/monitored', ScanController.getMonitored);

  // Supported Chains and Live Prices
  server.get('/api/chains', async () => {
    return { chains: CHAINS };
  });

  server.get('/api/prices', async () => {
    const symbols = MONITORED_TOKENS.map((t) => t.symbol);
    const prices = await pricingService.getPrices(symbols);
    return { tokens: MONITORED_TOKENS, prices };
  });
}
