'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { userApi, ApiClientError } from '@/lib/api/client'
import { useSearchParams } from 'next/navigation'
import type { Event } from '@/lib/types'
import { EventCard } from '@/components/user/event-card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { BannerSlider } from '@/components/user/banner-slider'
import { DynamicIcon } from '@/components/ui/dynamic-icon'
import type { Category } from '@/lib/types'

const LIMIT = 12

export default function EventosPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventsContent />
    </Suspense>
  )
}

function EventsContent() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)       // For initial/reset load
  const [isFetchingMore, setIsFetchingMore] = useState(false) // For infinite scroll loads
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])

  const category = searchParams.get('category') || 'all'
  const search = searchParams.get('search') || ''

  // Intersection Observer ref for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    async function loadCategories() {
      try {
        const res = await userApi.getCategories()
        if (mounted && res.success && res.data) {
          setCategories(res.data.categories || [])
        }
      } catch (err) {
        console.error('Failed to load categories', err)
      }
    }
    loadCategories()
    return () => { mounted = false }
  }, [])

  const fetchEvents = useCallback(async (currentOffset: number, isAppending: boolean) => {
    if (isAppending) {
      setIsFetchingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const response = await userApi.getEvents({
        status: 'active',
        category: category === 'all' ? undefined : category,
        title: search || undefined,
        limit: LIMIT,
        offset: currentOffset,
      })

      const newEvents = response.events || []

      if (isAppending) {
        setEvents(prev => {
          const combined = [...prev, ...newEvents]
          const seen = new Set<string>()
          return combined.filter(e => {
            if (seen.has(e.id)) return false
            seen.add(e.id)
            return true
          })
        })
      } else {
        setEvents(newEvents)
      }

      setTotalCount(response.totalCount || 0)

      // Stop fetching if we've reached the total or received exactly 0 in this chunk
      if (newEvents.length === 0 || (currentOffset + newEvents.length >= (response.totalCount || 0))) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }

    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      } else {
        toast.error('Erro ao carregar eventos')
      }
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [category, search])

  // Reset and fetch when category or search changes
  useEffect(() => {
    setEvents([])
    setOffset(0)
    setHasMore(true)
    fetchEvents(0, false)
  }, [category, search, fetchEvents])

  // Infinite Scroll Observer Effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isFetchingMore) {
          const nextOffset = offset + LIMIT
          setOffset(nextOffset)
          fetchEvents(nextOffset, true)
        }
      },
      { threshold: 0.1 }
    )

    const target = observerTarget.current
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [hasMore, isLoading, isFetchingMore, fetchEvents, offset])

  const handleFavoriteChange = (eventId: string, isFavorite: boolean) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isFavorite } : e))
  }

  const categoryInfo = categories.find(c => c.slug === category)

  return (
    <div className="w-full px-4 md:px-6 lg:px-10 xl:px-16 2xl:px-24 py-6">
      {/* Banner Slider - Only show on 'all' category and no search term */}
      {category === 'all' && !search && (
        <BannerSlider />
      )}

      {/* Category Section */}
      {isLoading ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[198px] w-full rounded-2xl" />
            ))}
          </div>
        </>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <svg width="85" height="83" viewBox="0 0 85 83" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-20 mx-auto mb-4 opacity-60">
            <path d="M18.8867 72.4155V25.3873V2H57.2318L74.1543 18.7958V72.4155H18.8867Z" fill="#DFE3EA" />
            <path d="M27.126 33.3101V29.127H64.9006V33.3101H27.126Z" fill="#14161B" />
            <path d="M27.126 41.9927V37.8096H64.9006V41.9927H27.126Z" fill="#14161B" />
            <path d="M27.126 50.9927V46.8096H64.9006V50.9927H27.126Z" fill="#14161B" />
          </svg>
          <p className="text-muted-foreground text-lg">Nenhum evento encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tente ajustar os filtros ou tente outra busca
          </p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex items-center gap-1.5">
                {/* Category Icon */}
                <div className="flex size-10 items-center justify-center rounded-[10px] bg-blue-500/5 dark:bg-white/5">
                  {(category === 'all' || !categoryInfo) ? (
                    <DynamicIcon name="LayoutGrid" className="size-5 text-blue-500" />
                  ) : (
                    <DynamicIcon name={categoryInfo.icon} className="size-5 text-blue-500" />
                  )}
                </div>
                <h3 className="text-xl font-bold dark:text-white">
                  {category === 'all' ? 'Todos os Eventos' : categoryInfo?.name || category}
                </h3>
              </div>
            </div>
          </div>

          {/* Events Grid - 3 columns */}
          <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isFavorite={event.isFavorite}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>

          {/* Infinite Scroll trigger / Loading Indicator */}
          {hasMore && (
            <div ref={observerTarget} className="mt-8 mb-4 w-full flex flex-col gap-4">
              {isFetchingMore && (
                <div className="grid w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-[198px] w-full rounded-2xl" />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
