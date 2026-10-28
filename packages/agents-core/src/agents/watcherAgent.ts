import { createAgent } from '../lib/agentFactory.ts';
import { ethers } from 'ethers';
import type { TreasurySnapshot } from '../types.ts';
import { withResilientProvider } from '../tools/rpcTools.ts';
import { getBatchPrices } from '../tools/priceTools.ts';

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

const TOKENS = [
  { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
  { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  { symbol: 'DAI',  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
];

export const watcherAgent = createAgent({
  name: 'watcher_agent',
  instructions: 'You are a blockchain observer. Read treasury balances and return structured data.',
});

export async function watchTreasury(address: string): Promise<TreasurySnapshot> {
  const normalizedAddress = ethers.getAddress(address.toLowerCase());
  const prices = await getBatchPrices(['ETH', ...TOKENS.map((t) => t.symbol)]);

  try {
    return await withResilientProvider('ethereum', async (provider) => {
      const balanceWei = await provider.getBalance(normalizedAddress);
      const balanceEth = Number(ethers.formatEther(balanceWei));
      const ethUsd = balanceEth * (prices.ETH || 2850);

      let totalUsdValue = ethUsd;
      const positions = [{ token: 'ETH', balance: balanceEth, usdValue: ethUsd }];

      const tokenBalances = await Promise.allSettled(
        TOKENS.map(async (token) => {
          const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const rawBalance: bigint = await contract.balanceOf(normalizedAddress);
          const formatted = Number(ethers.formatUnits(rawBalance, token.decimals));
          return { symbol: token.symbol, balance: formatted };
        })
      );

      for (const res of tokenBalances) {
        if (res.status === 'fulfilled' && res.value.balance > 0) {
          const price = prices[res.value.symbol] ?? 1.0;
          const usdValue = res.value.balance * price;
          totalUsdValue += usdValue;
          positions.push({
            token: res.value.symbol,
            balance: res.value.balance,
            usdValue,
          });
        }
      }

      console.log(`[watcherAgent] Scanned ${normalizedAddress}: Total=$${totalUsdValue.toFixed(2)} (${positions.length} assets)`);
      return { address: normalizedAddress, totalUsdValue, positions };
    });
  } catch (err) {
    console.warn(`[watcherAgent] All RPC endpoints unreachable for ${normalizedAddress}:`, err);
    return {
      address: normalizedAddress,
      totalUsdValue: 0,
      positions: [{ token: 'ETH', balance: 0, usdValue: 0 }],
    };
  }
}
