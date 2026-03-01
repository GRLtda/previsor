'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'
import type { Market } from '@/lib/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StatusBadge } from '@/components/shared/status-badge'
import { marketEngine } from '@/lib/market-engine'
import { useMarketRealTime } from '@/hooks/use-market-ws'
import { cn } from '@/lib/utils'

interface MarketCardProps {
  market: Market
  onOpenPosition?: () => void
  showEvent?: boolean
}

export function MarketCard({ market: initialMarket, onOpenPosition, showEvent = false }: MarketCardProps) {
  const [market, setMarket] = useState(initialMarket)

  useEffect(() => {
    setMarket(initialMarket)
  }, [initialMarket])

  useMarketRealTime(market.id, (data) => {
    if (data.marketId === market.id) {
      setMarket(prev => ({
        ...prev,
        probYes: data.probYes ?? prev.probYes,
        probNo: data.probNo ?? prev.probNo,
        status: data.status ?? prev.status,
        qYes: data.qYes ?? prev.qYes,
        qNo: data.qNo ?? prev.qNo,
        liquidityB: data.liquidityB ?? prev.liquidityB,
      }))
    }
  })

  const isOpen = market.status === 'open'
  const isSettled = market.status === 'settled'

  // Calculate Liquidity/Net Invested
  const liquidity = marketEngine.getNetInvested(market)

  return (
    <Card className={cn("flex flex-col h-full rounded-xl border border-border/40 bg-card/50 transition-all duration-300 ease-in-out hover:border-border/80", isOpen ? 'border-primary/30 hover:border-primary/50' : '')}>
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
      <CardContent className="space-y-4 flex-grow flex flex-col justify-end">
        {/* Probability Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-[#22c55e] font-medium">
              <TrendingUp className="h-4 w-4" />
              SIM {market.probYes.toFixed(1)}%
            </span>
            <span className="flex items-center gap-1 text-[#ef4444] font-medium">
              NÃO {market.probNo.toFixed(1)}%
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <div className="flex h-[8px] w-full gap-[2px] overflow-hidden rounded-[4px]">
            <div
              className="bg-[#22c55e] h-full transition-all"
              style={{ width: `${market.probYes}%`, borderRadius: '4px' }}
            />
            <div
              className="bg-[#ef4444] h-full transition-all"
              style={{ width: `${market.probNo}%`, borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Pool Info -> Liquidity Info */}
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Shares SIM</p>
            <p className="font-semibold text-[#22c55e]">
              {market.qYes?.toLocaleString('pt-BR') || 0}
            </p>
          </div>
          <div className="bg-muted/30 border border-border/40 rounded-lg p-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Liquidez</p>
            <p className="font-semibold dark:text-white">
              R$ {(liquidity / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Shares NÃO</p>
            <p className="font-semibold text-[#ef4444]">
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
