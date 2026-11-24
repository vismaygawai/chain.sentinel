import { execSync } from 'node:child_process';

interface BuildStep {
  name: string;
  command: string;
}

const steps: BuildStep[] = [
  { name: 'Typecheck agents-core', command: 'pnpm --filter agents-core exec tsc --noEmit' },
  { name: 'Typecheck api', command: 'pnpm --filter api exec tsc --noEmit' },
  { name: 'Typecheck web', command: 'pnpm --filter web exec tsc --noEmit' },
  { name: 'Build web dashboard', command: 'pnpm --filter web build' },
];

for (const step of steps) {
  console.log(`\n==> [build-all] ${step.name}...`);
  execSync(step.command, { stdio: 'inherit' });
}

console.log('\n==> [build-all] Monorepo build completed successfully.');
