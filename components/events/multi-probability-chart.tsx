'use client'

import { useEffect, useState, useMemo } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'
import { userApi } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Market } from '@/lib/types'

interface HistoryPoint {
    timestamp: string
    probYes: number
    probNo: number
}

// Data point combining multiple markets by timestamp
interface CombinedPoint {
    timestamp: string
    [marketId: string]: any // probYes
}

interface MultiProbabilityChartProps {
    markets: Market[]
    height?: number
    className?: string
}

type Period = '1d' | '1w' | '1m' | 'all'

const PERIODS: { value: Period; label: string }[] = [
    { value: '1d', label: '1D' },
    { value: '1w', label: '1S' },
    { value: '1m', label: '1M' },
    { value: 'all', label: 'Tudo' },
]

// Professional distinct colors for the lines
const CHART_COLORS = [
    '#00C9A7', // teal
    '#FF5F58', // red
    '#1A6BFF', // primary blue
    '#A052FF', // purple
    '#F5A623', // orange
    '#22c55e', // green
]

const GRID_COLOR = 'rgba(255, 255, 255, 0.08)'
const AXIS_COLOR = 'rgba(255, 255, 255, 0.4)'

// Format X-axis date labels based on period
function formatXDate(timestamp: string, period: Period): string {
    if (!timestamp || typeof timestamp !== 'string') return ''
    try {
        const date = parseISO(timestamp)
        switch (period) {
            case '1d':
                return format(date, 'HH:mm')
            case '1w':
                return format(date, 'dd/MM', { locale: ptBR })
            case '1m':
                return format(date, 'dd/MM', { locale: ptBR })
            case 'all':
                return format(date, "dd MMM", { locale: ptBR })
        }
    } catch {
        return ''
    }
}

