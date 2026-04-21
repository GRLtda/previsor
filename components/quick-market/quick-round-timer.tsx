'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface QuickRoundTimerProps {
    endsAt: string
    className?: string
    size?: 'sm' | 'lg'
}

export function QuickRoundTimer({ endsAt, className, size = 'lg' }: QuickRoundTimerProps) {
    const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, total: 0 })
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        const endTime = new Date(endsAt).getTime()

        function update() {
            const now = Date.now()
            const diff = Math.max(0, endTime - now)
            const totalSeconds = Math.ceil(diff / 1000)
            const minutes = Math.floor(totalSeconds / 60)
            const seconds = totalSeconds % 60

            setTimeLeft({ minutes, seconds, total: totalSeconds })

            if (diff > 0) {
                rafRef.current = requestAnimationFrame(update)
            }
        }

        update()

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [endsAt])

    const isUrgent = timeLeft.total <= 30
    const isExpired = timeLeft.total <= 0

    if (size === 'sm') {
        return (
            <span className={cn(
                'font-mono font-bold tabular-nums',
                isExpired ? 'text-zinc-500' : isUrgent ? 'text-red-400 animate-pulse' : 'text-emerald-400',
                className
            )}>
                {isExpired ? '00:00' : `${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`}
            </span>
        )
    }

    return (
        <div className={cn('flex items-baseline gap-1', className)}>
            <span className={cn(
                'font-mono font-bold text-4xl tabular-nums tracking-tight',
                isExpired ? 'text-zinc-500' : isUrgent ? 'text-red-400 animate-pulse' : 'text-emerald-400'
            )}>
                {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className={cn(
                'font-mono text-4xl tabular-nums',
                isExpired ? 'text-zinc-500' : isUrgent ? 'text-red-400 animate-pulse' : 'text-emerald-400'
            )}>
                {String(timeLeft.seconds).padStart(2, '0')}
            </span>
            <div className="flex flex-col text-[10px] text-zinc-500 leading-tight ml-1">
                <span>MINS</span>
                <span>SECS</span>
            </div>
        </div>
    )
}
