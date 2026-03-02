'use client'

import React, { useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useDominantColors } from '@/hooks/use-dominant-colors'

interface UserAvatarProps {
    src?: string | null
    fallback?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
    showRing?: boolean
    autoColor?: boolean // Whether to extract colors from image automatically
    ringColor?: string // Single color for the ring
    ringColors?: string[]
    animate?: boolean
    className?: string
    ringClassName?: string
    fallbackClassName?: string
    gapClassName?: string // New prop to customize the gap color
}

const sizeMap: Record<string, number> = {
    xs: 24,
    sm: 32,
    md: 42,
    lg: 64,
    xl: 140,
}

export function UserAvatar({
    src,
    fallback = 'U',
    size = 'md',
    showRing = false,
    autoColor = true,
    ringColor,
    ringColors: providedRingColors,
    animate = true,
    className,
    ringClassName,
    fallbackClassName,
    gapClassName,
}: UserAvatarProps) {
    const extractedColors = useDominantColors(autoColor ? src : null)
    const ringColors = providedRingColors || extractedColors

    const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 42

    // Calculate gap and padding based on size
    // For smaller sizes (like 32px), we need to be much more subtle
    const padding = pixelSize < 40 ? 1.5 : (pixelSize > 100 ? 3 : 2)
    const margin = pixelSize < 40 ? 1.5 : (pixelSize > 100 ? 3 : 2)

    const ringContent = useMemo(() => {
        if (!showRing) return null

        // Determine colors to use
        const colors = ringColor ? [ringColor, ringColor] : ringColors

        // Conic gradient for the spinning ring
        const gradient = `conic-gradient(from 0deg, ${colors.join(', ')}, ${colors[0]})`

        return (
            <motion.div
                className={cn("absolute inset-0 rounded-full", ringClassName)}
                style={{ background: gradient }}
                animate={animate ? { rotate: 360 } : {}}
                transition={animate ? { duration: 4, repeat: Infinity, ease: "linear" } : {}}
            />
        )
    }, [showRing, ringColors, animate, ringClassName])

    return (
        <div
            className={cn("relative flex items-center justify-center shrink-0 rounded-full", className)}
            style={{ width: pixelSize, height: pixelSize }}
        >
            {ringContent}

            {/* Background gap to separate ring from avatar */}
            <div
                className={cn(
                    "relative rounded-full bg-background overflow-hidden",
                    showRing ? "z-10" : "",
                    gapClassName
                )}
                style={showRing ? {
                    padding: `${padding}px`,
                    margin: `${margin}px`,
                    width: pixelSize - (margin * 2),
                    height: pixelSize - (margin * 2)
                } : {
                    width: pixelSize,
                    height: pixelSize
                }}
            >
                <Avatar className="h-full w-full">
                    {src ? (
                        <AvatarImage
                            src={src}
                            alt={fallback}
                            className="object-cover"
                        />
                    ) : null}
                    <AvatarFallback
                        className={cn(
                            "font-bold uppercase flex items-center justify-center text-white",
                            !src && "bg-gradient-to-br from-[#f59e0b] to-[#d97706]",
                            fallbackClassName
                        )}
                        style={{ fontSize: `${pixelSize * 0.35}px` }}
                    >
                        {fallback.charAt(0)}
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>
    )
}
