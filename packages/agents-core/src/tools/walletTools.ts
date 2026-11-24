import type { WhaleScanResult } from '../types.ts';
import { lookupKnownAddress } from '../data/index.ts';
import * as priceTools from './priceTools.ts';
import { redactSecrets } from '../lib/security.ts';

const ALLOWED_ASSETS = new Set([
  'ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'BTC', 'LINK', 'UNI', 'AAVE', 'MKR', 'PEPE', 'SHIB'
]);

const ALCHEMY_FETCH_TIMEOUT_MS = 10_000;

interface AlchemyTransfer {
  value?: number | string | null;
  asset?: string | null;
  from?: string | null;
  to?: string | null;
  hash?: string | null;
}

async function postAlchemyRpc<T>(url: string, body: unknown): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ALCHEMY_FETCH_TIMEOUT_MS);
  timer.unref?.();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getLatestBlock(url: string): Promise<bigint> {
  const json = await postAlchemyRpc<{ result?: string }>(url, {
    jsonrpc: '2.0',
    id: 2,
    method: 'eth_blockNumber',
    params: [],
  });
  if (json?.result) {
    try {
      return BigInt(json.result);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

export function subscribeToLargeTransactions(
  minUSD: number,
  callback: (tx: WhaleScanResult) => void,
): () => void {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (!alchemyKey || alchemyKey.includes('your_alchemy')) {
    console.log(`[walletTools] subscribeToLargeTransactions: Running in mock mode (no Alchemy key configured).`);
    return () => {};
  }
  console.log(`[walletTools] subscribeToLargeTransactions: listening for txs >= $${minUSD} (Alchemy Active)`);

  const url = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey.trim()}`;
  let lastCheckedBlock = 0n;
  let isPolling = false;

  const pollInterval = setInterval(async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      const currentBlock = await getLatestBlock(url);
      if (currentBlock === 0n) return;
      if (lastCheckedBlock === 0n) {
        lastCheckedBlock = currentBlock > 1n ? currentBlock - 1n : currentBlock;
        return;
      }
      if (currentBlock <= lastCheckedBlock) return;

      const fromBlock = '0x' + (lastCheckedBlock + 1n).toString(16);
      const toBlock = '0x' + currentBlock.toString(16);

      const data = await postAlchemyRpc<{ result?: { transfers?: AlchemyTransfer[] } }>(url, {
        jsonrpc: '2.0',
        id: 3,
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromBlock,
            toBlock,
            category: ['external', 'erc20'],
            maxCount: '0x64',
          },
        ],
      });

      const transfers = data?.result?.transfers;
      if (!transfers) return;

      // Advance lastCheckedBlock only after successful fetch
      lastCheckedBlock = currentBlock;

      const assets = Array.from(
        new Set(
          transfers
            .map((t) => (t.asset || 'ETH').toUpperCase())
            .filter((asset) => ALLOWED_ASSETS.has(asset))
        )
      );
      const prices = assets.length > 0 ? await priceTools.getBatchPrices(assets) : {};

      for (const t of transfers) {
        const val = Number(t.value || 0);
        const asset = (t.asset || 'ETH').toUpperCase();
        if (!ALLOWED_ASSETS.has(asset) || !t.hash) continue;
        const price = prices[asset] ?? 0;
        if (price <= 0) continue;
        const usdValue = val * price;

        if (usdValue >= minUSD) {
          const targetAddr = t.from || t.to;
          if (!targetAddr) continue;
          const knownFrom = t.from ? lookupKnownAddress(t.from) : null;
          const knownTo = t.to ? lookupKnownAddress(t.to) : null;
          const isAccumulation = Boolean(knownTo && !knownFrom);

          callback({
            address: targetAddr,
            amount: usdValue.toFixed(2),
            token: asset,
            timestamp: Date.now(),
            txHash: t.hash,
            label: knownFrom || knownTo || 'Mempool Whale',
            intent: isAccumulation ? 'ACCUMULATION' : 'DISTRIBUTION',
          });
        }
      }
    } catch {
      // transient network error
    } finally {
      isPolling = false;
    }
  }, 12000);

  pollInterval.unref?.();
  return () => clearInterval(pollInterval);
}

export async function fetchRecentTransactions(
  address: string,
  _days = 7
): Promise<WhaleScanResult[]> {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (!alchemyKey || alchemyKey.includes('your_alchemy')) {
    return [];
  }

  try {
    const url = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey.trim()}`;
    const latestBlock = await getLatestBlock(url);
    const fromBlock = '0x' + (latestBlock > 2000n ? latestBlock - 2000n : 0n).toString(16);

    const makeRequest = async (paramObj: Record<string, string>): Promise<AlchemyTransfer[]> => {
      const data = await postAlchemyRpc<{ result?: { transfers?: AlchemyTransfer[] } }>(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromBlock,
            category: ['external', 'erc20'],
            maxCount: '0x64',
            ...paramObj,
          },
        ],
      });
      return data?.result?.transfers || [];
    };

    const [inTransfers, outTransfers] = await Promise.all([
      makeRequest({ toAddress: address }),
      makeRequest({ fromAddress: address }),
    ]);

    const allTransfers = [...inTransfers, ...outTransfers];
    const assets = Array.from(
      new Set(
        allTransfers
          .map((t) => (t.asset || 'ETH').toUpperCase())
          .filter((asset) => ALLOWED_ASSETS.has(asset))
      )
    );
    const prices = assets.length > 0 ? await priceTools.getBatchPrices(assets) : {};

    const results: WhaleScanResult[] = [];
    const knownLabel = lookupKnownAddress(address);

    const mapTransfer = (t: AlchemyTransfer, intent: 'ACCUMULATION' | 'DISTRIBUTION') => {
      const val = Number(t.value || 0);
      const asset = (t.asset || 'ETH').toUpperCase();
      if (!ALLOWED_ASSETS.has(asset) || !t.hash) return;
      const price = prices[asset] ?? 0;
      const usdValue = price > 0 ? val * price : val;
      const counterparty = intent === 'ACCUMULATION' ? t.from : t.to;
      const defaultLabel = intent === 'ACCUMULATION' ? 'Whale Accumulation' : 'Whale Distribution';

      results.push({
        address,
        amount: usdValue.toFixed(2),
        token: asset,
        timestamp: Date.now(),
        txHash: t.hash,
        label: (counterparty ? lookupKnownAddress(counterparty) : null) || knownLabel || defaultLabel,
        intent,
      });
    };

    for (const t of inTransfers) mapTransfer(t, 'ACCUMULATION');
    for (const t of outTransfers) mapTransfer(t, 'DISTRIBUTION');

    return results;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[walletTools] Failed to fetch transactions for ${address}: ${redactSecrets(msg)}`);
    return [];
  }
}

export function lookupLabel(address: string): string | null {
  return lookupKnownAddress(address);
}
