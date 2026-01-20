'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { userApi, ApiClientError } from '@/lib/api/client'
import { useSearchParams } from 'next/navigation'
import type { Event } from '@/lib/types'
import { EventCard } from '@/components/user/event-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'all', label: 'Todas Categorias' },
  { value: 'esportes', label: 'Esportes' },
  { value: 'politica', label: 'Politica' },
  { value: 'economia', label: 'Economia' },
  { value: 'tecnologia', label: 'Tecnologia' },
  { value: 'entretenimento', label: 'Entretenimento' },
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
      // API retorna diretamente { events, totalCount, limit, offset }
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


  const totalPages = Math.ceil(totalCount / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-6" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">Nenhum evento encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tente ajustar os filtros ou tente outra busca
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
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
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOffset(offset + LIMIT)}
                disabled={currentPage >= totalPages}
              >
                Proximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
