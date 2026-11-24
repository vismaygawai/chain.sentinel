import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAddress, isAddress } from 'ethers';
import { redactSecrets } from 'agents-core';
import { ENV } from '../config/env.ts';
import { treasuryService } from '../services/treasuryService.ts';
import type {
  RiskScanRequestBody,
  WhaleRegisterRequestBody,
  PositionRegisterRequestBody,
  AlertsQuery,
  HealthQuery,
} from '../types/api.ts';

const VALID_POLICIES = new Set(['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE']);

function normalizeAddress(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!isAddress(trimmed)) return null;
  return getAddress(trimmed.toLowerCase());
}

export class ScanController {
  public static async runRiskScan(
    request: FastifyRequest<{ Body: RiskScanRequestBody }>,
    reply: FastifyReply
  ) {
    const { address, policy } = request.body || {};
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) {
      return reply.status(400).send({ error: 'A valid EVM Ethereum address is required' });
    }

    const normalizedPolicy = policy ? String(policy).toUpperCase() : undefined;
    if (normalizedPolicy && !VALID_POLICIES.has(normalizedPolicy)) {
      return reply.status(400).send({
        error: `Invalid policy '${policy}'. Allowed policies: CONSERVATIVE, BALANCED, AGGRESSIVE`,
      });
    }

    try {
      const result = await treasuryService.scanTreasury(normalizedAddress, normalizedPolicy);
      if (!result || !result.snapshot) {
        const rawErr = (result as { error?: string })?.error;
        return reply.status(502).send({
          error: 'On-chain telemetry unavailable: RPC providers failed or treasury unreadable',
          ...(ENV.NODE_ENV === 'development' && rawErr ? { details: redactSecrets(rawErr) } : {}),
        });
      }
      return reply.send(result);
    } catch (err: unknown) {
      const msg = redactSecrets(err instanceof Error ? err.message : String(err));
      request.log.error({ err: msg }, 'Treasury risk scan failed');
      return reply.status(500).send({
        error: 'Treasury risk scan failed',
        ...(ENV.NODE_ENV === 'development' ? { details: msg } : {}),
      });
    }
  }

  public static async registerWhale(
    request: FastifyRequest<{ Body: WhaleRegisterRequestBody }>,
    reply: FastifyReply
  ) {
    const normalizedAddress = normalizeAddress(request.body?.address);
    if (!normalizedAddress) {
      return reply.status(400).send({ error: 'A valid EVM address is required' });
    }
    try {
      const result = await treasuryService.registerWhaleWatch(normalizedAddress);
      return reply.send(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('capacity')) {
        return reply.status(429).send({ error: msg });
      }
      request.log.error({ err: redactSecrets(msg) }, 'WhaleWatch registration failed');
      return reply.status(500).send({ error: 'Failed to register WhaleWatch target' });
    }
  }

  public static async registerPosition(
    request: FastifyRequest<{ Body: PositionRegisterRequestBody }>,
    reply: FastifyReply
  ) {
    const normalizedAddress = normalizeAddress(request.body?.address);
    if (!normalizedAddress) {
      return reply.status(400).send({ error: 'A valid EVM address is required' });
    }
    try {
      const result = await treasuryService.registerPosition(normalizedAddress);
      return reply.send(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('capacity')) {
        return reply.status(429).send({ error: msg });
      }
      request.log.error({ err: redactSecrets(msg) }, 'LiquidShield registration failed');
      return reply.status(500).send({ error: 'Failed to register LiquidShield position' });
    }
  }

  public static async getAlerts(
    request: FastifyRequest<{ Querystring: AlertsQuery }>,
    reply: FastifyReply
  ) {
    const { address } = request.query;
    let normalizedAddress: string | undefined;
    if (address !== undefined) {
      const parsed = normalizeAddress(address);
      if (!parsed) {
        return reply.status(400).send({ error: 'Invalid address parameter' });
      }
      normalizedAddress = parsed;
    }
    const result = treasuryService.getWhaleAlerts(normalizedAddress);
    return reply.send(result);
  }

  public static async getHealth(
    request: FastifyRequest<{ Querystring: HealthQuery }>,
    reply: FastifyReply
  ) {
    const normalizedAddress = normalizeAddress(request.query.address);
    if (!normalizedAddress) {
      return reply.status(400).send({ error: 'A valid EVM address is required' });
    }
    const result = treasuryService.getHealthSnapshots(normalizedAddress);
    if (!result) {
      return reply.status(404).send({ error: 'No position snapshots found for address.' });
    }
    return reply.send(result);
  }

  public static async getMonitored(_request: FastifyRequest, reply: FastifyReply) {
    const result = await treasuryService.getMonitoredWorkflows();
    return reply.send(result);
  }
}
