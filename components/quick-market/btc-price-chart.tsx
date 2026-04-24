'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useBtcPriceRealTime } from '@/hooks/use-market-ws'
import type { BtcPriceTick } from '@/lib/types'

interface BtcPriceChartProps {
    openPrice: number
    initialHistory?: BtcPriceTick[]
    live?: boolean
    endTime?: string | null
    className?: string
}

interface Point {
    timestamp: number
    price: number
}

interface RenderPoint {
    x: number
    y: number
}

interface ViewportRange {
    minY: number
    maxY: number
}

interface HoverData {
    x: number
    y: number
    timestamp: number
    price: number
}

// Spring physics parameters
const TARGET_BLEND_PER_FRAME = 0.085
const DOMAIN_BLEND_PER_FRAME = 0.12
const MIN_DOMAIN_SPAN = 120
const BASE_SMOOTH_TIME = 0.26
const MAX_CHASE_SPEED = 1800

function blendByFps(perFrame: number, fpsScale: number): number {
    return 1.0 - Math.pow(1.0 - perFrame, fpsScale)
}

function smoothDamp(
    current: number,
    target: number,
    currentVelocity: number,
    smoothTime: number,
    maxSpeed: number,
    deltaTime: number
) {
    const safeSmoothTime = Math.max(0.0001, smoothTime)
    const omega = 2 / safeSmoothTime
    const x = omega * deltaTime
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)

    let change = current - target
    const originalTarget = target
    const maxChange = maxSpeed * safeSmoothTime
    change = Math.max(-maxChange, Math.min(maxChange, change))
    target = current - change

    const temp = (currentVelocity + omega * change) * deltaTime
    let nextVelocity = (currentVelocity - omega * temp) * exp
    let output = target + (change + temp) * exp

    const crossedTarget = (originalTarget - current > 0) === (output > originalTarget)
    if (crossedTarget) {
        output = originalTarget
        nextVelocity = 0
    }

    return {
        value: output,
        velocity: nextVelocity,
    }
}

function traceSmoothPath(
    path: Pick<CanvasRenderingContext2D, 'moveTo' | 'lineTo' | 'quadraticCurveTo'>,
    points: RenderPoint[],
    options?: { startWithMove?: boolean }
) {
    if (points.length === 0) return
    const startWithMove = options?.startWithMove ?? true

    if (points.length === 1) {
        if (startWithMove) {
            path.moveTo(points[0].x, points[0].y)
        } else {
            path.lineTo(points[0].x, points[0].y)
        }
        return
    }

    if (startWithMove) {
        path.moveTo(points[0].x, points[0].y)
    } else {
        path.lineTo(points[0].x, points[0].y)
    }

    for (let i = 1; i < points.length - 1; i++) {
        const current = points[i]
        const next = points[i + 1]
        const midX = (current.x + next.x) / 2
        const midY = (current.y + next.y) / 2
        path.quadraticCurveTo(current.x, current.y, midX, midY)
    }

    const penultimate = points[points.length - 2]
    const last = points[points.length - 1]
    path.quadraticCurveTo(penultimate.x, penultimate.y, last.x, last.y)
}

