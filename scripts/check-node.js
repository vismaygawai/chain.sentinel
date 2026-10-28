#!/usr/bin/env node
/* Check Node.js major version and pnpm user agent during install/build
   Exits non-zero if Node major < 20 to fail fast on incompatible builders.
*/
import { execSync } from 'node:child_process';

const major = Number(process.versions.node.split('.')[0]);
if (Number.isNaN(major)) {
  console.error('Unable to determine Node version:', process.version);
  process.exit(1);
}
if (major < 20) {
  console.error(`Unsupported Node.js version ${process.version}. Node >= 20 is required.`);
  console.error('Please set your platform/build Node version to 24.x (e.g., Vercel Project Settings → Node.js Version).');
  process.exit(1);
}

// Check for pnpm as the package manager (best-effort):
const ua = process.env.npm_config_user_agent || '';
if (!ua.includes('pnpm')) {
  console.warn('Warning: pnpm not detected in npm_config_user_agent. Build may still work if pnpm is installed.');
}

console.log(`Node.js check passed: ${process.version}`);
try {
  const pnpmV = execSync('pnpm -v', { stdio: 'pipe' }).toString().trim();
  console.log(`pnpm detected: ${pnpmV}`);
} catch {
  // non-fatal
}
