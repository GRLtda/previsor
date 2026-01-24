'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Market } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { marketEngine } from '@/lib/market-engine'

interface PositionModalProps {
  market: Market
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (market: Market) => void
  defaultSide?: 'YES' | 'NO'
}

export function PositionModal({ market, open, onOpenChange, onSuccess, defaultSide = 'YES' }: PositionModalProps) {
  const router = useRouter()
  const { isAuthenticated, isOtpVerified, user } = useAuth()
  const [side, setSide] = useState<'YES' | 'NO'>(defaultSide)
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Success state management
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastTrade, setLastTrade] = useState<{ amount: number; side: 'YES' | 'NO' } | null>(null)

  const amountCents = Math.round(Number.parseFloat(amount || '0') * 100)
  const balance = user?.wallet?.balance || 0

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!isOtpVerified) {
      toast.error('Voce precisa verificar seu telefone antes de abrir posicoes')
      router.push('/auth/otp')
      return
    }

    if (amountCents < 100) {
      toast.error('Valor minimo: R$ 1,00')
      return
    }

    if (amountCents > balance) {
      toast.error('Saldo insuficiente')
      return
    }

    setIsLoading(true)
    try {
      const response = await userApi.openPosition(market.id, side, amountCents)
      const shares = response.position.shares
      toast.success(`Posição aberta! Você recebeu ${shares.toLocaleString('pt-BR')} shares.`)
      onSuccess?.({
        ...market,
        qYes: response.market.qYes,
        qNo: response.market.qNo,
        liquidityB: response.market.liquidityB,
        probYes: response.market.probYes,
        probNo: response.market.probNo,
      })

      setLastTrade({ amount: amountCents, side })
      setShowSuccess(true)
      setAmount('')
      // onOpenChange(false) - Removed to show success screen
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate potential payout using Engine (Parimutuel Logic)
  /* Use qYes/qNo/liquidityB from Market for LMSR calculation */
  const estimate = marketEngine.calculatePayout(amountCents, {
    qYes: market.qYes,
    qNo: market.qNo,
    liquidityB: market.liquidityB
  }, side);

  const potentialPayout = estimate.payout;
  const potentialProfit = potentialPayout - amountCents;

  const handleClose = () => {
    setShowSuccess(false)
    onOpenChange(false)
  }

  if (showSuccess && lastTrade) {
    return (
      <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose() }}>
        <DialogContent className="sm:max-w-[360px] p-0 border-none bg-transparent shadow-none">
          <div className="flex flex-col border lg:dark:border-none border-black/10 rounded-[20px] bg-white p-5 dark:bg-[#1C1F26] max-h-[calc(100vh-200px)] h-auto" style={{ boxShadow: 'rgba(0, 0, 0, 0.05) 0px 8px 20px' }}>
            <div className="custom-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="h-full" style={{ willChange: 'auto', opacity: 1, transform: 'none' }}>
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center lg:min-h-[290px]">
                  <div className="my-3 flex size-[92px] items-center justify-center rounded-full bg-[#0000000D] p-4 dark:bg-[#FFFFFF0D]" style={{ willChange: 'transform', transform: 'scale(1.03663)' }}>
                    <div className="flex items-center justify-center w-full h-full text-green-500">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-[#00B471]"><path d="M20 6 9 17l-5-5" /></svg>
                    </div>
                  </div>
                  <h2 className="mb-4 text-xl font-bold text-triad-dark-100 dark:text-white">Previsão confirmada com sucesso!</h2>
                  <span className="flex items-center gap-1 rounded-lg border border-[#0000001A] p-2.5 text-[13px] font-semibold text-[#0C131F] dark:border-[#FFFFFF0D] dark:text-[#FFFFFF]">
                    Sua Previsão:
                    <span className={cn("flex items-center justify-center gap-[2px]", lastTrade.side === 'YES' ? "text-[#00B471]" : "text-red-500")}>
                      {lastTrade.side === 'YES' ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 11C8.75 11 11 8.75 11 6C11 3.25 8.75 1 6 1C3.25 1 1 3.25 1 6C1 8.75 3.25 11 6 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.875 5.99996L5.29 7.41496L8.125 4.58496" stroke="currentColor" strokeWidth="1.03571" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {lastTrade.side === 'YES' ? 'Sim' : 'Não'}
                    </span>
                  </span>
                  <button onClick={handleClose} className="mt-7 w-full rounded-lg bg-triad-azure-200 bg-[#0091FF] hover:bg-[#007ACC] py-3 text-base font-bold text-white transition-colors">
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir Posicao</DialogTitle>
          <DialogDescription className="text-left">
            {market.statement}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Side Selection */}
          <div className="space-y-2">
            <Label>Escolha seu lado</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSide('YES')}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all cursor-pointer',
                  side === 'YES'
                    ? 'border-green-500 bg-green-50'
                    : 'border-border hover:border-green-300'
                )}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-bold text-green-600">SIM</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {market.probYes.toFixed(1)}%
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSide('NO')}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all cursor-pointer',
                  side === 'NO'
                    ? 'border-red-500 bg-red-50'
                    : 'border-border hover:border-red-300'
                )}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="font-bold text-red-600">NÃO</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {market.probNo.toFixed(1)}%
                </p>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Valor (R$)</Label>
              {isAuthenticated && (
                <span className="text-xs text-muted-foreground">
                  Saldo: R$ {(balance / 100).toFixed(2)}
                </span>
              )}
            </div>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
            />
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((val) => (
                <Button
                  key={val}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(String(val))}
                  className="flex-1"
                >
                  R${val}
                </Button>
              ))}
            </div>
          </div>

          {/* Potential Payout */}
          {amountCents > 0 && (
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Estimativa se voce ganhar:</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Retorno potencial:</span>
                <span className="font-semibold text-green-600">
                  R$ {(potentialPayout / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Lucro potencial:</span>
                <span className="font-semibold text-green-600">
                  +R$ {(potentialProfit / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Warning */}
          {!isAuthenticated && (
            <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 rounded-lg p-3 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>Voce precisa estar logado para abrir posicoes.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className={cn(
                'flex-1',
                side === 'YES' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              )}
              onClick={handleSubmit}
              disabled={isLoading || amountCents < 100}
            >
              {isLoading ? 'Processando...' : `Comprar ${side === 'YES' ? 'SIM' : 'NÃO'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
