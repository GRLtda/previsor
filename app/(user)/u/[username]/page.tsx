'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ProfileOverview } from '@/components/profile/profile-overview'
import { ProfilePositions } from '@/components/profile/profile-positions'
import { ProfileHistory } from '@/components/profile/profile-history'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Position } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Copy, Check, Calendar, Info, Edit, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function PublicProfilePage() {
    const params = useParams()
    const username = params.username as string
    const { user, isAuthenticated } = useAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [positions, setPositions] = useState<Position[]>([])
    const [activeTab, setActiveTab] = useState('overview')
    const [copied, setCopied] = useState(false)

    const isOwner = isAuthenticated && user?.id === username

    const profileData = {
        username,
        displayName: user?.full_name || username.slice(0, 12) + '...',
        avatarUrl: null,
        walletAddress: username,
        joinedAt: user?.created_at || new Date().toISOString(),
    }

    // Calculate real stats from positions
    const stats = useMemo(() => {
        const portfolioValue = positions
            .filter(p => p.status === 'active')
            .reduce((sum, p) => sum + p.amount, 0)
        const volume = positions.reduce((sum, p) => sum + p.amount, 0)
        const profitLoss = positions
            .filter(p => p.status === 'settled' && p.payoutAmount !== null)
            .reduce((sum, p) => sum + ((p.payoutAmount || 0) - p.amount), 0)
        const settled = positions.filter(p => p.status === 'settled')
        const wins = settled.filter(p => (p.payoutAmount || 0) > p.amount)
        const winRate = settled.length > 0 ? (wins.length / settled.length) * 100 : 0
        return { portfolioValue, profitLoss, volume, winRate }
    }, [positions])

    const overviewStats = useMemo(() => ({
        liveMarkets: positions.filter(p => p.status === 'active').length,
        rankPosition: 0,
        marketsTraded: new Set(positions.map(p => p.marketId)).size,
        marketsCreated: 0,
        openPositions: positions.filter(p => p.status === 'active').length,
    }), [positions])

    const categories = [
        { name: 'Política', count: 2, color: '#FACC15' },
        { name: 'Esporte', count: 0, color: '#3b82f6' },
        { name: 'Social', count: 0, color: '#8b5cf6' },
        { name: 'Cripto', count: 0, color: '#f59e0b' },
    ]

    const fetchPositions = useCallback(async () => {
        if (!isAuthenticated) {
            setIsLoading(false)
            return
        }
        try {
            const response = await userApi.getPositions({ limit: 100 })
            setPositions(response.positions)
        } catch (err) {
            if (err instanceof ApiClientError) {
                console.error('Failed to fetch positions:', err)
            }
        } finally {
            setIsLoading(false)
        }
    }, [isAuthenticated])

    useEffect(() => {
        fetchPositions()
    }, [fetchPositions])

    const handleCopyAddress = async () => {
        try {
            await navigator.clipboard.writeText(profileData.walletAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error('Failed to copy:', e)
        }
    }

    const truncateAddress = (address: string) => {
        if (address.length <= 8) return address
        return `${address.slice(0, 4)}...${address.slice(-4)}`
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value / 100)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    }

    const tabs = [
        { id: 'overview', label: 'Visão Geral' },
        { id: 'positions', label: 'Previsões' },
        { id: 'history', label: 'Histórico' },
    ]

    if (isLoading) {
        return (
            <div className="min-h-screen">
                <div className="relative">
                    <div className="absolute inset-x-0 top-0 h-[280px] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-green-500/30 via-green-500/10 to-transparent blur-[40px]" />
                    </div>
                </div>
                <div className="relative mx-auto max-w-[1200px] px-4 pt-8">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <Skeleton className="w-[120px] h-[120px] rounded-full" />
                        <div className="flex-1 space-y-3">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-20">
            {/* Blurred Avatar Gradient Background */}
            <div className="relative">
                <div className="absolute inset-x-0 -top-20 h-[280px] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-50"
                        style={{
                            backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjMjJjNTVlIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjwvc3ZnPg==")`,
                            filter: 'blur(40px)',
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-transparent backdrop-blur-md dark:from-black/20 dark:via-black/10" />
                </div>
            </div>

            {/* Header Content */}
            <header className="relative mx-auto max-w-[1200px] px-4 pt-0 lg:px-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-5">
                    {/* Left: Avatar + Info */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-5">
                        {/* Avatar */}
                        <div className="relative w-[130px] h-[130px] flex items-center justify-center">
                            <div
                                className="w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center text-4xl font-bold text-white"
                                style={{
                                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                }}
                            >
                                {profileData.displayName.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Username + Meta */}
                        <div className="flex flex-col gap-2.5">
                            <h1 className="text-2xl lg:text-[32px] font-bold">
                                {truncateAddress(profileData.displayName)}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium">
                                {/* Copy Address Button */}
                                <button
                                    onClick={handleCopyAddress}
                                    className="flex items-center gap-1.5 h-7 px-3 pr-2 rounded-full bg-black/5 dark:bg-white/5 text-muted-foreground transition-all hover:bg-black/10 dark:hover:bg-white/10"
                                >
                                    {truncateAddress(profileData.walletAddress)}
                                    {copied ? (
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </button>

                                {/* Edit Button (only for owner) */}
                                {isOwner && (
                                    <Link
                                        href={`/u/${username}/edit`}
                                        className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-black/5 dark:bg-white/5 text-muted-foreground transition-all hover:bg-black/10 dark:hover:bg-white/10"
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                        Editar
                                    </Link>
                                )}

                                {/* Join Date */}
                                <span className="whitespace-nowrap text-muted-foreground">
                                    Entrou em {formatDate(profileData.joinedAt)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Stats */}
                    <aside className="flex w-full lg:w-fit lg:ml-auto gap-5 lg:gap-[30px] overflow-x-auto lg:overflow-visible py-4 lg:py-0 px-4 lg:px-0 border border-black/10 dark:border-white/5 lg:border-none rounded-xl lg:rounded-none bg-white/5 lg:bg-transparent">
                        {/* Valor do Portfolio */}
                        <div className="flex flex-col gap-1 lg:items-end min-w-fit">
                            <span className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-muted-foreground">
                                Valor do Portfolio
                                <Info className="h-4 w-4" />
                            </span>
                            <span className="whitespace-nowrap text-base lg:text-xl font-bold">
                                {formatCurrency(stats.portfolioValue)}
                            </span>
                        </div>

                        {/* Lucro/perda */}
                        <div className="flex flex-col gap-1 lg:items-end min-w-fit">
                            <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                                Lucro/perda
                            </span>
                            <span className={cn(
                                "whitespace-nowrap text-base lg:text-xl font-bold",
                                stats.profitLoss >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                                {stats.profitLoss >= 0 ? '+' : ''}{formatCurrency(stats.profitLoss)}
                            </span>
                        </div>

                        {/* Volume */}
                        <div className="flex flex-col gap-1 lg:items-end min-w-fit">
                            <span className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-muted-foreground">
                                Volume
                                <Info className="h-4 w-4" />
                            </span>
                            <span className="whitespace-nowrap text-base lg:text-xl font-bold">
                                {formatCurrency(stats.volume)}
                            </span>
                        </div>

                        {/* Taxa de ganho */}
                        <div className="flex flex-col gap-1 lg:items-end min-w-fit">
                            <span className="flex items-center gap-1 whitespace-nowrap text-sm font-medium text-muted-foreground">
                                Taxa de ganho
                                <Info className="h-4 w-4" />
                            </span>
                            <span className="whitespace-nowrap text-base lg:text-xl font-bold">
                                {stats.winRate.toFixed(0)}%
                            </span>
                        </div>
                    </aside>
                </div>
            </header>

            {/* Main Content */}
            <div className="relative mx-auto max-w-[1200px] px-4 lg:px-5 mt-6">
                {/* Tabs */}
                <div className="relative flex items-center justify-between h-10">
                    <div className="flex items-baseline gap-5 border-b border-border dark:border-white/5 w-full overflow-x-auto whitespace-nowrap">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "relative py-3 text-base font-medium transition-colors border-b-2",
                                    activeTab === tab.id
                                        ? "text-foreground border-foreground"
                                        : "text-muted-foreground border-transparent hover:text-foreground hover:border-foreground"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}

                        {/* Logo */}
                        <span className="ml-auto hidden lg:block text-muted-foreground/80 font-semibold">
                            ▲ Previzor
                        </span>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mt-5">
                    {activeTab === 'overview' && (
                        <ProfileOverview
                            positions={positions}
                            stats={overviewStats}
                            categories={categories}
                        />
                    )}
                    {activeTab === 'positions' && (
                        <ProfilePositions
                            positions={positions}
                            isLoading={isLoading}
                        />
                    )}
                    {activeTab === 'history' && (
                        <ProfileHistory
                            positions={positions.filter(p => p.status === 'settled')}
                            isLoading={isLoading}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
