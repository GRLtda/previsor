'use client'

import type { QuickRound } from '@/lib/types'
import { cn } from '@/lib/utils'
import { TriangleAlert } from 'lucide-react'

interface RoundHistoryBadgesProps {
    rounds: QuickRound[]
    className?: string
}

export function RoundHistoryBadges({ rounds, className }: RoundHistoryBadgesProps) {
    // Show last 5 resolved rounds (most recent first)
    const resolved = rounds
        .filter(r => r.roundStatus === 'settled' || r.roundStatus === 'annulled')
        .slice(0, 5)
        .reverse() // oldest first for display left-to-right

    if (resolved.length === 0) return null

    return (
        <div className={cn('flex items-center gap-1', className)}>
            <span className="text-xs text-zinc-500 mr-1">Últimos</span>
            {resolved.map((round) => {
                if (round.result === 'ANNULLED' || round.roundStatus === 'annulled') {
                    return (
                        <span
                            key={round.id}
                            className="w-6 h-6 flex items-center justify-center rounded bg-zinc-700"
                            title={`Rodada #${round.roundNumber} - Anulada`}
                        >
                            <TriangleAlert className="w-3 h-3 text-yellow-500" />
                        </span>
                    )
                }

                const isSobe = round.result === 'YES'
                return (
                    <span
                        key={round.id}
                        className={cn(
                            'w-6 h-6 flex items-center justify-center rounded',
                            isSobe ? 'bg-emerald-900/50' : 'bg-red-900/50'
                        )}
                        title={`Rodada #${round.roundNumber} - ${isSobe ? 'Sobe' : 'Desce'}`}
                    >
                        {isSobe ? (
                            <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 10 10" fill="currentColor">
                                <polygon points="5,1 9,9 1,9" />
                            </svg>
                        ) : (
                            <svg className="w-3 h-3 text-red-400" viewBox="0 0 10 10" fill="currentColor">
                                <polygon points="5,9 9,1 1,1" />
                            </svg>
                        )}
                    </span>
                )
            })}
        </div>
    )
}
