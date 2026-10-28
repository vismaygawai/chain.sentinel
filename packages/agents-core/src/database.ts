import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../../apps/api/local_db.json');

interface DBData {
  wallets: any[];
  positions: any[];
  users: any[];
}

function readDB(): DBData {
  if (!fs.existsSync(DB_PATH)) {
    return { wallets: [], positions: [], users: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { wallets: [], positions: [], users: [] };
  }
}

function writeDB(data: DBData) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch {
    // Ignore in-memory fallback
  }
}

export const prisma = {
  wallet: {
    findMany: async () => {
      const wallets = readDB().wallets || [];
      const seen = new Set<string>();
      return wallets.filter((w: any) => {
        const key = w.address?.toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    create: async ({ data }: any) => {
      const db = readDB();
      if (!db.wallets) db.wallets = [];
      const existingIdx = db.wallets.findIndex(
        (w: any) => w.address?.toLowerCase() === data.address?.toLowerCase()
      );
      if (existingIdx >= 0) {
        db.wallets[existingIdx] = { ...db.wallets[existingIdx], ...data };
      } else {
        db.wallets.push(data);
      }
      writeDB(db);
      return data;
    },
    deleteMany: async () => {
      const db = readDB();
      db.wallets = [];
      writeDB(db);
    },
  },
  user: {
    count: async () => (readDB().users || []).length,
  },
} as any;
