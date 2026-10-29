import type { FastifyInstance } from 'fastify';
import type { CompoundAlert } from 'agents-core';
import { alertCorrelator } from 'agents-core';
import type { WebSocket } from 'ws';

type AlertType = 'WHALE' | 'LIQUIDATION' | 'COMPOUND';

interface BroadcastMessage {
    type: AlertType;
    alert: CompoundAlert;
    data?: CompoundAlert;
    timestamp: string;
}

const MAX_REPLAY = 10;
const replayBuffer: BroadcastMessage[] = [];
const connectedClients = new Set<WebSocket>();
let isHookInitialized = false;

function classifyAlertType(alert: CompoundAlert): AlertType {
    if (alert.isCorrelated) return 'COMPOUND';
    if (alert.lsAlert && !alert.wwAlert) return 'LIQUIDATION';
    return 'WHALE';
}

function buildMessage(alert: CompoundAlert): BroadcastMessage {
    const type = classifyAlertType(alert);
    return {
        type,
        alert,
        data: alert,
        timestamp: new Date().toISOString(),
    };
}

function addToReplayBuffer(msg: BroadcastMessage): void {
    replayBuffer.push(msg);
    if (replayBuffer.length > MAX_REPLAY) {
        replayBuffer.shift();
    }
}

function broadcast(msg: BroadcastMessage): void {
    const payload = JSON.stringify(msg);
    for (const client of connectedClients) {
        if (client.readyState === 1) {
            client.send(payload);
        }
    }
}

function replayTo(client: WebSocket): void {
    for (const msg of replayBuffer) {
        client.send(JSON.stringify(msg));
    }
}

export function initCorrelatorHook(): void {
    if (isHookInitialized) return;
    isHookInitialized = true;
    alertCorrelator.onCompoundAlert((alert: any) => {
        const msg = buildMessage(alert);
        addToReplayBuffer(msg);
        broadcast(msg);
    });
}

export async function registerLiveFeed(fastify: FastifyInstance): Promise<void> {
    initCorrelatorHook();

    const handleConnection = (socket: any, _request: any) => {
        connectedClients.add(socket);

        // Instantly replay recent alerts buffer to newly connected client
        try {
            replayTo(socket);
        } catch {
            // Socket might have closed before replay
        }

        socket.isAlive = true;
        socket.on('pong', () => { socket.isAlive = true; });

        socket.on('close', () => connectedClients.delete(socket));
        socket.on('error', () => connectedClients.delete(socket));
    };

    // Periodic heartbeat to evict dead sockets
    const pingInterval = setInterval(() => {
        for (const client of connectedClients) {
            const s = client as any;
            if (s.isAlive === false) {
                connectedClients.delete(client);
                try { client.terminate(); } catch {}
                continue;
            }
            s.isAlive = false;
            try { client.ping(); } catch { connectedClients.delete(client); }
        }
    }, 30000);
    pingInterval.unref?.();

    // @ts-ignore
    fastify.get('/ws/feed', { websocket: true }, handleConnection);
    // @ts-ignore
    fastify.get('/ws', { websocket: true }, handleConnection);
}

export function getClientCount(): number {
    return connectedClients.size;
}

export function getReplayBufferSize(): number {
    return replayBuffer.length;
}
