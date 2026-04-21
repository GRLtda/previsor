'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useBtcPriceRealTime } from '@/hooks/use-market-ws'

export function LiveBtcTicker({ openPrice, initialPrice, live }: { openPrice: number, initialPrice: number | null, live: boolean }) {
    const [displayPrice, setDisplayPrice] = useState<number | null>(initialPrice)

    const targetRef = useRef(initialPrice || 0)
    const currentRef = useRef(initialPrice || 0)
    const velocityRef = useRef(0)

    const handleUpdate = useCallback((update: { price: number }) => {
        if (!live) return
        targetRef.current = update.price
    }, [live])

    useBtcPriceRealTime(handleUpdate)

    useEffect(() => {
        let raf: number
        let last = performance.now()

        const loop = (now: number) => {
            const dt = Math.min((now - last) / 1000, 0.1)
            last = now

            const current = currentRef.current
            const target = targetRef.current
            let velocity = velocityRef.current

            // Spring smoothing for the live BTC readout.
            const stiffness = 120
            const damping = 0.8

            const force = (target - current) * stiffness
            velocity += force * dt
            velocity *= damping

            const next = current + velocity * dt

            currentRef.current = next
            velocityRef.current = velocity

            setDisplayPrice(next)

            raf = requestAnimationFrame(loop)
        }

        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [])

    if (displayPrice == null) return null

    const formattedPrice = displayPrice.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

    return (
        <div className="flex flex-col items-end">
            <span className="text-[10px] text-[#606E85] dark:text-[#A1A7BB] uppercase">
                Preco Atual (USD)
            </span>

            <span className={cn(
                'text-sm font-mono font-bold',
                displayPrice >= openPrice ? 'text-[#22c55e]' : 'text-[#ef4444]'
            )}>
                {formattedPrice}
            </span>
        </div>
    )
}
