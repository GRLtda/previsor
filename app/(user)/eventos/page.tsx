'use client'

import { useState, useEffect, useCallback } from 'react'
import { userApi, ApiClientError } from '@/lib/api/client'
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
import { Search, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
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
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await userApi.getEvents({
        status: 'active',
        category: category === 'all' ? undefined : category,
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
  }, [category, offset])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const filteredEvents = events.filter(
    (event) =>
      search === '' ||
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.description.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <TrendingUp className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">Mercado de Previsoes</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Faca suas previsoes sobre eventos do mundo real. Compre posicoes YES ou NO 
          e ganhe se sua previsao estiver correta.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={(value) => { setCategory(value); setOffset(0) }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">Nenhum evento encontrado</p>
          <p className="text-sm text-muted-foreground mt-2">
            Tente ajustar os filtros ou volte mais tarde
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
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
