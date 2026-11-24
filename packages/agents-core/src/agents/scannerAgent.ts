import { createAgent } from '../lib/agentFactory.ts';
import type { WhaleScanResult } from '../types.ts';
import * as walletTools from '../tools/walletTools.ts';

const MIN_USD_THRESHOLD = 500_000;

export type ScannerEventHandler = (result: WhaleScanResult) => void;
let eventHandler: ScannerEventHandler | null = null;

export function onLargeTransaction(handler: ScannerEventHandler): void {
  eventHandler = handler;
}

export function startScanner(): () => void {
  return walletTools.subscribeToLargeTransactions(MIN_USD_THRESHOLD, (tx) => {
    if (eventHandler) {
      eventHandler(tx);
    }
  });
}

export const scannerAgent = createAgent({
  name: 'ww_scanner',
  instructions:
    'You are the WhaleWatch Scanner Agent. Monitor Ethereum mainnet blocks via Alchemy alchemy_getAssetTransfers for large transfers exceeding $500,000 USD and emit a WhaleScanResult for every qualifying transaction.',
  tools: [walletTools.subscribeToLargeTransactions, walletTools.fetchRecentTransactions],
});
