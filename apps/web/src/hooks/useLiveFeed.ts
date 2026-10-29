'use client'

import { useEffect, useState, useRef } from 'react'
import type { CompoundAlert } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/feed'

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
                console.log('[useLiveFeed] Connected to WebSocket')
                setIsConnected(true)
            }

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    // Broadcast format: { type: "WHALE"|"LIQUIDATION"|"COMPOUND", alert: {...}, timestamp: ISO }
                    if (data.alert) {
                        setAlerts((prev) => {
                            const incoming = data.alert as CompoundAlert;
                            const incomingTx = incoming.wwAlert?.txHash;
                            // If incoming is a correlated compound alert, upgrade any existing alert for this address or txHash
                            if (incoming.isCorrelated) {
                                const filtered = prev.filter(a =>
                                    !(incomingTx && a.wwAlert?.txHash === incomingTx) &&
                                    !(a.walletAddress?.toLowerCase() === incoming.walletAddress?.toLowerCase() && !a.isCorrelated)
                                );
                                return [incoming, ...filtered].slice(0, 50);
                            }

                            // If incoming has a txHash, check if that exact transaction was already alerted
                            if (incomingTx) {
                                const exists = prev.some(a => a.wwAlert?.txHash === incomingTx);
                                if (exists) return prev;
                            }

                            // If incoming is a pure liquidation snapshot, deduplicate by address and timestamp
                            const incomingLsTs = incoming.lsAlert?.timestamp;
                            if (incoming.lsAlert && !incoming.wwAlert && incomingLsTs) {
                                const exists = prev.some(a =>
                                    a.walletAddress?.toLowerCase() === incoming.walletAddress?.toLowerCase() &&
                                    a.lsAlert?.timestamp === incomingLsTs
                                );
                                if (exists) return prev;
                            }

                            return [incoming, ...prev].slice(0, 50);
                        })
                    }
                } catch (err) {
                    console.error('[useLiveFeed] Message error:', err)
                }
            }

            ws.current.onclose = () => {
                console.log('[useLiveFeed] Disconnected')
                setIsConnected(false)
                // Attempt reconnect after 5s
                reconnectTimeout.current = setTimeout(connect, 5000)
            }

            ws.current.onerror = () => {
                // Only log error if we haven't successfully connected yet 
                // or if it's a persistent failure.
                if (ws.current?.readyState !== WebSocket.OPEN) {
                    console.warn('[useLiveFeed] WebSocket connection failed. Retrying...');
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
