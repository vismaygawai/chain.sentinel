import { ethers } from 'ethers';
import { redactSecrets } from '../lib/security.ts';

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrls: string[];
}

const RPC_CALL_TIMEOUT_MS = 10_000;
const providerCache = new Map<string, ethers.JsonRpcProvider>();

function getAlchemyRpcUrl(): string | null {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key || key.includes('your_alchemy') || key.trim().length === 0) {
    return null;
  }
  return `https://eth-mainnet.g.alchemy.com/v2/${key.trim()}`;
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrls: [
      ...(getAlchemyRpcUrl() ? [getAlchemyRpcUrl()!] : []),
      process.env.RPC_URL || process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com',
      'https://eth.llamarpc.com',
      'https://cloudflare-eth.com',
      'https://rpc.ankr.com/eth',
    ],
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrls: [
      process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
    ],
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrls: [
      process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      'https://base.llamarpc.com',
    ],
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrls: [
      process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      'https://gateway.tenderly.co/public/sepolia',
    ],
  },
};

function sanitizeRpcUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    return 'invalid-endpoint';
  }
}

function getOrCreateProvider(chainId: number, url: string): ethers.JsonRpcProvider {
  const cacheKey = `${chainId}:${url}`;
  let provider = providerCache.get(cacheKey);
  if (!provider) {
    provider = new ethers.JsonRpcProvider(url, undefined, {
      staticNetwork: ethers.Network.from(chainId),
    });
    providerCache.set(cacheKey, provider);
  }
  return provider;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`RPC timeout after ${ms}ms (${label})`)), ms);
    timer.unref?.();
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Resilient JSON-RPC Provider Failover.
 * Attempts queries through an ordered pool of cached RPC endpoints with bounded timeouts.
 */
export async function withResilientProvider<T>(
  chain: keyof typeof SUPPORTED_CHAINS = 'ethereum',
  callback: (provider: ethers.JsonRpcProvider) => Promise<T>
): Promise<T> {
  const config = SUPPORTED_CHAINS[chain] || SUPPORTED_CHAINS.ethereum;
  const urls = config.rpcUrls;

  let lastError: unknown = null;

  for (const url of urls) {
    const safeLabel = sanitizeRpcUrl(url);
    try {
      const provider = getOrCreateProvider(config.chainId, url);
      return await withTimeout(callback(provider), RPC_CALL_TIMEOUT_MS, safeLabel);
    } catch (err) {
      lastError = err;
      console.warn(`[rpcTools] RPC ${safeLabel} failed on ${config.name}, falling back to next...`);
    }
  }

  const rawMsg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `All RPC providers exhausted for chain ${String(chain)}. Last error: ${redactSecrets(rawMsg)}`
  );
}

/**
 * Get active cached provider for chain.
 */
export function getProvider(chain: keyof typeof SUPPORTED_CHAINS = 'ethereum'): ethers.JsonRpcProvider {
  const config = SUPPORTED_CHAINS[chain] || SUPPORTED_CHAINS.ethereum;
  return getOrCreateProvider(config.chainId, config.rpcUrls[0]);
}
