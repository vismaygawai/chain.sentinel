import { EventEmitter } from 'events';

class LocalRedisMock extends EventEmitter {
    private storage: Map<string, any> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map();

    async set(key: string, value: any, mode?: string, duration?: number, flag?: string) {
        if (flag === 'NX' && this.storage.has(key)) {
            return null;
        }
        if (flag === 'XX' && !this.storage.has(key)) {
            return null;
        }
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key)!);
            this.timers.delete(key);
        }
        this.storage.set(key, value);
        if ((mode === 'EX' || mode === 'PX') && duration) {
            const ttl = mode === 'EX' ? duration * 1000 : duration;
            const timer = setTimeout(() => {
                this.storage.delete(key);
                this.timers.delete(key);
            }, ttl);
            timer.unref?.();
            this.timers.set(key, timer);
        }
        return 'OK';
    }

    async get(key: string) {
        return this.storage.get(key) || null;
    }

    async exists(key: string) {
        return this.storage.has(key) ? 1 : 0;
    }

    async del(...keys: string[]) {
        let count = 0;
        for (const k of keys) {
            if (this.timers.has(k)) {
                clearTimeout(this.timers.get(k)!);
                this.timers.delete(k);
            }
            if (this.storage.delete(k)) {
                count++;
            }
        }
        return count;
    }

    async lpush(key: string, ...values: string[]) {
        const list = this.storage.get(key) || [];
        list.unshift(...values);
        this.storage.set(key, list);
        return list.length;
    }

    async lrange(key: string, start: number, stop: number) {
        const list = this.storage.get(key) || [];
        if (stop === -1) return list.slice(start);
        return list.slice(start, stop + 1);
    }

    async keys(pattern: string) {
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
        const regex = new RegExp(`^${escaped}$`);
        return Array.from(this.storage.keys()).filter(k => regex.test(k));
    }

    pipeline() {
        const queue: Array<() => Promise<any> | any> = [];
        const pipe = {
            lpush: (key: string, val: string) => {
                queue.push(() => this.lpush(key, val));
                return pipe;
            },
            ltrim: (key: string, start: number, stop: number) => {
                queue.push(() => {
                    const list = this.storage.get(key) || [];
                    this.storage.set(key, list.slice(start, stop + 1));
                });
                return pipe;
            },
            set: (key: string, value: any, mode?: string, duration?: number, flag?: string) => {
                queue.push(() => this.set(key, value, mode, duration, flag));
                return pipe;
            },
            del: (...keys: string[]) => {
                queue.push(() => this.del(...keys));
                return pipe;
            },
            exec: async () => {
                const results = [];
                for (const op of queue) {
                    results.push(await op());
                }
                return results;
            },
        };
        return pipe as any;
    }

    async quit() {
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
        this.storage.clear();
        return 'OK';
    }
}

let instance: LocalRedisMock | null = null;

export const getRedisClient = () => {
    if (!instance) {
        instance = new LocalRedisMock();
        console.log("⚡ [Shim] Local In-Memory Redis initialized");
    }
    return instance;
};

export const historyKey = (pipeline: string, address: string) => `hist:${pipeline}:${address}`;
export const cooldownKey = (pipeline: string, address: string) => `cd:${pipeline}:${address}`;
