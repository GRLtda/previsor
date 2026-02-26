'use client'

import { useEffect, useRef, useCallback } from 'react'

const WS_BASE = (process.env.NEXT_PUBLIC_API_USER_BASE_URL || 'http://localhost:3001')
    .replace(/^http/, 'ws')

interface WalletWsOptions {
    /** Access token for JWT auth */
    token: string | null
    /** Called when a new balance is received */
    onBalanceUpdate: (balance: number) => void
    /** Called when any market is updated (optional) */
    onMarketUpdate?: (data: any) => void
    /** Whether the connection should be active */
    enabled: boolean
}

/**
 * React hook for real-time wallet balance updates via WebSocket.
 * Connects to ws://API_BASE/v1/ws?token=<jwt> and listens for BALANCE_UPDATE messages.
 * Auto-reconnects with exponential backoff on disconnect.
 */
export function useWalletWs({ token, onBalanceUpdate, onMarketUpdate, enabled }: WalletWsOptions) {
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const reconnectDelayRef = useRef(1000)
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const enabledRef = useRef(enabled)

    // Keep enabled ref in sync
    enabledRef.current = enabled

    // Stable reference for the callback
    const onBalanceUpdateRef = useRef(onBalanceUpdate)
    onBalanceUpdateRef.current = onBalanceUpdate

    const onMarketUpdateRef = useRef(onMarketUpdate)
    onMarketUpdateRef.current = onMarketUpdate

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
        if (!token || !enabledRef.current) return

        cleanup()

        try {
            const ws = new WebSocket(`${WS_BASE}/v1/ws?token=${token}`)
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
                    if (msg.type === 'BALANCE_UPDATE' && typeof msg.data?.balance === 'number') {
                        console.log('[WS] Received balance update:', msg.data.balance)
                        onBalanceUpdateRef.current(msg.data.balance)
                    } else if (msg.type === 'MARKET_UPDATE' && msg.data?.marketId) {
                        console.log('[WS] Received market update:', msg.data.marketId)
                        // Dispatch a custom event so any component can listen for updates to specific markets
                        const event = new CustomEvent('market-update', { detail: msg.data })
                        document.dispatchEvent(event)

                        // Also call callback if provided
                        if (onMarketUpdateRef.current) {
                            onMarketUpdateRef.current(msg.data)
                        }
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

                // Don't reconnect if intentionally closed or auth error
                if (event.code === 4001 || event.code === 4003 || !enabledRef.current) {
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
    }, [token, cleanup])

    useEffect(() => {
        if (enabled && token) {
            connect()
        } else {
            cleanup()
        }

        return cleanup
    }, [enabled, token, connect, cleanup])
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
