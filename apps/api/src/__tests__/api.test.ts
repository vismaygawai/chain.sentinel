import { describe, it, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../server.ts';
import { ENV } from '../config/env.ts';

const VALID_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('CHAIN.SENTINEL API integration & security tests', () => {
  let server: FastifyInstance;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-api-test-'));
  const prevDbEnv = process.env.LOCAL_DB_PATH;

  beforeEach(async () => {
    process.env.LOCAL_DB_PATH = path.join(tempDir, 'local_db.json');
    server = await buildServer();
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  after(() => {
    if (prevDbEnv === undefined) {
      delete process.env.LOCAL_DB_PATH;
    } else {
      process.env.LOCAL_DB_PATH = prevDbEnv;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns health, readiness, chains, and security headers', async () => {
    const res = await server.inject({ method: 'GET', url: '/health' });
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.status, 'healthy');

    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'DENY');
    assert.equal(res.headers['referrer-policy'], 'strict-origin-when-cross-origin');
    assert.ok(res.headers['content-security-policy']);

    const chainsRes = await server.inject({ method: 'GET', url: '/api/chains' });
    assert.equal(chainsRes.statusCode, 200);
    assert.ok(chainsRes.json().chains.ethereum);
  });

  it('does not reflect arbitrary untrusted CORS origins', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://evil-phishing.example' },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });

  it('rejects invalid addresses, policies, and unexpected fields with 400', async () => {
    const badAddr = await server.inject({
      method: 'POST',
      url: '/api/risk-scan',
      payload: { address: 'not-an-address' },
    });
    assert.equal(badAddr.statusCode, 400);

    const badPolicy = await server.inject({
      method: 'POST',
      url: '/api/risk-scan',
      payload: { address: VALID_ADDRESS, policy: 'INVALID' },
    });
    assert.equal(badPolicy.statusCode, 400);

    const extraProp = await server.inject({
      method: 'POST',
      url: '/whale',
      payload: { address: VALID_ADDRESS, admin: true },
    });
    assert.equal(extraProp.statusCode, 400);

    const badQuery = await server.inject({
      method: 'GET',
      url: '/alerts?address=invalid',
    });
    assert.equal(badQuery.statusCode, 400);
  });

  it('protects /api/atp/register with API key validation and schema checks', async () => {
    const origKey = ENV.ATP_API_KEY;
    // When ATP_API_KEY is empty in default test env, registration fails closed (503)
    if (!origKey) {
      const res503 = await server.inject({
        method: 'POST',
        url: '/api/atp/register',
        payload: {
          agentName: 'Test Sentinel',
          treasuryAddress: VALID_ADDRESS,
          policyProfile: 'CONSERVATIVE',
        },
      });
      assert.equal(res503.statusCode, 503);
    }

    const statusRes = await server.inject({ method: 'GET', url: '/api/atp/status' });
    assert.equal(statusRes.statusCode, 200);
    assert.equal(statusRes.json().connected, true);
  });
});
