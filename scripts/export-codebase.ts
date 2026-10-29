import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.join(ROOT_DIR, 'chain-sentinel-codebase.txt');

// Binary / large auto-generated files to skip
const IGNORED_FILES = new Set([
  'pnpm-lock.yaml',
  'chain-sentinel-codebase.txt',
  'apps/web/public/favicon.ico',
  'apps/web/public/logo-new.png',
  'apps/web/public/logo.png',
  'apps/web/public/logo1.png',
  'apps/web/src/app/favicon.ico',
]);

const IGNORED_EXTENSIONS = new Set([
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.gif',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.lock',
]);

function getTrackedFiles(): string[] {
  const output = execSync('git ls-files', { encoding: 'utf-8' });
  return output
    .split(/\r?\n/)
    .map((f) => f.trim())
    .filter((f) => f.length > 0 && !IGNORED_FILES.has(f) && !IGNORED_EXTENSIONS.has(path.extname(f).toLowerCase()));
}

function run() {
  console.log('Gathering codebase files for Notebook export...');
  const files = getTrackedFiles();
  console.log(`Found ${files.length} source and documentation files.`);

  const chunks: string[] = [];

  chunks.push('================================================================================');
  chunks.push('CHAIN SENTINEL - FULL CODEBASE & SPECIFICATIONS EXPORT');
  chunks.push(`Generated: ${new Date().toISOString()}`);
  chunks.push('Repository: https://github.com/vismaygawai/chain.sentinel');
  chunks.push('Live Web Dashboard: https://chain-sentinel-web.vercel.app/');
  chunks.push('Live API Service: https://chain-sentinel.onrender.com/');
  chunks.push('Team: WWHS? | Hackathon: ELECTROTHON 8.0');
  chunks.push('================================================================================\n');

  chunks.push('TABLE OF CONTENTS & FILE INDEX:');
  chunks.push('--------------------------------------------------------------------------------');
  files.forEach((file, idx) => {
    chunks.push(`${(idx + 1).toString().padStart(3, ' ')}. ${file}`);
  });
  chunks.push('--------------------------------------------------------------------------------\n\n');

  let totalLines = 0;

  for (const relativePath of files) {
    const fullPath = path.join(ROOT_DIR, relativePath);
    if (!fs.existsSync(fullPath)) continue;

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split(/\r?\n/).length;
      totalLines += lines;

      chunks.push('================================================================================');
      chunks.push(`FILE: ${relativePath} (${lines} lines)`);
      chunks.push('================================================================================');
      chunks.push(content);
      chunks.push('\n');
    } catch (err) {
      console.warn(`Could not read file: ${relativePath}`, err);
    }
  }

  const result = chunks.join('\n');
  fs.writeFileSync(OUTPUT_FILE, result, 'utf-8');

  const stats = fs.statSync(OUTPUT_FILE);
  const sizeKb = (stats.size / 1024).toFixed(2);
  console.log(`\nSuccessfully exported full codebase to: ${OUTPUT_FILE}`);
  console.log(`Total files: ${files.length}`);
  console.log(`Total lines of code/docs: ${totalLines}`);
  console.log(`Total file size: ${sizeKb} KB`);
}

run();
