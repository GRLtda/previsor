'use client'

import { cn } from '@/lib/utils'
import type { Market } from '@/lib/types'

interface OutcomeRowProps {
    market: Market
    onYesClick?: () => void
    onNoClick?: () => void
}

// Calculate multiplier from probability (1/prob)
function calcMultiplier(prob: number): string {
    if (prob <= 0) return '∞'
    const mult = 100 / prob
    if (mult >= 100) return '100.00x'
    return `${mult.toFixed(2)}x`
}

export function OutcomeRow({ market, onYesClick, onNoClick }: OutcomeRowProps) {
    const yesMultiplier = calcMultiplier(market.probYes)
    const noMultiplier = calcMultiplier(market.probNo)

    return (
        <div className="relative h-8 w-full cursor-pointer rounded-md transition-all duration-300 ease-in-out">
            <div className="relative z-10 flex size-full items-center justify-between">
                {/* Left side - Icon and Name */}
                <div className="flex w-4/12 items-center gap-1.5 lg:w-[37%]">
                    {/* Icon Circle */}
                    <div className="flex max-h-5 min-h-5 min-w-5 max-w-5 items-center justify-center overflow-hidden rounded-full bg-muted">
                        <span className="text-[10px] font-bold">
                            {market.statement.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    {/* Name */}
                    <h3 className="truncate whitespace-nowrap text-[13px] font-medium dark:text-white">
                        {market.statement}
                    </h3>
                </div>

                {/* Right side - Yes/No Buttons */}
                <div className="flex items-center">
                    <div className="flex items-center gap-x-1.5">
                        {/* Yes Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onYesClick?.()
                            }}
                            className="gap-x-2 flex items-center justify-center outline-none py-1 rounded-lg h-[30px] transition-all duration-300 px-1.5 ease-in-out w-full whitespace-nowrap max-w-[93px] lg:max-w-[96px] min-w-[93px] lg:min-w-[96px] font-semibold text-xs bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"
                        >
                            {/* Checkmark Icon */}
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="min-w-3.5">
                                <path d="M6.99935 12.8332C10.2077 12.8332 12.8327 10.2082 12.8327 6.99984C12.8327 3.7915 10.2077 1.1665 6.99935 1.1665C3.79102 1.1665 1.16602 3.7915 1.16602 6.99984C1.16602 10.2082 3.79102 12.8332 6.99935 12.8332Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M4.52051 6.99995L6.17134 8.65079L9.47884 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>Yes {yesMultiplier}</span>
                        </button>

                        {/* No Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onNoClick?.()
                            }}
                            className="gap-x-2 flex items-center justify-center outline-none py-1 rounded-lg h-[30px] transition-all duration-300 px-1.5 ease-in-out w-full whitespace-nowrap max-w-[93px] lg:max-w-[96px] min-w-[93px] lg:min-w-[96px] font-semibold text-xs text-red-500 hover:bg-red-500 hover:text-white bg-red-500/10"
                        >
                            {/* X Icon */}
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.99935 12.8332C10.2077 12.8332 12.8327 10.2082 12.8327 6.99984C12.8327 3.7915 10.2077 1.1665 6.99935 1.1665C3.79102 1.1665 1.16602 3.7915 1.16602 6.99984C1.16602 10.2082 3.79102 12.8332 6.99935 12.8332Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.34863 8.65079L8.6503 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8.6503 8.65079L5.34863 5.34912" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span>No {noMultiplier}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
