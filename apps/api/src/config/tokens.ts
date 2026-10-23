export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
}

export const MONITORED_TOKENS: TokenInfo[] = [
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
];
