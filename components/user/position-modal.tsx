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
      const shares = response.data.position.shares
      toast.success(`Posição aberta! Você recebeu ${shares.toLocaleString('pt-BR')} shares.`)
      onSuccess?.({
        ...market,
        totalPool: response.data.market.totalPool,
        poolYes: response.data.market.poolYes,
        poolNo: response.data.market.poolNo,
        probYes: response.data.market.probYes,
        probNo: response.data.market.probNo,
      })
      setAmount('')
      onOpenChange(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate potential payout
  const currentPool = side === 'YES' ? market.poolYes : market.poolNo
  const oppositePool = side === 'YES' ? market.poolNo : market.poolYes
  const newPool = currentPool + amountCents
  const shareOfPool = amountCents / newPool
  const potentialPayout = amountCents > 0 ? (newPool + oppositePool) * shareOfPool : 0
  const potentialProfit = potentialPayout - amountCents

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
                  <span className="font-bold text-green-600">YES</span>
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
                  <span className="font-bold text-red-600">NO</span>
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
              {isLoading ? 'Processando...' : `Comprar ${side}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
