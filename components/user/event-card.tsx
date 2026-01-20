import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Event, Market } from '@/lib/types'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: Event
}

function formatVolume(amount: number): string {
  const value = amount / 100
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}m`
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`
  }
  return `R$ ${value.toFixed(0)}`
}

function MarketRow({ market }: { market: Market }) {
  const probYesPercent = Math.round(market.probYes)
  const probNoPercent = 100 - probYesPercent

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className='flex items-center gap-2 flex-1 min-w-0'>
        {/*  Optionally show market image if available in future data */}
        <span className="text-xs font-medium text-foreground/90 truncate">
          {market.statement}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          {probYesPercent}%
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 min-w-[50px]"
        >
          Yes
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-3 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 min-w-[50px]"
        >
          No
        </Button>
      </div>
    </div>
  )
}

export function EventCard({ event }: EventCardProps) {
  const markets = event.markets || []
  const totalVolume = markets.reduce((acc, m) => acc + m.totalPool, 0)
  const hasMarkets = markets.length > 0
  const isLive = event.status === 'active'

  return (
    <Card className="group relative overflow-hidden transition-all hover:ring-1 hover:ring-primary/20 bg-card border-border/40 shadow-sm hover:shadow-md">
      <Link href={`/eventos/${event.slug}`} className="absolute inset-0 z-10" />

      <div className="p-3 space-y-3">
        {/* Header with image and title */}
        <div className="flex items-start gap-3">
          {/* Event Image */}
          <div className="shrink-0 relative">
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg">📊</span>
              )}
            </div>
            {/* Live indicator over image optionally or keep badge separate */}
          </div>

          {/* Title and category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-snug line-clamp-2 text-foreground/90 group-hover:text-primary transition-colors">
              {event.title}
            </h3>

            <div className="flex items-center gap-2 mt-1">
              {isLive && (
                <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase tracking-wider">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  Live
                </span>
              )}
              <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
                {formatVolume(totalVolume)} Vol.
              </span>
            </div>
          </div>
        </div>

        {/* Markets list - Polymarket style usually shows top outcomes vertically or horizontally */}
        <div className="space-y-1">
          {hasMarkets ? (
            markets.slice(0, 2).map((market) => ( // limit to 2 markets like polymarket dashboard cards
              <MarketRow key={market.id} market={market} />
            ))
          ) : (
            <div className="py-2 text-xs text-muted-foreground text-center bg-muted/30 rounded">
              Aguardando mercados
            </div>
          )}
        </div>
      </div>

      {/* Separate footer not needed if volume is up top, but polymarket sometimes has it at bottom right. 
           Keeping it simple and compact as requested. 
       */}
    </Card>
  )
}
