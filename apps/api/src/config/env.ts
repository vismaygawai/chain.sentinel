import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamically locate root and workspace .env
const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
  }
}

const nodeEnv = process.env.NODE_ENV || 'development';
const rawPort = Number(process.env.PORT || 3001);
const validatedPort = Number.isInteger(rawPort) && rawPort >= 1 && rawPort <= 65535 ? rawPort : 3001;

// Fail-closed in production if CORS_ORIGIN is not explicitly configured; allow local dev origin by default.
const defaultCorsOrigin = nodeEnv === 'production' ? '' : 'http://localhost:3000,http://127.0.0.1:3000';

export const ENV = {
  PORT: validatedPort,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: nodeEnv,
  RPC_URL: process.env.RPC_URL || process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com',
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  ATP_ENDPOINT: process.env.ATP_ENDPOINT || process.env.ATP_API_URL || 'https://api.atp.network/v1',
  ATP_API_KEY: process.env.ATP_API_KEY || '',
  ATP_AGENT_ID: process.env.ATP_AGENT_ID || 'chain-sentinel-v1',
  CORS_ORIGIN: process.env.CORS_ORIGIN !== undefined ? process.env.CORS_ORIGIN : defaultCorsOrigin,
} as const;

export function parseAllowedOrigins(rawOrigin: string): string[] | '*' | false {
  const trimmed = rawOrigin.trim();
  if (!trimmed) return false;
  if (trimmed === '*') return '*';
  const origins = trimmed
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : false;
}
