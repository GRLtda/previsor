'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { userApi, ApiClientError, getTokens } from '@/lib/api/client'
import { useSearchParams } from 'next/navigation'
import type { Event } from '@/lib/types'
import { EventCard } from '@/components/user/event-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Trophy,
  Landmark,
  TrendingUp,
  Laptop,
  Clapperboard,
  Sparkles,
  type LucideIcon
} from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'all', label: 'Todas', icon: Globe },
  { value: 'esportes', label: 'Esportes', icon: Trophy },
  { value: 'politica', label: 'Política', icon: Landmark },
  { value: 'economia', label: 'Economia', icon: TrendingUp },
  { value: 'tecnologia', label: 'Tecnologia', icon: Laptop },
  { value: 'entretenimento', label: 'Entretenimento', icon: Clapperboard },
]

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
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)

  const category = searchParams.get('category') || 'all'
  const search = searchParams.get('search') || ''

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await userApi.getEvents({
        status: 'active',
        category: category === 'all' ? undefined : category,
        title: search || undefined,
        limit: LIMIT,
        offset,
      })
      setEvents(response.events || [])
      setTotalCount(response.totalCount || 0)
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      } else {
        toast.error('Erro ao carregar eventos')
      }
    } finally {
      setIsLoading(false)
    }
  }, [category, search, offset])



  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    setOffset(0)
  }, [category, search])

  const handleFavoriteChange = (eventId: string, isFavorite: boolean) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isFavorite } : e))
  }

  const totalPages = Math.ceil(totalCount / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  const categoryInfo = CATEGORIES.find(c => c.value === category)

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-[120px] py-6">
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
                  {categoryInfo?.icon && <categoryInfo.icon className="size-5 text-blue-500" />}
                </div>
                <h3 className="text-xl font-bold dark:text-white">
                  {category === 'all' ? 'Todos os Eventos' : categoryInfo?.label || category}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                disabled={offset === 0}
                className="rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + LIMIT)}
                disabled={currentPage >= totalPages}
                className="rounded-lg"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
