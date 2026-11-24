import { describe, it, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  redactSecrets,
  assertSafeExternalUrl,
  constantTimeEqual,
  sanitizeText,
} from '../lib/security.ts';
import { extractJSON, treasuryTools } from '../tools/treasuryTools.ts';
import { calculateRequiredDebtRepayment, toPositionSnapshot } from '../tools/defiTools.ts';
import * as scanQueue from '../queues/scanQueue.ts';
import * as alertCorrelator from '../correlation/alertCorrelator.ts';
import { cosineSimilarity, pseudoEmbedText, threatVectorStore } from '../memory/vectorStore.ts';
import { deterministicScore, llmEnrich } from '../agents/riskAgent.ts';
import { generateProtectionPlan } from '../agents/plannerAgent.ts';
import { enforceGovernance } from '../agents/governanceAgent.ts';
import { evaluateAlert as lsEvaluate } from '../agents/lsGovernanceAgent.ts';
import { evaluateAlert as wwEvaluate } from '../agents/wwGovernanceAgent.ts';
import { getRedisClient } from '../redis.ts';
import { prisma, MAX_PERSISTED_WALLETS } from '../database.ts';

const TEST_ADDR = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

describe('security helpers', () => {
  it('redacts API keys in RPC URLs and query parameters', () => {
    const raw = 'Failed fetching https://eth-mainnet.g.alchemy.com/v2/secretAlchemyKey12345?apiKey=mySecret99';
    const redacted = redactSecrets(raw);
    assert.ok(!redacted.includes('secretAlchemyKey12345'));
    assert.ok(!redacted.includes('mySecret99'));
    assert.ok(redacted.includes('[REDACTED]'));
  });

  it('validates external URLs and rejects unsafe schemes', () => {
    assert.equal(assertSafeExternalUrl('https://api.example.com/v1').protocol, 'https:');
    assert.throws(() => assertSafeExternalUrl('file:///etc/passwd'));
    assert.throws(() => assertSafeExternalUrl('not-a-url'));
  });

  it('compares secrets in constant time regardless of length', () => {
    assert.equal(constantTimeEqual('alpha-secret', 'alpha-secret'), true);
    assert.equal(constantTimeEqual('alpha-secret', 'short'), false);
    assert.equal(constantTimeEqual('alpha-secret', 'alpha-secreu'), false);
  });

  it('sanitizes control characters and bounds length', () => {
    assert.equal(sanitizeText('hello\u0000\nworld', 20), 'hello  world');
    assert.equal(sanitizeText('abcdef', 3), 'abc');
  });
});

describe('treasuryTools & extractJSON', () => {
  it('extracts JSON even with braces inside quoted strings and markdown fences', () => {
    const raw = '```json\n{"approved": true, "reason": "Balance {ETH} is healthy", "enforcedActions": []}\n```';
    const parsed = extractJSON<{ approved: boolean; reason: string }>(raw);
    assert.equal(parsed.approved, true);
    assert.equal(parsed.reason, 'Balance {ETH} is healthy');
  });

  it('calculates base risk score bounded between 5 and 100', () => {
    const res = treasuryTools.generateBaseRisk({
      address: TEST_ADDR,
      totalUsdValue: 2_000_000,
      positions: [{ token: 'ETH', balance: 700, usdValue: 2_000_000 }],
    });
    assert.equal(res.level, 'HIGH');
    assert.equal(res.score, 75);
  });
});

describe('defiTools', () => {
  it('computes debt repayment required to reach target health factor', () => {
    // Collateral 1000, LiqThreshold 80%, Debt 700 -> HF = 800/700 = 1.14
    // Target HF 2.0 -> maxAllowedDebt = 800 / 2.0 = 400 -> repay = 300
    const repay = calculateRequiredDebtRepayment(1000, 700, 80, 2.0);
    assert.equal(repay, 300);
    assert.equal(calculateRequiredDebtRepayment(1000, 0, 80, 2.0), 0);
  });

  it('formats PositionSnapshot states accurately', () => {
    const errSnap = toPositionSnapshot(TEST_ADDR, {
      totalCollateralUSD: 0,
      totalDebtUSD: 0,
      availableBorrowsUSD: 0,
      currentLiquidationThreshold: 0,
      ltv: 0,
      healthFactor: 0,
      isAtRisk: false,
      distanceToLiquidationPct: 100,
      isError: true,
    });
    assert.equal(errSnap.healthFactor, 'UNKNOWN');

    const noDebtSnap = toPositionSnapshot(TEST_ADDR, {
      totalCollateralUSD: 5000,
      totalDebtUSD: 0,
      availableBorrowsUSD: 3000,
      currentLiquidationThreshold: 82.5,
      ltv: 75,
      healthFactor: 0,
      isAtRisk: false,
      distanceToLiquidationPct: 100,
    });
    assert.equal(noDebtSnap.healthFactor, 'Infinity');
  });
});

