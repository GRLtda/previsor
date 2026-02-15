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

interface HistoryPoint {
    timestamp: string
    probYes: number
    probNo: number
}

interface ProbabilityChartProps {
    marketId: string
    currentProbYes: number
    height?: number
    className?: string
    /** Mini sparkline mode (no axes, no tooltip, no time tabs) */
    mini?: boolean
}

type Period = '1d' | '1w' | '1m' | 'all'

const PERIODS: { value: Period; label: string }[] = [
    { value: '1d', label: '1D' },
    { value: '1w', label: '1S' },
    { value: '1m', label: '1M' },
    { value: 'all', label: 'Tudo' },
]

const CHART_GREEN = '#22c55e'
const CHART_GREEN_DIM = 'rgba(34, 197, 94, 0.08)'
const GRID_COLOR = 'rgba(255, 255, 255, 0.08)'
const AXIS_COLOR = 'rgba(255, 255, 255, 0.4)'

// Calculate the change from the first data point to the last
function calcChange(data: HistoryPoint[]): { value: number; positive: boolean } {
    if (data.length < 2) return { value: 0, positive: true }
    const first = data[0].probYes
    const last = data[data.length - 1].probYes
    const change = last - first
    return { value: Math.abs(change), positive: change >= 0 }
}

// Format X-axis date labels based on period
function formatXDate(timestamp: string, period: Period): string {
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

// Custom tooltip component
function ChartTooltip({ active, payload, period }: any) {
    if (!active || !payload?.length) return null
    const data = payload[0].payload as HistoryPoint
    const date = parseISO(data.timestamp)
    const formattedDate = format(date, "dd 'de' MMM, HH:mm", { locale: ptBR })

    return (
        <div className="rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 shadow-xl backdrop-blur-sm">
            <p className="text-xs text-zinc-400">{formattedDate}</p>
            <p className="mt-0.5 text-sm font-semibold text-white">
                Sim: <span className="text-green-400">{data.probYes.toFixed(1)}%</span>
            </p>
        </div>
    )
}

// Custom active dot (green glow on latest point)
function ActiveDot(props: any) {
    const { cx, cy } = props
    return (
        <g>
            <circle cx={cx} cy={cy} r={8} fill={CHART_GREEN} opacity={0.25} />
            <circle cx={cx} cy={cy} r={4} fill={CHART_GREEN} stroke="white" strokeWidth={1.5} />
        </g>
    )
}

export function ProbabilityChart({
    marketId,
    currentProbYes,
    height = 280,
    className,
    mini = false,
}: ProbabilityChartProps) {
    const [period, setPeriod] = useState<Period>('all')
    const [data, setData] = useState<HistoryPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    // Fetch data when period changes
    useEffect(() => {
        let cancelled = false

        async function fetchHistory() {
            setLoading(true)
            setError(false)
            try {
                const res = await userApi.getMarketHistory(marketId, period)
                if (!cancelled) {
                    setData(res.history)
                }
            } catch (err) {
                if (!cancelled) {
                    setError(true)
                    // Fallback: show just the current prob as a flat line
                    const now = new Date().toISOString()
                    setData([
                        { timestamp: now, probYes: currentProbYes, probNo: 100 - currentProbYes },
                    ])
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchHistory()
        return () => { cancelled = true }
    }, [marketId, period, currentProbYes])

    const change = useMemo(() => calcChange(data), [data])

    // Calculate Y domain for better visual range
    const yDomain = useMemo(() => {
        if (data.length === 0) return [0, 100]
        const values = data.map(d => d.probYes)
        const min = Math.min(...values)
        const max = Math.max(...values)
        const padding = Math.max((max - min) * 0.15, 5)
        return [
            Math.max(0, Math.floor((min - padding) / 12.5) * 12.5),
            Math.min(100, Math.ceil((max + padding) / 12.5) * 12.5),
        ]
    }, [data])

    // Generate grid lines for Y axis
    const gridLines = useMemo(() => {
        const lines: number[] = []
        for (let v = yDomain[0]; v <= yDomain[1]; v += 12.5) {
            lines.push(Math.round(v * 10) / 10)
        }
        return lines
    }, [yDomain])

    // ============== MINI SPARKLINE MODE ==============
    if (mini) {
        return (
            <div className={cn('h-12 w-full', className)}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                        <defs>
                            <linearGradient id={`miniGrad-${marketId}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_GREEN} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={CHART_GREEN} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="stepAfter"
                            dataKey="probYes"
                            stroke={CHART_GREEN}
                            strokeWidth={1.5}
                            fill={`url(#miniGrad-${marketId})`}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // ============== FULL CHART MODE ==============
    return (
        <div className={cn('w-full', className)}>
            {/* Header: probability + change */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                        {currentProbYes.toFixed(0)}%
                    </span>
                    <span className="text-sm text-muted-foreground">chance</span>
                    {change.value > 0 && (
                        <span
                            className={cn(
                                'text-sm font-medium',
                                change.positive ? 'text-green-400' : 'text-red-400'
                            )}
                        >
                            {change.positive ? '▲' : '▼'} {change.value.toFixed(1)}
                        </span>
                    )}
                </div>

                {/* Period tabs */}
                <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-0.5">
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={cn(
                                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
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
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
                    </div>
                )}

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 45, left: 0, bottom: 5 }}
                    >
                        <defs>
                            <linearGradient id={`chartGrad-${marketId}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_GREEN} stopOpacity={0.15} />
                                <stop offset="100%" stopColor={CHART_GREEN} stopOpacity={0} />
                            </linearGradient>
                        </defs>

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
                            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={8}
                            minTickGap={40}
                        />

                        <YAxis
                            domain={yDomain as [number, number]}
                            orientation="right"
                            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
                            tickFormatter={(v) => `${v}%`}
                            axisLine={false}
                            tickLine={false}
                            tickMargin={8}
                            ticks={gridLines}
                        />

                        <Tooltip
                            content={<ChartTooltip period={period} />}
                            cursor={{
                                stroke: 'rgba(255,255,255,0.2)',
                                strokeWidth: 1,
                                strokeDasharray: '4 4',
                            }}
                        />

                        <Area
                            type="stepAfter"
                            dataKey="probYes"
                            stroke={CHART_GREEN}
                            strokeWidth={2}
                            fill={`url(#chartGrad-${marketId})`}
                            activeDot={<ActiveDot />}
                            isAnimationActive={true}
                            animationDuration={600}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
