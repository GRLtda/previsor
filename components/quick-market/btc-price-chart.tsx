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

// Spring physics parameters
const SPRING_STIFFNESS = 250 // Increased stiffness so it chases the soft target reliably
const SPRING_DAMPING = 0.85

function formatPriceShort(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
    
    // UI badge state (we still use React for the absolute floating DOM badge as requested)
    const [moveData, setMoveData] = useState({ isAbove: true, percent: 0, show: false })

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

        // Viewport Math Constants
        const VIEW_DURATION_MS = 150_000 // 2.5 minutes width
        const RIGHT_PADDING_MS = 25_000   // Keep 25s visual padding on the right so dot isn't touching edge
        const VOLATILITY_AMP = 3.5        // Micro-tick fake noise max amplitude
        
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
            const blendFactor = 1.0 - Math.pow(1.0 - 0.1, fpsScale)
            physics.targetPrice += (physics.rawTargetPrice - physics.targetPrice) * blendFactor

            // 2. Core Physics: Spring Model
            const distance = physics.targetPrice - physics.currentPrice
            let force = distance * SPRING_STIFFNESS

            // 3. Acceleration Clamping
            const MAX_ACCEL = 50000
            if (force > MAX_ACCEL) force = MAX_ACCEL
            if (force < -MAX_ACCEL) force = -MAX_ACCEL

            physics.velocity += force * dtSeconds

            // 4. Adaptive Damping
            let currentDamping = SPRING_DAMPING
            const absDist = Math.abs(distance)
            if (absDist < 20) currentDamping = 0.7  // Extra damping
            if (absDist < 5) currentDamping = 0.4   // Heavy damping near endpoint
            
            // Secondary Velocity Smoothing
            const dampedVel = physics.velocity * Math.pow(currentDamping, fpsScale)
            const velSmoothing = 1.0 - Math.pow(1.0 - 0.3, fpsScale)
            physics.velocity += (dampedVel - physics.velocity) * velSmoothing
            
            // 5. Dead Zone
            if (absDist < 0.05 && Math.abs(physics.velocity) < 0.5) {
                physics.currentPrice = physics.targetPrice
                physics.velocity = 0
            } else {
                physics.currentPrice += physics.velocity * dtSeconds
            }

            let visualCurrentPrice = physics.currentPrice

            // 6. Corrected Noise (Only apply when technically at rest)
            if (Math.abs(physics.velocity) < 0.1 && absDist < 0.1) {
                const microNoise = Math.sin(now * 0.002) * Math.cos(now * 0.0039)
                visualCurrentPrice += microNoise * (VOLATILITY_AMP * 0.01)
            }

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
            if (pMin === pMax) { pMin -= 10; pMax += 10 }
            
            // 10% vertical padding
            const yPadding = (pMax - pMin) * 0.15 || 5
            const finalMinY = pMin - yPadding
            const finalMaxY = pMax + yPadding
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
            
            if (visiblePoints.length > 0) {
                firstRenderedX = getX(visiblePoints[0].timestamp)
                ctx.moveTo(firstRenderedX, getY(visiblePoints[0].price))
                
                // Exclude the very last incoming point from the hard static render 
                // so the physics engine owns the visual tail completely.
                // This eliminates the sharp snapping artifact when a new point arrives.
                for (let i = 1; i < visiblePoints.length - 1; i++) {
                    const pt = visiblePoints[i]
                    ctx.lineTo(getX(pt.timestamp), getY(pt.price))
                }
                
                // Connect history visually to our active simulated live point
                // This treats the simulated value as the true visual head of the chart
                ctx.lineTo(getX(now), getY(visualCurrentPrice))
            } else {
                // If history is totally empty, just start at the current point
                firstRenderedX = getX(now)
                ctx.moveTo(firstRenderedX, getY(visualCurrentPrice))
            }

            // 5. Draw Path Fill (Green or Red Polymarket Gradient)
            const pathXStart = firstRenderedX
            const currentX = getX(now)
            
            if (currentX > pathXStart) {
                // Create a closing path down to canvas bottom for the fill
                const fillPath = new Path2D()
                fillPath.moveTo(pathXStart, height)
                
                if (visiblePoints.length > 0) {
                    fillPath.lineTo(pathXStart, getY(visiblePoints[0].price))
                    for (let i = 1; i < visiblePoints.length - 1; i++) {
                        fillPath.lineTo(getX(visiblePoints[i].timestamp), getY(visiblePoints[i].price))
                    }
                    fillPath.lineTo(currentX, getY(visualCurrentPrice))
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

    return (
        <div className={`relative ${className || ''}`} ref={containerRef}>
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
            
            {/* The Raw Performance Canvas Element doing all the physical rendering isolated */}
            <canvas ref={canvasRef} className="block w-full h-full pointer-events-none touch-none" />
        </div>
    )
}
