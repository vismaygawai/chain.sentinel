import { createAgent } from '../lib/agentFactory.ts';
import { ethers } from 'ethers';
import type { TreasurySnapshot } from '../types.ts';

const PUBLIC_RPCS = [
  ...(process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== 'your_alchemy_api_key_here'
    ? [`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`]
    : []),
  process.env.RPC_URL || 'https://ethereum.publicnode.com',
  'https://eth.llamarpc.com',
  'https://cloudflare-eth.com',
  'https://rpc.ankr.com/eth',
];

export const watcherAgent = createAgent({
  name: 'watcher_agent',
  instructions: 'You are a blockchain observer. Read treasury balances and return structured data.',
});

export async function watchTreasury(address: string): Promise<TreasurySnapshot> {
  const normalizedAddress = ethers.getAddress(address.toLowerCase());
  const ethPrice = 2850;

  const TOKENS = [
    { symbol: 'USDT', address: ethers.getAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7'), decimals: 6 },
    { symbol: 'USDC', address: ethers.getAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), decimals: 6 },
    { symbol: 'DAI',  address: ethers.getAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F'), decimals: 18 },
    { symbol: 'WBTC', address: ethers.getAddress('0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'), decimals: 8 },
  ];

  for (const rpcUrl of PUBLIC_RPCS) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const balanceWei = await provider.getBalance(normalizedAddress);
      const balanceEth = Number(ethers.formatEther(balanceWei));

      let totalUsdValue = balanceEth * ethPrice;
      const positions = [
        {
          token: 'ETH',
          balance: balanceEth,
          usdValue: balanceEth * ethPrice,
        },
      ];

      for (const token of TOKENS) {
        try {
          const abi = ['function balanceOf(address) view returns (uint256)'];
          const contract = new ethers.Contract(token.address, abi, provider);
          const balance: bigint = await (contract as any).balanceOf(normalizedAddress);
          const formattedBalance = Number(ethers.formatUnits(balance, token.decimals));
          if (formattedBalance > 0) {
            const usdValue = token.symbol === 'WBTC' ? formattedBalance * 65000 : formattedBalance;
            totalUsdValue += usdValue;
            positions.push({
              token: token.symbol,
              balance: formattedBalance,
              usdValue: usdValue,
            });
          }
        } catch {
          // Ignore individual token RPC errors
        }
      }

      console.log(`[watcherAgent] Scanned ${normalizedAddress}: Total=$${totalUsdValue.toFixed(2)} (${positions.length} assets)`);

      return {
        address: normalizedAddress,
        totalUsdValue,
        positions,
      };
    } catch {
      // Try next RPC provider
      continue;
    }
  }

  // If all RPC providers failed, return zero-balance snapshot
  console.warn(`[watcherAgent] All RPC endpoints unreachable for ${normalizedAddress}`);
  return {
    address: normalizedAddress,
    totalUsdValue: 0,
    positions: [
      {
        token: 'ETH',
        balance: 0,
        usdValue: 0,
      },
    ],
  };
}
