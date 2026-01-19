'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Event, Market } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  ExternalLink, 
  Info,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import Link from 'next/link'
import { MarketCard } from '@/components/user/market-card'
import { PositionModal } from '@/components/user/position-modal'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default function EventDetailPage({ params }: PageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)

  useEffect(() => {
    async function fetchEvent() {
      setIsLoading(true)
      try {
        // API retorna o evento diretamente, sem wrapper success/data
        const event = await userApi.getEvent(slug)
        setEvent(event)
      } catch (err) {
        if (err instanceof ApiClientError) {
          toast.error(err.message)
          if (err.code === 'RESOURCE_NOT_FOUND') {
            router.push('/eventos')
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvent()
  }, [slug, router])

  const handleMarketUpdate = (updatedMarket: Market) => {
    if (event) {
      setEvent({
        ...event,
        markets: event.markets?.map((m) =>
          m.id === updatedMarket.id ? { ...m, ...updatedMarket } : m
        ),
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/eventos')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para Eventos
      </Button>

      {/* Event Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Badge variant="secondary">
            <Tag className="h-3 w-3 mr-1" />
            {event.category}
          </Badge>
          {event.status === 'active' && (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              Ativo
            </Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
        <p className="text-muted-foreground text-lg mb-6">{event.description}</p>

        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Inicio: {format(new Date(event.startsAt), "dd MMM yyyy", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Termino: {format(new Date(event.endsAt), "dd MMM yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Resolution Rules */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Regras de Resolucao
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{event.resolveRules}</p>
          {event.sourceUrls && event.sourceUrls.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {event.sourceUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Fonte {i + 1}
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Markets */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Mercados ({event.markets?.length || 0})
        </h2>
        
        {!event.markets || event.markets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum mercado disponivel para este evento ainda.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onOpenPosition={() => setSelectedMarket(market)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      {event.markets && event.markets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {event.markets.length}
            </p>
            <p className="text-sm text-muted-foreground">Mercados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              R$ {(event.markets.reduce((acc, m) => acc + m.totalPool, 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">Volume Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              <TrendingUp className="h-5 w-5 text-green-600" />
              {Math.max(...event.markets.map((m) => m.probYes))}%
            </p>
            <p className="text-sm text-muted-foreground">Maior Prob. YES</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold flex items-center justify-center gap-1">
              <TrendingDown className="h-5 w-5 text-red-600" />
              {Math.max(...event.markets.map((m) => m.probNo))}%
            </p>
            <p className="text-sm text-muted-foreground">Maior Prob. NO</p>
          </div>
        </div>
      )}

      {/* Position Modal */}
      {selectedMarket && (
        <PositionModal
          market={selectedMarket}
          open={!!selectedMarket}
          onOpenChange={(open) => !open && setSelectedMarket(null)}
          onSuccess={(updatedMarket) => {
            handleMarketUpdate(updatedMarket)
            setSelectedMarket(null)
          }}
        />
      )}
    </div>
  )
}
