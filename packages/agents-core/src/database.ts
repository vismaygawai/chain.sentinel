import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const MAX_PERSISTED_WALLETS = 100;

function resolveDbPath(): string {
  const envPath = process.env.LOCAL_DB_PATH;
  if (envPath) return path.resolve(envPath);
  return path.resolve(__dirname, '../../../apps/api/local_db.json');
}

export interface WalletRecord {
  address: string;
  type: string;
  types?: string[];
  isWhale?: boolean;
  isPosition?: boolean;
}

interface DBData {
  wallets: WalletRecord[];
  positions: unknown[];
  users: unknown[];
}

// Serialize concurrent writes to prevent race conditions and file corruption
let writeQueue: Promise<void> = Promise.resolve();

function withWriteLock<T>(fn: () => T): Promise<T> {
  const result = writeQueue.then(fn, fn);
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function readDB(): DBData {
  const dbPath = resolveDbPath();
  if (!fs.existsSync(dbPath)) {
    return { wallets: [], positions: [], users: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf-8')) as Partial<DBData>;
    return {
      wallets: Array.isArray(parsed.wallets) ? parsed.wallets : [],
      positions: Array.isArray(parsed.positions) ? parsed.positions : [],
      users: Array.isArray(parsed.users) ? parsed.users : [],
    };
  } catch {
    return { wallets: [], positions: [], users: [] };
  }
}

function writeDBAtomic(data: DBData): void {
  const dbPath = resolveDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, dbPath);
}

export const prisma = {
  wallet: {
    findMany: async (): Promise<WalletRecord[]> => {
      const wallets = readDB().wallets;
      const seen = new Set<string>();
      return wallets.filter((w) => {
        const key = w.address?.toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },

    create: async ({ data }: { data: { address: string; type: string } }): Promise<WalletRecord> => {
      return withWriteLock(() => {
        const db = readDB();
        const key = data.address?.toLowerCase();
        if (!key) {
          throw new Error('Wallet address is required');
        }

        const existingIdx = db.wallets.findIndex((w) => w.address?.toLowerCase() === key);

        if (existingIdx >= 0) {
          const existing = db.wallets[existingIdx];
          const existingTypes = new Set(
            Array.isArray(existing.types) ? existing.types : [existing.type].filter(Boolean)
          );
          if (data.type) existingTypes.add(data.type);

          const updated: WalletRecord = {
            ...existing,
            ...data,
            address: key,
            types: Array.from(existingTypes),
            isWhale: existingTypes.has('WHALE') || data.type === 'WHALE' || Boolean(existing.isWhale),
            isPosition: existingTypes.has('POSITION') || data.type === 'POSITION' || Boolean(existing.isPosition),
          };
          db.wallets[existingIdx] = updated;
          writeDBAtomic(db);
          return updated;
        }

        if (db.wallets.length >= MAX_PERSISTED_WALLETS) {
          throw new Error(`Monitored wallet capacity limit (${MAX_PERSISTED_WALLETS}) reached`);
        }

        const types = [data.type].filter(Boolean);
        const created: WalletRecord = {
          address: key,
          type: data.type,
          types,
          isWhale: data.type === 'WHALE',
          isPosition: data.type === 'POSITION',
        };
        db.wallets.push(created);
        writeDBAtomic(db);
        return created;
      });
    },

    deleteMany: async (): Promise<void> => {
      await withWriteLock(() => {
        const db = readDB();
        db.wallets = [];
        writeDBAtomic(db);
      });
    },
  },
  user: {
    count: async (): Promise<number> => readDB().users.length,
  },
};
