'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { ProfileOverview } from '@/components/profile/profile-overview'
import { ProfilePositions } from '@/components/profile/profile-positions'
import { ProfileHistory } from '@/components/profile/profile-history'
import { useAuth } from '@/contexts/auth-context'
import { userApi } from '@/lib/api/client'
import type { Position } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
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

    const [stats, setStats] = useState({
        portfolioValue: 0,
        profitLoss: 0,
        volume: 0,
        winRate: 0,
    })

    const [overviewStats, setOverviewStats] = useState({
        liveMarkets: 0,
        rankPosition: 0,
        marketsTraded: 0,
        marketsCreated: 0,
        openPositions: 0,
    })

    const isOwner = isAuthenticated && user?.id === username

    const profileData = {
        username,
        displayName: isOwner && user?.full_name ? user.full_name : username.slice(0, 4) + '...' + username.slice(-4),
        walletAddress: username,
        joinedAt: isOwner && user?.created_at ? user.created_at : new Date().toISOString(),
    }

    const categories = [
        { name: 'Política', count: 0, color: '#FACC15' },
        { name: 'Esporte', count: 0, color: '#3b82f6' },
        { name: 'Social', count: 0, color: '#8b5cf6' },
        { name: 'Cripto', count: 0, color: '#f59e0b' },
    ]

    const fetchProfileData = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await userApi.getPublicProfile(username, { limit: 100 })
            setPositions(response.data.positions || [])
            setStats({
                portfolioValue: response.data.stats.portfolioValue,
                profitLoss: response.data.stats.profitLoss,
                volume: response.data.stats.volume,
                winRate: response.data.stats.winRate,
            })
            setOverviewStats({
                liveMarkets: response.data.stats.liveMarkets,
                rankPosition: 0,
                marketsTraded: response.data.stats.marketsTraded,
                marketsCreated: 0,
                openPositions: response.data.stats.openPositions,
            })
        } catch (err) {
            console.error('Failed to fetch profile:', err)
        } finally {
            setIsLoading(false)
        }
    }, [username])

    useEffect(() => {
        fetchProfileData()
    }, [fetchProfileData])

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
        if (value >= 100000) {
            return `R$${(value / 100000).toFixed(2)}K`
        }
        return `R$${(value / 100).toFixed(2).replace('.', ',')}`
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
            <div className="flex size-full flex-col items-center justify-center px-3 pb-16 pt-[72px]">
                <div className="mx-auto w-full max-w-[1200px]">
                    <Skeleton className="h-[280px] w-full rounded-xl" />
                    <Skeleton className="mt-6 h-[400px] w-full rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="flex size-full flex-col items-center justify-center px-3 pb-16 pt-[20px]">
            <div className="mx-auto h-[calc(100%-320px)] w-full pb-20 lg:pb-0">
                {/* Header Section */}
                <section className="relative z-10 mb-6 max-sm:px-0.5">
                    <header className="relative flex w-full flex-col gap-4 lg:flex-row lg:gap-5 lg:px-5">
                        {/* Gradient Background */}
                        <div
                            className="absolute inset-x-0 -top-20 z-0 mx-auto size-full max-h-[280px] w-svw overflow-hidden bg-center"
                            style={{
                                backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCBmaWxsPSIjMjJjNTVlIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIvPjwvc3ZnPg==")`,
                                backgroundSize: 'cover',
                                filter: 'blur(40px)',
                                opacity: 0.5,
                            }}
                        >
                            <div className="absolute inset-0 rounded-lg border border-white/10 bg-gradient-to-b from-white/20 via-white/10 to-transparent backdrop-blur-md dark:border-black/20 dark:from-black/20 dark:via-black/10 dark:to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="relative mx-auto flex w-full flex-col justify-between gap-4 pt-0 lg:max-w-[1200px] lg:flex-row lg:items-center lg:gap-5 lg:pt-[0px]">
                            {/* Left: Avatar + Info */}
                            <div className="flex flex-col gap-x-5 gap-y-4 lg:flex-row lg:items-center">
                                {/* Avatar */}
                                <div className="relative flex w-fit items-center">
                                    <div className="size-[130px]" />
                                    <div
                                        className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 !rounded-full flex items-center justify-center text-5xl font-bold text-white"
                                        style={{
                                            width: 120,
                                            height: 120,
                                            overflow: 'hidden',
                                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                                        }}
                                    >
                                        {profileData.displayName.charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                {/* Username + Meta */}
                                <div className="flex flex-col gap-2.5 text-2xl lg:text-[32px]">
                                    <div className="flex items-center gap-x-1.5">
                                        <span className="font-bold">{truncateAddress(profileData.displayName)}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium lg:text-sm">
                                        {/* Copy Address Button */}
                                        <button
                                            onClick={handleCopyAddress}
                                            className="flex items-center justify-center h-7 rounded-full gap-1.5 text-[13px] font-medium transition-all duration-300 ease-in-out w-fit pl-3 pr-2 bg-black/5 dark:bg-white/5 text-muted-foreground"
                                        >
                                            {truncateAddress(profileData.walletAddress)}
                                            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clipPath="url(#clip0_659_2664)">
                                                    <path d="M12 9.675V12.825C12 15.45 10.95 16.5 8.325 16.5H5.175C2.55 16.5 1.5 15.45 1.5 12.825V9.675C1.5 7.05 2.55 6 5.175 6H8.325C10.95 6 12 7.05 12 9.675Z" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M16.5 5.175V8.325C16.5 10.95 15.45 12 12.825 12H12V9.675C12 7.05 10.95 6 8.325 6H6V5.175C6 2.55 7.05 1.5 9.675 1.5H12.825C15.45 1.5 16.5 2.55 16.5 5.175Z" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_659_2664">
                                                        <rect width="18" height="18" fill="white" />
                                                    </clipPath>
                                                </defs>
                                            </svg>
                                        </button>

                                        {/* Edit Button (only for owner) */}
                                        {isOwner && (
                                            <Link
                                                href={`/u/${username}/edit`}
                                                className="flex items-center justify-center h-7 rounded-full gap-1.5 text-[13px] font-medium transition-all duration-300 ease-in-out w-full bg-black/5 dark:bg-white/5 text-muted-foreground max-w-[72px] min-w-[72px]"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-3.5">
                                                    <path d="M14 14.667H2C1.72667 14.667 1.5 14.4403 1.5 14.167C1.5 13.8937 1.72667 13.667 2 13.667H14C14.2733 13.667 14.5 13.8937 14.5 14.167C14.5 14.4403 14.2733 14.667 14 14.667Z" fill="currentColor" />
                                                    <path d="M12.6799 2.31945C11.3866 1.02612 10.1199 0.992787 8.79322 2.31945L7.98655 3.12612C7.91989 3.19279 7.89322 3.29945 7.91989 3.39279C8.42655 5.15945 9.83989 6.57279 11.6066 7.07945C11.6332 7.08612 11.6599 7.09279 11.6866 7.09279C11.7599 7.09279 11.8266 7.06612 11.8799 7.01279L12.6799 6.20612C13.3399 5.55279 13.6599 4.91945 13.6599 4.27945C13.6666 3.61945 13.3466 2.97945 12.6799 2.31945Z" fill="currentColor" />
                                                    <path d="M10.4066 7.68654C10.2132 7.5932 10.0266 7.49987 9.84655 7.3932C9.69989 7.30654 9.55989 7.2132 9.41989 7.1132C9.30655 7.03987 9.17322 6.9332 9.04655 6.82654C9.03322 6.81987 8.98655 6.77987 8.93322 6.72654C8.71322 6.53987 8.46655 6.29987 8.24655 6.0332C8.22655 6.01987 8.19322 5.9732 8.14655 5.9132C8.07989 5.8332 7.96655 5.69987 7.86655 5.54654C7.78655 5.44654 7.69322 5.29987 7.60655 5.1532C7.49989 4.9732 7.40655 4.7932 7.31322 4.60654C7.2991 4.57627 7.28543 4.54616 7.27218 4.51623C7.1738 4.29402 6.88404 4.22905 6.7122 4.40089L2.89322 8.21987C2.80655 8.30654 2.72655 8.4732 2.70655 8.58654L2.34655 11.1399C2.27989 11.5932 2.40655 12.0199 2.68655 12.3065C2.92655 12.5399 3.25989 12.6665 3.61989 12.6665C3.69989 12.6665 3.77989 12.6599 3.85989 12.6465L6.41989 12.2865C6.53989 12.2665 6.70655 12.1865 6.78655 12.0999L10.6008 8.28566C10.7738 8.11263 10.7085 7.81565 10.4834 7.71961C10.4581 7.7088 10.4325 7.69778 10.4066 7.68654Z" fill="currentColor" />
                                                </svg>
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
                            <aside className="flex w-full gap-x-5 overflow-x-auto overflow-y-hidden border border-black/10 max-lg:rounded-xl max-lg:bg-white/5 max-lg:p-4 lg:w-fit lg:justify-end lg:gap-x-[30px] lg:overflow-visible lg:border-none dark:border-white/5">
                                {/* Portfolio Value */}
                                <div className="flex w-fit flex-col gap-1 max-lg:pointer-events-none lg:items-end">
                                    <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                                        <span className="flex items-center gap-x-1">
                                            Valor do Portfolio
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                                                <path d="M7.86016 5.36016C7.60448 5.38964 7.41152 5.60612 7.41152 5.8635C7.41152 6.12087 7.60448 6.33736 7.86016 6.36683C7.9945 6.36869 8.12379 6.31569 8.21815 6.22007C8.31252 6.12444 8.36381 5.99446 8.36016 5.86016C8.35657 5.58552 8.1348 5.36375 7.86016 5.36016Z" fill="currentColor" />
                                                <path d="M7.86016 7.28016C7.72701 7.27835 7.59877 7.33045 7.50461 7.42461C7.41045 7.51877 7.35835 7.64701 7.36016 7.78016V9.86016C7.36016 10.1363 7.58402 10.3602 7.86016 10.3602C8.1363 10.3602 8.36016 10.1363 8.36016 9.86016V7.7935C8.36376 7.65859 8.31268 7.52796 8.21851 7.43129C8.12435 7.33462 7.99511 7.28011 7.86016 7.28016Z" fill="currentColor" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M7.86016 1.3335C4.25711 1.33717 1.33717 4.25711 1.3335 7.86016C1.3335 11.4647 4.25558 14.3868 7.86016 14.3868C11.4647 14.3868 14.3868 11.4647 14.3868 7.86016C14.3832 4.25711 11.4632 1.33717 7.86016 1.3335ZM7.86016 13.3868C4.80787 13.3868 2.3335 10.9125 2.3335 7.86016C2.3335 4.80787 4.80787 2.3335 7.86016 2.3335C10.9125 2.3335 13.3868 4.80787 13.3868 7.86016C13.3832 10.9109 10.9109 13.3832 7.86016 13.3868Z" fill="currentColor" />
                                            </svg>
                                        </span>
                                    </span>
                                    <span className="whitespace-nowrap text-base font-bold lg:text-xl">
                                        {formatCurrency(stats.portfolioValue)}
                                    </span>
                                </div>

                                {/* Profit/Loss */}
                                <div className="flex w-fit flex-col gap-1 max-lg:pointer-events-none lg:items-end">
                                    <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">Lucro/perda</span>
                                    <span className={cn(
                                        "whitespace-nowrap text-base font-bold lg:text-xl",
                                        stats.profitLoss >= 0 ? "text-green-500" : "text-red-500"
                                    )}>
                                        {stats.profitLoss >= 0 ? '+' : ''}{formatCurrency(stats.profitLoss)}
                                    </span>
                                </div>

                                {/* Volume */}
                                <div className="flex w-fit flex-col gap-1 max-lg:pointer-events-none lg:items-end">
                                    <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                                        <span className="flex items-center gap-x-1">
                                            Volume
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                                                <path d="M7.86016 5.36016C7.60448 5.38964 7.41152 5.60612 7.41152 5.8635C7.41152 6.12087 7.60448 6.33736 7.86016 6.36683C7.9945 6.36869 8.12379 6.31569 8.21815 6.22007C8.31252 6.12444 8.36381 5.99446 8.36016 5.86016C8.35657 5.58552 8.1348 5.36375 7.86016 5.36016Z" fill="currentColor" />
                                                <path d="M7.86016 7.28016C7.72701 7.27835 7.59877 7.33045 7.50461 7.42461C7.41045 7.51877 7.35835 7.64701 7.36016 7.78016V9.86016C7.36016 10.1363 7.58402 10.3602 7.86016 10.3602C8.1363 10.3602 8.36016 10.1363 8.36016 9.86016V7.7935C8.36376 7.65859 8.31268 7.52796 8.21851 7.43129C8.12435 7.33462 7.99511 7.28011 7.86016 7.28016Z" fill="currentColor" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M7.86016 1.3335C4.25711 1.33717 1.33717 4.25711 1.3335 7.86016C1.3335 11.4647 4.25558 14.3868 7.86016 14.3868C11.4647 14.3868 14.3868 11.4647 14.3868 7.86016C14.3832 4.25711 11.4632 1.33717 7.86016 1.3335ZM7.86016 13.3868C4.80787 13.3868 2.3335 10.9125 2.3335 7.86016C2.3335 4.80787 4.80787 2.3335 7.86016 2.3335C10.9125 2.3335 13.3868 4.80787 13.3868 7.86016C13.3832 10.9109 10.9109 13.3832 7.86016 13.3868Z" fill="currentColor" />
                                            </svg>
                                        </span>
                                    </span>
                                    <span className="whitespace-nowrap text-base font-bold lg:text-xl">
                                        {formatCurrency(stats.volume)}
                                    </span>
                                </div>

                                {/* Win Rate */}
                                <div className="flex w-fit flex-col gap-1 max-lg:pointer-events-none lg:items-end">
                                    <span className="whitespace-nowrap text-sm font-medium text-muted-foreground">
                                        <span className="flex items-center gap-x-1">
                                            Taxa de ganho
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                                                <path d="M7.86016 5.36016C7.60448 5.38964 7.41152 5.60612 7.41152 5.8635C7.41152 6.12087 7.60448 6.33736 7.86016 6.36683C7.9945 6.36869 8.12379 6.31569 8.21815 6.22007C8.31252 6.12444 8.36381 5.99446 8.36016 5.86016C8.35657 5.58552 8.1348 5.36375 7.86016 5.36016Z" fill="currentColor" />
                                                <path d="M7.86016 7.28016C7.72701 7.27835 7.59877 7.33045 7.50461 7.42461C7.41045 7.51877 7.35835 7.64701 7.36016 7.78016V9.86016C7.36016 10.1363 7.58402 10.3602 7.86016 10.3602C8.1363 10.3602 8.36016 10.1363 8.36016 9.86016V7.7935C8.36376 7.65859 8.31268 7.52796 8.21851 7.43129C8.12435 7.33462 7.99511 7.28011 7.86016 7.28016Z" fill="currentColor" />
                                                <path fillRule="evenodd" clipRule="evenodd" d="M7.86016 1.3335C4.25711 1.33717 1.33717 4.25711 1.3335 7.86016C1.3335 11.4647 4.25558 14.3868 7.86016 14.3868C11.4647 14.3868 14.3868 11.4647 14.3868 7.86016C14.3832 4.25711 11.4632 1.33717 7.86016 1.3335ZM7.86016 13.3868C4.80787 13.3868 2.3335 10.9125 2.3335 7.86016C2.3335 4.80787 4.80787 2.3335 7.86016 2.3335C10.9125 2.3335 13.3868 4.80787 13.3868 7.86016C13.3832 10.9109 10.9109 13.3832 7.86016 13.3868Z" fill="currentColor" />
                                            </svg>
                                        </span>
                                    </span>
                                    <span className="whitespace-nowrap text-base font-bold lg:text-xl">
                                        {stats.winRate.toFixed(0)}%
                                    </span>
                                </div>
                            </aside>
                        </div>
                    </header>
                </section>

                {/* Main Content */}
                <div className="w-full relative mx-auto h-full max-w-[1200px] lg:mt-6">
                    {/* Tabs */}
                    <div className="relative flex h-10 items-center justify-between">
                        <div className="relative flex items-baseline mb-0 mt-[6px] w-full justify-start gap-x-5 border-b border-border dark:border-white/5 dark:bg-transparent max-lg:overflow-x-auto max-lg:whitespace-nowrap">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "relative outline-0 mr-0.5 last-of-type:mr-0 py-3 flex w-fit px-0 text-base items-center justify-center font-medium border-b-2 transition-colors",
                                        activeTab === tab.id
                                            ? "text-[#0C131F] dark:text-white border-[#0C131F] dark:border-[#FFFFFF]"
                                            : "text-[#606E85] dark:text-[#A1A7BB] hover:text-[#0C131F] dark:hover:text-white border-transparent hover:border-black dark:hover:border-white"
                                    )}
                                >
                                    <span><span className="flex items-center">{tab.label}</span></span>
                                </button>
                            ))}

                            {/* Logo */}
                            <span className="ml-auto hidden max-w-[103px] object-contain opacity-80 lg:block text-muted-foreground font-semibold">
                                ▲ Previzor
                            </span>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="size-full">
                        <div className="w-full h-full p-0">
                            {activeTab === 'overview' && (
                                <div className="mt-5 flex w-full flex-col">
                                    <ProfileOverview
                                        positions={positions}
                                        stats={overviewStats}
                                        categories={categories}
                                    />
                                </div>
                            )}
                            {activeTab === 'positions' && (
                                <ProfilePositions
                                    positions={positions.filter(p => p.status === 'active')}
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
            </div>
        </div>
    )
}
