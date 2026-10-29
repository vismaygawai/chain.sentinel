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

export async function scanRoutes(server: FastifyInstance) {
  // Treasury Risk Scan (stricter per-client rate limit for heavy RPC/ADK pipeline)
  server.post<{ Body: RiskScanRequestBody }>(
    '/api/risk-scan',
    {
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
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    ScanController.registerWhale
  );
  server.get<{ Querystring: AlertsQuery }>('/alerts', ScanController.getAlerts);

  // LiquidShield Registration & Health Snapshots
  server.post<{ Body: PositionRegisterRequestBody }>(
    '/position',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    ScanController.registerPosition
  );
  server.get<{ Querystring: HealthQuery }>('/position/health', ScanController.getHealth);

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
