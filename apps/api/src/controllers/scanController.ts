import type { FastifyReply, FastifyRequest } from 'fastify';
import { isAddress } from 'ethers';
import { treasuryService } from '../services/treasuryService.ts';
import type {
  RiskScanRequestBody,
  WhaleRegisterRequestBody,
  PositionRegisterRequestBody,
  AlertsQuery,
  HealthQuery,
} from '../types/api.ts';

export class ScanController {
  public static async runRiskScan(
    request: FastifyRequest<{ Body: RiskScanRequestBody }>,
    reply: FastifyReply
  ) {
    const { address, policy } = request.body || {};
    if (!address || !isAddress(address)) {
      return reply.status(400).send({ error: 'A valid EVM Ethereum address is required' });
    }

    try {
      const result = await treasuryService.scanTreasury(address, policy);
      return reply.send(result);
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        error: 'Treasury risk scan failed',
        details: String(err?.message || err),
      });
    }
  }

  public static async registerWhale(
    request: FastifyRequest<{ Body: WhaleRegisterRequestBody }>,
    reply: FastifyReply
  ) {
    const { address } = request.body || {};
    if (!address || !isAddress(address)) {
      return reply.status(400).send({ error: 'A valid EVM address is required' });
    }
    const result = await treasuryService.registerWhaleWatch(address);
    return reply.send(result);
  }

  public static async registerPosition(
    request: FastifyRequest<{ Body: PositionRegisterRequestBody }>,
    reply: FastifyReply
  ) {
    const { address } = request.body || {};
    if (!address || !isAddress(address)) {
      return reply.status(400).send({ error: 'A valid EVM address is required' });
    }
    const result = await treasuryService.registerPosition(address);
    return reply.send(result);
  }

  public static async getAlerts(
    request: FastifyRequest<{ Querystring: AlertsQuery }>,
    reply: FastifyReply
  ) {
    const { address } = request.query;
    if (address && !isAddress(address)) {
      return reply.status(400).send({ error: 'Invalid address parameter' });
    }
    const result = treasuryService.getWhaleAlerts(address);
    return reply.send(result);
  }

  public static async getHealth(
    request: FastifyRequest<{ Querystring: HealthQuery }>,
    reply: FastifyReply
  ) {
    const { address } = request.query;
    if (!address || !isAddress(address)) {
      return reply.status(400).send({ error: 'A valid EVM address is required' });
    }
    const result = treasuryService.getHealthSnapshots(address);
    if (!result) {
      return reply.status(404).send({ error: 'No position snapshots found for address.' });
    }
    return reply.send(result);
  }

  public static async getMonitored(request: FastifyRequest, reply: FastifyReply) {
    const result = await treasuryService.getMonitoredWorkflows();
    return reply.send(result);
  }
}
