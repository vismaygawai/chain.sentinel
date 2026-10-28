import type { WhaleScanResult } from '../types.ts';
import { lookupKnownAddress } from '../data/index.ts';

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
  return 20000000n;
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
      if (lastCheckedBlock === 0n) {
        lastCheckedBlock = currentBlock > 1n ? currentBlock - 1n : currentBlock;
        return;
      }
      if (currentBlock <= lastCheckedBlock) return;

      const fromBlock = '0x' + (lastCheckedBlock + 1n).toString(16);
      const toBlock = '0x' + currentBlock.toString(16);
      lastCheckedBlock = currentBlock;

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
              maxCount: '0x14',
            },
          ],
        }),
      });

      const data: any = await res.json();
      const transfers = data?.result?.transfers || [];
      for (const t of transfers) {
        const val = Number(t.value || 0);
        const asset = (t.asset || 'ETH').toUpperCase();
        const multiplier = asset === 'WBTC' ? 65000 : asset === 'ETH' || asset === 'WETH' ? 2800 : 1;
        const usdValue = val * multiplier;

        if (usdValue >= minUSD) {
          callback({
            address: t.to || t.from,
            amount: t.value?.toString() || '0',
            token: asset,
            timestamp: Date.now(),
            txHash: t.hash,
            label: lookupKnownAddress(t.to || t.from) || 'Mempool Whale',
            intent: 'DISTRIBUTION',
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
    const fromBlock = '0x' + (latestBlock > 1000n ? latestBlock - 1000n : 0n).toString(16);

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
            toAddress: address,
            category: ['external', 'erc20'],
            maxCount: '0xa',
          },
        ],
      }),
    });

    const data: any = await response.json();
    const transfers = data.result?.transfers || [];

    return transfers.map((t: any) => ({
      address,
      amount: t.value?.toString() || '0',
      token: t.asset || 'ETH',
      timestamp: Date.now(),
      txHash: t.hash,
      label: lookupKnownAddress(address) || 'Whale Multisig',
      intent: 'ACCUMULATION' as const,
    }));
  } catch (err) {
    console.warn(`[walletTools] Failed to fetch transactions for ${address}:`, err);
    return [];
  }
}

export function lookupLabel(address: string): string | null {
  return lookupKnownAddress(address);
}
