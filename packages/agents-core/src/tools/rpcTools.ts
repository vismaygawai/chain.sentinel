import { ethers } from 'ethers';

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrls: string[];
}

export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrls: [
      ...(process.env.ALCHEMY_API_KEY &&
      !process.env.ALCHEMY_API_KEY.includes('your_alchemy')
        ? [`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`]
        : []),
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

/**
 * Resilient JSON-RPC Provider Failover
 * Attempts queries through ordered pool of public and private RPC endpoints
 */
export async function withResilientProvider<T>(
  chain: keyof typeof SUPPORTED_CHAINS = 'ethereum',
  callback: (provider: ethers.JsonRpcProvider) => Promise<T>
): Promise<T> {
  const config = SUPPORTED_CHAINS[chain] || SUPPORTED_CHAINS.ethereum;
  const urls = config.rpcUrls;

  let lastError: any = null;

  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url, undefined, {
        staticNetwork: ethers.Network.from(config.chainId),
      });

      // Quick liveness test or direct callback execution
      const result = await callback(provider);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(`[rpcTools] RPC ${sanitizeRpcUrl(url)} failed on ${config.name}, falling back to next...`);
    }
  }

  throw new Error(
    `All RPC providers exhausted for chain ${String(chain)}. Last error: ${String(lastError?.message || lastError)}`
  );
}

/**
 * Get active provider for chain
 */
export function getProvider(chain: keyof typeof SUPPORTED_CHAINS = 'ethereum'): ethers.JsonRpcProvider {
  const config = SUPPORTED_CHAINS[chain] || SUPPORTED_CHAINS.ethereum;
  const primaryUrl = config.rpcUrls[0];
  return new ethers.JsonRpcProvider(primaryUrl, undefined, {
    staticNetwork: ethers.Network.from(config.chainId),
  });
}
