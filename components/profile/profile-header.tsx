'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Copy, Check, Gift, Calendar, Edit, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

interface ProfileStats {
    portfolioValue: number
    profitLoss: number
    volume: number
    winRate: number
}

interface ProfileHeaderProps {
    username: string
    displayName: string
    avatarUrl?: string | null
    walletAddress?: string
    joinedAt: string
    stats: ProfileStats
    isOwner?: boolean
    gradientColor?: string // Hex color for gradient
}

export function ProfileHeader({
    username,
    displayName,
    avatarUrl,
    walletAddress,
    joinedAt,
    stats,
    isOwner = false,
    gradientColor = '#22c55e', // default green
}: ProfileHeaderProps) {
    const [copied, setCopied] = useState(false)

    const handleCopyAddress = async () => {
        if (!walletAddress) return
        try {
            await navigator.clipboard.writeText(walletAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (e) {
            console.error('Failed to copy:', e)
        }
    }

    const truncateAddress = (address: string) => {
        if (address.length <= 12) return address
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value / 100)
    }

    const formatPercent = (value: number) => {
        return `${value.toFixed(0)}%`
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return `Entrou em ${date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
    }

    // Generate gradient from color
    const gradientStyle = {
        background: `linear-gradient(135deg, ${gradientColor}40 0%, ${gradientColor}20 50%, transparent 100%)`,
    }

    return (
        <div className="relative">
            {/* Gradient Background */}
            <div
                className="absolute inset-0 h-48 rounded-t-xl"
                style={gradientStyle}
            />

            <div className="relative px-6 pt-8 pb-6">
                {/* Top Section: Avatar + Info + Stats */}
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Avatar */}
                    <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                        <AvatarFallback
                            className="text-3xl font-bold"
                            style={{ backgroundColor: `${gradientColor}60`, color: gradientColor }}
                        >
                            {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {/* Name & Info */}
                    <div className="flex-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">{displayName}</h1>
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                                    {walletAddress && (
                                        <button
                                            onClick={handleCopyAddress}
                                            className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <span className="font-mono text-xs">{truncateAddress(walletAddress)}</span>
                                            {copied ? (
                                                <Check className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <Copy className="h-3 w-3" />
                                            )}
                                        </button>
                                    )}
                                    <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                                        <Gift className="h-3 w-3" />
                                        Tips
                                    </button>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(joinedAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Edit Button (only for owner) */}
                            {isOwner && (
                                <Link href="/profile/edit">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Edit className="h-4 w-4" />
                                        Editar
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 md:gap-6">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Valor do Portfolio</p>
                            <p className="text-lg font-bold">{formatCurrency(stats.portfolioValue)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Lucro/perda</p>
                            <p className={cn(
                                "text-lg font-bold",
                                stats.profitLoss >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                                {stats.profitLoss >= 0 ? '+' : ''}{formatCurrency(stats.profitLoss)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Volume</p>
                            <p className="text-lg font-bold">{formatCurrency(stats.volume)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">Taxa de ganho</p>
                            <p className="text-lg font-bold">{formatPercent(stats.winRate)}</p>
                        </div>
                    </div>
                </div>

                {/* Brand Logo */}
                <div className="absolute top-4 right-4 text-muted-foreground opacity-50">
                    <Logo width={100} height={32} />
                </div>
            </div>
        </div>
    )
}
