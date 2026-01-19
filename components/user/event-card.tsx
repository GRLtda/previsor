import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Tag } from 'lucide-react'
import type { Event } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const totalMarkets = event.markets?.length || 0
  const totalVolume = event.markets?.reduce((acc, m) => acc + m.totalPool, 0) || 0

  return (
    <Link href={`/eventos/${event.slug}`}>
      <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              <Tag className="h-3 w-3 mr-1" />
              {event.category}
            </Badge>
            {event.status === 'active' && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-600">Ativo</span>
              </span>
            )}
          </div>
          <CardTitle className="text-lg leading-tight line-clamp-2 mt-2">
            {event.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {event.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(event.endsAt), "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Mercados</p>
              <p className="font-semibold">{totalMarkets}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Volume Total</p>
              <p className="font-semibold">
                R$ {(totalVolume / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
