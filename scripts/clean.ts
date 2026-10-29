import fs from 'fs';
import path from 'path';

const targets = [
  'dist',
  '.next',
  'apps/api/dist',
  'apps/web/.next',
  'packages/agents-core/dist',
];

for (const target of targets) {
  const fullPath = path.resolve(process.cwd(), target);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Cleaned ${target}`);
    } catch (err) {
      console.warn(`Failed to clean ${target}:`, err);
    }
  }
}
console.log('Build artifacts cleaned successfully.');
