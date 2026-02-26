'use client'

import { useEffect, useRef, useCallback } from 'react'

const WS_BASE = (process.env.NEXT_PUBLIC_API_USER_BASE_URL || 'http://localhost:3001')
    .replace(/^http/, 'ws')

interface MarketWsOptions {
    /** Whether the connection should be active */
    enabled: boolean
}

/**
 * React hook for real-time public market updates via WebSocket.
 * Connects to ws://API_BASE/v1/ws/market without auth and listens for MARKET_UPDATE and ACTIVITY_UPDATE.
 * Auto-reconnects with exponential backoff on disconnect.
 */
export function useMarketWs({ enabled }: MarketWsOptions) {
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const reconnectDelayRef = useRef(1000)
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const enabledRef = useRef(enabled)

    // Keep enabled ref in sync
    enabledRef.current = enabled

    const cleanup = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current)
            pingIntervalRef.current = null
        }
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
    }, [])

    const connect = useCallback(() => {
        if (!enabledRef.current) return

        cleanup()

        try {
            const ws = new WebSocket(`${WS_BASE}/v1/ws/market`)
            wsRef.current = ws

            ws.onopen = () => {
                // Reset reconnect delay on successful connection
                reconnectDelayRef.current = 1000

                // Start keepalive ping every 30s
                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'PING' }))
                    }
                }, 30000)
            }

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data)

                    if (msg.type === 'MARKET_UPDATE' && msg.data?.marketId) {
                        // Dispatch a custom event so any component can listen for updates to specific markets
                        const customEvent = new CustomEvent('market-update', { detail: msg.data })
                        document.dispatchEvent(customEvent)
                    } else if (msg.type === 'ACTIVITY_UPDATE' && msg.data?.id) {
                        // Dispatch a custom event for new activities
                        const customEvent = new CustomEvent('activity-update', { detail: msg.data })
                        document.dispatchEvent(customEvent)
                    }
                } catch {
                    // Ignore malformed messages
                }
            }

            ws.onclose = (event) => {
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current)
                    pingIntervalRef.current = null
                }

                if (!enabledRef.current) {
                    return
                }

                // Exponential backoff reconnect: 1s -> 2s -> 4s -> 8s -> ... -> max 30s
                const delay = reconnectDelayRef.current
                reconnectDelayRef.current = Math.min(delay * 2, 30000)

                reconnectTimeoutRef.current = setTimeout(() => {
                    if (enabledRef.current) {
                        connect()
                    }
                }, delay)
            }

            ws.onerror = () => {
                // onclose will handle reconnection
            }
        } catch {
            // Connection failed, will retry via onclose logic
        }
    }, [cleanup])

    useEffect(() => {
        if (enabled) {
            connect()
        } else {
            cleanup()
        }

        return cleanup
    }, [enabled, connect, cleanup])
}

/**
 * Hook to listen for real-time updates for a specific market
 */
export function useMarketRealTime(marketId: string | undefined, onUpdate: (data: any) => void) {
    useEffect(() => {
        if (!marketId) return

        const handleUpdate = (event: Event) => {
            const customEvent = event as CustomEvent
            if (customEvent.detail.marketId === marketId) {
                onUpdate(customEvent.detail)
            }
        }

        document.addEventListener('market-update', handleUpdate)
        return () => document.removeEventListener('market-update', handleUpdate)
    }, [marketId, onUpdate])
}

/**
 * Hook to listen for real-time activity updates globally
 */
export function useActivityRealTime(onUpdate: (data: any) => void) {
    useEffect(() => {
        const handleUpdate = (event: Event) => {
            const customEvent = event as CustomEvent
            onUpdate(customEvent.detail)
        }

        document.addEventListener('activity-update', handleUpdate)
        return () => document.removeEventListener('activity-update', handleUpdate)
    }, [onUpdate])
}
