'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Wallet, WalletEntry, Deposit, Withdrawal } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { DepositModal } from '@/components/wallet/deposit-modal'
import { toast } from 'sonner'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Calendar,
  ChevronDown,
  AlertCircle,
  Copy,
  CheckCircle,
} from 'lucide-react'

type HistoryItem = (Deposit | Withdrawal) & {
  _type: 'deposit' | 'withdrawal'
}

function WalletPageContent() {
  const searchParams = useSearchParams()
  const { user, isOtpVerified, refreshUser } = useAuth()

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Balance visibility
  const [showBalance, setShowBalance] = useState(true)

  // Filters
  const [timeFilter, setTimeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [methodFilter, setMethodFilter] = useState('all')

  // Deposit modal
  const [depositModalOpen, setDepositModalOpen] = useState(false)

  // Withdraw modal
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [pixKeyType, setPixKeyType] = useState('')
  const [pixKeyValue, setPixKeyValue] = useState('')
  const [isCreatingWithdraw, setIsCreatingWithdraw] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, depositsRes, withdrawalsRes] = await Promise.all([
        userApi.getWallet(),
        userApi.getDeposits({ limit: 50 }),
        userApi.getWithdrawals({ limit: 50 }),
      ])
      setWallet(walletRes.data.wallet)
      setDeposits(depositsRes.data.deposits)
      setWithdrawals(withdrawalsRes.data.withdrawals)
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    await refreshUser()
    setIsRefreshing(false)
    toast.success('Dados atualizados!')
  }

  useEffect(() => {
    if (isOtpVerified) {
      setIsLoading(true)
      fetchData().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [isOtpVerified, fetchData])

  const handleCreateWithdraw = async () => {
    const amountCents = Math.round(Number.parseFloat(withdrawAmount) * 100)
    if (amountCents < 1000) {
      toast.error('Valor mínimo: R$ 10,00')
      return
    }

    if (!pixKeyType || !pixKeyValue) {
      toast.error('Preencha a chave PIX')
      return
    }

    setIsCreatingWithdraw(true)
    try {
      await userApi.createWithdrawal(amountCents, pixKeyType, pixKeyValue)
      toast.success('Saque solicitado com sucesso!')
      setWithdrawModalOpen(false)
      setWithdrawAmount('')
      setPixKeyType('')
      setPixKeyValue('')
      fetchData()
      refreshUser()
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    } finally {
      setIsCreatingWithdraw(false)
    }
  }

  // Combine and filter history
  const historyItems: HistoryItem[] = [
    ...deposits.map(d => ({ ...d, _type: 'deposit' as const })),
    ...withdrawals.map(w => ({ ...w, _type: 'withdrawal' as const })),
  ]
    .filter(item => {
      // Time filter
      if (timeFilter !== 'all') {
        const date = new Date(item.created_at)
        const now = new Date()
        if (timeFilter === '7days' && date < new Date(now.setDate(now.getDate() - 7))) return false
        if (timeFilter === '30days' && date < new Date(now.setDate(now.getDate() - 30))) return false
        if (timeFilter === '90days' && date < new Date(now.setDate(now.getDate() - 90))) return false
      }
      // Method filter
      if (methodFilter !== 'all') {
        if (methodFilter === 'deposit' && item._type !== 'deposit') return false
        if (methodFilter === 'withdrawal' && item._type !== 'withdrawal') return false
      }
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  const formatBalance = (balance: number) => {
    if (!showBalance) return 'R$ •••••'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(balance / 100)
  }

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Método', 'Valor', 'Status']
    const rows = historyItems.map(item => [
      new Date(item.created_at).toLocaleDateString('pt-BR'),
      item._type === 'deposit' ? 'Depósito' : 'Saque',
      'PIX',
      item.amount_formatted,
      item.status,
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `historico-carteira-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('CSV exportado!')
  }

  if (!isOtpVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 flex items-center gap-4">
          <AlertCircle className="h-8 w-8 text-yellow-600" />
          <div>
            <h3 className="font-semibold text-yellow-800">Verificação Necessária</h3>
            <p className="text-sm text-yellow-700">
              Verifique seu telefone para acessar a carteira.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const kycApproved = user?.kyc?.status === 'approved'

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6">Visão geral</h1>

      {/* Balance Card */}
      <div className="rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] p-6 mb-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-24 bg-white/10" />
            <Skeleton className="h-10 w-40 bg-white/10" />
            <Skeleton className="h-4 w-32 bg-white/10" />
          </div>
        ) : (
          <>
            <p className="text-sm text-[#00C805] font-medium mb-2">Saldo Total</p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl font-bold text-white">
                {formatBalance(wallet?.balance || 0)}
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {showBalance ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>Saldo disponível</span>
              <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center">
                <span className="text-[10px]">?</span>
              </div>
              <span className="text-white/80 font-medium ml-2">
                {formatBalance(wallet?.balance || 0)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-8">
        <Button
          className="bg-[#0055FF] hover:bg-[#0044CC] text-white font-semibold px-6 gap-2"
          onClick={() => setDepositModalOpen(true)}
        >
          <ArrowDownToLine className="h-4 w-4" />
          Depósito
        </Button>
        <Button
          variant="outline"
          className="font-semibold px-6 gap-2"
          onClick={() => kycApproved ? setWithdrawModalOpen(true) : toast.error('KYC necessário para saques')}
          disabled={!kycApproved}
        >
          <ArrowUpFromLine className="h-4 w-4" />
          Retirar
        </Button>
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Histórico</h2>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[150px] bg-muted/50">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o Tempo</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[140px] bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais Novos</SelectItem>
              <SelectItem value="oldest">Mais Antigos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-[150px] bg-muted/50">
              <SelectValue placeholder="Método: Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Método: Todos</SelectItem>
              <SelectItem value="deposit">Depósitos</SelectItem>
              <SelectItem value="withdrawal">Saques</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" />
            Baixar CSV
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-medium">Solicitações</TableHead>
                <TableHead className="font-medium">Tipo</TableHead>
                <TableHead className="font-medium">Método</TableHead>
                <TableHead className="font-medium text-right">Montante Total</TableHead>
                <TableHead className="font-medium text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : historyItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nenhuma transação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                historyItems.map((item) => (
                  <TableRow key={`${item._type}-${item.id}`}>
                    <TableCell className="font-medium">
                      {new Date(item.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <span className={item._type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                        {item._type === 'deposit' ? 'Depósito' : 'Saque'}
                      </span>
                    </TableCell>
                    <TableCell>PIX</TableCell>
                    <TableCell className="text-right font-medium">
                      {item.amount_formatted}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={depositModalOpen}
        onOpenChange={(open) => {
          setDepositModalOpen(open)
          if (!open) {
            fetchData()
            refreshUser()
          }
        }}
      />

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sacar via PIX</DialogTitle>
            <DialogDescription>
              Informe o valor e a chave PIX para receber
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="10"
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo: R$ 10,00 | Disponível: {wallet?.balance_formatted}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Chave PIX</Label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="random">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input
                placeholder={
                  pixKeyType === 'cpf' ? '00000000000' :
                    pixKeyType === 'cnpj' ? '00000000000000' :
                      pixKeyType === 'email' ? 'seu@email.com' :
                        pixKeyType === 'phone' ? '+5511999999999' :
                          'Chave aleatória'
                }
                value={pixKeyValue}
                onChange={(e) => setPixKeyValue(e.target.value)}
              />
            </div>

            {Number.parseFloat(withdrawAmount) >= 10 && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Valor do saque:</span>
                  <span>R$ {Number.parseFloat(withdrawAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Taxa (2%):</span>
                  <span>-R$ {(Number.parseFloat(withdrawAmount) * 0.02).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Você receberá:</span>
                  <span className="text-green-600">
                    R$ {(Number.parseFloat(withdrawAmount) * 0.98).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleCreateWithdraw}
              disabled={isCreatingWithdraw || Number.parseFloat(withdrawAmount) < 10 || !pixKeyType || !pixKeyValue}
            >
              {isCreatingWithdraw ? 'Processando...' : 'Solicitar Saque'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-40 rounded-xl mb-6" />
        <div className="flex gap-3 mb-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    }>
      <WalletPageContent />
    </Suspense>
  )
}
