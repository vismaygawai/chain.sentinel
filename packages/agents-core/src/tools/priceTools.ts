interface PriceCacheEntry {
  priceUSD: number;
  timestamp: number;
}

const priceCache = new Map<string, PriceCacheEntry>();
const CACHE_TTL_MS = 60_000; // 1 minute

const KNOWN_STABLECOINS = new Set([
  'USDT', 'USDC', 'DAI', 'USDE', 'FDUSD', 'PYUSD', 'LUSD', 'BUSD', 'TUSD', 'GUSD', 'FRAX'
]);

// Fallback prices in case external APIs are rate-limited or offline
const FALLBACK_PRICES: Record<string, number> = {
  ETH: 2850.0,
  WETH: 2850.0,
  BTC: 64200.0,
  WBTC: 64200.0,
  USDT: 1.0,
  USDC: 1.0,
  DAI: 1.0,
  LINK: 14.5,
  UNI: 8.2,
  AAVE: 112.4,
  MATIC: 0.42,
  SOL: 145.0,
  MKR: 1450.0,
  PEPE: 0.0000095,
  SHIB: 0.000018,
  SUPRA: 0.015,
};

const COINGECKO_ID_MAP: Record<string, string> = {
  ETH: 'ethereum',
  WETH: 'ethereum',
  BTC: 'bitcoin',
  WBTC: 'bitcoin',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  MATIC: 'matic-network',
  SOL: 'solana',
  MKR: 'maker',
  PEPE: 'pepe',
  SHIB: 'shiba-inu',
};

/**
 * Fetch real-time token USD price with caching and multi-source fallback
 */
export async function getTokenPriceUSD(symbol: string): Promise<number> {
  const sym = symbol.toUpperCase();
  const cached = priceCache.get(sym);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.priceUSD;
  }

  const coinId = COINGECKO_ID_MAP[sym];
  if (!coinId) {
    return FALLBACK_PRICES[sym] ?? (KNOWN_STABLECOINS.has(sym) ? 1.0 : 0);
  }

  try {
    // Attempt 1: CoinGecko Simple Price API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as Record<string, { usd: number }>;
      if (data[coinId]?.usd) {
        const price = data[coinId].usd;
        priceCache.set(sym, { priceUSD: price, timestamp: Date.now() });
        return price;
      }
    }
  } catch {
    // API failed or timed out, attempt secondary fallback
  }

  try {
    // Attempt 2: DeFiLlama Coin Price API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://coins.llama.fi/prices/current/coingecko:${coinId}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as { coins?: Record<string, { price: number }> };
      const key = `coingecko:${coinId}`;
      if (data.coins?.[key]?.price) {
        const price = data.coins[key].price;
        priceCache.set(sym, { priceUSD: price, timestamp: Date.now() });
        return price;
      }
    }
  } catch {
    // Fallback to static reference table
  }

  const fallback = FALLBACK_PRICES[sym] ?? (KNOWN_STABLECOINS.has(sym) ? 1.0 : 0);
  priceCache.set(sym, { priceUSD: fallback, timestamp: Date.now() });
  return fallback;
}

/**
 * Batch price lookup
 */
export async function getBatchPrices(symbols: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  await Promise.all(
    symbols.map(async (s) => {
      result[s] = await getTokenPriceUSD(s);
    })
  );
  return result;
}
