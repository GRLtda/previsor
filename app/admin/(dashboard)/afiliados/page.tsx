'use client'

import { useEffect, useState } from 'react'
import { Loader2, Coins, UserCheck, Eye, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { adminApi, ApiClientError } from '@/lib/api/client'
import type { AdminAffiliate, AdminAffiliateCommission, AdminAffiliateWithdrawal, AdminAffiliateOverview } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminAffiliateRules } from './_components/admin-affiliate-rules'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AdminAffiliate[]>([])
  const [commissions, setCommissions] = useState<AdminAffiliateCommission[]>([])
  const [withdrawals, setWithdrawals] = useState<AdminAffiliateWithdrawal[]>([])
  const [overview, setOverview] = useState<AdminAffiliateOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [affiliatesRes, commissionsRes, withdrawalsRes, overviewRes] = await Promise.all([
        adminApi.getAffiliates({ page: 1, per_page: 10 }),
        adminApi.getAffiliateCommissions({ page: 1, per_page: 10 }),
        adminApi.getAffiliateWithdrawals({ page: 1, per_page: 10 }),
        adminApi.getAffiliatesOverview(),
      ])

      setAffiliates(affiliatesRes.data)
      setCommissions(commissionsRes.data)
      setWithdrawals(withdrawalsRes.data)
      setOverview(overviewRes.data)
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.getDetailedMessage())
      } else {
        toast.error('Nao foi possivel carregar o modulo de afiliados.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  if (loading || !overview) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando modulo de afiliados...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Afiliados</h1>
        <p className="text-sm text-muted-foreground">
          Supervisao de perfis, comissoes, regras de negocio e historico de repasses automaticos do programa Refer and Earn.
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visao Geral & Perfis</TabsTrigger>
          <TabsTrigger value="rules">Regras de Negocio</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-sm text-muted-foreground">Afiliados Totais</div>
                  <div className="mt-1 text-2xl font-bold">{overview.totals.affiliates}</div>
                </div>
                <UserCheck className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-sm text-muted-foreground">Comissoes Geradas</div>
                  <div className="mt-1 text-2xl font-bold">{money(overview.totals.commission_generated)}</div>
                </div>
                <Coins className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-sm text-muted-foreground">Liquidacoes Pendentes</div>
                  <div className="mt-1 text-2xl font-bold">{overview.totals.pending_withdrawals_count}</div>
                </div>
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-sm text-muted-foreground">Repasses Pagos</div>
                  <div className="mt-1 text-2xl font-bold">{money(overview.totals.commission_paid)}</div>
                </div>
                <Coins className="h-5 w-5 text-green-500" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Perfis de Afiliado</CardTitle>
              <CardDescription>Aprovacao, bloqueio e monitoramento do programa.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="pb-3">Afiliado</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Indicados</th>
                    <th className="pb-3">Pendente</th>
                    <th className="pb-3">Pago</th>
                    <th className="pb-3 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.id} className="border-t">
                      <td className="py-3">
                        <div className="font-medium">{affiliate.display_name}</div>
                        <div className="text-xs text-muted-foreground">{affiliate.email}</div>
                      </td>
                      <td className="py-3 uppercase">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${affiliate.status === 'active' ? 'border-green-500/50 bg-green-500/10 text-green-500' : 'border-neutral-500/50 bg-neutral-500/10'}`}>
                          {affiliate.status}
                        </span>
                      </td>
                      <td className="py-3">{affiliate.total_referrals}</td>
                      <td className="py-3">{money(affiliate.balances.pending)}</td>
                      <td className="py-3">{money(affiliate.balances.paid)}</td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/afiliados/${affiliate.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Mais
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Comissoes Recentes</CardTitle>
                <CardDescription>Ultimos eventos de comissionamento processados pelo sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {commissions.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">Nenhuma comissao recente.</div>
                ) : (
                  commissions.map((commission) => (
                    <div key={commission.id} className="rounded-xl border p-4 text-sm bg-card/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{commission.affiliate_name}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-1">{commission.source_type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{money(commission.amount)}</div>
                          <div className="text-xs uppercase text-muted-foreground mt-1">{commission.status}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repasses Recentes</CardTitle>
                <CardDescription>Historico automatico de creditos enviados para a carteira principal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {withdrawals.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">Nenhum repasse registrado.</div>
                ) : (
                  withdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="rounded-xl border p-4 text-sm bg-card/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold">{withdrawal.affiliate_name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{new Date(withdrawal.paid_at || withdrawal.requested_at).toLocaleString('pt-BR')}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{money(withdrawal.net_amount || withdrawal.requested_amount)}</div>
                          <div className="text-xs uppercase text-muted-foreground mt-1">{withdrawal.status}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6 mt-0">
          <AdminAffiliateRules />
        </TabsContent>
      </Tabs>
    </div>
  )
}
