'use client'

import { useCallback, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { useBtcPriceRealTime } from '@/hooks/use-market-ws'
import type { BtcPriceTick } from '@/lib/types'

interface BtcPriceChartProps {
    openPrice: number
    initialHistory?: BtcPriceTick[]
    className?: string
}

interface ChartDataPoint {
    time: string
    price: number
    timestamp: number
}

function formatTime(dateStr: string | number): string {
    const d = new Date(dateStr)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function formatPrice(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

export function BtcPriceChart({ openPrice, initialHistory = [], className }: BtcPriceChartProps) {
    const [data, setData] = useState<ChartDataPoint[]>(() => {
        let hist = initialHistory.map(t => ({
            time: formatTime(t.timestamp),
            price: t.price,
            timestamp: new Date(t.timestamp).getTime(),
        }))
        
        // Garante pelo menos 30 pontos preenchendo o passado, para que o SVG path length nunca mude
        // Isso permite que o CSS transition possa animar perfeitamente o 100% fluido (morphing no d attribute)
        if (hist.length < 30) {
            const paddingCount = 30 - hist.length
            const first = hist[0] || { time: formatTime(Date.now()), price: openPrice, timestamp: Date.now() }
            const padded: ChartDataPoint[] = []
            for (let i = 0; i < paddingCount; i++) {
                const ts = first.timestamp - ((paddingCount - i) * 1000)
                padded.push({ time: formatTime(ts), price: first.price, timestamp: ts })
            }
            hist = [...padded, ...hist]
        }
        
        return hist.length > 30 ? hist.slice(-30) : hist
    })

    const handlePriceUpdate = useCallback((update: { price: number; timestamp: string }) => {
        setData(prev => {
            const newPoint: ChartDataPoint = {
                time: formatTime(update.timestamp),
                price: update.price,
                timestamp: new Date(update.timestamp).getTime(),
            }
            
            // Subsititui se for o mesmo timestamp exato, senão adiciona e avança
            if (prev.length > 0 && prev[prev.length - 1].timestamp === newPoint.timestamp) {
                const updated = [...prev]
                updated[updated.length - 1] = newPoint
                return updated
            }

            const updated = [...prev, newPoint]
            return updated.slice(-30)
        })
    }, [])

    useBtcPriceRealTime(handlePriceUpdate)

    // Calculate Y domain com mais zoom (padding menor)
    const prices = data.map(d => d.price)
    const allPrices = [...prices, openPrice]
    const minPrice = Math.min(...allPrices)
    const maxPrice = Math.max(...allPrices)
    const padding = (maxPrice - minPrice) * 0.05 || 5
    const yDomain = [minPrice - padding, maxPrice + padding]

    const currentPrice = data.length > 0 ? data[data.length - 1].price : openPrice
    const isAbove = currentPrice >= openPrice

    const percentFromOpen = ((currentPrice - openPrice) / openPrice) * 100
    // Indicativo quando passa pouco do valor inicial
    const isSignificantMove = Math.abs(percentFromOpen) > 0.01 && data.length > 0

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null
        const point = payload[0].payload
        return (
            <div className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 shadow-lg z-50">
                <p className="text-xs text-zinc-400">{point.time}</p>
                <p className="text-sm font-mono font-bold text-white">
                    {formatPrice(point.price)}
                </p>
            </div>
        )
    }

    const CustomDot = (props: any) => {
        const { cx, cy, index } = props
        if (index === data.length - 1) {
            return (
                <motion.circle 
                    cx={cx}
                    cy={cy}
                    r={6} 
                    animate={{
                        cx,
                        cy,
                        fill: isAbove ? '#22c55e' : '#ef4444'
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 30,
                        damping: 10,
                        mass: 0.8
                    }}
                    className="custom-dot drop-shadow-md"
                />
            )
        }
        return null
    }

    return (
        <div className={`relative ${className || ''}`}>
            {/* O path não tem transição para não distorcer o passado. A bolinha usa framer-motion para física fluida. */}

            {isSignificantMove && (
                <div 
                    className={`absolute top-2 right-4 z-10 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-lg transition-colors duration-500 ${
                        isAbove ? 'bg-green-500/20 text-green-500 border border-green-500/30' : 'bg-red-500/20 text-red-500 border border-red-500/30'
                    }`}
                >
                    {isAbove ? '↑' : '↓'} {(Math.abs(percentFromOpen)).toFixed(3)}%
                </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} className="fluid-chart">
                    <defs>
                        <linearGradient id="btcGradientGreen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="btcGradientRed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis
                        dataKey="time"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        axisLine={{ stroke: '#27272a' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={yDomain}
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}`}
                        width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                        y={openPrice}
                        stroke="#a1a1aa"
                        strokeDasharray="5 5"
                        strokeWidth={1}
                        label={{
                            value: 'Alvo',
                            position: 'right',
                            fill: '#a1a1aa',
                            fontSize: 11,
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isAbove ? '#22c55e' : '#ef4444'}
                        strokeWidth={3}
                        fill={isAbove ? 'url(#btcGradientGreen)' : 'url(#btcGradientRed)'}
                        dot={<CustomDot />}
                        activeDot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
