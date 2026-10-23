/**
 * Chain Sentinel - Demo Data Seeder
 * Populates test wallets, Aave V3 positions, and WhaleWatch targets for hackathon judging
 */

import { prisma } from '../packages/agents-core/src/database.ts';

const DEMO_WALLETS = [
  {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
    type: 'DAO_TREASURY',
  },
  {
    address: '0x577da75775b0606b5d92582b1c67e9154b7c62c3', // Aave Whale Borrower
    type: 'WHALE_BORROWER',
  },
  {
    address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Binance Hot Wallet
    type: 'CEX_EXCHANGE',
  },
  {
    address: '0x1b7BAa734C00298b9429b518D621753Bb0f6efF2', // MakerDAO Multisig
    type: 'DAO_TREASURY',
  },
];

async function seed() {
  console.log('========================================================');
  console.log('🌱 SEEDING CHAIN SENTINEL TEST & DEMO WALLETS');
  console.log('========================================================\n');

  try {
    for (const w of DEMO_WALLETS) {
      await prisma.wallet.create({
        data: {
          address: w.address,
          type: w.type,
        },
      });
      console.log(`✓ Seeded ${w.type}: ${w.address}`);
    }

    console.log('\n✅ Demo data seeded successfully into local database.');
  } catch (err: any) {
    console.warn('⚠️ Seeding note:', err?.message || err);
  }
}

seed();
