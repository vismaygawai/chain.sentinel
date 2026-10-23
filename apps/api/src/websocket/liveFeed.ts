import type { FastifyInstance } from 'fastify'
import type { CompoundAlert } from '../../../../packages/agents-core/src/types.ts'
import { alertCorrelator } from '../../../../packages/agents-core/src/index.ts'
import type { WebSocket } from 'ws'

type AlertType = 'WHALE' | 'LIQUIDATION' | 'COMPOUND'

interface BroadcastMessage {
    type: AlertType
    alert: CompoundAlert
    timestamp: string
}

const MAX_REPLAY = 10
const replayBuffer: BroadcastMessage[] = []
const connectedClients = new Set<WebSocket>()

function classifyAlertType(alert: CompoundAlert): AlertType {
    if (alert.isCorrelated) return 'COMPOUND'
    if (alert.lsAlert && !alert.wwAlert) return 'LIQUIDATION'
    return 'WHALE'
}

function buildMessage(alert: CompoundAlert): BroadcastMessage {
    return {
        type: classifyAlertType(alert),
        alert,
        timestamp: new Date().toISOString(),
    }
}

function addToReplayBuffer(msg: BroadcastMessage): void {
    replayBuffer.push(msg)
    if (replayBuffer.length > MAX_REPLAY) {
        replayBuffer.shift()
    }
}

function broadcast(msg: BroadcastMessage): void {
    const payload = JSON.stringify(msg)
    for (const client of connectedClients) {
        if (client.readyState === 1) {
            client.send(payload)
        }
    }
}

function replayTo(client: WebSocket): void {
    for (const msg of replayBuffer) {
        client.send(JSON.stringify(msg))
    }
}

export function initCorrelatorHook(): void {
    alertCorrelator.onCompoundAlert((alert: any) => {
        const msg = buildMessage(alert)
        addToReplayBuffer(msg)
        broadcast(msg)
    })
}

export async function registerLiveFeed(fastify: FastifyInstance): Promise<void> {
    initCorrelatorHook()

    const handleConnection = (socket: any, _request: any) => {
        connectedClients.add(socket)
        replayTo(socket)
        socket.on('close', () => connectedClients.delete(socket))
        socket.on('error', () => connectedClients.delete(socket))
    }

    // @ts-ignore
    fastify.get('/ws/feed', { websocket: true }, handleConnection)
    // @ts-ignore
    fastify.get('/ws', { websocket: true }, handleConnection)
}

export function getClientCount(): number {
    return connectedClients.size
}

export function getReplayBufferSize(): number {
    return replayBuffer.length
}
