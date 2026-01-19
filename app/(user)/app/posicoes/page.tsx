'use client'

import { useState, useEffect, useCallback } from 'react'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Position } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { toast } from 'sonner'
import Link from 'next/link'
import { 
  History, 
  TrendingUp, 
  TrendingDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const LIMIT = 10

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchPositions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await userApi.getPositions({
        status: statusFilter || undefined,
        limit: LIMIT,
        offset,
      })
      setPositions(response.data.positions)
      setTotalCount(response.data.totalCount)
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, offset])

  useEffect(() => {
    fetchPositions()
  }, [fetchPositions])

  const totalPages = Math.ceil(totalCount / LIMIT)
  const currentPage = Math.floor(offset / LIMIT) + 1

  // Stats
  const activeCount = positions.filter(p => p.status === 'active').length
  const wonCount = positions.filter(p => p.status === 'settled' && p.payoutAmount && p.payoutAmount > 0).length
  const totalInvested = positions.reduce((acc, p) => acc + p.amount, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Minhas Posicoes</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Posicoes</p>
            <p className="text-2xl font-bold">{totalCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ativas</p>
            <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Vitorias</p>
            <p className="text-2xl font-bold text-green-600">{wonCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Investido</p>
            <p className="text-2xl font-bold">
              R$ {(totalInvested / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setOffset(0) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="settled">Finalizadas</SelectItem>
            <SelectItem value="refunded">Reembolsadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Positions List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : positions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Voce ainda nao tem posicoes.</p>
            <Link href="/eventos">
              <Button>Explorar Mercados</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {positions.map((position) => (
            <Card key={position.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {position.side === 'YES' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                      <StatusBadge status={position.side} />
                      <StatusBadge status={position.status} />
                    </div>
                    <h3 className="font-semibold mb-1">{position.marketStatement}</h3>
                    <p className="text-sm text-muted-foreground">{position.eventTitle}</p>
                    
                    {position.eventSlug && (
                      <Link 
                        href={`/eventos/${position.eventSlug}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        Ver evento
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Investido</p>
                    <p className="font-semibold">
                      R$ {(position.amount / 100).toFixed(2)}
                    </p>
                    
                    {position.status === 'settled' && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Retorno</p>
                        <p className={`font-semibold ${position.payoutAmount && position.payoutAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {position.payoutAmount && position.payoutAmount > 0
                            ? `+R$ ${(position.payoutAmount / 100).toFixed(2)}`
                            : 'R$ 0,00'
                          }
                        </p>
                      </div>
                    )}

                    {position.status === 'settled' && position.marketResult && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Resultado:</p>
                        <StatusBadge status={position.marketResult} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                  <span>Aberta em: {new Date(position.createdAt).toLocaleDateString('pt-BR')}</span>
                  {position.settledAt && (
                    <span>Liquidada em: {new Date(position.settledAt).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

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
        </div>
      )}
    </div>
  )
}
