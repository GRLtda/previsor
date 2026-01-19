'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Wallet, Position } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import Link from 'next/link'
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  History, 
  ArrowRight,
  AlertCircle,
  User,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AppDashboardPage() {
  const { user, isOtpVerified } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!isOtpVerified) {
        setIsLoading(false)
        return
      }

      try {
        const [walletRes, positionsRes] = await Promise.all([
          userApi.getWallet(),
          userApi.getPositions({ limit: 5 }),
        ])
        setWallet(walletRes.data.wallet)
        setPositions(positionsRes.data.positions)
      } catch (err) {
        if (err instanceof ApiClientError) {
          toast.error(err.message)
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [isOtpVerified])

  if (!isOtpVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800">Verificacao Pendente</h3>
              <p className="text-sm text-yellow-700">
                Voce precisa verificar seu telefone para acessar todas as funcionalidades.
              </p>
            </div>
            <Link href="/auth/otp" className="ml-auto">
              <Button variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 bg-transparent">
                Verificar Agora
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Ola, {user?.full_name || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Bem-vindo ao seu painel. Acompanhe suas posicoes e carteira.
        </p>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Saldo Disponivel"
            value={wallet?.balance_formatted || 'R$ 0,00'}
            icon={WalletIcon}
          />
          <StatCard
            title="Posicoes Ativas"
            value={positions.filter((p) => p.status === 'active').length}
            icon={TrendingUp}
          />
          <StatCard
            title="KYC Status"
            value={user?.kyc?.status === 'approved' ? 'Aprovado' : 'Pendente'}
            icon={User}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              Carteira
            </CardTitle>
            <CardDescription>Gerencie seus depositos e saques</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href="/app/carteira" className="flex-1">
              <Button className="w-full gap-2">
                <Plus className="h-4 w-4" />
                Depositar
              </Button>
            </Link>
            <Link href="/app/carteira?tab=saques" className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                Sacar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Mercados
            </CardTitle>
            <CardDescription>Explore eventos e abra posicoes</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/eventos">
              <Button className="w-full gap-2">
                Ver Eventos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Positions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Posicoes Recentes
            </CardTitle>
            <CardDescription>Suas ultimas posicoes abertas</CardDescription>
          </div>
          <Link href="/app/posicoes">
            <Button variant="ghost" size="sm">
              Ver Todas
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Voce ainda nao tem posicoes.</p>
              <Link href="/eventos">
                <Button variant="link">Explorar Mercados</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm line-clamp-1">
                      {position.marketStatement || 'Mercado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {position.eventTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={position.side} />
                    <div className="text-right">
                      <p className="font-semibold">
                        R$ {(position.amount / 100).toFixed(2)}
                      </p>
                      <StatusBadge status={position.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