// Custom tooltip component matching screenshot
function ChartTooltip({ active, payload, label, markets }: any) {
    if (!active || !payload?.length || typeof label !== 'string') return null

    let formattedDate = label
    try {
        const date = parseISO(label)
        formattedDate = format(date, "dd MMM. 'às' HH:mm", { locale: ptBR })
    } catch (e) {
        // Fallback to raw label if parsing fails
    }

    // Sort payload by value descending so the highest prob is at the top
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value)

    return (
        <div className="rounded-lg border border-white/10 bg-[#12121a]/95 px-4 py-3 shadow-xl backdrop-blur-md">
            <p className="mb-2 text-[13px] font-medium text-white/90">{formattedDate}</p>
            <div className="flex flex-col gap-1.5">
                {sortedPayload.map((entry: any, index: number) => {
                    const market = markets.find((m: Market) => m.id === entry.dataKey)
                    if (!market) return null
                    return (
                        <div key={entry.dataKey} className="flex items-center gap-2">
                            <span
                                className="font-semibold text-sm truncate max-w-[150px]"
                                style={{ color: entry.stroke }}
                            >
                                {market.statement}:
                            </span>
                            <span
                                className="font-semibold text-sm"
                                style={{ color: entry.stroke }}
                            >
                                {entry.value.toFixed(1)}%
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function MultiProbabilityChart({
    markets,
    height = 360,
    className,
}: MultiProbabilityChartProps) {
    const [period, setPeriod] = useState<Period>('all')
    const [data, setData] = useState<CombinedPoint[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch data for all markets when period changes
    useEffect(() => {
        let cancelled = false

        async function fetchAllHistory() {
            setLoading(true)
            try {
                // Fetch histories concurrently
                const promises = markets.map(m => userApi.getMarketHistory(m.id, period))
                const results = await Promise.all(promises)

                if (cancelled) return

                // Combine histories by timestamp
                const timeMap = new Map<string, CombinedPoint>()

                // Populate with current values as a baseline/fallback
                const now = new Date().toISOString()
                const baselineData: CombinedPoint = { timestamp: now }
                markets.forEach((m) => {
                    baselineData[m.id] = m.probYes
                })

                results.forEach((res, index) => {
                    const marketId = markets[index].id
                    res.history.forEach((point) => {
                        let combined = timeMap.get(point.timestamp)
                        if (!combined) {
                            combined = { timestamp: point.timestamp }
                            timeMap.set(point.timestamp, combined)
                        }
                        combined[marketId] = point.probYes
                    })
                })

                let combinedArray = Array.from(timeMap.values())
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

                // Fill gaps using previous known value (Last Observation Carried Forward)
                markets.forEach(m => {
                    let lastKnown = m.probYes // start with current prob if history is completely empty
                    for (let i = 0; i < combinedArray.length; i++) {
                        if (combinedArray[i][m.id] !== undefined) {
                            lastKnown = combinedArray[i][m.id]
                        } else {
                            combinedArray[i][m.id] = lastKnown
                        }
                    }
                })

                if (combinedArray.length === 0) {
                    combinedArray = [baselineData]
                }

                setData(combinedArray)
            } catch (err) {
                if (!cancelled) {
                    // Fallback to flat lines with current probabilities
                    const now = new Date().toISOString()
                    const fallback: CombinedPoint = { timestamp: now }
                    markets.forEach((m) => {
                        fallback[m.id] = m.probYes
                    })
                    setData([fallback])
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        if (markets.length > 0) {
            fetchAllHistory()
        }

        return () => { cancelled = true }
    }, [markets, period])

    // Calculate dynamic Y domain avoiding 0-100 if lines are tight
    const yDomain = useMemo(() => {
        if (data.length === 0) return [0, 100]

        let min = 100
        let max = 0

        for (const point of data) {
            for (const m of markets) {
                const val = point[m.id]
                if (val !== undefined && val !== null) {
                    if (val < min) min = val
                    if (val > max) max = val
                }
            }
        }

        const padding = Math.max((max - min) * 0.15, 5)
        return [
            Math.max(0, Math.floor((min - padding) / 5) * 5),
            Math.min(100, Math.ceil((max + padding) / 5) * 5),
        ]
    }, [data, markets])

    // Generate grid lines for Y axis (every ~5-10%)
    const gridLines = useMemo(() => {
        const lines: number[] = []
        // we'll try to divide the domain into ~4 sections
        const step = Math.ceil((yDomain[1] - yDomain[0]) / 4 / 5) * 5
        const safeStep = Math.max(step, 5)

        for (let v = yDomain[0]; v <= yDomain[1]; v += safeStep) {
            lines.push(v)
        }
        return lines
    }, [yDomain])

    return (
        <div className={cn('w-full', className)}>
            {/* Legend Header */}
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {markets.map((m, i) => {
                        const color = CHART_COLORS[i % CHART_COLORS.length]
                        return (
                            <div key={m.id} className="flex items-center gap-1.5 text-[13px] sm:text-sm font-semibold text-white">
                                <span
                                    className="size-2.5 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-[#A1A7BB] font-medium mr-1">{m.statement}:</span>
                                <span>{m.probYes.toFixed(1)}%</span>
                            </div>
                        )
                    })}
                </div>

                {/* Period tabs */}
                <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5 mt-2 sm:mt-0 ml-auto">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={cn(
                                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                                period === p.value
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div
                className="relative w-full"
                style={{ height }}
            >
                {loading && data.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A6BFF] border-t-transparent" />
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 35, left: 0, bottom: 5 }}
                    >
                        {/* Horizontal dotted grid lines */}
                        {gridLines.map(val => (
                            <ReferenceLine
                                key={val}
                                y={val}
                                stroke={GRID_COLOR}
                                strokeDasharray="3 3"
                            />
                        ))}

                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={(t) => formatXDate(t, period)}
                            tick={{ fill: AXIS_COLOR, fontSize: 11, fontWeight: 500 }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={12}
                            minTickGap={50}
                        />

                        <YAxis
                            domain={yDomain as [number, number]}
                            orientation="right"
                            tick={{ fill: AXIS_COLOR, fontSize: 11, fontWeight: 500 }}
                            tickFormatter={(v) => `${v}%`}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={8}
                            ticks={gridLines}
                        />

                        <Tooltip
                            content={<ChartTooltip markets={markets} />}
                            cursor={{
                                stroke: 'rgba(255,255,255,0.15)',
                                strokeWidth: 1,
                                strokeDasharray: '3 3',
                            }}
                            isAnimationActive={false}
                        />

                        {/* Line Series */}
                        {markets.map((m, i) => {
                            const color = CHART_COLORS[i % CHART_COLORS.length]
                            return (
                                <Area
                                    key={m.id}
                                    type="monotone"
                                    dataKey={m.id}
                                    stroke={color}
                                    strokeWidth={3}
                                    fill="transparent"
                                    activeDot={{ r: 5, stroke: '#12121a', strokeWidth: 2, fill: color }}
                                    isAnimationActive={true}
                                    animationDuration={500}
                                />
                            )
                        })}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
