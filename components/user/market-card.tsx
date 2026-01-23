'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'
import type { Market } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge } from '@/components/shared/status-badge'
import { marketEngine } from '@/lib/market-engine'

interface MarketCardProps {
  market: Market
  onOpenPosition?: () => void
  showEvent?: boolean
}

export function MarketCard({ market, onOpenPosition, showEvent = false }: MarketCardProps) {
  const isOpen = market.status === 'open'
  const isSettled = market.status === 'settled'

  // Calculate Liquidity/Net Invested
  const liquidity = marketEngine.getNetInvested(market)

  return (
    <Card className={isOpen ? 'border-primary/30' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <StatusBadge status={market.status} />
          {isSettled && market.result && (
            <Badge className={market.result === 'YES' ? 'bg-green-600' : 'bg-red-600'}>
              Resultado: {market.result}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg leading-tight mt-2">
          {market.statement}
        </CardTitle>
        {showEvent && market.event && (
          <p className="text-sm text-muted-foreground">{market.event.title}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Probability Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-green-600 font-medium">
              <TrendingUp className="h-4 w-4" />
              YES {market.probYes.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1 text-red-600 font-medium">
              NO {market.probNo.toFixed(1)}%
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="relative h-3 bg-red-200 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all"
              style={{ width: `${market.probYes}%` }}
            />
          </div>
        </div>

        {/* Pool Info -> Liquidity Info */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Shares YES</p>
            <p className="font-semibold text-green-700">
              {market.qYes?.toLocaleString('pt-BR') || 0}
            </p>
          </div>
          <div className="bg-muted rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Liquidez</p>
            <p className="font-semibold">
              R$ {(liquidity / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Shares NO</p>
            <p className="font-semibold text-red-700">
              {market.qNo?.toLocaleString('pt-BR') || 0}
            </p>
          </div>
        </div>

        {/* Close Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Fecha em: {format(new Date(market.closesAt), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
        </div>

        {/* Action Button */}
        {isOpen && onOpenPosition && (
          <Button className="w-full" onClick={onOpenPosition}>
            Abrir Posicao
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
