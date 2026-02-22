'use client'

import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { userApi } from '@/lib/api/client'
import type { Banner } from '@/lib/types'
import Link from 'next/link'

export function BannerSlider() {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [banners, setBanners] = useState<Banner[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let mounted = true
        async function loadBanners() {
            try {
                const res = await userApi.getBanners()
                if (mounted && res.success && res.data) {
                    setBanners(res.data.banners || [])
                }
            } catch (err) {
                console.error('Failed to load banners', err)
            } finally {
                if (mounted) setIsLoading(false)
            }
        }
        loadBanners()
        return () => { mounted = false }
    }, [])

    const scrollPrev = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev()
    }, [emblaApi])

    const scrollNext = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext()
    }, [emblaApi])

    const onSelect = useCallback(() => {
        if (!emblaApi) return
        setSelectedIndex(emblaApi.selectedScrollSnap())
    }, [emblaApi, setSelectedIndex])

    useEffect(() => {
        if (!emblaApi) return

        onSelect()
        emblaApi.on('select', onSelect)

        // Autoplay implementation
        const intervalId = setInterval(() => {
            emblaApi.scrollNext()
        }, 5000)

        return () => {
            clearInterval(intervalId)
            emblaApi.off('select', onSelect)
        }
    }, [emblaApi, onSelect])

    if (isLoading || banners.length === 0) {
        return null // Don't render the slider entirely if empty
    }

    return (
        <div className="relative w-full mb-12 group">
            <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
                <div className="flex touch-pan-y">
                    {banners.map((banner) => (
                        <div key={banner.id} className="relative min-w-0 flex-[0_0_100%] aspect-[21/9] md:aspect-[4/1] lg:aspect-[5/1] overflow-hidden">
                            {banner.linkUrl ? (
                                <Link href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
                                    <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover rounded-2xl" />
                                </Link>
                            ) : (
                                <img src={banner.imageUrl} alt={banner.title || 'Banner'} className="w-full h-full object-cover rounded-2xl" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 left-2 md:-left-5 lg:-left-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm size-8 md:size-10 shadow-lg"
                    onClick={scrollPrev}
                >
                    <ChevronLeft className="size-5 md:size-6" />
                </Button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-2 md:-right-5 lg:-right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm size-8 md:size-10 shadow-lg"
                    onClick={scrollNext}
                >
                    <ChevronRight className="size-5 md:size-6" />
                </Button>
            </div>

            {/* Pagination Dots */}
            <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-2 mt-4">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        aria-label={`Go to slide ${index + 1}`}
                        className={`size-2 md:size-2.5 rounded-full transition-all duration-300 ${index === selectedIndex
                            ? 'bg-black/80 dark:bg-white/80 w-4 md:w-6'
                            : 'bg-black/20 dark:bg-white/20 hover:bg-black/40 dark:hover:bg-white/40'
                            }`}
                        onClick={() => emblaApi?.scrollTo(index)}
                    />
                ))}
            </div>
        </div>
    )
}
