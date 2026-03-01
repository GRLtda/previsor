'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Wallet, Deposit, Withdrawal, Position } from '@/lib/types'
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
import { DepositModal } from '@/components/wallet/deposit-modal'
import { toast } from 'sonner'
import { AlertCircle, Search, Share, Eye, EyeOff, History, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

const Odometer = ({ value }: { value: number }) => {
  const formatted = (value / 100).toFixed(2).split('.')
  const integerPart = formatted[0]
  const decimalPart = formatted[1]

  return (
    <span className="inline-flex items-baseline">
      R$
      <span>
        {integerPart.split('').map((digit, i) => (
          <span key={i} className="inline-block">{digit}</span>
        ))}
      </span>
      <span>.</span>
      <span className="inline-block">{decimalPart}</span>
    </span>
  )
}

function WalletPageContent() {
  const { user, isOtpVerified, refreshUser } = useAuth()

  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(true)

  const [viewMode, setViewMode] = useState<'portfolio' | 'favorites'>('portfolio')
  const [activeTab, setActiveTab] = useState('previsoes')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [pixKeyType, setPixKeyType] = useState('')
  const [pixKeyValue, setPixKeyValue] = useState('')
  const [isCreatingWithdraw, setIsCreatingWithdraw] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    portfolioValue: 0,
    profitLoss: 0,
    volume: 0,
    winRate: 0,
    winCount: 0,
    lossCount: 0,
  })

  const categoriesList = useMemo(() => {
    const baseCategories = [
      { id: 'esportes', name: 'Esportes', icon: '/assets/svg/profile/football.svg', color: '#00B774', bgColor: 'rgba(0, 183, 116, 0.12)' },
      { id: 'social', name: 'Social', icon: '/assets/svg/profile/social.svg', color: '#E922FF', bgColor: 'rgba(233, 34, 255, 0.12)' },
      { id: 'cripto', name: 'Cripto', icon: '/assets/svg/profile/btc.svg', color: '#FA9316', bgColor: 'rgba(250, 147, 22, 0.12)' },
      { id: 'politica', name: 'Política', icon: '/assets/svg/profile/politics.svg', color: '#0052FF', bgColor: 'rgba(0, 82, 255, 0.12)' },
      { id: 'jogos', name: 'Jogos', icon: '/assets/svg/profile/gaming.svg', color: '#8A8C99', bgColor: 'rgba(255, 255, 255, 0.05)' },
      { id: 'mercados_rapid', name: 'Mercados Rápid.', icon: '/assets/svg/profile/fast.svg', color: '#8A8C99', bgColor: 'rgba(255, 255, 255, 0.05)' },
    ];

    return baseCategories.map((cat) => ({
      ...cat,
      count: positions.filter(p =>
        p.marketStatus === 'open' && p.status === 'active' && (
          p.eventCategory?.toLowerCase() === cat.id ||
          (cat.id === 'esportes' && p.eventCategory?.toLowerCase() === 'esporte') ||
          (cat.id === 'politica' && (p.eventCategory?.toLowerCase() === 'política' || p.eventCategory?.toLowerCase() === 'politica'))
        )
      ).length
    }));
  }, [positions]);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, publicProfileRes] = await Promise.all([
        userApi.getWallet(),
        userApi.getPublicProfile(user?.id || '', { limit: 100 }).catch(() => ({ data: { positions: [], stats: { portfolioValue: 0, profitLoss: 0, volume: 0, winRate: 0, liveMarkets: 0, marketsTraded: 0, openPositions: 0 } } }))
      ])

      setWallet(walletRes.data.wallet)
      setPositions(publicProfileRes.data.positions)
      setStats({
        ...publicProfileRes.data.stats,
        winCount: (publicProfileRes.data.stats as any).winCount || 0,
        lossCount: (publicProfileRes.data.stats as any).lossCount || 0,
      })
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

  const handleCreateWithdraw = async () => {
    const amountCents = Math.round(Number.parseFloat(withdrawAmount) * 100)
    if (amountCents < 1000) {
      toast.error('Valor mínimo: R$ 10,00')
      return
    }
    if (!pixKeyType || !pixKeyValue) {
      toast.error('Preencha a sua chave PIX')
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

  const activePositions = positions.filter(p => p.status === 'active')

  return (
    <div className="flex size-full flex-col items-center justify-center px-4 pb-16 pt-[89px] lg:pt-[32px]">
      <div className="mx-auto h-full w-full max-w-[1140px] pb-20 lg:pb-0">
        <div className="flex min-h-[220px] flex-col gap-3 lg:max-h-[220px] lg:flex-row lg:gap-4">
          {/* Portfolio Card */}
          <section className="relative z-10 size-full max-h-[300px] min-h-[300px] max-w-3xl animate-fade-right overflow-hidden rounded-[30px] border-white/5 p-6 animate-normal animate-duration-[400ms] animate-once animate-ease-out dark:border max-sm:px-0.5 lg:max-h-[220px] lg:min-h-[220px]">
            <div className="absolute inset-0 overflow-hidden rounded-[30px]">
              <div className="absolute inset-0 bg-[url('/assets/img/texture.webp')] bg-cover bg-no-repeat opacity-40"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c24] via-[#1c1c24] to-[#1c1c24]/85 lg:bg-gradient-to-r"></div>
            </div>

            <header className="relative z-10 flex size-full min-h-[165px] justify-between text-white max-sm:min-h-[209px]">
              <div className="flex flex-col gap-3 px-5 lg:px-0">
                {viewMode === 'portfolio' ? (
                  <div className="flex flex-col gap-3">
                    <span className="mb-3 flex items-center gap-x-1 text-sm font-normal text-[#8A8C99]">Valor do Portfolio</span>
                    <span className="relative bottom-1 text-4xl font-semibold text-[#f0f0f0]">
                      <Odometer value={stats.portfolioValue} />
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-[#00B471]">
                      <ArrowUpRight className="size-3" />
                      +R$0,00 (+0.00%)
                    </span>
                  </div>
                ) : (
                  <div className="favorite-categories relative flex w-full flex-col lg:max-w-[430px]">
                    <div className="flex items-center mb-4">
                      <h2 className="text-sm font-normal text-[#8A8C99]">Categorias Favoritas</h2>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">
                      <div className="flex lg:justify-center shrink-0">
                        <div className="relative size-[110px]">
                          <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#00B774" strokeWidth="3" strokeDasharray="30 100" />
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#E922FF" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="-30" />
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#FA9316" strokeWidth="3" strokeDasharray="15 100" strokeDashoffset="-50" />
                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#0052FF" strokeWidth="3" strokeDasharray="35 100" strokeDashoffset="-65" />
                          </svg>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 lg:mt-0">
                        {categoriesList.map((cat) => (
                          <div
                            key={cat.id}
                            className={cn(
                              "flex h-7 items-center gap-2 whitespace-nowrap rounded-full px-3 transition-all",
                              cat.count > 0 ? "bg-transparent border border-white/20 opacity-100" : "bg-transparent border border-white/5 opacity-40"
                            )}
                          >
                            <div className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-[11px] font-medium text-white">{cat.count} {cat.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative mr-6 flex h-fit gap-x-2.5 lg:mr-0">
                <button className="flex size-[38px] items-center justify-center rounded-full bg-white/[7%] backdrop-blur-xl hover:bg-white/[12%] transition-colors">
                  <svg className="size-4" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.16659 5.00016C9.16659 7.30016 7.29992 9.16683 4.99992 9.16683C2.69992 9.16683 1.29575 6.85016 1.29575 6.85016M1.29575 6.85016H3.17909M1.29575 6.85016V8.9335M0.833252 5.00016C0.833252 2.70016 2.68325 0.833496 4.99992 0.833496C7.77909 0.833496 9.16659 3.15016 9.16659 3.15016M9.16659 3.15016V1.06683M9.16659 3.15016H7.31658" stroke="#8A8C99" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </button>
                <div className="hidden lg:flex">
                  <div className="relative flex h-[38px] items-center rounded-full bg-white/[6%] p-1 backdrop-blur-xl">
                    <span
                      className={cn(
                        "absolute h-[30px] rounded-full bg-[#f0f0f0] transition-all duration-300 ease-out w-[110px]",
                        viewMode === 'portfolio' ? "left-1" : "left-[114px]"
                      )}
                    />
                    <button
                      onClick={() => setViewMode('portfolio')}
                      className={cn(
                        "relative z-10 flex h-[30px] w-[110px] items-center justify-center gap-x-2 rounded-full text-xs font-normal transition-colors",
                        viewMode === 'portfolio' ? "text-black" : "text-[#8A8C99]"
                      )}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.05206 11.3501C4.51532 10.8529 5.2215 10.8925 5.62826 11.4348L6.19885 12.1975C6.65645 12.802 7.39653 12.802 7.85413 12.1975L8.42473 11.4348C8.83148 10.8925 9.53766 10.8529 10.0009 11.3501C11.0065 12.4235 11.8257 12.0676 11.8257 10.5648V4.1979C11.8313 1.92118 11.3003 1.35059 9.1648 1.35059H4.89383C2.75834 1.35059 2.22729 1.92118 2.22729 4.1979V10.5592C2.22729 12.0676 3.05211 12.4178 4.05206 11.3501Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path><path d="M4.76953 4.17529H9.28908" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path><path d="M5.33447 6.43506H8.72413" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                      Portfólio
                    </button>
                    <button
                      onClick={() => setViewMode('favorites')}
                      className={cn(
                        "relative z-10 flex h-[30px] w-[110px] items-center justify-center gap-x-2 rounded-full text-xs font-normal transition-colors",
                        viewMode === 'favorites' ? "text-black" : "text-[#8A8C99]"
                      )}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.00008 12.3959C9.98012 12.3959 12.3959 9.98012 12.3959 7.00008C12.3959 4.02005 9.98012 1.60425 7.00008 1.60425C4.02005 1.60425 1.60425 4.02005 1.60425 7.00008C1.60425 9.98012 4.02005 12.3959 7.00008 12.3959Z" stroke="currentColor" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.00002 1.60425C5.8122 1.60415 4.65753 1.99601 3.71512 2.71905C2.7727 3.44209 2.0952 4.45589 1.7877 5.60323C1.4802 6.75056 1.55989 7.9673 2.01439 9.06473C2.4689 10.1622 3.27283 11.0789 4.30149 11.6729C5.33016 12.2669 6.52606 12.5048 7.70373 12.3498C8.8814 12.1948 9.97501 11.6555 10.8149 10.8156C11.6549 9.97568 12.1942 8.88209 12.3493 7.70443C12.5043 6.52677 12.2664 5.33085 11.6725 4.30216L7.00002 7.00008V1.60425Z" stroke="currentColor" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"></path><path d="M7.00002 1.60425C6.05284 1.60417 5.12232 1.85343 4.302 2.32697C3.48168 2.8005 2.80047 3.48163 2.32683 4.30189C1.85318 5.12214 1.60381 6.05263 1.60376 6.99981C1.60371 7.947 1.853 8.87751 2.32656 9.69781C2.80012 10.5181 3.48127 11.1993 4.30154 11.6729C5.12181 12.1465 6.0523 12.3959 6.99949 12.3959C7.94667 12.3959 8.87717 12.1466 9.69746 11.673C10.5178 11.1995 11.1989 10.5183 11.6725 9.698L7.00002 7.00008V1.60425Z" stroke="currentColor" strokeWidth="0.875" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                      Favoritos
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {viewMode === 'portfolio' && (
              <div className="relative bottom-12 z-10 flex w-full gap-x-5 px-5 lg:bottom-9 lg:gap-x-[30px] lg:overflow-visible lg:px-0">
                <div className="flex w-full flex-wrap gap-x-5 lg:gap-x-[30px]">
                  <div className="flex w-fit flex-col gap-[2px]">
                    <span className="whitespace-nowrap text-xs font-normal text-[#8A8C99]">Lucro/perda</span>
                    <span className="whitespace-nowrap font-medium text-lg text-[#F0F0F0]">
                      {stats.profitLoss >= 0 ? '+' : ''}{formatCurrency(stats.profitLoss)}
                    </span>
                  </div>
                  <div className="flex w-fit flex-col gap-[2px]">
                    <span className="whitespace-nowrap text-xs font-normal text-[#8A8C99]">Taxa de ganho</span>
                    <span className="whitespace-nowrap font-medium text-lg text-[#F0F0F0]">
                      <div className="flex items-center gap-2">
                        <span>{stats.winRate.toFixed(0)}%</span>
                        <div className="relative bottom-0.5 flex h-4 w-fit items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-medium text-black">
                          {stats.winCount}W - {stats.lossCount}L
                        </div>
                      </div>
                    </span>
                  </div>
                  <div className="flex w-fit flex-col gap-[2px]">
                    <span className="whitespace-nowrap text-xs font-normal text-[#8A8C99]">Posições abertas</span>
                    <span className="whitespace-nowrap font-medium text-lg text-[#F0F0F0]">{activePositions.length}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 lg:hidden">
              <button onClick={() => setViewMode('portfolio')} className={cn("size-2.5 rounded-full transition-all duration-300", viewMode === 'portfolio' ? "bg-white" : "bg-white/10")} />
              <button onClick={() => setViewMode('favorites')} className={cn("size-2.5 rounded-full transition-all duration-300", viewMode === 'favorites' ? "bg-white" : "bg-white/10")} />
            </div>
          </section>

          {/* Balance Card */}
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

        {/* Categories Carousel */}
        <div className="w-full animate-fade-up animate-normal animate-duration-[400ms] animate-once animate-ease-out">
          <div className="flex w-full items-center justify-center">
            <section className="mt-4 flex w-full items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categoriesList.map((cat, idx) => (
                <div
                  key={cat.id}
                  className={cn(
                    "flex max-h-[50px] shrink-0 w-[126px] relative min-h-[50px] overflow-hidden flex-row items-center gap-3 rounded-xl border p-1.5 transition-all",
                    cat.count > 0 ? "opacity-100 bg-transparent border-white/20" : "opacity-40 bg-transparent border-white/5"
                  )}
                >
                  <div className="absolute -bottom-9 h-6 w-full rounded-full bg-black/10 blur-[60px] dark:bg-white/15"></div>
                  <div className="flex size-[38px] items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: cat.color }}>
                    <img className="size-[20px]" alt="" src={cat.icon} />
                  </div>
                  <div className="flex flex-col leading-tight overflow-hidden">
                    <span className="text-[10px] font-normal text-[#8A8C99] transition-colors truncate">{cat.name}</span>
                    <span className="text-sm font-semibold text-black dark:text-[#f0f0f0]">{cat.count}</span>
                  </div>
                </div>
              ))}
            </section>

            <div className="hidden items-center lg:block ml-auto">
              <Logo width={168} height={30} className="relative mt-4" />
            </div>
          </div>

          <div className="mt-5 lg:mt-0">
            <div className="rounded-3xl border-black/10 bg-transparent dark:border-white/5 dark:bg-transparent lg:mt-4 lg:border lg:p-5">
              <div className="w-full relative h-full">
                <div className="relative flex h-10 items-center justify-between">
                  <div className="relative flex items-baseline mb-0 w-fit justify-start gap-x-2.5 bg-transparent dark:bg-transparent max-lg:overflow-x-auto max-lg:whitespace-nowrap" role="tablist">
                    {['previsoes', 'ordens', 'atividade'].map((tab) => (
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
                        <span className="capitalize">{tab === 'previsoes' ? 'Previsões' : tab === 'ordens' ? 'Ordens' : 'Atividade'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="size-full">
                  <div className="w-full h-full p-0 mt-3">
                    {activeTab === 'previsoes' && (
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
                                <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Resultado Previsto</th>
                                <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Preço de entrada → Agora</th>
                                <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Previu no valor de</th>
                                <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Para ganhar</th>
                                <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Valor Atual</th>
                                <th className="whitespace-nowrap px-6 py-3 border-b border-black/10 dark:border-white/5 lg:px-4"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                              {activePositions.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="py-20 text-center text-[#8A8C99]">Nenhuma previsão encontrada</td>
                                </tr>
                              ) : (
                                activePositions.map((pos) => {
                                  const currentSellValue = pos.currentSellValue || 0;
                                  const profitAmount = currentSellValue - (pos.amount || 0);
                                  const profitPercent = pos.amount > 0 ? (profitAmount / pos.amount) * 100 : 0;
                                  const currentSellPrice = pos.currentSellPrice || (currentSellValue > 0 ? (currentSellValue / (pos.shares || 1)) : 0);

                                  // Use potential payout (payoutAmount) but if it is still open, it is shares * 100 (cents)
                                  const potentialPayout = pos.status === 'active' ? (pos.shares * 100) : (pos.payoutAmount || 0);

                                  return (
                                    <tr key={pos.id} className="hover:bg-black/[2%] dark:hover:bg-white/[2%] transition-colors group">
                                      <td className="px-5 py-5 lg:px-4">
                                        <div className="flex gap-x-3">
                                          <div className="relative h-fit shrink-0">
                                            <div className="size-10 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                                              {pos.eventImageUrl ? <img src={pos.eventImageUrl} alt="" className="size-full object-cover" /> : <div className="text-xl">🎯</div>}
                                            </div>
                                          </div>
                                          <div className="overflow-hidden">
                                            <Link href={`/eventos/${pos.eventSlug}`} className="line-clamp-1 text-sm font-medium text-black dark:text-[#f0f0f0] hover:underline block">
                                              {pos.marketStatement}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase", pos.side === 'YES' ? "bg-[#00B471]/10 text-[#00B471]" : "bg-red-500/10 text-red-500")}>
                                                {pos.side === 'YES' ? 'Sim' : 'Não'}
                                              </span>
                                              <span className="text-xs text-[#8A8C99]">{pos.shares.toFixed(2)} shares</span>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-5 py-5 lg:px-4 text-right">
                                        <div className="flex flex-col items-end">
                                          <span className="text-sm font-medium text-black dark:text-[#f0f0f0]">{pos.avgPrice.toFixed(1)}¢ → {currentSellPrice.toFixed(1)}¢</span>
                                        </div>
                                      </td>
                                      <td className="px-5 py-5 lg:px-4 text-right">
                                        <span className="text-sm font-medium text-black dark:text-[#f0f0f0]">{formatCurrency(pos.amount)}</span>
                                      </td>
                                      <td className="px-5 py-5 lg:px-4 text-right text-[#00B471]">
                                        <span className="text-sm font-medium">{formatCurrency(potentialPayout)}</span>
                                      </td>
                                      <td className="px-5 py-5 lg:px-4 text-right">
                                        <div className="flex flex-col items-end">
                                          <span className="text-sm font-medium text-black dark:text-[#f0f0f0]">{formatCurrency(currentSellValue)}</span>
                                          <span className={cn("text-[10px] font-medium", profitAmount >= 0 ? "text-[#00B471]" : "text-red-500")}>
                                            {profitAmount >= 0 ? '+' : ''}{formatCurrency(profitAmount)} ({profitPercent.toFixed(2)}%)
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-5 py-5 lg:px-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => handleClosePosition(pos.id)}
                                            className="h-9 px-4 rounded-xl border border-red-500 text-red-500 text-xs font-semibold hover:bg-red-500 hover:text-white transition-all whitespace-nowrap"
                                          >
                                            Encerrar Previsão
                                          </button>
                                          <Link href={`/eventos/${pos.eventSlug}`} className="size-9 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                            <ExternalLink className="size-4 text-[#8A8C99]" />
                                          </Link>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}
                    {(activeTab === 'ordens' || activeTab === 'atividade') && (
                      <div className="py-20 text-center text-[#8A8C99]">Nenhum registro encontrado</div>
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
                  <span className="text-emerald-500">R$ {(Number.parseFloat(withdrawAmount) * 0.98).toFixed(2)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleCreateWithdraw}
              disabled={isCreatingWithdraw || Number.parseFloat(withdrawAmount) < 10 || !pixKeyType || !pixKeyValue}
              className="w-full h-[46px] rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      <div className="mx-auto w-full max-w-[1200px] px-3 pt-[80px]">
        <Skeleton className="h-[180px] w-full rounded-[20px] mb-6" />
        <Skeleton className="h-[400px] w-full rounded-[20px]" />
      </div>
    }>
      <WalletPageContent />
    </Suspense>
  )
}
