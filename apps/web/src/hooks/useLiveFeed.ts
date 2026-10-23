
'use client'

import { useEffect, useState, useRef } from 'react'
import type { CompoundAlert } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws/feed'

export function useLiveFeed() {
    const [alerts, setAlerts] = useState<CompoundAlert[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const ws = useRef<WebSocket | null>(null)

    useEffect(() => {
        function connect() {
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
                            // Check for duplicates (by txHash or txHash + address)
                            const isDuplicate = prev.some(a => 
                                (a.wwAlert?.txHash && a.wwAlert?.txHash === data.alert.wwAlert?.txHash) ||
                                (a.walletAddress === data.alert.walletAddress && 
                                 JSON.stringify(a.lsAlert) === JSON.stringify(data.alert.lsAlert))
                            )
                            if (isDuplicate) return prev
                            return [data.alert, ...prev].slice(0, 50)
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
                setTimeout(connect, 5000)
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
            if (ws.current) {
                ws.current.onclose = null
                ws.current.close()
            }
        }
    }, [])

    return { alerts, isConnected }
}
