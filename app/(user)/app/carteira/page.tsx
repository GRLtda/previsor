'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Wallet, Deposit, Withdrawal, Position, WalletEntry } from '@/lib/types'

type TransactionItem = {
  id: string
  type: 'deposit' | 'withdrawal'
  created_at: string
  amount_formatted: string
  status: string
  description: string
}
import { useAuth } from '@/contexts/auth-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { DepositModal } from '@/components/wallet/deposit-modal'
import { WithdrawModal } from '@/components/wallet/withdraw-modal'
import { toast } from 'sonner'
import { AlertCircle, Search, Share, Eye, EyeOff, History, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'


function WalletPageContent() {
  const { user, isOtpVerified, refreshUser } = useAuth()

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [activities, setActivities] = useState<WalletEntry[]>([])
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(true)

  const [activeTab, setActiveTab] = useState('transacoes')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)

  // Pagination states
  const [currentPageActivities, setCurrentPageActivities] = useState(1)
  const [currentPageTransactions, setCurrentPageTransactions] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Calculate paginated data
  const totalActivityPages = Math.ceil(activities.length / ITEMS_PER_PAGE)
  const paginatedActivities = useMemo(() => {
    return activities.slice((currentPageActivities - 1) * ITEMS_PER_PAGE, currentPageActivities * ITEMS_PER_PAGE)
  }, [activities, currentPageActivities])

  const totalTransactionPages = Math.ceil(transactions.length / ITEMS_PER_PAGE)
  const paginatedTransactions = useMemo(() => {
    return transactions.slice((currentPageTransactions - 1) * ITEMS_PER_PAGE, currentPageTransactions * ITEMS_PER_PAGE)
  }, [transactions, currentPageTransactions])

  // Reset pagination when data length changes
  useEffect(() => {
    setCurrentPageActivities(1)
  }, [activities.length])

  useEffect(() => {
    setCurrentPageTransactions(1)
  }, [transactions.length])

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, statementRes, depositsRes, withdrawalsRes] = await Promise.all([
        userApi.getWallet(),
        userApi.getStatement({ limit: 100 }).catch(() => ({ data: { entries: [], pagination: { total: 0, limit: 100, offset: 0 } } })),
        userApi.getDeposits({ limit: 50 }).catch(() => ({ data: { deposits: [], pagination: { total: 0, limit: 50, offset: 0 } } })),
        userApi.getWithdrawals({ limit: 50 }).catch(() => ({ data: { withdrawals: [], pagination: { total: 0, limit: 50, offset: 0 } } }))
      ])

      const deps = (depositsRes.data.deposits || []).map(d => ({
        id: d.id,
        type: 'deposit' as const,
        created_at: d.created_at,
        amount_formatted: d.amount_formatted,
        status: d.status,
        description: 'Depósito'
      }))

      const wths = (withdrawalsRes.data.withdrawals || []).map(w => ({
        id: w.id,
        type: 'withdrawal' as const,
        created_at: w.created_at,
        amount_formatted: w.amount_formatted,
        status: w.status,
        description: 'Saque'
      }))

      const allTrans = [...deps, ...wths].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const acts = (statementRes.data.entries || []).filter(e => ['position', 'settlement', 'position_close', 'position_payout', 'position_refund'].includes(e.reference_type))

      setWallet(walletRes.data.wallet)
      setActivities(acts)
      setTransactions(allTrans)
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    }
  }, [user?.id])

  useEffect(() => {
    if (isOtpVerified) {
      setIsLoading(true)
      fetchData().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [isOtpVerified, fetchData])

  const handleClosePosition = async (positionId: string) => {
    try {
      await userApi.closePosition(positionId)
      toast.success('Posição encerrada com sucesso!')
      fetchData()
      refreshUser()
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      } else {
        toast.error('Ocorreu um erro ao encerrar a posição')
      }
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)
  }

  const kycApproved = user?.kyc?.status === 'approved'

  if (!isOtpVerified) {
    return (
      <div className="mx-auto w-full lg:pt-[60px] pt-0">
        <div className="mx-auto min-h-[100vh] px-3 pt-4 lg:mt-0 lg:max-w-[1200px] lg:pt-11">
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Verificação Necessária</h3>
              <p className="text-sm text-yellow-700">Verifique seu telefone para acessar a carteira.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="flex size-full flex-col items-center justify-center px-4 pb-16 pt-[89px] lg:pt-[32px]">
      <div className="mx-auto h-full w-full max-w-[1140px] pb-20 lg:pb-0">
        <div className="flex w-full min-h-[220px] flex-col gap-3 lg:max-h-[220px] lg:flex-row lg:gap-4">
          <div className="flex flex-1">
            <div className="flex size-full max-h-[220px] min-h-[220px] animate-fade-left flex-col justify-between rounded-3xl border border-black/10 bg-white p-5 text-white animate-normal animate-duration-[400ms] animate-once animate-ease-out dark:border-white/5 dark:bg-[#1c1c24]">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="mb-4 text-sm font-normal text-[#8A8C99]">Saldo Total</h2>
                  <div className="relative mb-0.5 text-3xl font-bold text-[#00B471]">
                    <span className={cn("absolute inset-0 transition-all font-semibold duration-300 ease-out", balanceVisible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-2 blur-sm")}>
                      {formatCurrency(wallet?.balance || 0)}
                    </span>
                    <span className={cn("absolute inset-0 transition-all duration-300 ease-out", !balanceVisible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-2 blur-sm")}>
                      ••••••
                    </span>
                    <span className="invisible">{formatCurrency(wallet?.balance || 0)}</span>
                  </div>
                  <div className="relative mt-1 flex items-center gap-2 text-xs text-[#8A8C99]">
                    <span>Saldo da Carteira</span>
                    <span className="text-[#f0f0f0]">{formatCurrency(wallet?.balance || 0)}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="flex size-[38px] items-center justify-center rounded-full bg-black/5 transition-colors dark:bg-white/5 dark:hover:bg-white/10">
                    <History className="size-4 text-[#8A8C99]" />
                  </button>
                  <button
                    onClick={() => setBalanceVisible(!balanceVisible)}
                    className="flex size-[38px] items-center justify-center rounded-full bg-black/5 transition-colors dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    {balanceVisible ? <Eye className="size-4 text-[#8A8C99]" /> : <EyeOff className="size-4 text-[#8A8C99]" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setDepositModalOpen(true)}
                  className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[14px] bg-black text-sm font-normal text-white transition-colors hover:bg-black/90 dark:bg-[#f0f0f0] dark:text-black hover:dark:bg-white/90"
                >
                  <ArrowDownLeft className="size-3.5" />
                  Depósito
                </button>
                <button
                  onClick={() => kycApproved ? setWithdrawModalOpen(true) : toast.error('KYC necessário para saques')}
                  disabled={!kycApproved}
                  className="flex h-12 flex-1 bg-black/5 disabled:opacity-70 disabled:cursor-not-allowed ease-in-out hover:bg-black/10 hover:dark:bg-white/[7%] dark:bg-white/5 items-center text-sm text-[#8A8C99] justify-center gap-1.5 rounded-[14px] font-normal transition-colors"
                >
                  <ArrowUpRight className="size-3.5" />
                  Retirar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full animate-fade-up animate-normal animate-duration-[400ms] animate-once animate-ease-out">
          <div className="flex w-full items-center justify-center">
            <div className="hidden items-center lg:block ml-auto">
              <Logo width={168} height={30} className="relative mt-4" />
            </div>
          </div>

          <div className="mt-5 lg:mt-0">
            <div className="rounded-3xl border-black/10 bg-transparent dark:border-white/5 dark:bg-transparent lg:mt-4 lg:border lg:p-5">
              <div className="w-full relative h-full">
                <div className="relative flex h-10 items-center justify-between">
                  <div className="relative flex items-baseline mb-0 w-fit justify-start gap-x-2.5 bg-transparent dark:bg-transparent max-lg:overflow-x-auto max-lg:whitespace-nowrap" role="tablist">
                    {['transacoes', 'atividades'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "flex relative text-sm outline-0 items-center py-2.5 px-4 h-fit w-fit rounded-xl transition-all ease-in-out font-medium",
                          activeTab === tab
                            ? "dark:bg-white bg-black text-white dark:text-black"
                            : "text-[#8A8C99] bg-transparent border border-black/10 dark:bg-white/5 hover:dark:text-white hover:text-black hover:border-black/20 hover:dark:border-white/10"
                        )}
                      >
                        <span className="capitalize">{tab === 'atividades' ? 'Atividades' : 'Transações'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="size-full">
                  <div className="w-full h-full p-0 mt-3">
                    {activeTab === 'atividades' && (
                      <section className="w-full">
                        <div className="flex w-full items-center gap-2.5 mb-4">
                          <div className="flex h-10 w-full items-center justify-between rounded-xl p-3.5 text-sm transition-all border border-black/10 bg-transparent hover:border-black/20 dark:bg-white/5 hover:dark:border-white/10">
                            <div className="flex w-full items-center gap-x-1.5">
                              <Search className="size-3.5 text-[#8A8C99]" />
                              <input
                                placeholder="Pesquisar por Mercados, Tópicos..."
                                className="flex w-full flex-1 bg-transparent outline-none placeholder:text-black/30 dark:text-[#f0f0f0] dark:placeholder:text-white/30"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="relative h-10 max-w-[200px] rounded-xl lg:min-w-[200px]">
                            <Select value={sortOrder} onValueChange={setSortOrder}>
                              <SelectTrigger className="h-10 w-full whitespace-nowrap rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] font-medium text-[#8A8C99] transition-all hover:border-black/20 dark:border-none dark:bg-white/5 dark:text-[#f0f0f0]">
                                <div className="text-[#8A8C99]">Ordenar: <span className="ml-0.5 text-black dark:text-[#f0f0f0]">{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span></div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="newest">Newest</SelectItem>
                                <SelectItem value="oldest">Oldest</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="overflow-x-auto min-h-[300px] w-full rounded-lg">
                          <table className="h-full min-w-full divide-y divide-black/10 dark:divide-white/5">
                            <thead>
                              <tr>
                                <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Data</th>
                                <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Tipo</th>
                                <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Descrição</th>
                                <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Valor</th>
                                <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Saldo</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                              {activities.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-20 text-center text-[#8A8C99]">Nenhuma atividade encontrada</td>
                                </tr>
                              ) : (
                                paginatedActivities.map((entry) => (
                                  <tr key={entry.id} className="hover:bg-black/[2%] dark:hover:bg-white/[2%] transition-colors group">
                                    <td className="px-5 py-5 lg:px-4">
                                      <span className="text-sm text-black dark:text-[#f0f0f0]">
                                        {new Date(entry.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </td>
                                    <td className="px-5 py-5 lg:px-4">
                                      <div className="flex items-center gap-2">
                                        {entry.type === 'credit' ? (
                                          <ArrowDownLeft className="size-4 text-[#00B471]" />
                                        ) : (
                                          <ArrowUpRight className="size-4 text-red-500" />
                                        )}
                                        <span className={cn(
                                          "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                          entry.type === 'credit' ? "bg-[#00B471]/10 text-[#00B471]" : "bg-red-500/10 text-red-500"
                                        )}>
                                          {entry.type === 'credit' ? 'Venda' : 'Compra'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-5 py-5 lg:px-4 text-sm text-[#8A8C99]">
                                      {entry.description}
                                    </td>
                                    <td className="px-5 py-5 lg:px-4 text-right">
                                      <span className={cn(
                                        "text-sm font-semibold",
                                        entry.type === 'credit' ? "text-[#00B471]" : "text-black dark:text-[#f0f0f0]"
                                      )}>
                                        {entry.type === 'credit' ? '+' : '-'}{entry.amount_formatted}
                                      </span>
                                    </td>
                                    <td className="px-5 py-5 lg:px-4 text-right text-sm font-medium text-black dark:text-[#f0f0f0]">
                                      {entry.balance_after_formatted}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Controls for Activities */}
                        {totalActivityPages > 1 && (
                          <div className="flex justify-center items-center gap-4 mt-6">
                            <button
                              onClick={() => setCurrentPageActivities(prev => Math.max(1, prev - 1))}
                              disabled={currentPageActivities === 1}
                              className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5 text-black dark:text-white"
                            >
                              Anterior
                            </button>
                            <span className="text-sm text-muted-foreground">
                              Página {currentPageActivities} de {totalActivityPages}
                            </span>
                            <button
                              onClick={() => setCurrentPageActivities(prev => Math.min(totalActivityPages, prev + 1))}
                              disabled={currentPageActivities === totalActivityPages}
                              className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5 text-black dark:text-white"
                            >
                              Próxima
                            </button>
                          </div>
                        )}
                      </section>
                    )}
                    {activeTab === 'transacoes' && (
                      <section className="w-full">
                        <div className="overflow-x-auto min-h-[300px] w-full rounded-lg">
                          <table className="h-full min-w-full divide-y divide-black/10 dark:divide-white/5">
                            <thead>
                              <tr>
                                <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Data</th>
                                <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Tipo</th>
                                <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Descrição</th>
                                <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Valor</th>
                                <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                              {transactions.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="py-20 text-center text-[#8A8C99]">Nenhuma transação encontrada</td>
                                </tr>
                              ) : (
                                paginatedTransactions.map((entry) => {
                                  let statusColor = 'bg-gray-500/10 text-gray-500'
                                  let statusText = entry.status

                                  if (entry.status === 'paid' || entry.status === 'completed') {
                                    statusColor = 'bg-emerald-500/10 text-emerald-500'
                                    statusText = 'Concluído'
                                  } else if (entry.status === 'pending') {
                                    statusColor = 'bg-amber-500/10 text-amber-500'
                                    statusText = 'Pendente'
                                  } else if (entry.status === 'processing') {
                                    statusColor = 'bg-blue-500/10 text-blue-500'
                                    statusText = 'Processando'
                                  } else if (entry.status === 'failed' || entry.status === 'expired' || entry.status === 'cancelled') {
                                    statusColor = 'bg-red-500/10 text-red-500'
                                    statusText = entry.status === 'failed' ? 'Falhou' : entry.status === 'expired' ? 'Expirado' : 'Cancelado'
                                  }

                                  return (
                                    <tr key={entry.id} className="hover:bg-black/[2%] dark:hover:bg-white/[2%] transition-colors group">
                                      <td className="px-5 py-5 lg:px-4">
                                        <span className="text-sm text-black dark:text-[#f0f0f0]">
                                          {new Date(entry.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </td>
                                      <td className="px-5 py-5 lg:px-4">
                                        <div className="flex items-center gap-2">
                                          {entry.type === 'deposit' ? (
                                            <ArrowDownLeft className="size-4 text-[#00B471]" />
                                          ) : (
                                            <ArrowUpRight className="size-4 text-red-500" />
                                          )}
                                          <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                            entry.type === 'deposit' ? "bg-[#00B471]/10 text-[#00B471]" : "bg-red-500/10 text-red-500"
                                          )}>
                                            {entry.type === 'deposit' ? 'Depósito' : 'Saque'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-5 py-5 lg:px-4 text-sm text-[#8A8C99]">
                                        {entry.description}
                                      </td>
                                      <td className="px-5 py-5 lg:px-4 text-right">
                                        <span className={cn(
                                          "text-sm font-semibold",
                                          entry.type === 'deposit' ? "text-[#00B471]" : "text-black dark:text-[#f0f0f0]"
                                        )}>
                                          {entry.type === 'deposit' ? '+' : '-'}{entry.amount_formatted}
                                        </span>
                                      </td>
                                      <td className="px-5 py-5 lg:px-4 text-right">
                                        <span className={cn(
                                          "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                          statusColor
                                        )}>
                                          {statusText}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Controls for Transactions */}
                        {totalTransactionPages > 1 && (
                          <div className="flex justify-center items-center gap-4 mt-6">
                            <button
                              onClick={() => setCurrentPageTransactions(prev => Math.max(1, prev - 1))}
                              disabled={currentPageTransactions === 1}
                              className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5 text-black dark:text-white"
                            >
                              Anterior
                            </button>
                            <span className="text-sm text-muted-foreground">
                              Página {currentPageTransactions} de {totalTransactionPages}
                            </span>
                            <button
                              onClick={() => setCurrentPageTransactions(prev => Math.min(totalTransactionPages, prev + 1))}
                              disabled={currentPageTransactions === totalTransactionPages}
                              className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5 text-black dark:text-white"
                            >
                              Próxima
                            </button>
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      <WithdrawModal
        isOpen={withdrawModalOpen}
        onOpenChange={(open) => {
          setWithdrawModalOpen(open)
          if (!open) {
            fetchData()
            refreshUser()
          }
        }}
      />
    </div>
  )
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full max-w-[1200px] px-3 pt-[80px]">
        <Skeleton className="h-[180px] w-full rounded-[20px] mb-6" />
        <Skeleton className="h-[400px] w-full rounded-[20px]" />
      </div>
    }>
      <WalletPageContent />
    </Suspense>
  )
}
