'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Loader2, Coins, Plus, Copy, Trash, ChevronLeft, ChevronRight, Share2, Wallet } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

import { userApi, ApiClientError } from '@/lib/api/client'
import type { AffiliateDashboard, AffiliateReferral, AffiliateWithdrawal } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)

export function AffiliateDashboardPage() {
  const { user, isAuthenticated, isLoading: isLoadingAuth } = useAuth()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null)
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([])
  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [creatingCampaign, setCreatingCampaign] = useState(false)
  const [campaignName, setCampaignName] = useState('')
  const [campaignSlug, setCampaignSlug] = useState('')
  const [missingProfile, setMissingProfile] = useState(false)
  const [customAlias, setCustomAlias] = useState('')
  const [chartMetric, setChartMetric] = useState<'earnings' | 'registrations' | 'active_players'>('earnings')

  const [activeTab, setActiveTab] = useState('campanhas')
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7d' | '30d' | 'total'>('7d')
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [pageCampanhas, setPageCampanhas] = useState(1)
  const [pageIndicacoes, setPageIndicacoes] = useState(1)
  const [pageSaques, setPageSaques] = useState(1)

  const ITEMS_PER_PAGE = 4

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await userApi.getAffiliateDashboard({ period: selectedPeriod, chart_metric: chartMetric })
      setDashboard(res.data)
      setMissingProfile(false)
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 404) {
        setMissingProfile(true)
        setDashboard(null)
      } else if (error instanceof ApiClientError) {
        toast.error(error.getDetailedMessage())
      } else {
        toast.error('Não foi possível carregar os dados do painel.')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const fetchReferralsData = async () => {
    try {
      const res = await userApi.getAffiliateReferrals({ limit: 100, offset: 0 })
      setReferrals(res.data.referrals)
    } catch (error) {
      console.error('Error fetching referrals', error)
    }
  }

  const fetchWithdrawalsData = async () => {
    try {
      const res = await userApi.getAffiliateWithdrawals({ limit: 100, offset: 0 })
      setWithdrawals(res.data.withdrawals)
    } catch (error) {
      console.error('Error fetching withdrawals', error)
    }
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      await Promise.allSettled([
        fetchDashboardData(true),
        fetchReferralsData(),
        fetchWithdrawalsData(),
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (missingProfile) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [missingProfile])

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoadingAuth, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      void fetchReferralsData()
      void fetchWithdrawalsData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      void fetchDashboardData(dashboard !== null) // Be silent only if we already have data
    }
  }, [chartMetric, selectedPeriod, isAuthenticated])

  const handleEnroll = async () => {
    if (!customAlias.trim() || customAlias.length < 3) {
      toast.error('Informe um link valido com pelo menos 3 caracteres.')
      return
    }

    setEnrolling(true)
    try {
      await userApi.enrollAffiliate({ referral_code: customAlias.trim() })

      try {
        const campaignsResult = await userApi.getAffiliateCampaigns()
        const defaultCamp = campaignsResult.data?.campaigns?.[0]

        const newCamp = await userApi.createAffiliateCampaign({
          name: 'Link Principal',
          slug: customAlias.trim(),
          landing_path: '/',
        })

        if (defaultCamp && defaultCamp.id !== newCamp.data.id) {
          await userApi.deleteAffiliateCampaign(defaultCamp.id)
        }
      } catch (error) {
        console.error('Error enforcing exact link constraint', error)
      }

      toast.success('Perfil de afiliado ativado com sucesso.')
      await loadAll()
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.getDetailedMessage())
      } else {
        toast.error('Nao foi possivel criar o perfil de afiliado.')
      }
    } finally {
      setEnrolling(false)
    }
  }

  const chartConfig = {
    earnings: {
      label: 'Ganhos',
      color: '#3b82f6',
      gradientId: 'colorEarnings',
      tooltip: (value: number) => money(value),
      yTick: (value: number) => `${value / 100}`,
    },
    registrations: {
      label: 'Cadastros',
      color: '#22c55e',
      gradientId: 'colorRegistrations',
      tooltip: (value: number) => `${value}`,
      yTick: (value: number) => `${value}`,
    },
    active_players: {
      label: 'Traders ativos',
      color: '#f59e0b',
      gradientId: 'colorActivePlayers',
      tooltip: (value: number) => `${value}`,
      yTick: (value: number) => `${value}`,
    },
  } as const

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) return
    setCreatingCampaign(true)
    try {
      await userApi.createAffiliateCampaign({
        name: campaignName,
        slug: campaignSlug || undefined,
        landing_path: '/',
      })
      toast.success('Campanha criada com sucesso.')
      setCampaignName('')
      setCampaignSlug('')
      await loadAll()
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.getDetailedMessage())
      } else {
        toast.error('Nao foi possivel criar a campanha.')
      }
    } finally {
      setCreatingCampaign(false)
    }
  }

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a campanha "${name}"? Todo o link se tornara inativo.`)) return
    try {
      await userApi.deleteAffiliateCampaign(id)
      toast.success('Campanha excluida com sucesso.')
      await loadAll()
    } catch {
      toast.error('Erro ao excluir campanha.')
    }
  }

  if ((loading || isLoadingAuth) && !dashboard) {
    return (
      <div className="max-w-[1240px] mx-auto space-y-8 px-4 py-8 w-full animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-12 rounded-full ml-1" />
        </div>
        <Skeleton className="h-[480px] sm:h-[500px] w-full rounded-[24px]" />
        <Skeleton className="h-[400px] w-full rounded-[24px]" />
      </div>
    )
  }

  if (!isAuthenticated) return null
 
  if (missingProfile) {
    return (
      <div className="max-w-[1240px] mx-auto space-y-8 px-4 py-8">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Portal de Afiliado</h1>
          <p className="text-sm text-[#8A8C99]">Acompanhe seu desempenho em tempo real, gerencie campanhas e visualize suas comissões.</p>
        </div>

        <div className="relative">
          <div className="opacity-20 blur-[2px] select-none pointer-events-none">
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-12 rounded-full ml-1" />
            </div>
            <Skeleton className="h-[480px] sm:h-[500px] w-full rounded-[24px] mb-8" />
          </div>

          <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-background/30 backdrop-blur-[2px] rounded-[24px]">
            <Card className="relative z-20 w-full max-w-[425px] overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-card shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 p-6">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl">Boas-vindas a afiliados</DialogTitle>
                <DialogDescription>
                  Ative seu perfil para gerar seu link e comece a ganhar comissões hoje mesmo.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Crie o seu link principal</Label>
                  <div className="flex rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 h-11">
                    <div className="flex h-11 items-center justify-center bg-muted/40 px-3 text-xs font-medium text-muted-foreground border-r border-black/10 dark:border-white/10 select-none whitespace-nowrap">
                      previzor.com/
                    </div>
                    <Input
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                      placeholder="seunome"
                      className="border-0 bg-transparent h-11 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none text-sm font-medium"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  size="lg"
                  className="w-full h-12 rounded-xl font-bold text-[15px] bg-black dark:bg-white text-white dark:text-black"
                  onClick={handleEnroll}
                  disabled={enrolling || customAlias.trim().length < 3}
                >
                  {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ativar e Gerar Link
                </Button>
              </DialogFooter>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  const activeChart = chartConfig[chartMetric]
  const chartData = dashboard.chart.points.map((point) => ({
    ...point,
    value:
      chartMetric === 'earnings'
        ? point.earnings
        : chartMetric === 'registrations'
          ? point.registrations
          : point.active_players,
  }))

  const paginatedCampaigns = dashboard.campaigns.slice((pageCampanhas - 1) * ITEMS_PER_PAGE, pageCampanhas * ITEMS_PER_PAGE)
  const maxPageCampanhas = Math.max(1, Math.ceil(dashboard.campaigns.length / ITEMS_PER_PAGE))

  const paginatedReferrals = referrals.slice((pageIndicacoes - 1) * ITEMS_PER_PAGE, pageIndicacoes * ITEMS_PER_PAGE)
  const maxPageIndicacoes = Math.max(1, Math.ceil(referrals.length / ITEMS_PER_PAGE))

  const paginatedWithdrawals = withdrawals.slice((pageSaques - 1) * ITEMS_PER_PAGE, pageSaques * ITEMS_PER_PAGE)
  const maxPageSaques = Math.max(1, Math.ceil(withdrawals.length / ITEMS_PER_PAGE))

  return (
    <div className="max-w-[1240px] mx-auto space-y-8 px-4 py-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Portal de Afiliado</h1>
        <p className="text-sm text-[#8A8C99]">Acompanhe seu desempenho em tempo real, gerencie campanhas e visualize suas comissões.</p>
      </div>

      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 ring-1 ring-border shadow-sm">
          <AvatarImage src={user?.avatar_url || `https://avatar.vercel.sh/${dashboard.profile.referral_code}?size=36`} />
          <AvatarFallback>{(user?.nickname || dashboard.profile.display_name)?.substring(0, 2)?.toUpperCase() || 'AF'}</AvatarFallback>
        </Avatar>
        <span className="font-mono text-[15px] font-medium tracking-wide text-foreground">
          {user?.nickname || dashboard.profile.display_name}
        </span>
        <span className={cn(
          "ml-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase",
          dashboard.profile.status === 'active' ? "bg-[#00B471]/10 text-[#00B471]" : "bg-gray-500/10 text-gray-500"
        )}>
          {dashboard.profile.status === 'active' ? 'Ativo' : dashboard.profile.status}
        </span>
      </div>

      <Card className="rounded-[24px] overflow-hidden border bg-card/40 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 pt-5 pb-4 sm:pb-2 border-b border-border/10">
          <h2 className="text-sm font-semibold text-black dark:text-[#f0f0f0]">Desempenho</h2>
          <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl gap-1 w-full sm:w-auto overflow-x-auto">
            {(['today', '7d', '30d', 'total'] as const).map((id) => (
              <button
                key={id}
                onClick={() => setSelectedPeriod(id)}
                className={cn(
                  "px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex-1 sm:flex-none whitespace-nowrap",
                  selectedPeriod === id
                    ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                    : "text-[#8A8C99] hover:text-black dark:hover:text-white"
                )}
              >
                {id === 'today' ? 'Hoje' : id === '7d' ? '7D' : id === '30d' ? '30D' : 'Tudo'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border/50">
          <div
            onClick={() => setChartMetric('registrations')}
            className={cn(
              'px-4 sm:px-6 py-4 sm:py-5 cursor-pointer transition-all border-b-2 sm:border-b-2 -mb-[1px]',
              chartMetric === 'registrations' ? 'border-foreground' : 'border-transparent hover:bg-muted/5'
            )}
          >
            <div className="text-[12px] sm:text-[13px] font-medium text-muted-foreground mb-1">Cadastros</div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight">{dashboard.totals.total_registrations}</div>
          </div>
          <div
            onClick={() => setChartMetric('active_players')}
            className={cn(
              'px-4 sm:px-6 py-4 sm:py-5 cursor-pointer transition-all border-b-2 sm:border-b-2 -mb-[1px]',
              chartMetric === 'active_players' ? 'border-foreground' : 'border-transparent hover:bg-muted/5'
            )}
          >
            <div className="text-[12px] sm:text-[13px] font-medium text-muted-foreground mb-1">Traders ativos</div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight">{dashboard.totals.total_active_players}</div>
          </div>
          <div
            onClick={() => setChartMetric('earnings')}
            className={cn(
              'px-4 sm:px-6 py-4 sm:py-5 flex flex-col justify-center cursor-pointer transition-all border-b-2 sm:border-b-2 -mb-[1px]',
              chartMetric === 'earnings' ? 'border-foreground' : 'border-transparent hover:bg-muted/5'
            )}
          >
            <div className="flex items-center gap-2 text-[12px] sm:text-[13px] font-medium text-muted-foreground mb-1">
              Ganhos <img src="/512.gif" alt="Coins" className="h-4 w-4 object-contain" />
            </div>
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight">{money(dashboard.totals.total_commission_generated)}</div>
          </div>
        </div>

        <div className="px-2 sm:px-6 py-6 h-[340px] sm:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={activeChart.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeChart.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={activeChart.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#2c2e33" strokeDasharray="4 4" opacity={0.4} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                dy={10}
                minTickGap={20}
                tickFormatter={(value) => {
                  if (!value || typeof value !== 'string') return value;
                  const [y, m, d] = value.split('-').map(Number);
                  const date = new Date(y, m - 1, d);
                  return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
                    .replace('.', '')
                    .replace(/^\w/, (c) => c.toUpperCase());
                }}
              />
              <YAxis orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={activeChart.yTick} dx={10} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #222', backgroundColor: '#111', fontSize: '13px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => activeChart.tooltip(value)}
              />
              <Area type="monotone" name={activeChart.label} dataKey="value" stroke={activeChart.color} strokeWidth={2.5} fillOpacity={1} fill={`url(#${activeChart.gradientId})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="w-full mt-5">
        <div className="rounded-3xl border-black/10 bg-transparent dark:border-white/5 dark:bg-transparent lg:mt-4 xl:border xl:p-5">
          <div className="w-full relative h-full">
            <div className="relative flex h-auto lg:h-10 flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="relative flex items-baseline mb-0 w-full lg:w-fit justify-start gap-x-2.5 bg-transparent dark:bg-transparent overflow-x-auto whitespace-nowrap pb-2 lg:pb-0" role="tablist">
                {['campanhas', 'indicacoes', 'payouts'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex relative text-sm outline-0 items-center py-2.5 px-4 h-fit w-fit rounded-xl transition-all ease-in-out font-medium capitalize shrink-0",
                      activeTab === tab
                        ? "dark:bg-white bg-black text-white dark:text-black"
                        : "text-[#8A8C99] bg-transparent border border-black/10 dark:bg-white/5 hover:dark:text-white hover:text-black hover:border-black/20 hover:dark:border-white/10"
                    )}
                  >
                    <span>{tab === 'payouts' ? 'Saques' : tab === 'indicacoes' ? 'Indicações' : 'Campanhas'}</span>
                  </button>
                ))}
              </div>

              <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
                {activeTab === 'campanhas' && (
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 rounded-xl border border-black/10 dark:border-white/10 bg-transparent dark:bg-white/5 dark:hover:bg-white/10 w-full lg:w-auto ml-auto gap-2 text-black dark:text-white">
                      <Plus className="h-4 w-4" />
                      <span>Nova Campanha</span>
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent className="sm:max-w-[425px] rounded-3xl p-6 border-black/10 dark:border-white/10">
                  {activeTab === 'campanhas' && (
                    <>
                      <DialogHeader>
                        <DialogTitle>Nova Campanha</DialogTitle>
                        <DialogDescription>Crie links dedicados para medir performance e canais.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome da Campanha</Label>
                          <Input value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Ex: Divulgação Telegram" className="rounded-xl border-black/10 dark:border-white/10 bg-transparent dark:bg-white/5" />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug opcional</Label>
                          <Input value={campaignSlug} onChange={e => setCampaignSlug(e.target.value)} placeholder="telegram-vip" className="rounded-xl border-black/10 dark:border-white/10 bg-transparent dark:bg-white/5" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => { void handleCreateCampaign(); setActionDialogOpen(false) }} disabled={creatingCampaign || !campaignName.trim()} className="w-full rounded-xl bg-black dark:bg-white text-white dark:text-black">
                          {creatingCampaign && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="size-full">
              <div className="w-full h-full p-0 mt-3">
                {activeTab === 'campanhas' && (
                  <section className="w-full">
                    <div className="overflow-x-auto min-h-[300px] w-full rounded-lg">
                      <table className="h-full min-w-full divide-y divide-black/10 dark:divide-white/5">
                        <thead>
                          <tr>
                            <th className="whitespace-nowrap px-4 sm:px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Campanha</th>
                            <th className="whitespace-nowrap px-4 sm:px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Cadastros</th>
                            <th className="whitespace-nowrap px-4 sm:px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Ganhos</th>
                            <th className="whitespace-nowrap px-4 sm:px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                          {dashboard.campaigns.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-20 text-center text-[#8A8C99] text-sm\">Nenhuma campanha encontrada</td>
                            </tr>
                          ) : (
                            paginatedCampaigns.map((c) => (
                              <tr key={c.id} className="hover:bg-black/[2%] dark:hover:bg-white/[2%] transition-colors group">
                                <td className="px-4 sm:px-5 py-4 sm:py-5 lg:px-4 truncate max-w-[120px]">
                                  <div className="font-medium text-sm text-black dark:text-[#f0f0f0]">{c.name}</div>
                                  <div className="text-[11px] text-[#8A8C99] mt-1 truncate">{c.link}</div>
                                </td>
                                <td className="px-4 sm:px-5 py-4 sm:py-5 lg:px-4 text-sm text-black dark:text-[#f0f0f0]">
                                  {c.registrations}
                                </td>
                                <td className="px-4 sm:px-5 py-4 sm:py-5 lg:px-4 text-right text-sm font-semibold text-[#00B471]">
                                  {money(c.commission_generated)}
                                </td>
                                <td className="px-4 sm:px-5 py-4 sm:py-5 lg:px-4 text-right flex items-center justify-end gap-1 sm:gap-2">
                                  <button onClick={() => { navigator.clipboard.writeText(c.link); toast.success('Link copiado!') }} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8C99] hover:bg-black/5 hover:text-black transition-colors">
                                    <Copy className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => void handleDeleteCampaign(c.id, c.name)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A8C99] hover:bg-red-500/10 hover:text-red-500 transition-colors">
                                    <Trash className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {maxPageCampanhas > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                          onClick={() => setPageCampanhas(prev => Math.max(1, prev - 1))}
                          disabled={pageCampanhas === 1}
                          className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 text-black dark:text-white"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-[#8A8C99]">
                          Página {pageCampanhas} de {maxPageCampanhas}
                        </span>
                        <button
                          onClick={() => setPageCampanhas(prev => Math.min(maxPageCampanhas, prev + 1))}
                          disabled={pageCampanhas === maxPageCampanhas}
                          className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 text-black dark:text-white"
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {activeTab === 'indicacoes' && (
                  <section className="w-full">
                    <div className="overflow-x-auto min-h-[300px] w-full rounded-lg">
                      <table className="h-full min-w-full divide-y divide-black/10 dark:divide-white/5">
                        <thead>
                          <tr>
                            <th className="whitespace-nowrap px-4 sm:px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Indicado</th>
                            <th className="whitespace-nowrap px-4 sm:px-6 py-3 text-center text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Status</th>
                            <th className="whitespace-nowrap px-4 sm:px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Comissão</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                          {referrals.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-20 text-center text-[#8A8C99] text-sm">Nenhuma indicação encontrada</td>
                            </tr>
                          ) : (
                            paginatedReferrals.map((r) => (
                              <tr key={r.id} className="hover:bg-black/[2%] dark:hover:bg-white/[2%] transition-colors group">
                                <td className="px-4 sm:px-5 py-4 sm:py-5 lg:px-4">
                                  <div className="font-mono text-[13px] text-black dark:text-[#f0f0f0]">{r.masked_identity}</div>
                                  <div className="text-[11px] text-[#8A8C99] mt-1 truncate">Campanha: {r.campaign_slug || 'principal'}</div>
                                </td>
                                <td className="px-4 sm:px-5 py-4 sm:py-5 lg:px-4 text-center">
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                    r.active ? "bg-[#00B471]/10 text-[#00B471]" : "bg-gray-500/10 text-gray-500"
                                  )}>
                                    {r.active ? 'Ativo' : 'Inativo'}
                                  </span>
                                </td>
                                <td className="px-4 sm:px-5 py-4 sm:py-5 lg:px-4 text-right text-sm font-semibold text-[#00B471]">
                                  {money(r.commission_generated)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {maxPageIndicacoes > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                          onClick={() => setPageIndicacoes(prev => Math.max(1, prev - 1))}
                          disabled={pageIndicacoes === 1}
                          className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 text-black dark:text-white"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-[#8A8C99]">
                          Página {pageIndicacoes} de {maxPageIndicacoes}
                        </span>
                        <button
                          onClick={() => setPageIndicacoes(prev => Math.min(maxPageIndicacoes, prev + 1))}
                          disabled={pageIndicacoes === maxPageIndicacoes}
                          className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 text-black dark:text-white"
                        >
                          Próxima
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {activeTab === 'payouts' && (
                  <section className="w-full">
                    <div className="mb-6 p-4 lg:p-5 rounded-3xl border border-black/5 dark:border-white/5 bg-black/[2%] dark:bg-white/[2%] shadow-sm">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Wallet className="h-4 w-4 text-[#8A8C99]" />
                            <h3 className="text-sm font-semibold text-black dark:text-[#f0f0f0]">
                              Repasse automático de comissões
                            </h3>
                          </div>
                          <p className="text-[13px] leading-snug text-[#8A8C99] max-w-xl">
                            Todos os dias, às 00:00 (horário de Brasília), os valores de comissão que já foram liberados são transferidos automaticamente para a sua carteira principal.
                          </p>
                        </div>

                        <div className="flex gap-6 lg:pl-6 lg:border-l lg:border-black/5 lg:dark:border-white/5 shrink-0">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[#8A8C99]">Pendente</span>
                            <span className="text-base font-bold text-amber-500 font-mono">{money(dashboard.balances.pending)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[#8A8C99]">Recebido</span>
                            <span className="text-base font-bold text-[#00B471] font-mono">{money(dashboard.balances.paid)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto min-h-[300px] w-full rounded-lg">
                      <table className="h-full min-w-full divide-y divide-black/10 dark:divide-white/5">
                        <thead>
                          <tr>
                            <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Valor / Data</th>
                            <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-normal capitalize border-b border-black/10 pt-4 tracking-normal text-[#8A8C99] dark:border-white/5 lg:px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                          {withdrawals.length === 0 ? (
                            <tr>
                              <td colSpan={2} className="py-20 text-center text-[#8A8C99] text-sm">Nenhum repasse encontrado</td>
                            </tr>
                          ) : (
                            paginatedWithdrawals.map((w) => {
                              let statusColor = 'bg-gray-500/10 text-gray-500'
                              if (w.status === 'approved' || w.status === 'paid') statusColor = 'bg-emerald-500/10 text-emerald-500'
                              else if (w.status === 'pending') statusColor = 'bg-amber-500/10 text-amber-500'
                              else if (w.status === 'rejected' || w.status === 'cancelled') statusColor = 'bg-red-500/10 text-red-500'

                              return (
                                <tr key={w.id} className="hover:bg-black/[2%] dark:hover:bg-white/[2%] transition-colors group">
                                  <td className="px-5 py-5 lg:px-4">
                                    <div className="font-medium text-sm text-black dark:text-[#f0f0f0]">{money(w.net_amount || w.requested_amount)}</div>
                                    <div className="text-[11px] text-[#8A8C99] mt-1">Carteira principal • {new Date(w.paid_at || w.requested_at).toLocaleString('pt-BR')}</div>
                                  </td>
                                  <td className="px-5 py-5 lg:px-4 text-right">
                                    <span className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                      statusColor
                                    )}>
                                      {w.status === 'approved' || w.status === 'paid' ? 'Concluído' : w.status === 'pending' ? 'Pendente' : w.status === 'rejected' ? 'Rejeitado' : w.status}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {maxPageSaques > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-6">
                        <button
                          onClick={() => setPageSaques(prev => Math.max(1, prev - 1))}
                          disabled={pageSaques === 1}
                          className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 text-black dark:text-white"
                        >
                          Anterior
                        </button>
                        <span className="text-sm text-[#8A8C99]">
                          Página {pageSaques} de {maxPageSaques}
                        </span>
                        <button
                          onClick={() => setPageSaques(prev => Math.min(maxPageSaques, prev + 1))}
                          disabled={pageSaques === maxPageSaques}
                          className="flex h-9 items-center justify-center rounded-md border border-black/10 px-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 text-black dark:text-white"
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
  )
}

export default AffiliateDashboardPage
