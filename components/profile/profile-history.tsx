'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, ShoppingCart, TrendingDown, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Position } from '@/lib/types'

type ActivityType = 'bought' | 'sold' | 'lost' | 'won'

interface ActivityItem {
    id: string
    type: ActivityType
    position: Position
    timestamp: string
}

interface ProfileHistoryProps {
    positions: Position[]
    isLoading?: boolean
}

export function ProfileHistory({ positions, isLoading = false }: ProfileHistoryProps) {
    const [search, setSearch] = useState('')
    const [sortOrder, setSortOrder] = useState('newest')

    // Convert positions to activity items
    const activities: ActivityItem[] = positions.map((pos) => {
        let type: ActivityType = 'bought'
        if (pos.status === 'settled') {
            type = pos.payoutAmount && pos.payoutAmount > pos.amount ? 'won' : 'lost'
        }
        return {
            id: pos.id,
            type,
            position: pos,
            timestamp: pos.settledAt || pos.createdAt,
        }
    })

    const filteredActivities = activities
        .filter((act) => {
            if (search && !act.position.marketStatement?.toLowerCase().includes(search.toLowerCase())) {
                return false
            }
            return true
        })
        .sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime()
            const dateB = new Date(b.timestamp).getTime()
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
        })

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value / 100)
    }

    const formatRelativeTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffDays === 0) return 'hoje'
        if (diffDays === 1) return 'há 1 dia'
        if (diffDays < 7) return `há ${diffDays} dias`
        if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semanas`
        return date.toLocaleDateString('pt-BR')
    }

    const getActivityIcon = (type: ActivityType) => {
        switch (type) {
            case 'bought':
                return <ShoppingCart className="h-4 w-4" />
            case 'sold':
                return <TrendingDown className="h-4 w-4" />
            case 'lost':
                return <XCircle className="h-4 w-4" />
            case 'won':
                return <ShoppingCart className="h-4 w-4" />
        }
    }

    const getActivityLabel = (type: ActivityType) => {
        switch (type) {
            case 'bought': return 'Comprado'
            case 'sold': return 'Vendido'
            case 'lost': return 'Perdido'
            case 'won': return 'Ganhou'
        }
    }

    const getActivityColor = (type: ActivityType) => {
        switch (type) {
            case 'bought': return 'text-blue-600'
            case 'sold': return 'text-yellow-600'
            case 'lost': return 'text-red-600'
            case 'won': return 'text-green-600'
        }
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Procurar por mercados, tópicos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex-1" />

                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Ordenar: Mais Recente</SelectItem>
                        <SelectItem value="oldest">Ordenar: Mais Antigo</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Info Banner */}
            <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground text-center">
                Apenas mercados resolvidos são exibidos aqui. Suas previsões ativas estão disponíveis na aba Previsões.
            </div>

            {/* Activity List */}
            <div className="rounded-lg border border-border overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[120px_1fr_150px_120px] gap-4 px-4 py-3 bg-muted/30 text-sm font-medium text-muted-foreground">
                    <div>Activity</div>
                    <div>Mercado - Resultado Previsto</div>
                    <div className="text-right">Previu No Valor De</div>
                    <div className="text-right">Data De Fechamento</div>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="px-4 py-4">
                                <div className="animate-pulse bg-muted h-12 rounded" />
                            </div>
                        ))
                    ) : filteredActivities.length === 0 ? (
                        <div className="px-4 py-12 text-center text-muted-foreground">
                            Nenhuma atividade encontrada
                        </div>
                    ) : (
                        filteredActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="grid grid-cols-[120px_1fr_150px_120px] gap-4 px-4 py-4 items-center hover:bg-muted/30 transition-colors"
                            >
                                {/* Activity Type */}
                                <div className={cn("flex items-center gap-2", getActivityColor(activity.type))}>
                                    {getActivityIcon(activity.type)}
                                    <span className="text-sm font-medium">{getActivityLabel(activity.type)}</span>
                                </div>

                                {/* Market Info */}
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                        {activity.position.side === 'YES' ? '👍' : '👎'}
                                    </div>
                                    <div>
                                        <Link
                                            href={`/eventos/${activity.position.eventSlug || '#'}`}
                                            className="font-medium hover:text-primary transition-colors line-clamp-1"
                                        >
                                            {activity.position.marketStatement || 'Mercado'}
                                        </Link>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full inline-block mt-1",
                                            activity.position.side === 'YES'
                                                ? "bg-green-500/10 text-green-600"
                                                : "bg-red-500/10 text-red-600"
                                        )}>
                                            {activity.position.side === 'YES' ? 'Sim' : 'Não'}
                                        </span>
                                    </div>
                                </div>

                                {/* Value */}
                                <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(activity.position.amount)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(activity.position.amount / 100).toFixed(2)} Shares
                                    </p>
                                </div>

                                {/* Date */}
                                <div className="text-right text-sm text-muted-foreground">
                                    {formatRelativeTime(activity.timestamp)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
