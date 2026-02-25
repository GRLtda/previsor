'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { userApi } from '@/lib/api/client'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/logo'
import { Copy, Edit3, LogOut, Settings, Award, Droplets, RefreshCw, X, ChevronUp } from 'lucide-react'

export default function PublicProfilePage() {
    const params = useParams()
    const username = params.username as string
    const { user, isAuthenticated, logout } = useAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('missions')
    const [copied, setCopied] = useState(false)

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
        if (address.length <= 10) return address
        return `${address.slice(0, 4)}...${address.slice(-4)}`
    }

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

                    {/* Level Progress */}
                    <div className="mb-6 flex w-full flex-col gap-2">
                        <div className="flex w-full items-center justify-between text-sm font-bold text-black dark:text-white">
                            <span>LVL 1</span>
                            <span>0%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                            <div className="h-full w-0 bg-brand rounded-full transition-all duration-500" />
                        </div>
                        <div className="flex w-full justify-end text-xs font-medium text-muted-foreground">
                            0 / 100 XP
                        </div>
                    </div>

                    {/* Bio */}
                    <p className="mb-6 w-full text-center text-sm font-medium text-muted-foreground lg:text-left">
                        Sou um predictor na Triad Markets.
                    </p>

                    {/* Connect Buttons */}
                    <div className="mb-10 flex w-full gap-3">
                        <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-transparent text-sm font-medium text-black transition-colors hover:bg-muted/50 dark:text-white">
                            Connect <X className="size-4" />
                        </button>
                        <button className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-transparent text-sm font-medium text-black transition-colors hover:bg-muted/50 dark:text-white">
                            Connect <svg viewBox="0 0 24 24" className="size-4 fill-current"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.008 17.508c-2.348 0-4.25-1.902-4.25-4.25s1.902-4.25 4.25-4.25 4.25 1.902 4.25 4.25-1.902 4.25-4.25 4.25zm5.727-2.316c-1.424 0-2.583-1.159-2.583-2.583s1.159-2.583 2.583-2.583 2.583 1.159 2.583 2.583-1.159 2.583-2.583 2.583z"/></svg>
                        </button>
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
                    {/* Top Cards Grid */}
                    <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
                        {/* TRIAD Score Card */}
                        <div className="relative flex min-h-[140px] w-full flex-col overflow-hidden rounded-[20px] border border-border bg-card p-6">
                            <div className="pointer-events-none absolute -right-[15%] -top-[30%] h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.1)_0%,transparent_70%)]" />
                            
                            <div className="flex w-full items-start justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-muted-foreground mb-3">TRIAD Score</span>
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-4xl font-bold tracking-tight text-black dark:text-white">100</span>
                                        <span className="text-sm font-medium text-muted-foreground">/1000</span>
                                        <span className="ml-2 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-600">
                                            Low Score
                                        </span>
                                    </div>
                                    
                                    {/* Score Progress Segments */}
                                    <div className="flex gap-1.5 w-full max-w-[200px]">
                                        <div className="h-1.5 flex-1 rounded-full bg-amber-500" />
                                        <div className="h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/10" />
                                        <div className="h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/10" />
                                        <div className="h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/10" />
                                        <div className="h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/10" />
                                        <div className="h-1.5 flex-1 rounded-full bg-black/10 dark:bg-white/10" />
                                    </div>
                                </div>
                                
                                {/* Hexagon Badge */}
                                <div className="relative flex size-[70px] shrink-0 items-center justify-center">
                                    <div className="absolute inset-0 rounded-2xl bg-amber-900 rotate-45 transform" />
                                    <div className="absolute inset-[3px] rounded-[14px] bg-gradient-to-br from-amber-700 to-amber-900 rotate-45 transform" />
                                    <Award className="relative z-10 size-8 text-amber-100" />
                                </div>
                            </div>
                        </div>

                        {/* Recompensa & Info */}
                        <div className="flex w-full gap-5">
                            {/* Recompensa Atual */}
                            <div className="flex flex-1 flex-col justify-between rounded-[20px] border border-border bg-card p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                                        <svg viewBox="0 0 24 24" className="size-5 text-emerald-600 fill-current"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h2.25c.1 1.05.85 1.49 2.01 1.49 1.43 0 2.22-.72 2.22-1.76 0-1.11-.9-1.54-2.58-2.07C9.37 11.69 8 10.9 8 8.84c0-1.77 1.35-2.91 3.32-3.32V4h2.67v1.54c1.46.28 2.65 1.13 2.91 2.89h-2.22c-.15-.81-.84-1.28-1.99-1.28-1.07 0-1.91.56-1.91 1.54 0 1.07.86 1.46 2.58 2.03 2.15.7 3.52 1.63 3.52 3.66.01 1.96-1.44 3.09-3.47 3.51z"/></svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-muted-foreground">Recompensa Atual</span>
                                        <span className="text-lg font-bold text-black dark:text-white">R$0.00</span>
                                    </div>
                                </div>
                                <button className="mt-4 h-9 w-full rounded-lg bg-black/5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-black/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                                    Resgatar
                                </button>
                            </div>

                            {/* O que é Info */}
                            <div className="flex flex-1 flex-col rounded-[20px] border border-border bg-card p-5">
                                <span className="mb-2 text-sm font-medium text-muted-foreground">O que é TRIAD Score?</span>
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                    A pontuação TRIAD reflete sua participação em previsões e missões. 
                                    Maior atividade resulta em maiores recompensas mensais.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mt-2 w-full">
                        <div className="flex w-full items-center gap-1">
                            <button
                                onClick={() => setActiveTab('missions')}
                                className={cn(
                                    "flex h-9 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all",
                                    activeTab === 'missions' 
                                        ? "bg-white text-black dark:bg-white dark:text-black" 
                                        : "bg-transparent text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                Missões
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={cn(
                                    "flex h-9 items-center justify-center rounded-full px-5 text-sm font-semibold transition-all",
                                    activeTab === 'activity' 
                                        ? "bg-white text-black dark:bg-white dark:text-black" 
                                        : "bg-transparent text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                Atividade
                            </button>
                            <div className="ml-auto hidden max-w-[103px] object-contain opacity-80 lg:block text-muted-foreground font-semibold">
                                <Logo width={100} height={32} />
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="mt-6 w-full">
                            {activeTab === 'missions' && (
                                <div className="flex w-full flex-col gap-3">
                                    {/* Mission Group Header */}
                                    <div className="flex w-full items-center justify-between rounded-t-xl py-3 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-9 items-center justify-center rounded-full border border-border bg-card">
                                                <RefreshCw className="size-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-black dark:text-white">Repeatable Missions</span>
                                                <span className="text-xs text-muted-foreground">Complete missions daily to earn XP</span>
                                            </div>
                                        </div>
                                        <button className="flex size-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                            <ChevronUp className="size-4 text-muted-foreground" />
                                        </button>
                                    </div>

                                    {/* Missions List Row */}
                                    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                                        {/* Predict Markets */}
                                        <div className="flex w-full flex-col justify-between overflow-hidden rounded-[20px] border border-border bg-card p-5 min-h-[160px]">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-brand/10">
                                                        <Award className="size-5 text-brand" />
                                                    </div>
                                                    <span className="text-base font-bold text-black dark:text-white">Predict Markets</span>
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">1 Ponto por $1</span>
                                            </div>
                                            <div className="flex w-full items-center justify-between mt-6">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <RefreshCw className="size-3.5" /> Repeatable
                                                </div>
                                                <div className="flex items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1 text-xs font-bold text-black dark:bg-white/10 dark:text-white">
                                                    <span className="opacity-60">XP</span> 1
                                                </div>
                                            </div>
                                        </div>

                                        {/* Add Order Book Liquidity */}
                                        <div className="flex w-full flex-col justify-between overflow-hidden rounded-[20px] border border-border bg-card p-5 min-h-[160px]">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                                                        <Droplets className="size-5 text-emerald-500" />
                                                    </div>
                                                    <span className="text-base font-bold text-black dark:text-white">Add Order Book Liquidity</span>
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">1 Ponto por $1</span>
                                            </div>
                                            <div className="flex w-full items-center justify-between mt-6">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <RefreshCw className="size-3.5" /> Repeatable
                                                </div>
                                                <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">
                                                    <span className="flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-white">$</span>
                                                    10
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'activity' && (
                                <div className="flex w-full flex-col items-center justify-center py-12 text-muted-foreground">
                                    <span className="text-sm">Nenhuma atividade recente.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
