/**
 * Chain Sentinel Monorepo Build Runner
 * Compiles and builds agents-core, apps/api, and apps/web
 */

import { execSync } from 'child_process';
import path from 'path';

console.log('========================================================');
console.log('🛡️  CHAIN SENTINEL - PRODUCTION MONOREPO BUILD RUNNER');
console.log('========================================================\n');

const ROOT_DIR = process.cwd();

function runCommand(command: string, stepName: string) {
  console.log(`[Step] ${stepName}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: ROOT_DIR });
    console.log(`✓ ${stepName} completed successfully.\n`);
  } catch (error) {
    console.error(`❌ ${stepName} failed:`, error);
    process.exit(1);
  }
}

// 1. Typecheck & Test Agents Core
runCommand('pnpm --filter agents-core test', 'Testing Agents Core ADK Engine');

// 2. Typecheck Fastify API Service
runCommand('pnpm --filter api exec tsc --noEmit', 'Validating Fastify API TypeScript');

// 3. Build Next.js 16 Web Operations Dashboard
runCommand('pnpm --filter web build', 'Building Next.js 16 Web Dashboard');

console.log('========================================================');
console.log('🎉 ALL MONOREPO PACKAGES COMPILED & READY FOR PRODUCTION');
console.log('========================================================');
