'use client'

import { useState, useEffect } from 'react'

export function useDominantColors(imageUrl: string | null | undefined) {
    const [colors, setColors] = useState<string[]>(['#3b82f6', '#0ea5e9', '#6366f1']) // Default blue gradient

    useEffect(() => {
        if (!imageUrl) return

        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas')
                const size = 32 // Small size for performance
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext('2d')
                if (!ctx) return
                ctx.drawImage(img, 0, 0, size, size)
                const imageData = ctx.getImageData(0, 0, size, size).data

                const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
                    r /= 255; g /= 255; b /= 255
                    const max = Math.max(r, g, b), min = Math.min(r, g, b)
                    const l = (max + min) / 2
                    if (max === min) return [0, 0, l]
                    const d = max - min
                    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
                    let h = 0
                    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
                    else if (max === g) h = ((b - r) / d + 2) / 6
                    else h = ((r - g) / d + 4) / 6
                    return [h * 360, s, l]
                }

                const hslToRgb = (h: number, s: number, l: number): string => {
                    h /= 360
                    const hue2rgb = (p: number, q: number, t: number) => {
                        if (t < 0) t += 1; if (t > 1) t -= 1
                        if (t < 1 / 6) return p + (q - p) * 6 * t
                        if (t < 1 / 2) return q
                        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
                        return p
                    }
                    if (s === 0) {
                        const v = Math.round(l * 255)
                        return `rgb(${v}, ${v}, ${v})`
                    }
                    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
                    const p = 2 * l - q
                    const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255)
                    const g = Math.round(hue2rgb(p, q, h) * 255)
                    const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
                    return `rgb(${r}, ${g}, ${b})`
                }

                const pixels: { h: number; s: number; l: number }[] = []
                for (let i = 0; i < imageData.length; i += 4 * 4) {
                    const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2]
                    const [h, s, l] = rgbToHsl(r, g, b)
                    if (l > 0.08 && l < 0.92) pixels.push({ h, s, l })
                }

                if (pixels.length < 3) return

                const saturated = pixels.filter(p => p.s > 0.15).sort((a, b) => b.s - a.s)
                let finalColors: string[]

                if (saturated.length >= 3) {
                    const buckets: typeof pixels[] = Array.from({ length: 6 }, () => [])
                    saturated.forEach(p => buckets[Math.floor(p.h / 60) % 6].push(p))

                    const ranked = buckets.filter(b => b.length > 0).sort((a, b) => b.length - a.length)
                    const picked: string[] = []
                    for (const bucket of ranked) {
                        if (picked.length >= 3) break
                        const best = bucket[0]
                        picked.push(hslToRgb(best.h, Math.min(1, best.s * 1.4), Math.max(0.35, Math.min(0.65, best.l))))
                    }
                    while (picked.length < 3) {
                        const base = saturated[0]
                        const shift = picked.length === 1 ? 120 : 240
                        picked.push(hslToRgb((base.h + shift) % 360, Math.min(1, base.s * 1.3), Math.max(0.35, Math.min(0.65, base.l))))
                    }
                    finalColors = picked
                } else {
                    const sorted = pixels.sort((a, b) => b.l - a.l)
                    const base = sorted[Math.floor(sorted.length * 0.3)]
                    const baseH = base.h || 220
                    const baseS = Math.max(0.4, base.s * 2)
                    const baseL = Math.max(0.4, Math.min(0.6, base.l))
                    finalColors = [
                        hslToRgb(baseH, baseS, baseL),
                        hslToRgb((baseH + 120) % 360, baseS * 0.8, baseL),
                        hslToRgb((baseH + 240) % 360, baseS * 0.6, baseL + 0.1),
                    ]
                }

                setColors(finalColors)
            } catch {
                // Ignore errors
            }
        }
        img.src = imageUrl
    }, [imageUrl])

    return colors
}
