import type { WhaleScanResult } from '../types.ts';
import { lookupKnownAddress } from '../data/index.ts';
import * as priceTools from './priceTools.ts';

const ALLOWED_ASSETS = new Set([
  'ETH', 'WETH', 'USDT', 'USDC', 'DAI', 'WBTC', 'BTC', 'LINK', 'UNI', 'AAVE', 'MKR', 'PEPE', 'SHIB'
]);

async function getLatestBlock(url: string): Promise<bigint> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'eth_blockNumber', params: [] }),
    });
    const json: any = await res.json();
    if (json.result) return BigInt(json.result);
  } catch {}
  return 0n;
}

export function subscribeToLargeTransactions(
  minUSD: number,
  callback: (tx: WhaleScanResult) => void,
): void {
  const alchemyKey = process.env.ALCHEMY_API_KEY;
  if (!alchemyKey || alchemyKey.includes('your_alchemy')) {
    console.log(`[walletTools] subscribeToLargeTransactions: Running in mock mode (no Alchemy key configured).`);
    return;
  }
  console.log(`[walletTools] subscribeToLargeTransactions: listening for txs >= $${minUSD} (Alchemy Active)`);

  const url = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
  let lastCheckedBlock = 0n;

  const pollInterval = setInterval(async () => {
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

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });

      const data: any = await res.json();
      const transfers = data?.result?.transfers || [];
      // Advance lastCheckedBlock only after successful fetch
      lastCheckedBlock = currentBlock;

      for (const t of transfers) {
        const val = Number(t.value || 0);
        const asset = (t.asset || 'ETH').toUpperCase();
        if (!ALLOWED_ASSETS.has(asset)) continue;
        const price = await priceTools.getTokenPriceUSD(asset);
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
    }
  }, 12000);

  pollInterval.unref?.();
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
    const url = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    const latestBlock = await getLatestBlock(url);
    const fromBlock = '0x' + (latestBlock > 2000n ? latestBlock - 2000n : 0n).toString(16);

    const makeRequest = async (paramObj: Record<string, any>) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });
      const data: any = await response.json();
      return data.result?.transfers || [];
    };

    const [inTransfers, outTransfers] = await Promise.all([
      makeRequest({ toAddress: address }),
      makeRequest({ fromAddress: address }),
    ]);

    const results: WhaleScanResult[] = [];
    const knownLabel = lookupKnownAddress(address);

    for (const t of inTransfers) {
      const val = Number(t.value || 0);
      const asset = (t.asset || 'ETH').toUpperCase();
      if (!ALLOWED_ASSETS.has(asset)) continue;
      const price = await priceTools.getTokenPriceUSD(asset);
      const usdValue = price > 0 ? val * price : val;
      results.push({
        address,
        amount: usdValue.toFixed(2),
        token: asset,
        timestamp: Date.now(),
        txHash: t.hash,
        label: lookupKnownAddress(t.from) || knownLabel || 'Whale Accumulation',
        intent: 'ACCUMULATION' as const,
      });
    }

    for (const t of outTransfers) {
      const val = Number(t.value || 0);
      const asset = (t.asset || 'ETH').toUpperCase();
      if (!ALLOWED_ASSETS.has(asset)) continue;
      const price = await priceTools.getTokenPriceUSD(asset);
      const usdValue = price > 0 ? val * price : val;
      results.push({
        address,
        amount: usdValue.toFixed(2),
        token: asset,
        timestamp: Date.now(),
        txHash: t.hash,
        label: lookupKnownAddress(t.to) || knownLabel || 'Whale Distribution',
        intent: 'DISTRIBUTION' as const,
      });
    }

    return results;
  } catch (err) {
    console.warn(`[walletTools] Failed to fetch transactions for ${address}:`, err);
    return [];
  }
}

export function lookupLabel(address: string): string | null {
  return lookupKnownAddress(address);
}
