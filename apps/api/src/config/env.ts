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

export const ENV = {
  PORT: Number(process.env.PORT || 3001),
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  RPC_URL: process.env.RPC_URL || process.env.ETH_RPC_URL || 'https://ethereum.publicnode.com',
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY || '',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  ATP_ENDPOINT: process.env.ATP_ENDPOINT || process.env.ATP_API_URL || 'https://api.atp.network/v1',
  ATP_API_KEY: process.env.ATP_API_KEY || '',
  ATP_AGENT_ID: process.env.ATP_AGENT_ID || 'chain-sentinel-v1',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
} as const;
