'use client'

import { useState } from 'react'
import type { Market } from '@/lib/types'
import { cn } from '@/lib/utils'

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
    market,
    onYesClick,
    onNoClick,
    defaultAmount = 50
}: MarketCardTriadProps) {
    const yesPercent = Math.round(market.probYes)
    const noPercent = 100 - yesPercent
    const yesMultiplier = calcMultiplier(market.probYes)
    const noMultiplier = calcMultiplier(market.probNo)

    return (
        <div className="mt-2.5 rounded-2xl bg-black/5 transition-all duration-300 ease-in-out first-of-type:mt-0 dark:bg-white/5 lg:mt-0 lg:p-0">
            <div className="flex w-full flex-col gap-y-2.5 rounded-2xl p-3 hover:lg:bg-white/5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {/* Market Image - using first letter as fallback */}
                        <div className="mr-3 size-10 min-h-10 min-w-10 rounded-[10px] bg-muted flex items-center justify-center overflow-hidden lg:mr-4 lg:size-[46px] lg:min-w-[46px]">
                            <span className="text-lg font-bold">{market.statement.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-0.5 flex flex-col">
                            {/* Title now wraps to multiple lines */}
                            <span className="text-base font-semibold dark:text-white">
                                {market.statement}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Always expanded content (no toggle) */}
                <div>
                    {/* Probability Display */}
                    <div className="flex flex-col gap-1">
                        <div className="flex w-full items-center justify-between">
                            <span className="text-lg font-bold dark:text-white">{yesPercent}%</span>
                            <span className="text-base font-medium text-[#606E85] dark:text-[#A1A7BB]">Chance</span>
                            <span className="text-lg font-bold dark:text-white">{noPercent}%</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative mt-1 w-full overflow-hidden rounded-lg" style={{ height: '6px' }}>
                        <div
                            className="absolute left-0 top-0 h-full rounded-l-full bg-[#00B471]"
                            style={{ width: `calc(${yesPercent}% - 5px)` }}
                        />
                        <div
                            className="absolute right-0 top-0 h-full rounded-r-full bg-[#EE5F67]"
                            style={{ width: `calc(${noPercent}% - 5px)` }}
                        />
                    </div>

                    {/* Yes/No Buttons */}
                    <div className="w-full flex items-center justify-center mt-3">
                        <div className="flex items-center justify-end gap-x-2.5 max-sm:w-full lg:w-full lg:justify-center">
                            {/* Yes Button */}
                            <div className="flex w-full flex-col items-center justify-center">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onYesClick?.()
                                    }}
                                    className="touch-manipulation flex px-3 h-[48px] w-full items-center justify-between rounded-[10px] font-bold transition-colors duration-100 ease-in-out hover:bg-[#00A366] active:bg-[#00B471] bg-[#00B471] text-white text-sm"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <svg width="18" height="18" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M3.875 5.99996L5.29 7.41496L8.125 4.58496" stroke="#fff" strokeWidth="1.03571" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>Yes</span>
                                    </div>
                                    <div className="flex h-[23px] w-[51px] items-center justify-center rounded-[200px] bg-white">
                                        <span className="text-xs font-semibold text-black">{yesMultiplier}</span>
                                    </div>
                                </button>
                                <div className="mt-[6px] flex w-full justify-center">
                                    <div className="flex items-center gap-x-1 text-sm font-semibold dark:text-white">
                                        <span>R${defaultAmount}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                        <span className="text-[#00B471]">{calcReturn(defaultAmount, market.probYes)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* No Button */}
                            <div className="flex w-full flex-col items-center justify-center">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onNoClick?.()
                                    }}
                                    className="touch-manipulation flex px-3 h-[48px] w-full items-center justify-between rounded-[10px] font-bold transition-colors duration-100 ease-in-out bg-[#EE5F67] text-white hover:bg-[#D6555D] active:bg-[#EE5F67] text-sm"
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        <svg width="18" height="18" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M4.58496 7.41496L7.41496 4.58496" stroke="#fff" strokeWidth="1.03571" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M7.41496 7.41496L4.58496 4.58496" stroke="#fff" strokeWidth="0.776786" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>No</span>
                                    </div>
                                    <div className="flex h-[23px] w-[51px] items-center justify-center rounded-[200px] bg-white">
                                        <span className="text-xs font-semibold text-black">{noMultiplier}</span>
                                    </div>
                                </button>
                                <div className="mt-[6px] flex w-full justify-center">
                                    <div className="flex items-center gap-x-1 text-sm font-semibold dark:text-white">
                                        <span>R${defaultAmount}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                        <span className="text-[#00B471]">{calcReturn(defaultAmount, market.probNo)}</span>
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
