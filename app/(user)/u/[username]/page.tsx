'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { userApi } from '@/lib/api/client'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { Copy, Edit3, LogOut, Settings, ArrowUpRight } from 'lucide-react'
import { ProfilePositions } from '@/components/profile/profile-positions'
import type { Position } from '@/lib/types'
const Odometer = ({ value }: { value: number }) => {
    const formatted = (value / 100).toFixed(2).split('.')
    const integerPart = formatted[0]
    const decimalPart = formatted[1]

    return (
        <span className="inline-flex items-baseline">
            R$
            <span>
                {integerPart.split('').map((digit, i) => (
                    <span key={i} className="inline-block">{digit}</span>
                ))}
            </span>
            <span>.</span>
            <span className="inline-block">{decimalPart}</span>
        </span>
    )
}

export default function PublicProfilePage() {
    const params = useParams()
    const username = params.username as string
    const { user, isAuthenticated, logout } = useAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [positions, setPositions] = useState<Position[]>([])
    const [copied, setCopied] = useState(false)
    const [viewMode, setViewMode] = useState<'portfolio' | 'favorites'>('portfolio')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [activeActivityTab, setActiveActivityTab] = useState<'positions' | 'activity'>('positions')

    const filteredPositions = useMemo(() => {
        if (viewMode === 'favorites' && selectedCategory) {
            return positions.filter(p =>
                p.eventCategory?.toLowerCase() === selectedCategory ||
                (selectedCategory === 'esportes' && p.eventCategory?.toLowerCase() === 'esporte') ||
                (selectedCategory === 'politica' && (p.eventCategory?.toLowerCase() === 'política' || p.eventCategory?.toLowerCase() === 'politica'))
            )
        }
        return positions
    }, [positions, viewMode, selectedCategory])
    const [stats, setStats] = useState({
        portfolioValue: 0,
        profitLoss: 0,
        volume: 0,
        winRate: 0,
        winCount: 0,
        lossCount: 0,
        openPositions: 0
    })

    const isOwner = isAuthenticated && user?.id === username

    const [profileData, setProfileData] = useState({
        username,
        displayName: username.slice(0, 4) + '...' + username.slice(-4),
        walletAddress: username,
        joinedAt: new Date().toISOString(),
        avatarUrl: null as string | null,
    })

    const fetchProfileData = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await userApi.getPublicProfile(username, { limit: 100 })
            const data = response.data

            setProfileData({
                username,
                displayName: data.full_name || username.slice(0, 4) + '...' + username.slice(-4),
                walletAddress: username,
                joinedAt: data.created_at,
                avatarUrl: data.avatar_url ?? null,
            })
            setPositions(data.positions || [])
            setStats({
                portfolioValue: data.stats?.portfolioValue || 0,
                profitLoss: data.stats?.profitLoss || 0,
                volume: data.stats?.volume || 0,
                winRate: data.stats?.winRate || 0,
                winCount: (data.stats as any)?.winCount || 0,
                lossCount: (data.stats as any)?.lossCount || 0,
                openPositions: data.stats?.openPositions || 0,
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

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)
    }

    const truncateAddress = (address: string) => {
        if (address.length <= 10) return address
        return `${address.slice(0, 4)}...${address.slice(-4)}`
    }

    const categoriesList = useMemo(() => {
        const baseCategories = [
            { id: 'esportes', name: 'Esportes', icon: '/assets/svg/profile/football.svg', color: '#00B774' },
            { id: 'social', name: 'Social', icon: '/assets/svg/profile/social.svg', color: '#E922FF' },
            { id: 'cripto', name: 'Cripto', icon: '/assets/svg/profile/btc.svg', color: '#FA9316' },
            { id: 'politica', name: 'Política', icon: '/assets/svg/profile/politics.svg', color: '#0052FF' },
            { id: 'jogos', name: 'Jogos', icon: '/assets/svg/profile/gaming.svg', color: '#8A8C99' },
            { id: 'mercados_rapid', name: 'Mercados Rápid.', icon: '/assets/svg/profile/fast.svg', color: '#8A8C99' },
        ];

        return baseCategories.map((cat) => ({
            ...cat,
            count: positions.filter(p =>
                (p.status === 'active' || p.marketStatus === 'open') && (
                    p.eventCategory?.toLowerCase() === cat.id ||
                    (cat.id === 'esportes' && p.eventCategory?.toLowerCase() === 'esporte') ||
                    (cat.id === 'politica' && (p.eventCategory?.toLowerCase() === 'política' || p.eventCategory?.toLowerCase() === 'politica'))
                )
            ).length
        }));
    }, [positions]);

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
        <div className="flex size-full justify-center px-3 pb-16 pt-[20px]">
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 lg:flex-row lg:gap-8 pb-20 lg:pb-0">
                {/* Left Sidebar */}
                <aside className="flex w-full flex-col items-center lg:w-[320px] lg:items-start shrink-0">
                    {/* Avatar */}
                    <div className="relative mb-6 flex size-[140px] items-center justify-center rounded-full overflow-hidden"
                        style={{
                            background: profileData.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        }}
                    >
                        {profileData.avatarUrl ? (
                            <img
                                src={profileData.avatarUrl}
                                alt={profileData.displayName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-5xl font-bold text-white">
                                {profileData.displayName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* Username & Wallet */}
                    <div className="mb-6 flex flex-col items-center lg:items-start w-full">
                        <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
                            {truncateAddress(profileData.displayName)}
                        </h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCopyAddress}
                                className="flex h-7 items-center justify-center gap-1.5 rounded-full bg-black/5 px-3 text-[13px] font-medium text-muted-foreground transition-all hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                            >
                                {truncateAddress(profileData.walletAddress)}
                                <Copy className="size-3.5" />
                            </button>
                            {isOwner && (
                                <Link
                                    href={`/u/${username}/edit`}
                                    className="flex h-7 items-center justify-center gap-1.5 rounded-full bg-black/5 px-3 text-[13px] font-medium text-muted-foreground transition-all hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                                >
                                    <Edit3 className="size-3.5" />
                                    Editar
                                </Link>
                            )}
                        </div>
                    </div>



                    {/* Bottom Actions (Only for owner) */}
                    {isOwner && (
                        <div className="flex w-full items-center justify-between mt-auto">
                            <Link
                                href="/perfil"
                                className="flex size-9 items-center justify-center rounded-full bg-black/5 text-muted-foreground transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                            >
                                <Settings className="size-4" />
                            </Link>
                            <button
                                onClick={logout}
                                className="flex h-9 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                            >
                                <LogOut className="size-4" />
                                Desconectar
                            </button>
                        </div>
                    )}
                </aside>

                {/* Right Content */}
                <main className="flex w-full flex-col gap-5 lg:pl-5">
                    {/* Portfolio Card (Flat Style) */}
                    <section className="relative z-10 w-full animate-fade-down overflow-hidden rounded-[24px] border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5 p-6 min-h-[220px]">
                        <header className="relative z-10 flex w-full min-h-[165px] justify-between text-black dark:text-white flex-col lg:flex-row max-sm:min-h-[209px]">
                            <div className="flex flex-col gap-3 lg:px-0">
                                {viewMode === 'portfolio' ? (
                                    <div className="flex flex-col gap-3">
                                        <span className="mb-3 flex items-center gap-x-1 text-sm font-normal text-muted-foreground">Valor do Portfólio</span>
                                        <span className="relative bottom-1 text-4xl font-semibold text-black dark:text-[#f0f0f0]">
                                            <Odometer value={stats.portfolioValue} />
                                        </span>
                                        <span className={cn("flex items-center gap-1 text-xs font-medium", stats.profitLoss >= 0 ? "text-[#00B471]" : "text-red-500")}>
                                            {stats.profitLoss >= 0 ? <ArrowUpRight className="size-3" /> : <div className="size-3 rotate-180"><ArrowUpRight className="size-full" /></div>}
                                            {stats.profitLoss > 0 ? '+' : ''}{formatCurrency(stats.profitLoss)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="favorite-categories relative flex w-full flex-col lg:max-w-[430px]">
                                        <div className="flex items-center mb-4">
                                            <h2 className="text-sm font-normal text-muted-foreground">Categorias Favoritas</h2>
                                        </div>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
                                            <div className="flex lg:justify-center shrink-0">
                                                <div className="relative size-[110px]">
                                                    <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                                                        <circle cx="18" cy="18" r="15.9155" fill="none" className="stroke-black/5 dark:stroke-white/5" strokeWidth="3" />
                                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#00B774" strokeWidth="3" strokeDasharray="30 100" />
                                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#E922FF" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="-30" />
                                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#FA9316" strokeWidth="3" strokeDasharray="15 100" strokeDashoffset="-50" />
                                                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#0052FF" strokeWidth="3" strokeDasharray="35 100" strokeDashoffset="-65" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 lg:mt-0">
                                                {categoriesList.map((cat) => (
                                                    <div
                                                        key={cat.id}
                                                        className={cn(
                                                            "flex h-7 items-center gap-2 whitespace-nowrap rounded-full px-3 transition-all",
                                                            cat.count > 0 ? "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 opacity-100" : "bg-transparent border border-black/5 dark:border-white/5 opacity-50"
                                                        )}
                                                    >
                                                        <div className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                                        <span className="text-[11px] font-medium text-black dark:text-white">{cat.count} {cat.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative flex h-fit gap-x-2.5 max-lg:mr-0 max-lg:mt-4 max-lg:self-end">
                                <button className="flex size-[38px] items-center justify-center rounded-full bg-black/5 dark:bg-white/5 transition-colors hover:bg-black/10 hover:dark:bg-white/10 text-muted-foreground">
                                    <svg className="size-4" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.16659 5.00016C9.16659 7.30016 7.29992 9.16683 4.99992 9.16683C2.69992 9.16683 1.29575 6.85016 1.29575 6.85016M1.29575 6.85016H3.17909M1.29575 6.85016V8.9335M0.833252 5.00016C0.833252 2.70016 2.68325 0.833496 4.99992 0.833496C7.77909 0.833496 9.16659 3.15016 9.16659 3.15016M9.16659 3.15016V1.06683M9.16659 3.15016H7.31658" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                </button>
                                <div className="hidden lg:flex">
                                    <div className="relative flex h-[38px] items-center rounded-full bg-black/5 dark:bg-white/5 p-1">
                                        <span
                                            className={cn(
                                                "absolute h-[30px] rounded-full bg-white dark:bg-[#1c1c24] shadow-sm transition-all duration-300 ease-out w-[110px]",
                                                viewMode === 'portfolio' ? "left-1" : "left-[114px]"
                                            )}
                                        />
                                        <button
                                            onClick={() => setViewMode('portfolio')}
                                            className={cn(
                                                "relative z-10 flex h-[30px] w-[110px] items-center justify-center gap-x-2 rounded-full text-xs font-medium transition-colors",
                                                viewMode === 'portfolio' ? "text-black dark:text-white" : "text-muted-foreground"
                                            )}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.05206 11.3501C4.51532 10.8529 5.2215 10.8925 5.62826 11.4348L6.19885 12.1975C6.65645 12.802 7.39653 12.802 7.85413 12.1975L8.42473 11.4348C8.83148 10.8925 9.53766 10.8529 10.0009 11.3501C11.0065 12.4235 11.8257 12.0676 11.8257 10.5648V4.1979C11.8313 1.92118 11.3003 1.35059 9.1648 1.35059H4.89383C2.75834 1.35059 2.22729 1.92118 2.22729 4.1979V10.5592C2.22729 12.0676 3.05211 12.4178 4.05206 11.3501Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path><path d="M4.76953 4.17529H9.28908" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5.33447 6.43506H8.72413" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                            Portfólio
                                        </button>
                                        <button
                                            onClick={() => setViewMode('favorites')}
                                            className={cn(
                                                "relative z-10 flex h-[30px] w-[110px] items-center justify-center gap-x-2 rounded-full text-xs font-medium transition-colors",
                                                viewMode === 'favorites' ? "text-black dark:text-white" : "text-muted-foreground"
                                            )}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.00008 12.3959C9.98012 12.3959 12.3959 9.98012 12.3959 7.00008C12.3959 4.02005 9.98012 1.60425 7.00008 1.60425C4.02005 1.60425 1.60425 4.02005 1.60425 7.00008C1.60425 9.98012 4.02005 12.3959 7.00008 12.3959Z" stroke="currentColor" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.00002 1.60425C5.8122 1.60415 4.65753 1.99601 3.71512 2.71905C2.7727 3.44209 2.0952 4.45589 1.7877 5.60323C1.4802 6.75056 1.55989 7.9673 2.01439 9.06473C2.4689 10.1622 3.27283 11.0789 4.30149 11.6729C5.33016 12.2669 6.52606 12.5048 7.70373 12.3498C8.8814 12.1948 9.97501 11.6555 10.8149 10.8156C11.6549 9.97568 12.1942 8.88209 12.3493 7.70443C12.5043 6.52677 12.2664 5.33085 11.6725 4.30216L7.00002 7.00008V1.60425Z" stroke="currentColor" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.00002 1.60425C6.05284 1.60417 5.12232 1.85343 4.302 2.32697C3.48168 2.8005 2.80047 3.48163 2.32683 4.30189C1.85318 5.12214 1.60381 6.05263 1.60376 6.99981C1.60371 7.947 1.853 8.87751 2.32656 9.69781C2.80012 10.5181 3.48127 11.1993 4.30154 11.6729C5.12181 12.1465 6.0523 12.3959 6.99949 12.3959C7.94667 12.3959 8.87717 12.1466 9.69746 11.673C10.5178 11.1995 11.1989 10.5183 11.6725 9.698L7.00002 7.00008V1.60425Z" stroke="currentColor" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                            Favoritos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {viewMode === 'portfolio' && (
                            <div className="relative mt-5 z-10 flex w-full gap-x-5 lg:gap-x-[30px]">
                                <div className="flex w-full flex-wrap gap-x-5 lg:gap-x-[30px]">
                                    <div className="flex w-fit flex-col gap-[2px]">
                                        <span className="whitespace-nowrap text-xs font-normal text-muted-foreground">O volume total</span>
                                        <span className="whitespace-nowrap font-medium text-lg text-black dark:text-white">
                                            {formatCurrency(stats.volume)}
                                        </span>
                                    </div>
                                    <div className="flex w-fit flex-col gap-[2px]">
                                        <span className="whitespace-nowrap text-xs font-normal text-muted-foreground">Taxa de ganho</span>
                                        <span className="whitespace-nowrap font-medium text-lg text-black dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <span>{stats.winRate.toFixed(0)}%</span>
                                                <div className="flex h-5 w-fit items-center justify-center rounded-md bg-black/10 dark:bg-white/10 px-1.5 text-xs font-medium text-muted-foreground">
                                                    {stats.winCount}W - {stats.lossCount}L
                                                </div>
                                            </div>
                                        </span>
                                    </div>
                                    <div className="flex w-fit flex-col gap-[2px]">
                                        <span className="whitespace-nowrap text-xs font-normal text-muted-foreground">Posições abertas</span>
                                        <span className="whitespace-nowrap font-medium text-lg text-black dark:text-white">{stats.openPositions}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 lg:hidden">
                            <button onClick={() => setViewMode('portfolio')} className={cn("size-2.5 rounded-full transition-all duration-300", viewMode === 'portfolio' ? "bg-black dark:bg-white" : "bg-black/20 dark:bg-white/20")} />
                            <button onClick={() => setViewMode('favorites')} className={cn("size-2.5 rounded-full transition-all duration-300", viewMode === 'favorites' ? "bg-black dark:bg-white" : "bg-black/20 dark:bg-white/20")} />
                        </div>
                    </section>

                    {/* Categories Carousel */}
                    <section className="flex w-full items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {categoriesList.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    if (viewMode !== 'favorites') setViewMode('favorites')
                                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                                }}
                                className={cn(
                                    "flex shrink-0 w-[126px] h-[50px] relative overflow-hidden flex-row items-center gap-3 rounded-xl border p-1.5 transition-all outline-none text-left",
                                    cat.count > 0 ? "opacity-100 bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10" : "opacity-40 bg-transparent border-black/5 dark:border-white/5",
                                    viewMode === 'favorites' && selectedCategory === cat.id ? "ring-2 ring-black/20 dark:ring-white/20" : ""
                                )}
                            >
                                <div className="flex size-[38px] items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: cat.color }}>
                                    <img className="size-[20px]" alt="" src={cat.icon} />
                                </div>
                                <div className="flex flex-col leading-tight overflow-hidden">
                                    <span className="text-[10px] font-normal text-muted-foreground transition-colors truncate">{cat.name}</span>
                                    <span className="text-sm font-semibold text-black dark:text-[#f0f0f0]">{cat.count}</span>
                                </div>
                            </button>
                        ))}
                    </section>

                    {/* Activity Section */}
                    <div className="w-full">
                        <div className="flex w-full items-center gap-1.5 border-b border-black/10 dark:border-white/10 overflow-x-auto scrollbar-hide mb-4">
                            <button
                                onClick={() => setActiveActivityTab('positions')}
                                className={cn(
                                    "relative flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                                    activeActivityTab === 'positions'
                                        ? "text-black dark:text-white"
                                        : "text-[#8A8C99] hover:text-black dark:hover:text-white"
                                )}
                            >
                                Posições
                                {activeActivityTab === 'positions' && (
                                    <div className="absolute bottom-[-1px] left-0 h-[2px] w-full bg-black dark:bg-white" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveActivityTab('activity')}
                                className={cn(
                                    "relative flex items-center justify-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                                    activeActivityTab === 'activity'
                                        ? "text-black dark:text-white"
                                        : "text-[#8A8C99] hover:text-black dark:hover:text-white"
                                )}
                            >
                                Atividades Recentes
                                {activeActivityTab === 'activity' && (
                                    <div className="absolute bottom-[-1px] left-0 h-[2px] w-full bg-black dark:bg-white" />
                                )}
                            </button>
                            <div className="ml-auto hidden max-w-[103px] object-contain opacity-80 lg:block text-muted-foreground font-semibold">
                                <Logo width={100} height={32} />
                            </div>
                        </div>

                        {/* Pass public positions down to ProfilePositions */}
                        <div className="mt-4 w-full">
                            <ProfilePositions
                                positions={activeActivityTab === 'positions' ? filteredPositions.filter(p => p.status === 'active') : filteredPositions.filter(p => p.status === 'settled')}
                                isLoading={isLoading}
                                isOwner={isOwner && activeActivityTab === 'positions'}
                                onPositionClosed={fetchProfileData}
                                hideStatusFilter={true}
                            />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
