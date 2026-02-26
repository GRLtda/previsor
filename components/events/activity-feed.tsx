'use client'

import { useState, useEffect, useCallback } from 'react'
import { userApi } from '@/lib/api/client'
import type { ActivityItem } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { useActivityRealTime } from '@/hooks/use-market-ws'

interface ActivityFeedProps {
    eventId: string
}

function timeAgo(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'agora'
    if (diffMin < 60) return `há ${diffMin} min`
    if (diffHour < 24) return `há ${diffHour}h`
    if (diffDay < 30) return `há ${diffDay}d`
    return `há ${Math.floor(diffDay / 30)} meses`
}

function formatCurrency(centavos: number): string {
    return `R$${(centavos / 100).toFixed(2)}`
}

export function ActivityFeed({ eventId }: ActivityFeedProps) {
    const [items, setItems] = useState<ActivityItem[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [offset, setOffset] = useState(0)
    const LIMIT = 20

    const loadActivity = useCallback(async (currentOffset: number, append = false) => {
        try {
            const response = await userApi.getEventActivity(eventId, { limit: LIMIT, offset: currentOffset })
            if (response.success && response.data) {
                if (append) {
                    setItems(prev => [...prev, ...response.data.activity])
                } else {
                    setItems(response.data.activity)
                }
                setTotal(response.data.total)
            }
        } catch {
            // silently fail — activity is non-critical
        }
    }, [eventId])

    useEffect(() => {
        setLoading(true)
        loadActivity(0).finally(() => setLoading(false))
    }, [loadActivity])

    useActivityRealTime((newActivity) => {
        if (newActivity.eventId === eventId) {
            setItems(prev => {
                if (prev.some(item => item.id === newActivity.id)) return prev
                return [newActivity, ...prev]
            })
            setTotal(prev => prev + 1)
        }
    })

    const handleLoadMore = async () => {
        const newOffset = offset + LIMIT
        setOffset(newOffset)
        setLoadingMore(true)
        await loadActivity(newOffset, true)
        setLoadingMore(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
                <p>Nenhuma atividade recente</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="border-b border-black/5 dark:border-white/5"
                >
                    <div className="flex justify-between px-0 py-4 text-sm font-medium lg:flex-row lg:items-center">
                        <div className="flex items-center gap-x-3">
                            {/* Avatar */}
                            <div className="flex size-[40px] min-w-[40px] items-center justify-center rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                {item.user.avatarUrl ? (
                                    <img
                                        src={item.user.avatarUrl}
                                        alt={item.user.firstName}
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-bold">
                                        {item.user.firstName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-col">
                                <p className="flex flex-col items-start gap-x-1 text-[13px] font-medium dark:text-white lg:items-start lg:text-sm">
                                    <span className="flex items-center gap-1 flex-wrap">
                                        <span className="font-semibold">{item.user.firstName}</span>
                                        <span className="text-[#606E85] dark:text-[#A1A7BB]">
                                            {item.shares < 0 ? 'vendeu' : 'comprou'}
                                        </span>
                                        <span className={item.side === 'YES' ? 'text-[#22c55e] font-bold' : 'text-[#ef4444] font-bold'}>
                                            {item.side === 'YES' ? 'Sim' : 'Não'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            {item.marketImageUrl && (
                                                <img className="size-4 object-contain rounded-sm" width={16} height={16} alt="" src={item.marketImageUrl} />
                                            )}
                                            <span className="font-semibold truncate max-w-[120px] lg:max-w-[200px]">{item.marketStatement}</span>
                                        </span>
                                        <span className="text-[#606E85] dark:text-[#A1A7BB]">a</span>
                                        <span className="font-bold">{(item.avgPrice / 100).toFixed(0)}¢</span>
                                    </span>
                                </p>
                                <div className="mt-0.5 flex items-center gap-x-1 text-[12px] font-medium text-[#606E85] dark:text-[#A1A7BB]">
                                    <span>{Math.abs(item.shares).toFixed(2)} Contratos</span>
                                    <span className="mx-0.5">·</span>
                                    <span>{formatCurrency(item.amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Time */}
                        <div className="text-end text-[12px] text-[#606E85] dark:text-[#A1A7BB] lg:mx-0 lg:mt-0 whitespace-nowrap ml-2">
                            <span>{timeAgo(item.createdAt)}</span>
                        </div>
                    </div>
                </div>
            ))}

            {/* Load more */}
            {items.length < total && (
                <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="mt-4 w-full flex items-center justify-center py-3 text-sm font-medium text-[#606E85] dark:text-[#A1A7BB] hover:text-foreground transition-colors"
                >
                    {loadingMore ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        'Carregar mais'
                    )}
                </button>
            )}
        </div>
    )
}
