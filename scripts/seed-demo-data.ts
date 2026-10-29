/**
 * Chain Sentinel - Demo Data Seeder
 * Populates test wallets, Aave V3 positions, and WhaleWatch targets for hackathon judging
 */

import { prisma } from '../packages/agents-core/src/database.ts';

const DEMO_WALLETS: Array<{ address: string; type: string }> = process.env.SEED_DEMO_WALLETS
  ? JSON.parse(process.env.SEED_DEMO_WALLETS)
  : [];

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
