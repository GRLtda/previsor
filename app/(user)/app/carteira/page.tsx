'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Wallet, Deposit, Withdrawal } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/status-badge'
import { DepositModal } from '@/components/wallet/deposit-modal'
import { toast } from 'sonner'
import { RefreshCw, AlertCircle } from 'lucide-react'

type HistoryItem = (Deposit | Withdrawal) & {
  _type: 'deposit' | 'withdrawal'
}

function WalletPageContent() {
  const { user, isOtpVerified, refreshUser } = useAuth()

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [showBalance, setShowBalance] = useState(true)
  const [timeFilter, setTimeFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [methodFilter, setMethodFilter] = useState('all')

  const [depositModalOpen, setDepositModalOpen] = useState(false)
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

  const historyItems: HistoryItem[] = [
    ...deposits.map(d => ({ ...d, _type: 'deposit' as const })),
    ...withdrawals.map(w => ({ ...w, _type: 'withdrawal' as const })),
  ]
    .filter(item => {
      if (timeFilter !== 'all') {
        const date = new Date(item.created_at)
        const now = new Date()
        if (timeFilter === '7days' && date < new Date(now.setDate(now.getDate() - 7))) return false
        if (timeFilter === '30days' && date < new Date(now.setDate(now.getDate() - 30))) return false
        if (timeFilter === '90days' && date < new Date(now.setDate(now.getDate() - 90))) return false
      }
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance / 100)
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
      <div className="mx-auto w-full lg:pt-[60px] pt-0">
        <div className="mx-auto min-h-[100vh] px-3 pt-4 lg:mt-0 lg:max-w-[1118px] lg:pt-11">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 flex items-center gap-4">
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

  const kycApproved = user?.kyc?.status === 'approved'

  return (
    <div className="mx-auto w-full lg:pt-[60px] pt-0">
      <div className="mx-auto min-h-[100vh] px-3 pt-4 lg:mt-0 lg:max-w-[1118px] lg:pt-11">
        <div className="flex flex-col gap-5 lg:pb-20">
          {/* Title */}
          <span className="hidden text-[32px] font-bold text-black dark:text-white lg:flex">
            Visão geral
          </span>

          <div className="flex flex-col gap-3 lg:gap-5">
            {/* Mobile Header */}
            <div className="mb-4 flex items-center justify-between text-black dark:text-white lg:hidden">
              <Link href="/" className="flex size-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.2875 14.94L6.39747 10.05C5.81997 9.4725 5.81997 8.5275 6.39747 7.95L11.2875 3.06" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="flex size-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5799 12C15.5799 13.98 13.9799 15.58 11.9999 15.58C10.0199 15.58 8.41992 13.98 8.41992 12C8.41992 10.02 10.0199 8.41998 11.9999 8.41998C13.9799 8.41998 15.5799 10.02 15.5799 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12.0001 20.27C15.5301 20.27 18.8201 18.19 21.1101 14.59C22.0101 13.18 22.0101 10.81 21.1101 9.39997C18.8201 5.79997 15.5301 3.71997 12.0001 3.71997C8.47009 3.71997 5.18009 5.79997 2.89009 9.39997C1.99009 10.81 1.99009 13.18 2.89009 14.59C5.18009 18.19 8.47009 20.27 12.0001 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="flex size-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.58999 5.19141C11.69 5.37224 12.5475 6.45141 12.5475 8.81391V8.88974C12.5475 11.4972 11.5033 12.5414 8.89582 12.5414H5.09832C2.49082 12.5414 1.44666 11.4972 1.44666 8.88974V8.81391C1.44666 6.46891 2.29249 5.38974 4.35749 5.19724" stroke="currentColor" strokeWidth="1.01111" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.99988 2.15805V8.79639" stroke="currentColor" strokeWidth="1.01111" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.95411 7.49554L6.99994 9.44971L5.04578 7.49554" stroke="currentColor" strokeWidth="1.01111" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Balance Card */}
            <div className="relative z-10 overflow-hidden rounded-2xl bg-[#10131A] px-4 py-5 lg:flex lg:w-full lg:flex-col lg:gap-y-[68px]">
              {/* Background Effects */}
              <div className="pointer-events-none absolute inset-0 size-full opacity-50">
                <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-blue-500/20 to-transparent" />
              </div>
              <div className="pointer-events-none absolute inset-0 z-10 size-full opacity-50">
                <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-purple-500/20 to-transparent" />
              </div>

              {isLoading ? (
                <div className="relative z-30 space-y-4">
                  <Skeleton className="h-4 w-24 bg-white/10" />
                  <Skeleton className="h-10 w-40 bg-white/10" />
                </div>
              ) : (
                <>
                  <div className="relative z-30 flex items-center justify-between">
                    <span className="text-sm font-medium text-white dark:text-[#A1A7BB]">Saldo Total</span>
                    <span className="text-xl font-bold text-white/50">Previzor</span>
                  </div>

                  <div className="relative z-30 mt-10 flex flex-col lg:mt-0 lg:gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[32px] font-bold text-white">
                        {formatBalance(wallet?.balance || 0)}
                      </span>
                      <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="hidden size-8 items-center justify-center rounded-lg bg-white/5 text-[#A1A7BB] lg:flex"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15.5799 12C15.5799 13.98 13.9799 15.58 11.9999 15.58C10.0199 15.58 8.41992 13.98 8.41992 12C8.41992 10.02 10.0199 8.41998 11.9999 8.41998C13.9799 8.41998 15.5799 10.02 15.5799 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12.0001 20.27C15.5301 20.27 18.8201 18.19 21.1101 14.59C22.0101 13.18 22.0101 10.81 21.1101 9.39997C18.8201 5.79997 15.5301 3.71997 12.0001 3.71997C8.47009 3.71997 5.18009 5.79997 2.89009 9.39997C1.99009 10.81 1.99009 13.18 2.89009 14.59C5.18009 18.19 8.47009 20.27 12.0001 20.27Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex flex-col gap-1 text-xs font-medium text-white dark:text-[#A1A7BB]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          Saldo disponível
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.86016 5.36016C7.60448 5.38964 7.41152 5.60612 7.41152 5.8635C7.41152 6.12087 7.60448 6.33736 7.86016 6.36683C7.9945 6.36869 8.12379 6.31569 8.21815 6.22007C8.31252 6.12444 8.36381 5.99446 8.36016 5.86016C8.35657 5.58552 8.1348 5.36375 7.86016 5.36016Z" fill="#A1A7BB" />
                            <path d="M7.86016 7.28016C7.72701 7.27835 7.59877 7.33045 7.50461 7.42461C7.41045 7.51877 7.35835 7.64701 7.36016 7.78016V9.86016C7.36016 10.1363 7.58402 10.3602 7.86016 10.3602C8.1363 10.3602 8.36016 10.1363 8.36016 9.86016V7.7935C8.36376 7.65859 8.31268 7.52796 8.21851 7.43129C8.12435 7.33462 7.99511 7.28011 7.86016 7.28016Z" fill="#A1A7BB" />
                            <path fillRule="evenodd" clipRule="evenodd" d="M7.86016 1.3335C4.25711 1.33717 1.33717 4.25711 1.3335 7.86016C1.3335 11.4647 4.25558 14.3868 7.86016 14.3868C11.4647 14.3868 14.3868 11.4647 14.3868 7.86016C14.3832 4.25711 11.4632 1.33717 7.86016 1.3335ZM7.86016 13.3868C4.80787 13.3868 2.3335 10.9125 2.3335 7.86016C2.3335 4.80787 4.80787 2.3335 7.86016 2.3335C10.9125 2.3335 13.3868 4.80787 13.3868 7.86016C13.3832 10.9109 10.9109 13.3832 7.86016 13.3868Z" fill="#A1A7BB" />
                          </svg>
                        </span>
                        <div className="ml-4 font-semibold text-white">
                          {formatBalance(wallet?.balance || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons Section */}
            <div className="flex flex-col gap-[30px] lg:gap-[50px]">
              <div className="items-center lg:flex">
                <div className="grid w-full grid-cols-2 gap-2.5 text-sm font-semibold lg:flex lg:gap-3">
                  <button
                    onClick={() => setDepositModalOpen(true)}
                    className="flex h-[42px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#0052FF] text-white lg:h-10 lg:w-[111px]"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.84473 1.40527C2.65579 1.21634 2.34421 1.21634 2.15527 1.40527C1.96648 1.59422 1.96638 1.90584 2.15527 2.09473L8.32422 8.2627H4.36523C4.0981 8.2627 3.87793 8.48287 3.87793 8.75C3.87808 9.01701 4.09819 9.2373 4.36523 9.2373H9.5C9.56674 9.2373 9.62587 9.22345 9.68652 9.19922V9.19824C9.80542 9.15164 9.90391 9.05458 9.9502 8.93555L9.94922 8.93457C9.97308 8.87448 9.98727 8.81613 9.9873 8.75V3.61426C9.98705 3.34734 9.76698 3.12695 9.5 3.12695C9.23302 3.12695 9.01295 3.34734 9.0127 3.61426V7.57324L2.84473 1.40527Z" fill="currentColor" stroke="currentColor" strokeWidth="0.225" />
                      <path d="M1.75 10.5127C1.48287 10.5127 1.2627 10.7329 1.2627 11C1.2627 11.2671 1.48287 11.4873 1.75 11.4873H10.25C10.5171 11.4873 10.7373 11.2671 10.7373 11C10.7373 10.7329 10.5171 10.5127 10.25 10.5127H1.75Z" fill="currentColor" stroke="currentColor" strokeWidth="0.225" />
                    </svg>
                    Depósito
                  </button>
                  <button
                    onClick={() => kycApproved ? setWithdrawModalOpen(true) : toast.error('KYC necessário para saques')}
                    disabled={!kycApproved}
                    className="flex h-[42px] w-full items-center justify-center gap-1.5 rounded-lg bg-black/5 text-[#606E85] dark:bg-white/5 dark:text-[#A1A7BB] lg:h-10 lg:w-[124px] disabled:opacity-50"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.75 10.5127C1.48287 10.5127 1.2627 10.7329 1.2627 11C1.2627 11.2671 1.48287 11.4873 1.75 11.4873H10.25C10.5171 11.4873 10.7373 11.2671 10.7373 11C10.7373 10.7329 10.5171 10.5127 10.25 10.5127H1.75Z" fill="currentColor" stroke="currentColor" strokeWidth="0.225" />
                      <path d="M4.36523 1.2627C4.0981 1.2627 3.87793 1.48287 3.87793 1.75C3.87793 2.01713 4.0981 2.2373 4.36523 2.2373H8.32422L2.15527 8.40527C1.96634 8.59421 1.96634 8.90579 2.15527 9.09473C2.25248 9.19194 2.37677 9.2373 2.5 9.2373C2.62323 9.2373 2.74752 9.19194 2.84473 9.09473L9.0127 2.92578V6.88477C9.0127 7.1519 9.23287 7.37207 9.5 7.37207C9.76713 7.37207 9.9873 7.1519 9.9873 6.88477V1.75C9.9873 1.68353 9.97327 1.62484 9.94922 1.56445H9.9502C9.90376 1.44506 9.80494 1.34624 9.68555 1.2998V1.30078C9.62516 1.27673 9.56647 1.2627 9.5 1.2627H4.36523Z" fill="currentColor" stroke="currentColor" strokeWidth="0.225" />
                    </svg>
                    Retirar
                  </button>
                </div>
              </div>

              {/* History Section */}
              <div className="relative h-full">
                <span className="text-xl font-bold text-black dark:text-white lg:text-2xl">Histórico</span>

                <div className="my-[14px] flex-col items-start justify-between gap-4 lg:flex lg:flex-row lg:items-center">
                  <div className="items-center gap-2.5 lg:flex">
                    {/* Time Filter */}
                    <div className="relative">
                      <Select value={timeFilter} onValueChange={setTimeFilter}>
                        <SelectTrigger className="flex w-full items-center gap-1.5 rounded-lg border border-black/10 px-[12px] py-3 text-[#606E85] dark:border-none dark:bg-white/5 dark:text-[#A1A7BB] lg:w-[163px]">
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.5625 2.67V1.5C12.5625 1.1925 12.3075 0.9375 12 0.9375C11.6925 0.9375 11.4375 1.1925 11.4375 1.5V2.625H6.56249V1.5C6.56249 1.1925 6.30749 0.9375 5.99999 0.9375C5.69249 0.9375 5.43749 1.1925 5.43749 1.5V2.67C3.41249 2.8575 2.42999 4.065 2.27999 5.8575C2.26499 6.075 2.44499 6.255 2.65499 6.255H15.345C15.5625 6.255 15.7425 6.0675 15.72 5.8575C15.57 4.065 14.5875 2.8575 12.5625 2.67Z" fill="currentColor" />
                            <path d="M15 7.37988H3C2.5875 7.37988 2.25 7.71738 2.25 8.12988V12.7499C2.25 14.9999 3.375 16.4999 6 16.4999H12C14.625 16.4999 15.75 14.9999 15.75 12.7499V8.12988C15.75 7.71738 15.4125 7.37988 15 7.37988Z" fill="currentColor" />
                          </svg>
                          <SelectValue placeholder="Todo o Tempo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todo o Tempo</SelectItem>
                          <SelectItem value="7days">Últimos 7 dias</SelectItem>
                          <SelectItem value="30days">Últimos 30 dias</SelectItem>
                          <SelectItem value="90days">Últimos 90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2.5 lg:mt-0">
                      {/* Sort Order */}
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="flex w-full items-center gap-2 rounded-lg border border-black/10 px-[12px] py-3 text-[#606E85] dark:border-none dark:bg-white/5 dark:text-[#A1A7BB] lg:min-w-[147px]">
                          <SelectValue placeholder="Mais Novos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Mais Novos</SelectItem>
                          <SelectItem value="oldest">Mais Antigos</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Method Filter */}
                      <Select value={methodFilter} onValueChange={setMethodFilter}>
                        <SelectTrigger className="flex w-full items-center gap-2 rounded-lg border border-black/10 px-[12px] py-3 font-medium dark:border-none dark:bg-white/5 lg:min-w-[147px]">
                          <span className="text-[13px] text-[#606E85] dark:text-[#A1A7BB]">Método:</span>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="deposit">Depósitos</SelectItem>
                          <SelectItem value="withdrawal">Saques</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Refresh Button */}
                      <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex h-[43px] w-fit items-center gap-x-2 rounded-lg px-[12px] text-[13px] text-[#606E85] hover:bg-black/5 dark:bg-white/5 dark:text-[#A1A7BB]"
                      >
                        <span className="hidden items-center whitespace-nowrap lg:flex">Atualizar</span>
                        <RefreshCw className={`size-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Export CSV Button */}
                  <button
                    onClick={handleExportCSV}
                    className="hidden items-center gap-1.5 rounded-lg bg-black/5 px-[14px] py-3 text-[#606E85] hover:bg-black/10 dark:bg-white/5 dark:text-[#A1A7BB] lg:flex"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.58999 5.19141C11.69 5.37224 12.5475 6.45141 12.5475 8.81391V8.88974C12.5475 11.4972 11.5033 12.5414 8.89582 12.5414H5.09832C2.49082 12.5414 1.44666 11.4972 1.44666 8.88974V8.81391C1.44666 6.46891 2.29249 5.38974 4.35749 5.19724" stroke="currentColor" strokeWidth="1.01111" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.99988 2.15805V8.79639" stroke="currentColor" strokeWidth="1.01111" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.95411 7.49554L6.99994 9.44971L5.04578 7.49554" stroke="currentColor" strokeWidth="1.01111" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[13px] font-semibold">Baixar CSV</span>
                  </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <div className="hidden min-w-[800px] lg:block">
                    {/* Table Header */}
                    <div className="w-full gap-6 border-black/10 px-3 py-[13px] text-xs font-medium text-[#606E85] dark:border-white/5 dark:text-[#A1A7BB] lg:grid lg:grid-cols-[1fr_150px_180px_150px_150px] lg:border-b">
                      <div>Solicitações</div>
                      <div className="flex justify-end pr-3">Tipo</div>
                      <div className="flex justify-end pr-3">Método</div>
                      <div className="flex justify-end pr-3">Montante Total</div>
                      <div className="flex justify-end">Status</div>
                    </div>

                    {/* Table Body */}
                    <div className="w-full">
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="w-full gap-6 px-3 py-4 lg:grid lg:grid-cols-[1fr_150px_180px_150px_150px] border-b border-black/5 dark:border-white/5">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))
                      ) : historyItems.length === 0 ? (
                        <div className="text-center py-12 text-[#606E85] dark:text-[#A1A7BB]">
                          Nenhuma transação encontrada
                        </div>
                      ) : (
                        historyItems.map((item) => (
                          <div key={`${item._type}-${item.id}`} className="w-full gap-6 px-3 py-4 lg:grid lg:grid-cols-[1fr_150px_180px_150px_150px] border-b border-black/5 dark:border-white/5 text-sm">
                            <div className="font-medium text-black dark:text-white">
                              {new Date(item.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                              })}
                            </div>
                            <div className={`flex justify-end pr-3 ${item._type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                              {item._type === 'deposit' ? 'Depósito' : 'Saque'}
                            </div>
                            <div className="flex justify-end pr-3 text-[#606E85] dark:text-[#A1A7BB]">PIX</div>
                            <div className="flex justify-end pr-3 font-medium text-black dark:text-white">{item.amount_formatted}</div>
                            <div className="flex justify-end"><StatusBadge status={item.status} /></div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Mobile List */}
                  <div className="block pb-20 lg:hidden">
                    {historyItems.map((item) => (
                      <div key={`mobile-${item._type}-${item.id}`} className="flex items-center justify-between py-4 border-b border-black/5 dark:border-white/5">
                        <div>
                          <div className={`text-sm font-medium ${item._type === 'deposit' ? 'text-green-500' : 'text-red-500'}`}>
                            {item._type === 'deposit' ? 'Depósito' : 'Saque'}
                          </div>
                          <div className="text-xs text-[#606E85] dark:text-[#A1A7BB]">
                            {new Date(item.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-black dark:text-white">{item.amount_formatted}</div>
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <DialogDescription>Informe o valor e a chave PIX para receber</DialogDescription>
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
                        pixKeyType === 'phone' ? '+5511999999999' : 'Chave aleatória'
                }
                value={pixKeyValue}
                onChange={(e) => setPixKeyValue(e.target.value)}
              />
            </div>

            {Number.parseFloat(withdrawAmount) >= 10 && (
              <div className="bg-black/5 dark:bg-white/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Valor do saque:</span>
                  <span>R$ {Number.parseFloat(withdrawAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#606E85] dark:text-[#A1A7BB]">
                  <span>Taxa (2%):</span>
                  <span>-R$ {(Number.parseFloat(withdrawAmount) * 0.02).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-black/10 dark:border-white/10 pt-2">
                  <span>Você receberá:</span>
                  <span className="text-green-500">R$ {(Number.parseFloat(withdrawAmount) * 0.98).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateWithdraw}
              disabled={isCreatingWithdraw || Number.parseFloat(withdrawAmount) < 10 || !pixKeyType || !pixKeyValue}
              className="w-full h-[46px] rounded-lg bg-[#0052FF] text-white font-semibold hover:bg-[#004AE5] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingWithdraw ? 'Processando...' : 'Solicitar Saque'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full lg:pt-[60px] pt-0">
        <div className="mx-auto min-h-[100vh] px-3 pt-4 lg:mt-0 lg:max-w-[1118px] lg:pt-11">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-40 rounded-2xl mb-6" />
          <div className="flex gap-3 mb-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    }>
      <WalletPageContent />
    </Suspense>
  )
}
