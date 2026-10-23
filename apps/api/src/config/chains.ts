export interface ChainDefinition {
  chainId: number;
  name: string;
  nativeCurrency: string;
  rpcUrl: string;
  aaveV3Pool?: string;
  blockExplorer: string;
}

export const CHAINS: Record<string, ChainDefinition> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    nativeCurrency: 'ETH',
    rpcUrl: process.env.RPC_URL || 'https://ethereum.publicnode.com',
    aaveV3Pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
    blockExplorer: 'https://etherscan.io',
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    nativeCurrency: 'ETH',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    aaveV3Pool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
    blockExplorer: 'https://arbiscan.io',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    nativeCurrency: 'ETH',
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    aaveV3Pool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
};