function formatPriceShort(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatHoverTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

export function BtcPriceChart({ openPrice, initialHistory = [], live = true, endTime, className }: BtcPriceChartProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    
    // Core physics state completely decoupled from React renders
    const historyRef = useRef<Point[]>([])
    const simulatedRef = useRef({
        currentPrice: openPrice,
        targetPrice: openPrice,
        rawTargetPrice: openPrice,
        velocity: 0,
        lastTickTime: Date.now()
    })
    const viewportRef = useRef<ViewportRange | null>(null)
    const hoverXRef = useRef<number | null>(null)
    const lastHoverKeyRef = useRef<string | null>(null)
    
    // UI badge state (we still use React for the absolute floating DOM badge as requested)
    const [moveData, setMoveData] = useState({ isAbove: true, percent: 0, show: false })
    const [hoverData, setHoverData] = useState<HoverData | null>(null)

    // Initialize history exactly once
    useEffect(() => {
        if (initialHistory.length > 0 && historyRef.current.length === 0) {
            historyRef.current = initialHistory.map(t => ({
                timestamp: new Date(t.timestamp).getTime(),
                price: t.price
            })).sort((a, b) => a.timestamp - b.timestamp)
            
            const last = historyRef.current[historyRef.current.length - 1]
            simulatedRef.current.currentPrice = last.price
            simulatedRef.current.targetPrice = last.price
            simulatedRef.current.rawTargetPrice = last.price
            simulatedRef.current.lastTickTime = last.timestamp
            viewportRef.current = null
            
            // Set initial React Badge safely
            const percent = ((last.price - openPrice) / openPrice) * 100
            setMoveData({ isAbove: last.price >= openPrice, percent: Math.abs(percent), show: Math.abs(percent) > 0.01 })
        }
    }, [initialHistory, openPrice])

    // Websocket receiver - Zero React Updates
    const handlePriceUpdate = useCallback((update: { price: number; timestamp: string }) => {
        if (!live) return
        
        const timestamp = new Date(update.timestamp).getTime()
        const latest = historyRef.current[historyRef.current.length - 1]
        
        // Prevent duplicate exact ticks
        if (latest && latest.timestamp === timestamp) {
            latest.price = update.price
        } else {
            historyRef.current.push({ price: update.price, timestamp })
        }
        
        // Garbage collect old history out of sight (> 3 minutes)
        const cutoff = Date.now() - 180_000
        historyRef.current = historyRef.current.filter(p => p.timestamp >= cutoff)
        
        // Update physics target
        simulatedRef.current.rawTargetPrice = update.price
        simulatedRef.current.lastTickTime = timestamp
        
        // Update the floating percentage badge (throttled naturally by ws traffic)
        const percent = ((update.price - openPrice) / openPrice) * 100
        setMoveData({ isAbove: update.price >= openPrice, percent: Math.abs(percent), show: Math.abs(percent) > 0.01 })
    }, [live, openPrice])
    
    useBtcPriceRealTime(handlePriceUpdate)

    // The Master Engine Loop
    useEffect(() => {
        const canvas = canvasRef.current
        const container = containerRef.current
        if (!canvas || !container) return
        
        let animationFrameId: number
        let width = 0
        let height = 0
        let dpr = window.devicePixelRatio || 1
        
        // Setup ResizeObserver for crisp Retina 60fps filling
        const resizeObserver = new ResizeObserver((entries) => {
            const rect = entries[0].contentRect
            width = rect.width
            height = rect.height
            canvas.width = width * dpr
            canvas.height = height * dpr
            canvas.style.width = `${width}px`
            canvas.style.height = `${height}px`
        })
        resizeObserver.observe(container)

        viewportRef.current = null

        // Viewport Math Constants
        const VIEW_DURATION_MS = 150_000 // 2.5 minutes width
        const RIGHT_PADDING_MS = 25_000   // Keep 25s visual padding on the right so dot isn't touching edge
        
        let lastFrameTime = performance.now()

        const renderLoop = (time: DOMHighResTimeStamp) => {
            const dt = time - lastFrameTime
            lastFrameTime = time
            const rawNow = Date.now()
            
            // 0. Time Freeze Core Logic
            let now = rawNow
            if (!live && endTime) {
                const freezeBoundary = new Date(endTime).getTime()
                now = Math.min(rawNow, freezeBoundary)
            }
            
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            
            // 1. Continuous Target Interpolation
            const physics = simulatedRef.current
            const dtSeconds = Math.min(dt / 1000, 0.1) // Cap dt at 100ms
            const fpsScale = dtSeconds * 60

            // Soft target moves gradually toward raw incoming price (~0.1 per frame independent of fps)
            const blendFactor = blendByFps(TARGET_BLEND_PER_FRAME, fpsScale)
            physics.targetPrice += (physics.rawTargetPrice - physics.targetPrice) * blendFactor

            const distance = physics.targetPrice - physics.currentPrice
            const absDist = Math.abs(distance)

            // Critically damped chase keeps the head fluid without the end-of-move wobble.
            let smoothTime = BASE_SMOOTH_TIME
            if (absDist > 150) smoothTime = 0.18
            else if (absDist < 18) smoothTime = 0.34

            const damped = smoothDamp(
                physics.currentPrice,
                physics.targetPrice,
                physics.velocity,
                smoothTime,
                MAX_CHASE_SPEED,
                dtSeconds
            )

            physics.currentPrice = damped.value
            physics.velocity = damped.velocity

            if (absDist < 0.08 && Math.abs(physics.velocity) < 0.12) {
                physics.currentPrice = physics.targetPrice
                physics.velocity = 0
            }

            const visualCurrentPrice = physics.currentPrice

            const isAbove = visualCurrentPrice >= openPrice
            const themeColor = isAbove ? '#27CE88' : '#FF4040'
            const lightColor = isAbove ? 'rgba(39, 206, 136, 0.4)' : 'rgba(255, 64, 64, 0.4)'

            // 2. Prepare Coordinate Space
            ctx.resetTransform()
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.scale(dpr, dpr)

            // Dynamic X-Scale
            const timeMin = now - VIEW_DURATION_MS
            const timeMax = now + RIGHT_PADDING_MS
            const getX = (t: number) => ((t - timeMin) / (timeMax - timeMin)) * width

            // Dynamic Y-Scale
            // Extract prices to find domain, padding loosely to avoid jumps
            const visiblePoints = historyRef.current.filter(p => p.timestamp >= timeMin)
            const visiblePrices = visiblePoints.map(p => p.price).concat([openPrice, visualCurrentPrice])
            
            let pMin = Math.min(...visiblePrices)
            let pMax = Math.max(...visiblePrices)
            if (pMin === pMax) { pMin -= MIN_DOMAIN_SPAN / 2; pMax += MIN_DOMAIN_SPAN / 2 }
            
            const rawSpan = Math.max(pMax - pMin, MIN_DOMAIN_SPAN)
            const center = (pMax + pMin) / 2
            pMin = center - rawSpan / 2
            pMax = center + rawSpan / 2

            // 10% vertical padding
            const yPadding = rawSpan * 0.15
            const targetMinY = pMin - yPadding
            const targetMaxY = pMax + yPadding

            const viewport = viewportRef.current
            if (!viewport) {
                viewportRef.current = {
                    minY: targetMinY,
                    maxY: targetMaxY,
                }
            } else {
                const domainBlend = blendByFps(DOMAIN_BLEND_PER_FRAME, fpsScale)
                viewport.minY += (targetMinY - viewport.minY) * domainBlend
                viewport.maxY += (targetMaxY - viewport.maxY) * domainBlend
            }

            const finalMinY = viewportRef.current?.minY ?? targetMinY
            const finalMaxY = viewportRef.current?.maxY ?? targetMaxY
            const getY = (p: number) => height - ((p - finalMinY) / (finalMaxY - finalMinY)) * height

            // 3. Draw Background Target Line (The Strike Baseline)
            const targetY = getY(openPrice)
            ctx.beginPath()
            ctx.setLineDash([4, 4])
            ctx.moveTo(0, targetY)
            ctx.lineTo(width, targetY)
            ctx.strokeStyle = '#606E85'
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.setLineDash([]) // Reset for path

            // 4. Trace the continuous path
            ctx.beginPath()
            let firstRenderedX = 0
            const renderPoints: RenderPoint[] = []

            if (visiblePoints.length > 0) {
                firstRenderedX = getX(visiblePoints[0].timestamp)
                renderPoints.push({ x: firstRenderedX, y: getY(visiblePoints[0].price) })
                
                // Exclude the very last incoming point from the hard static render 
                // so the physics engine owns the visual tail completely.
                // This eliminates the sharp snapping artifact when a new point arrives.
                for (let i = 1; i < visiblePoints.length - 1; i++) {
                    const pt = visiblePoints[i]
                    renderPoints.push({ x: getX(pt.timestamp), y: getY(pt.price) })
                }
                
                // Connect history visually to our active simulated live point
                // This treats the simulated value as the true visual head of the chart
                renderPoints.push({ x: getX(now), y: getY(visualCurrentPrice) })
            } else {
                // If history is totally empty, just start at the current point
                firstRenderedX = getX(now)
                renderPoints.push({ x: firstRenderedX, y: getY(visualCurrentPrice) })
            }

            traceSmoothPath(ctx, renderPoints)

            // 5. Draw Path Fill (Green or Red Polymarket Gradient)
            const pathXStart = firstRenderedX
            const currentX = getX(now)
            
            if (currentX > pathXStart) {
                // Create a closing path down to canvas bottom for the fill
                const fillPath = new Path2D()
                fillPath.moveTo(pathXStart, height)
                
                if (renderPoints.length > 0) {
                    fillPath.lineTo(renderPoints[0].x, renderPoints[0].y)
                    traceSmoothPath(fillPath, renderPoints, { startWithMove: false })
                }
                
                fillPath.lineTo(currentX, height)
                fillPath.closePath()

                const gradient = ctx.createLinearGradient(0, getY(pMax), 0, height)
                gradient.addColorStop(0, lightColor)
                gradient.addColorStop(1, 'rgba(0,0,0,0)')
                ctx.fillStyle = gradient
                ctx.fill(fillPath)
            }

            // 6. Stroke the Line
            ctx.strokeStyle = themeColor
            ctx.lineWidth = 2
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.stroke()

            const hoverX = hoverXRef.current
            if (hoverX != null && width > 0) {
                const hoverTimestamp = timeMin + (Math.max(0, Math.min(width, hoverX)) / width) * (timeMax - timeMin)
                const hoverCandidates = visiblePoints.concat({ timestamp: now, price: visualCurrentPrice })

                let nearest = hoverCandidates[0] ?? null
                for (let i = 1; i < hoverCandidates.length; i++) {
                    const candidate = hoverCandidates[i]
                    if (!nearest || Math.abs(candidate.timestamp - hoverTimestamp) < Math.abs(nearest.timestamp - hoverTimestamp)) {
                        nearest = candidate
                    }
                }

                if (nearest) {
                    const hoverPointX = getX(nearest.timestamp)
                    const hoverPointY = getY(nearest.price)
                    const hoverKey = `${Math.round(hoverPointX)}:${nearest.timestamp}:${nearest.price.toFixed(2)}`

                    if (hoverKey !== lastHoverKeyRef.current) {
                        lastHoverKeyRef.current = hoverKey
                        setHoverData({
                            x: hoverPointX,
                            y: hoverPointY,
                            timestamp: nearest.timestamp,
                            price: nearest.price,
                        })
                    }

                    ctx.beginPath()
                    ctx.setLineDash([3, 5])
                    ctx.moveTo(hoverPointX, 0)
                    ctx.lineTo(hoverPointX, height - 18)
                    ctx.strokeStyle = 'rgba(161, 167, 187, 0.55)'
                    ctx.lineWidth = 1
                    ctx.stroke()
                    ctx.setLineDash([])

                    ctx.beginPath()
                    ctx.arc(hoverPointX, hoverPointY, 4, 0, Math.PI * 2)
                    ctx.fillStyle = '#F8FAFC'
                    ctx.fill()

                    ctx.beginPath()
                    ctx.arc(hoverPointX, hoverPointY, 2.5, 0, Math.PI * 2)
                    ctx.fillStyle = themeColor
                    ctx.fill()
                } else if (lastHoverKeyRef.current !== null) {
                    lastHoverKeyRef.current = null
                    setHoverData(null)
                }
            } else if (lastHoverKeyRef.current !== null) {
                lastHoverKeyRef.current = null
                setHoverData(null)
            }

            // 7. Draw The "Bolinha" 
            const headX = currentX
            const headY = getY(visualCurrentPrice)
            
            // The pulsing radar ring logic (infinite time-based oscillation)
            // Modulo cycle for standard 'ping' effect (1.5 seconds)
            const cycleDuration = 1500
            const cycleProgress = (now % cycleDuration) / cycleDuration
            const easedRing = 1 - Math.pow(1 - cycleProgress, 3) // Cubic ease out inline
            
            // Draw Ping Ring
            ctx.beginPath()
            ctx.arc(headX, headY, 5 + (easedRing * 10), 0, Math.PI * 2)
            ctx.fillStyle = isAbove ? `rgba(39, 206, 136, ${0.8 - easedRing*0.8})` : `rgba(255, 64, 64, ${0.8 - easedRing*0.8})`
            ctx.fill()
            
            // Draw Main Solid Dot
            ctx.beginPath()
            ctx.arc(headX, headY, 5, 0, Math.PI * 2)
            ctx.fillStyle = themeColor
            ctx.shadowColor = lightColor
            ctx.shadowBlur = 10
            ctx.fill()
            
            // Reset Shadow so we don't mess up next frame rendering limits
            ctx.shadowBlur = 0
            
            // 8. Simple Time Axis Ticks 
            // Slides to the left consistently mapped to absolute milestones
            ctx.fillStyle = '#A1A7BB'
            ctx.font = '11px Inter, system-ui, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'top'
            
            const TICK_MS = 30_000
            const startTick = Math.ceil(timeMin / TICK_MS) * TICK_MS
            for(let t = startTick; t <= timeMax; t += TICK_MS) {
                const tx = getX(t)
                const d = new Date(t)
                const str = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
                ctx.fillText(str, tx, height - 15)
            }

            // Continuous execution requests
            animationFrameId = requestAnimationFrame(renderLoop)
        }
        
        lastFrameTime = performance.now()
        animationFrameId = requestAnimationFrame(renderLoop)

        return () => {
            cancelAnimationFrame(animationFrameId)
            resizeObserver.disconnect()
        }
    }, [live, openPrice, endTime])

    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        hoverXRef.current = event.clientX - rect.left
    }, [])

    const handleMouseLeave = useCallback(() => {
        hoverXRef.current = null
        lastHoverKeyRef.current = null
        setHoverData(null)
    }, [])

    return (
        <div
            className={`relative cursor-crosshair ${className || ''}`}
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* The Floating % Badge precisely styled like Polymarket absolute positioned */}
            {moveData.show && (
                <div 
                    className={`absolute top-2 right-4 z-10 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-lg transition-colors duration-500 ${
                        moveData.isAbove ? 'bg-[#27CE88]/10 text-[#27CE88]' : 'bg-[#FF4040]/10 text-[#FF4040]'
                    }`}
                >
                    {moveData.isAbove ? '↑' : '↓'} {(moveData.percent).toFixed(3)}%
                </div>
            )}
            
            {hoverData && (
                <div
                    className="absolute z-20 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0F1724]/92 px-3 py-2 text-[11px] shadow-2xl backdrop-blur-sm pointer-events-none"
                    style={{
                        left: `${hoverData.x}px`,
                        top: `${Math.max(10, hoverData.y - 56)}px`,
                    }}
                >
                    <div className="font-semibold text-white">{formatPriceShort(hoverData.price)}</div>
                    <div className="mt-0.5 text-[#A1A7BB]">{formatHoverTime(hoverData.timestamp)}</div>
                </div>
            )}

            {/* The Raw Performance Canvas Element doing all the physical rendering isolated */}
            <canvas ref={canvasRef} className="block w-full h-full pointer-events-none touch-none" />
        </div>
    )
}
