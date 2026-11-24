import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { CompoundAlert } from 'agents-core';
import { alertCorrelator } from 'agents-core';
import type { WebSocket } from 'ws';
import { ENV, parseAllowedOrigins } from '../config/env.ts';

type AlertType = 'WHALE' | 'LIQUIDATION' | 'COMPOUND';

interface BroadcastMessage {
  type: AlertType;
  alert: CompoundAlert;
  data?: CompoundAlert;
  timestamp: string;
}

interface TrackedSocket extends WebSocket {
  isAlive?: boolean;
}

const MAX_REPLAY = 10;
const MAX_WS_CLIENTS = 100;
const replayBuffer: BroadcastMessage[] = [];
const connectedClients = new Set<TrackedSocket>();
let isHookInitialized = false;
let pingInterval: NodeJS.Timeout | null = null;

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

function isOriginAllowed(originHeader: string | undefined): boolean {
  const allowed = parseAllowedOrigins(ENV.CORS_ORIGIN);
  if (allowed === '*') return true;
  if (!originHeader) {
    // Allow non-browser / CLI clients only in non-production, or require match when Origin is sent
    return ENV.NODE_ENV !== 'production';
  }
  if (allowed === false) return false;
  return allowed.includes(originHeader);
}

export function initCorrelatorHook(): void {
  if (isHookInitialized) return;
  isHookInitialized = true;
  alertCorrelator.onCompoundAlert((alert: CompoundAlert) => {
    const msg = buildMessage(alert);
    addToReplayBuffer(msg);
    broadcast(msg);
  });
}

export async function registerLiveFeed(fastify: FastifyInstance): Promise<void> {
  initCorrelatorHook();

  const handleConnection = (socket: WebSocket, request: FastifyRequest) => {
    const origin = typeof request.headers.origin === 'string' ? request.headers.origin : undefined;
    if (!isOriginAllowed(origin)) {
      socket.close(1008, 'Origin not allowed');
      return;
    }

    if (connectedClients.size >= MAX_WS_CLIENTS) {
      socket.close(1013, 'Server connection capacity reached');
      return;
    }

    const tracked = socket as TrackedSocket;
    connectedClients.add(tracked);

    // Instantly replay recent alerts buffer to newly connected client
    try {
      replayTo(tracked);
    } catch {
      // Socket might have closed before replay
    }

    tracked.isAlive = true;
    tracked.on('pong', () => {
      tracked.isAlive = true;
    });

    tracked.on('close', () => connectedClients.delete(tracked));
    tracked.on('error', () => connectedClients.delete(tracked));
  };

  if (pingInterval) {
    clearInterval(pingInterval);
  }

  // Periodic heartbeat to evict dead sockets
  pingInterval = setInterval(() => {
    for (const client of connectedClients) {
      if (client.isAlive === false) {
        connectedClients.delete(client);
        try {
          client.terminate();
        } catch {
          // ignore
        }
        continue;
      }
      client.isAlive = false;
      try {
        client.ping();
      } catch {
        connectedClients.delete(client);
      }
    }
  }, 30_000);
  pingInterval.unref?.();

  fastify.get('/ws/feed', { websocket: true }, handleConnection);
  fastify.get('/ws', { websocket: true }, handleConnection);

  fastify.addHook('onClose', async () => {
    closeLiveFeed();
  });
}

export function closeLiveFeed(): void {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  for (const client of connectedClients) {
    try {
      client.close(1001, 'Server shutting down');
    } catch {
      // ignore
    }
  }
  connectedClients.clear();
}

export function getClientCount(): number {
  return connectedClients.size;
}

export function getReplayBufferSize(): number {
  return replayBuffer.length;
}
