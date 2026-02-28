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
                        <div className="flex items-center justify-end gap-x-2.5 max-sm:w-full lg:w-full lg:justify-center">
                            {/* Yes Button */}
                            <div className="flex w-full flex-col items-center justify-center">
                                <button
                                    disabled={!isMarketOpen}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onYesClick?.()
                                    }}
                                    className={cn(
                                        "touch-manipulation flex px-3 h-[42px] lg:h-[48px] w-full items-center justify-between rounded-xl font-bold transition-all duration-200 border text-sm",
                                        isMarketOpen
                                            ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/20"
                                            : "bg-muted text-muted-foreground border-border/40 opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <svg width="18" height="18" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M3.875 5.99996L5.29 7.41496L8.125 4.58496" stroke="currentColor" strokeWidth="1.03571" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Sim</span>
                                    </div>
                                    <div className="flex min-h-[22px] px-2 items-center justify-center rounded-[6px] bg-[#22c55e]">
                                        <span className="text-[11px] font-bold text-white">{yesMultiplier}</span>
                                    </div>
                                </button>
                                <div className="mt-[6px] flex w-full justify-center">
                                    <div className="flex items-center gap-x-1 text-sm font-semibold dark:text-white">
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
                            <div className="flex w-full flex-col items-center justify-center">
                                <button
                                    disabled={!isMarketOpen}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onNoClick?.()
                                    }}
                                    className={cn(
                                        "touch-manipulation flex px-3 h-[42px] lg:h-[48px] w-full items-center justify-between rounded-xl font-bold transition-all duration-200 border text-sm",
                                        isMarketOpen
                                            ? "bg-[#ef4444]/10 border-[#ef4444]/30 text-[#ef4444] hover:bg-[#ef4444]/20"
                                            : "bg-muted text-muted-foreground border-border/40 opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <svg width="18" height="18" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M4.58496 7.41496L7.41496 4.58496" stroke="currentColor" strokeWidth="1.03571" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M7.41496 7.41496L4.58496 4.58496" stroke="currentColor" strokeWidth="0.776786" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Não</span>
                                    </div>
                                    <div className="flex min-h-[22px] px-2 items-center justify-center rounded-[6px] bg-[#ef4444]">
                                        <span className="text-[11px] font-bold text-white">{noMultiplier}</span>
                                    </div>
                                </button>
                                <div className="mt-[6px] flex w-full justify-center">
                                    <div className="flex items-center gap-x-1 text-sm font-semibold dark:text-white">
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