describe('scanQueue', () => {
  beforeEach(() => {
    scanQueue.remove(TEST_ADDR);
  });

  it('classifies tiers and prioritizes urgent scans', () => {
    assert.equal(scanQueue.classifyTier(1.05), 'CRITICAL');
    assert.equal(scanQueue.classifyTier(1.2), 'DANGER');
    assert.equal(scanQueue.classifyTier(1.6), 'WARNING');
    assert.equal(scanQueue.classifyTier(2.5), 'SAFE');

    scanQueue.enqueue(TEST_ADDR, 1.08);
    const entry = scanQueue.dequeueNext();
    assert.ok(entry);
    assert.equal(entry.tier, 'CRITICAL');
    assert.equal(entry.address, TEST_ADDR.toLowerCase());
  });
});

describe('alertCorrelator', () => {
  beforeEach(() => {
    alertCorrelator.reset();
  });

  it('correlates whale and liquidation events within sliding window', () => {
    const first = alertCorrelator.ingestWhaleAlert({
      address: TEST_ADDR,
      amount: '1200000',
      token: 'USDC',
      timestamp: Date.now(),
      txHash: '0xabc123',
      intent: 'CEX_DEPOSIT',
    });
    assert.equal(first.isCorrelated, false);
    assert.equal(first.combinedUrgency, 'LOW');

    const second = alertCorrelator.ingestLiquidationAlert({
      walletAddress: TEST_ADDR,
      healthFactor: '1.15',
      collateral: '500000',
      debt: '350000',
      protocol: 'aave-v3',
      timestamp: Date.now(),
    });
    assert.equal(second.isCorrelated, true);
    assert.equal(second.combinedUrgency, 'CRITICAL');
    assert.equal(alertCorrelator.getRecentAlerts(TEST_ADDR).length, 2);
  });
});

describe('vectorStore & riskAgent & planner & governance', () => {
  it('computes cosine similarity and matches seeded threats', () => {
    const v1 = pseudoEmbedText('Health factor rapid collapse below 1.05');
    const v2 = pseudoEmbedText('Health factor rapid collapse');
    assert.ok(cosineSimilarity(v1, v2) > 0.5);
    const matches = threatVectorStore.querySimilar('health factor collapse collateral debt', 2);
    assert.ok(matches.length > 0);
  });

  it('scores risk deterministically and enriches critical HF', async () => {
    const score = deterministicScore(TEST_ADDR, 1.05);
    assert.equal(score.tier, 'CRITICAL');
    assert.equal(score.level, 'HIGH');
    const enriched = await llmEnrich(score);
    assert.ok(enriched.narrative.startsWith('CRITICAL:'));
  });

  it('enforces hard safety override for HIGH risk > $1M and handles HIGH risk <= $1M', async () => {
    const highRisk = deterministicScore(TEST_ADDR, 1.05);
    const plan = await generateProtectionPlan(highRisk, 'CONSERVATIVE');
    assert.ok(plan.actions.length >= 1);

    const bigDecision = await enforceGovernance({
      risk: highRisk,
      plan,
      totalUsdValue: 2_500_000,
      policy: 'CONSERVATIVE',
    });
    assert.equal(bigDecision.approved, true);
    assert.ok(bigDecision.reason.includes('Hard safety rule activated'));

    const smallDecision = await enforceGovernance({
      risk: highRisk,
      plan,
      totalUsdValue: 50_000,
      policy: 'CONSERVATIVE',
    });
    assert.equal(smallDecision.approved, true);
    assert.ok(smallDecision.enforcedActions.length >= 1);
  });
});

describe('governance cooldowns', () => {
  beforeEach(async () => {
    await getRedisClient().quit();
  });

  it('enforces LiquidShield critical override and confidence gates', async () => {
    const lowConf = await lsEvaluate(TEST_ADDR, 1.5, 0.2);
    assert.equal(lowConf.allowed, false);

    const crit = await lsEvaluate(TEST_ADDR, 1.05, 0.2);
    assert.equal(crit.allowed, true);
    assert.equal(crit.criticalOverride, true);
  });

  it('rejects WhaleWatch alerts when wallet has no verified history', async () => {
    const res = await wwEvaluate(TEST_ADDR, 0.9);
    assert.equal(res.allowed, false);
    assert.ok(res.reason.includes('baseline'));
  });
});

describe('database persistence', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-db-test-'));
  const tempDb = path.join(tempDir, 'local_db.json');
  const prevDbEnv = process.env.LOCAL_DB_PATH;

  beforeEach(async () => {
    process.env.LOCAL_DB_PATH = tempDb;
    await prisma.wallet.deleteMany();
  });

  after(() => {
    if (prevDbEnv === undefined) {
      delete process.env.LOCAL_DB_PATH;
    } else {
      process.env.LOCAL_DB_PATH = prevDbEnv;
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('deduplicates addresses and merges WHALE + POSITION types atomically', async () => {
    await prisma.wallet.create({ data: { address: TEST_ADDR, type: 'WHALE' } });
    await prisma.wallet.create({ data: { address: TEST_ADDR.toLowerCase(), type: 'POSITION' } });

    const wallets = await prisma.wallet.findMany();
    assert.equal(wallets.length, 1);
    assert.equal(wallets[0].isWhale, true);
    assert.equal(wallets[0].isPosition, true);
    assert.ok(MAX_PERSISTED_WALLETS >= 50);
  });
});
