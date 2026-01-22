'use client'

import { Button } from '@/components/ui/button'
import { ChevronRight, Star, Target, TrendingUp, Users, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Position } from '@/lib/types'

interface ProfileOverviewProps {
    positions: Position[]
    stats: {
        liveMarkets: number
        rankPosition: number
        marketsTraded: number
        marketsCreated: number
        openPositions: number
    }
    categories: { name: string; count: number; color: string }[]
}

export function ProfileOverview({ positions, stats, categories }: ProfileOverviewProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value / 100)
    }

    const recentPositions = positions
        .filter((p) => p.status === 'active')
        .slice(0, 3)

    const totalCategories = categories.reduce((sum, c) => sum + c.count, 0)

    return (
        <div className="flex flex-col w-full">
            {/* Stats Cards Row */}
            <section className="flex w-full items-center gap-3 overflow-x-auto lg:overflow-hidden">
                {/* Live Markets - Special Green */}
                <div className="flex flex-col min-w-[140px] w-full items-center justify-center gap-0.5 rounded-xl border py-4 min-h-[73px] max-h-[73px] border-green-500 bg-[radial-gradient(circle_at_50%_240%,rgba(0,180,113,0.2)_0%,transparent_100%)] relative overflow-hidden">
                    <div className="absolute -bottom-9 h-6 w-full rounded-full bg-white/15 blur-[60px]" />
                    <div className="flex items-center space-x-2">
                        <h4 className="text-lg lg:text-xl font-bold" style={{ color: '#00B471' }}>
                            {stats.liveMarkets}
                        </h4>
                    </div>
                    <div className="text-xs font-medium" style={{ color: '#00B471' }}>
                        <div className="flex items-center gap-x-1.5">
                            <div className="size-1.5 animate-pulse rounded-full bg-green-500" />
                            <span>Merc. ao Vivo</span>
                        </div>
                    </div>
                </div>

                {/* Score */}
                <div className="flex flex-col min-w-[140px] w-full items-center justify-center gap-0.5 rounded-xl border py-4 min-h-[73px] max-h-[73px] border-border bg-[radial-gradient(circle_at_50%_240%,rgba(113,113,74,0.2)_0%,transparent_100%)] relative overflow-hidden">
                    <div className="absolute -bottom-9 h-6 w-full rounded-full bg-white/15 blur-[60px]" />
                    <div className="flex items-center space-x-2">
                        <TrendingUp className="size-5 text-yellow-500" />
                        <h4 className="text-lg lg:text-xl font-bold">
                            {(stats.marketsTraded * 0.5).toFixed(2)}
                        </h4>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                        Pontuação
                    </div>
                </div>

                {/* Rank Position */}
                <div className="flex flex-col min-w-[140px] w-full items-center justify-center gap-0.5 rounded-xl border py-4 min-h-[73px] max-h-[73px] border-border relative overflow-hidden">
                    <div className="absolute -bottom-9 h-6 w-full rounded-full bg-white/15 blur-[60px]" />
                    <div className="flex items-center space-x-2">
                        <h4 className="text-lg lg:text-xl font-bold">
                            #{stats.rankPosition || '--'}
                        </h4>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                        Posição no Rank
                    </div>
                </div>

                {/* Markets Traded */}
                <div className="flex flex-col min-w-[140px] w-full items-center justify-center gap-0.5 rounded-xl border py-4 min-h-[73px] max-h-[73px] border-border relative overflow-hidden">
                    <div className="absolute -bottom-9 h-6 w-full rounded-full bg-white/15 blur-[60px]" />
                    <div className="flex items-center space-x-2">
                        <h4 className="text-lg lg:text-xl font-bold">
                            {stats.marketsTraded}
                        </h4>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                        Merc. Negociados
                    </div>
                </div>

                {/* Markets Created */}
                <div className="flex flex-col min-w-[140px] w-full items-center justify-center gap-0.5 rounded-xl border py-4 min-h-[73px] max-h-[73px] border-border relative overflow-hidden">
                    <div className="absolute -bottom-9 h-6 w-full rounded-full bg-white/15 blur-[60px]" />
                    <div className="flex items-center space-x-2">
                        <h4 className="text-lg lg:text-xl font-bold">
                            {stats.marketsCreated}
                        </h4>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                        Merc. Criados
                    </div>
                </div>

                {/* Open Positions */}
                <div className="flex flex-col min-w-[140px] w-full items-center justify-center gap-0.5 rounded-xl border py-4 min-h-[73px] max-h-[73px] border-border relative overflow-hidden">
                    <div className="absolute -bottom-9 h-6 w-full rounded-full bg-white/15 blur-[60px]" />
                    <div className="flex items-center space-x-2">
                        <h4 className="text-lg lg:text-xl font-bold">
                            {stats.openPositions}
                        </h4>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">
                        Posições abertas
                    </div>
                </div>
            </section>

            {/* Two Column Layout */}
            <section className="mt-4 flex w-full items-start gap-4 max-lg:flex-col">
                {/* Favorite Categories */}
                <div className="relative h-[322px] w-full overflow-hidden rounded-2xl border border-border p-4 lg:max-w-[356px]">
                    {/* Glow Effect */}
                    <div className="pointer-events-none absolute -top-5 left-0 hidden h-28 w-full rounded-full opacity-20 dark:flex"
                        style={{ filter: 'blur(24px)', background: 'radial-gradient(circle at center top, rgb(0, 82, 255), transparent)' }}
                    />

                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-600 p-2">
                            <Star className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Categorias Favoritas</h2>
                            <p className="text-xs font-medium text-muted-foreground">
                                Temas mais negociados na Previzor.
                            </p>
                        </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="mb-2 flex justify-center py-4">
                        <div className="relative w-[140px] h-[140px]">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="14"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    className="text-muted/30"
                                />
                                {totalCategories > 0 && categories.map((cat, idx) => {
                                    const prevPercent = categories.slice(0, idx).reduce((sum, c) => sum + (c.count / totalCategories), 0)
                                    const percent = cat.count / totalCategories
                                    const dashArray = percent * 88
                                    const dashOffset = -prevPercent * 88
                                    return cat.count > 0 ? (
                                        <circle
                                            key={cat.name}
                                            cx="18"
                                            cy="18"
                                            r="14"
                                            fill="none"
                                            stroke={cat.color}
                                            strokeWidth="4"
                                            strokeDasharray={`${dashArray} 88`}
                                            strokeDashoffset={dashOffset}
                                        />
                                    ) : null
                                })}
                            </svg>
                        </div>
                    </div>

                    <p className="mb-4 text-center text-xs font-medium text-muted-foreground">
                        Todas as categorias
                    </p>

                    {/* Category Tags */}
                    <div className="flex flex-wrap gap-2 justify-center">
                        {categories.map((cat) => (
                            <div
                                key={cat.name}
                                className={cn(
                                    "flex h-7 items-center gap-1 rounded-full bg-muted px-3 transition-all",
                                    cat.count === 0 && "opacity-50"
                                )}
                            >
                                <div
                                    className="size-3 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                />
                                <span className="text-xs font-medium">
                                    {cat.count} {cat.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Predictions Preview */}
                <section className="w-full min-h-[322px] max-h-[322px] overflow-hidden rounded-2xl border border-border pt-4">
                    {/* Header */}
                    <div className="relative flex w-full items-center justify-between px-4">
                        <span className="absolute -left-20 bottom-0 h-24 w-56 rounded-full bg-[radial-gradient(circle_at_50%_90%,rgba(0,82,255,0.2)_0%,transparent_100%)] blur-md" />
                        <span className="absolute -right-10 top-4 h-6 w-56 rounded-full bg-[radial-gradient(circle_at_50%_90%,rgba(0,82,255,0.2)_0%,transparent_100%)] blur-md" />

                        <figure className="relative flex items-center gap-x-3">
                            <span className="flex size-9 items-center justify-center rounded-lg bg-blue-600">
                                <Target className="h-4 w-4 text-white" />
                            </span>
                            <figcaption>
                                <h4 className="font-semibold">Previsões</h4>
                                <p className="mt-0.5 text-xs font-medium text-muted-foreground max-w-40 truncate lg:max-w-none">
                                    Visão geral das previsões ativas e passadas.
                                </p>
                            </figcaption>
                        </figure>

                        <Button size="sm" className="relative gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                            Ver Mais
                            <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto overflow-y-auto min-h-[254px] max-h-[calc(100%-60px)] w-full pb-1">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="h-11 border-b border-border">
                                <tr>
                                    <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal text-muted-foreground">
                                        Preço de entrada → Agora
                                    </th>
                                    <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal text-muted-foreground">
                                        Preço Atual
                                    </th>
                                    <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal text-muted-foreground">
                                        Performance
                                    </th>
                                    <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal text-muted-foreground">
                                        Para ganhar
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentPositions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                                            Nenhuma previsão ativa
                                        </td>
                                    </tr>
                                ) : (
                                    recentPositions.map((pos) => (
                                        <tr key={pos.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-7 lg:size-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                                        {pos.side === 'YES' ? '👍' : '👎'}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs lg:text-sm font-semibold line-clamp-1 max-w-72">
                                                            {pos.marketStatement || 'Mercado'}
                                                        </span>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className={cn(
                                                                "text-xs px-1 rounded-sm font-semibold",
                                                                pos.side === 'YES'
                                                                    ? "bg-green-500/10 text-green-600"
                                                                    : "bg-red-500/10 text-red-600"
                                                            )}>
                                                                {pos.side === 'YES' ? 'Sim' : 'Não'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="text-xs lg:text-base font-medium">--</span>
                                                <div className="text-xs text-muted-foreground">
                                                    {(pos.shares || 0).toFixed(1)} Shares
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="text-sm font-semibold">
                                                    {formatCurrency(pos.amount)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="text-sm font-semibold text-green-500">
                                                    {formatCurrency(pos.payoutAmount || 0)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </section>
        </div>
    )
}
