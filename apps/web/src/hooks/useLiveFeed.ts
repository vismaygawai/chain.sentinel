'use client'

import { useEffect, useState, useRef } from 'react'
import type { CompoundAlert } from '@/types'

function resolveWsUrl(): string {
    if (process.env.NEXT_PUBLIC_WS_URL) {
        return process.env.NEXT_PUBLIC_WS_URL
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    return apiBase.replace(/^http(s?):\/\//, 'ws$1://').replace(/\/$/, '') + '/ws/feed'
}

const WS_URL = resolveWsUrl()
const VALID_URGENCIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

function isValidCompoundAlert(val: unknown): val is CompoundAlert {
    if (!val || typeof val !== 'object') return false
    const record = val as Record<string, unknown>
    return (
        typeof record.walletAddress === 'string' &&
        record.walletAddress.length > 0 &&
        typeof record.isCorrelated === 'boolean' &&
        typeof record.combinedUrgency === 'string' &&
        VALID_URGENCIES.has(record.combinedUrgency)
    )
}

export function useLiveFeed() {
    const [alerts, setAlerts] = useState<CompoundAlert[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const ws = useRef<WebSocket | null>(null)
    const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        function connect() {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current)
                reconnectTimeout.current = null
            }

            ws.current = new WebSocket(WS_URL)

            ws.current.onopen = () => {
                setIsConnected(true)
            }

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as { alert?: unknown }
                    if (isValidCompoundAlert(data.alert)) {
                        const incoming = data.alert
                        setAlerts((prev) => {
                            const incomingTx = incoming.wwAlert?.txHash
                            if (incoming.isCorrelated) {
                                const filtered = prev.filter(
                                    (a) =>
                                        !(incomingTx && a.wwAlert?.txHash === incomingTx) &&
                                        !(a.walletAddress?.toLowerCase() === incoming.walletAddress.toLowerCase() && !a.isCorrelated)
                                )
                                return [incoming, ...filtered].slice(0, 50)
                            }

                            if (incomingTx) {
                                const exists = prev.some((a) => a.wwAlert?.txHash === incomingTx)
                                if (exists) return prev
                            }

                            const incomingLsTs = incoming.lsAlert?.timestamp
                            if (incoming.lsAlert && !incoming.wwAlert && incomingLsTs) {
                                const exists = prev.some(
                                    (a) =>
                                        a.walletAddress?.toLowerCase() === incoming.walletAddress.toLowerCase() &&
                                        a.lsAlert?.timestamp === incomingLsTs
                                )
                                if (exists) return prev
                            }

                            return [incoming, ...prev].slice(0, 50)
                        })
                    }
                } catch (err) {
                    console.error('[useLiveFeed] Message error:', err)
                }
            }

            ws.current.onclose = () => {
                setIsConnected(false)
                reconnectTimeout.current = setTimeout(connect, 5000)
            }

            ws.current.onerror = () => {
                if (ws.current?.readyState !== WebSocket.OPEN) {
                    console.warn('[useLiveFeed] WebSocket connection failed. Retrying...')
                }
                ws.current?.close()
            }
        }

        connect()

        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current)
                reconnectTimeout.current = null
            }
            if (ws.current) {
                ws.current.onclose = null
                ws.current.close()
            }
        }
    }, [])

    return { alerts, isConnected }
}
