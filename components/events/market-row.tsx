'use client'

import { useState, useEffect } from 'react'
import type { Market } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useMarketRealTime } from '@/hooks/use-market-ws'

interface MarketRowProps {
    market: Market
    onYesClick?: () => void
    onNoClick?: () => void
}

// Calculate multiplier from probability (1/prob * 100)
function calcMultiplier(prob: number): string {
    if (prob <= 0) return '∞'
    const mult = 100 / prob
    if (mult >= 100) return '100.00x'
    return `${mult.toFixed(2)}x`
}

export function MarketRow({ market: initialMarket, onYesClick, onNoClick }: MarketRowProps) {
    const [market, setMarket] = useState(initialMarket)

    useEffect(() => {
        setMarket(initialMarket)
    }, [initialMarket])

    useMarketRealTime(market.id, (data) => {
        if (data.marketId === market.id) {
            setMarket(prev => ({
                ...prev,
                probYes: data.probYes ?? prev.probYes,
                probNo: data.probNo ?? prev.probNo,
                status: data.status ?? prev.status,
            }))
        }
    })

    const yesPercent = Math.round(market.probYes)
    // we use market.probNo if we want true data, or just 100 - yesPercent
    const noPercent = Math.round(market.probNo)
    const yesMultiplier = calcMultiplier(market.probYes)
    const noMultiplier = calcMultiplier(market.probNo)
    const isMarketOpen = market.status === 'open'

    return (
        <div className="flex w-full items-center justify-between border-b border-border/40 py-3 sm:py-4 transition-colors hover:bg-white/[0.02] last:border-b-0 px-2 sm:px-4">
            {/* Left side - Icon and Name */}
            <div className="flex w-[40%] sm:w-[45%] items-center gap-3">
                <div className="flex h-10 w-10 min-w-[40px] sm:h-12 sm:w-12 sm:min-w-[48px] items-center justify-center overflow-hidden rounded-xl bg-muted/30 dark:bg-white/5">
                    {market.imageUrl ? (
                        <img src={market.imageUrl} alt="" className="size-full object-cover" />
                    ) : (
                        <span className="text-sm sm:text-base font-bold dark:text-white">
                            {market.statement.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <h3 className="line-clamp-2 text-[13px] sm:text-[15px] font-semibold dark:text-white leading-tight">
                    {market.statement}
                </h3>
            </div>

            {/* Middle - Percentage */}
            <div className="flex w-[20%] flex-col items-center justify-center">
                <span className="text-xl sm:text-2xl font-bold dark:text-white leading-none tracking-tight">
                    {yesPercent}%
                </span>
            </div>

            {/* Right side - Buttons */}
            <div className="flex w-[40%] sm:w-[35%] items-center justify-end gap-2 sm:gap-3">
                <button
                    disabled={!isMarketOpen}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onYesClick?.()
                    }}
                    className={cn(
                        "flex h-[38px] sm:h-[42px] flex-1 items-center justify-center gap-1 sm:gap-2 rounded-xl border font-bold transition-all duration-300 px-1 sm:px-3 text-xs sm:text-sm",
                        isMarketOpen
                            ? "border-transparent bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"
                            : "border-transparent bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    )}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="min-w-3.5 shrink-0"><path d="M6.99935 12.8332C10.2077 12.8332 12.8327 10.2082 12.8327 6.99984C12.8327 3.7915 10.2077 1.1665 6.99935 1.1665C3.79102 1.1665 1.16602 3.7915 1.16602 6.99984C1.16602 10.2082 3.79102 12.8332 6.99935 12.8332Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path><path d="M4.52051 6.99995L6.17134 8.65079L9.47884 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    <span className="truncate">Sim {yesMultiplier}</span>
                </button>
                <button
                    disabled={!isMarketOpen}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onNoClick?.()
                    }}
                    className={cn(
                        "flex h-[38px] sm:h-[42px] flex-1 items-center justify-center gap-1 sm:gap-2 rounded-xl border font-bold transition-all duration-300 px-1 sm:px-3 text-xs sm:text-sm",
                        isMarketOpen
                            ? "border-transparent bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                            : "border-transparent bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                    )}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0"><path d="M6.99935 12.8332C10.2077 12.8332 12.8327 10.2082 12.8327 6.99984C12.8327 3.7915 10.2077 1.1665 6.99935 1.1665C3.79102 1.1665 1.16602 3.7915 1.16602 6.99984C1.16602 10.2082 3.79102 12.8332 6.99935 12.8332Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5.34863 8.65079L8.6503 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path><path d="M8.6503 8.65079L5.34863 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    <span className="truncate">Não {noMultiplier}</span>
                </button>
            </div>
        </div>
    )
}
