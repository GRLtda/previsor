'use client'

import { useState, useEffect } from 'react'
import type { Market } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useMarketRealTime } from '@/hooks/use-market-ws'

interface MarketCardTriadProps {
    market: Market
    onYesClick?: () => void
    onNoClick?: () => void
    defaultAmount?: number
}

// Calculate multiplier from probability (1/prob * 100)
function calcMultiplier(prob: number): string {
    if (prob <= 0) return '∞'
    const mult = 100 / prob
    if (mult >= 100) return '100.00x'
    return `${mult.toFixed(2)}x`
}

// Calculate potential return
function calcReturn(amount: number, prob: number): string {
    const multiplier = 100 / prob
    const potentialReturn = amount * multiplier
    return `R$${potentialReturn.toFixed(2)}`
}

export function MarketCardTriad({
    market: initialMarket,
    onYesClick,
    onNoClick,
    defaultAmount = 50
}: MarketCardTriadProps) {
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
                qYes: data.qYes ?? prev.qYes,
                qNo: data.qNo ?? prev.qNo,
                liquidityB: data.liquidityB ?? prev.liquidityB,
            }))
        }
    })

    const yesPercent = Math.round(market.probYes)
    const noPercent = 100 - yesPercent
    const yesMultiplier = calcMultiplier(market.probYes)
    const noMultiplier = calcMultiplier(market.probNo)
    const isMarketOpen = market.status === 'open'

    return (
        <div className="h-full rounded-xl border border-border/40 bg-card/50 transition-all duration-300 ease-in-out p-4 lg:p-5">
            <div className="flex h-full w-full flex-col justify-between">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="mr-3 size-[38px] min-h-[38px] min-w-[38px] rounded-[10px] flex items-center justify-center overflow-hidden lg:mr-4 lg:size-[46px] lg:min-w-[46px]">
                            {market.imageUrl ? (
                                <img src={market.imageUrl} alt={market.statement} className="size-full object-cover" />
                            ) : (
                                <span className="text-lg font-bold">{market.statement.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="ml-0.5 flex flex-col">
                            {/* Title now wraps to multiple lines */}
                            <span className="text-base font-semibold dark:text-white">
                                {market.statement}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4">
                    {/* Probability Display */}
                    <div className="flex flex-col gap-1">
                        <div className="flex w-full items-center justify-between">
                            <span className="text-lg font-bold dark:text-white">{yesPercent}%</span>
                            <span className="text-base font-medium text-[#606E85] dark:text-[#A1A7BB]">Chance</span>
                            <span className="text-lg font-bold dark:text-white">{noPercent}%</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex h-[10px] w-full gap-[3px] overflow-hidden mt-3 rounded-[4px]">
                        <div
                            className="bg-[#22c55e] h-full"
                            style={{ width: `${yesPercent}%`, borderRadius: '4px' }}
                        />
                        <div
                            className="bg-[#ef4444] h-full"
                            style={{ width: `${noPercent}%`, borderRadius: '4px' }}
                        />
                    </div>

                    {/* Yes/No Buttons */}
                    <div className="w-full flex items-center justify-center mt-3">
                        <div className="flex w-full items-start justify-center gap-x-3 sm:gap-x-4">
                            {/* Yes Button */}
                            <div className="flex flex-1 flex-col items-center justify-center">
                                <button
                                    disabled={!isMarketOpen}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onYesClick?.()
                                    }}
                                    className={cn(
                                        "touch-manipulation flex gap-x-2 h-[42px] lg:h-[48px] w-full items-center justify-center rounded-xl font-bold transition-all duration-300 text-sm",
                                        isMarketOpen
                                            ? "bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="min-w-4">
                                        <path d="M6.99935 12.8332C10.2077 12.8332 12.8327 10.2082 12.8327 6.99984C12.8327 3.7915 10.2077 1.1665 6.99935 1.1665C3.79102 1.1665 1.16602 3.7915 1.16602 6.99984C1.16602 10.2082 3.79102 12.8332 6.99935 12.8332Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M4.52051 6.99995L6.17134 8.65079L9.47884 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Sim {yesMultiplier}</span>
                                </button>
                                <div className="mt-[6px] flex w-full justify-center">
                                    <div className="flex items-center gap-1.5 text-[12px] sm:text-xs lg:text-sm font-semibold dark:text-white whitespace-nowrap">
                                        <span>R${defaultAmount}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                        <span className="text-[#22c55e]">{calcReturn(defaultAmount, market.probYes)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* No Button */}
                            <div className="flex flex-1 flex-col items-center justify-center">
                                <button
                                    disabled={!isMarketOpen}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onNoClick?.()
                                    }}
                                    className={cn(
                                        "touch-manipulation flex gap-x-2 h-[42px] lg:h-[48px] w-full items-center justify-center rounded-xl font-bold transition-all duration-300 text-sm",
                                        isMarketOpen
                                            ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                                            : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="min-w-4">
                                        <path d="M6.99935 12.8332C10.2077 12.8332 12.8327 10.2082 12.8327 6.99984C12.8327 3.7915 10.2077 1.1665 6.99935 1.1665C3.79102 1.1665 1.16602 3.7915 1.16602 6.99984C1.16602 10.2082 3.79102 12.8332 6.99935 12.8332Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M5.34863 8.65079L8.6503 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M8.6503 8.65079L5.34863 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span>Não {noMultiplier}</span>
                                </button>
                                <div className="mt-[6px] flex w-full justify-center">
                                    <div className="flex items-center gap-1.5 text-[12px] sm:text-xs lg:text-sm font-semibold dark:text-white whitespace-nowrap">
                                        <span>R${defaultAmount}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                        <span className="text-[#22c55e]">{calcReturn(defaultAmount, market.probNo)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
