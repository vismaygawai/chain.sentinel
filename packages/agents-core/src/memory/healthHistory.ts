import { getRedisClient, historyKey } from '../redis.ts';
import type { PositionSnapshot } from '../types.ts';

const PIPELINE = 'ls';

export async function append(
    address: string,
    snapshot: PositionSnapshot,
): Promise<void> {
    const redis = getRedisClient();
    const key = historyKey(PIPELINE, address);
    await (redis as any).pipeline()
        .lpush(key, JSON.stringify(snapshot))
        .ltrim(key, 0, 99)
        .exec();
}

export async function getHistory(address: string, count = 100): Promise<PositionSnapshot[]> {
    const redis = getRedisClient();
    const entries = await redis.lrange(historyKey(PIPELINE, address), 0, count - 1);
    return entries.map((entry: string) => JSON.parse(entry) as PositionSnapshot);
}
