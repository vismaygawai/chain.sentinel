import type { FastifyInstance } from 'fastify';
import { ScanController } from '../controllers/scanController.ts';
import type {
  RiskScanRequestBody,
  WhaleRegisterRequestBody,
  PositionRegisterRequestBody,
  AlertsQuery,
  HealthQuery,
} from '../types/api.ts';

export async function scanRoutes(server: FastifyInstance) {
  // Treasury Risk Scan
  server.post<{ Body: RiskScanRequestBody }>('/api/risk-scan', ScanController.runRiskScan);

  // WhaleWatch Registration & Alerts
  server.post<{ Body: WhaleRegisterRequestBody }>('/whale', ScanController.registerWhale);
  server.get<{ Querystring: AlertsQuery }>('/alerts', ScanController.getAlerts);

  // LiquidShield Registration & Health Snapshots
  server.post<{ Body: PositionRegisterRequestBody }>('/position', ScanController.registerPosition);
  server.get<{ Querystring: HealthQuery }>('/health', ScanController.getHealth);

  // Monitored Workflows Overview
  server.get('/api/monitored', ScanController.getMonitored);
}
