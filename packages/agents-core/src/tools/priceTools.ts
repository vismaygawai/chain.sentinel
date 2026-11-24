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

async function fetchJsonWithTimeout<T>(url: string, timeoutMs: number): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  timeoutId.unref?.();
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch real-time token USD price with caching and multi-source fallback.
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

  // Attempt 1: CoinGecko Simple Price API
  const cgData = await fetchJsonWithTimeout<Record<string, { usd: number }>>(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd`,
    3000
  );
  if (cgData?.[coinId]?.usd) {
    const price = cgData[coinId].usd;
    priceCache.set(sym, { priceUSD: price, timestamp: Date.now() });
    return price;
  }

  // Attempt 2: DeFiLlama Coin Price API
  const llamaData = await fetchJsonWithTimeout<{ coins?: Record<string, { price: number }> }>(
    `https://coins.llama.fi/prices/current/coingecko:${encodeURIComponent(coinId)}`,
    3000
  );
  const key = `coingecko:${coinId}`;
  if (llamaData?.coins?.[key]?.price) {
    const price = llamaData.coins[key].price;
    priceCache.set(sym, { priceUSD: price, timestamp: Date.now() });
    return price;
  }

  const fallback = FALLBACK_PRICES[sym] ?? (KNOWN_STABLECOINS.has(sym) ? 1.0 : 0);
  priceCache.set(sym, { priceUSD: fallback, timestamp: Date.now() });
  return fallback;
}

/**
 * Batch price lookup with single aggregated CoinGecko request.
 */
export async function getBatchPrices(symbols: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const neededCoinIds = new Set<string>();
  const idToSymbols = new Map<string, string[]>();

  for (const rawSym of symbols) {
    const sym = rawSym.toUpperCase();
    const cached = priceCache.get(sym);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      result[sym] = cached.priceUSD;
      continue;
    }
    const coinId = COINGECKO_ID_MAP[sym];
    if (coinId) {
      neededCoinIds.add(coinId);
      const list = idToSymbols.get(coinId) || [];
      list.push(sym);
      idToSymbols.set(coinId, list);
    } else {
      result[sym] = FALLBACK_PRICES[sym] ?? (KNOWN_STABLECOINS.has(sym) ? 1.0 : 0);
    }
  }

  if (neededCoinIds.size > 0) {
    const idsParam = Array.from(neededCoinIds).map((id) => encodeURIComponent(id)).join(',');
    const cgData = await fetchJsonWithTimeout<Record<string, { usd: number }>>(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsParam}&vs_currencies=usd`,
      4000
    );
    if (cgData) {
      for (const [coinId, syms] of idToSymbols.entries()) {
        const price = cgData[coinId]?.usd;
        if (price && price > 0) {
          for (const sym of syms) {
            priceCache.set(sym, { priceUSD: price, timestamp: Date.now() });
            result[sym] = price;
          }
        }
      }
    }
  }

  // Populate any remaining symbols with individual fallback/cache
  for (const rawSym of symbols) {
    const sym = rawSym.toUpperCase();
    if (result[sym] === undefined) {
      result[sym] = await getTokenPriceUSD(sym);
    }
  }

  return result;
}
