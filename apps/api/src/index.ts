import { isAddress } from 'ethers';
import { ENV } from './config/env.ts';
import { buildServer } from './server.ts';
import {
  watchWalletWorkflow,
  scanPositionWorkflow,
  prisma,
} from 'agents-core';

const start = async () => {
  try {
    const server = await buildServer();

    await server.listen({
      port: ENV.PORT,
      host: ENV.HOST,
    });

    console.log(`\n========================================================`);
    console.log(`🛡️  CHAIN SENTINEL API RUNNING ON http://localhost:${ENV.PORT}`);
    console.log(`📡 WebSocket Live Feed on ws://localhost:${ENV.PORT}/ws`);
    console.log(`========================================================\n`);

    // Start Autonomous Multi-Agent Workflows
    console.log('[ChainSentinel] Starting autonomous background workflows...');
    watchWalletWorkflow.startWorkflow();
    const stopPositionScan = scanPositionWorkflow.startWorkflow();

    // Sync tracked addresses from persistent local store
    try {
      const dbWallets = await prisma.wallet.findMany();
      for (const wallet of dbWallets) {
        if (isAddress(wallet.address)) {
          const isWhaleTarget =
            wallet.isWhale ||
            wallet.type === 'WHALE' ||
            wallet.type === 'CEX_EXCHANGE' ||
            wallet.type === 'DAO_TREASURY' ||
            wallet.types?.includes('WHALE');
          const isPositionTarget =
            wallet.isPosition ||
            wallet.type === 'POSITION' ||
            wallet.type === 'WHALE_BORROWER' ||
            wallet.types?.includes('POSITION');

          if (isWhaleTarget) {
            await watchWalletWorkflow.registerWallet(wallet.address);
          }
          if (isPositionTarget) {
            await scanPositionWorkflow.registerPosition(wallet.address);
          }
        }
      }
      console.log(`[ChainSentinel] Synced ${dbWallets.length} wallets into active monitoring.`);
    } catch {
      console.log('[ChainSentinel] Persistence store initialized in memory mode.');
    }

    // Graceful Shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`\nReceived ${signal}. Gracefully stopping Chain Sentinel server...`);
        stopPositionScan?.();
        await server.close();
        process.exit(0);
      });
    }
  } catch (err) {
    console.error('Fatal Server Error:', err);
    process.exit(1);
  }
};

start();
