'use client'

import { useEffect, useState, use } from 'react'
import { Loader2, ArrowLeft, ShieldCheck, Ban, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { adminApi, ApiClientError } from '@/lib/api/client'
import type { AdminAffiliateSummary, AdminAffiliateReferralListItem, AdminAffiliateWithdrawal, AdminAffiliateCommission } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)

export default function AffiliateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<AdminAffiliateSummary | null>(null)
  const [referrals, setReferrals] = useState<AdminAffiliateReferralListItem[]>([])
  const [commissions, setCommissions] = useState<AdminAffiliateCommission[]>([])
  const [withdrawals, setWithdrawals] = useState<AdminAffiliateWithdrawal[]>([])

  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [pageReferrals, setPageReferrals] = useState(1)
  const [maxPageReferrals, setMaxPageReferrals] = useState(1)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [summaryRes, referralsRes, commissionsRes, withdrawalsRes] = await Promise.all([
        adminApi.getAffiliateSummary(id),
        adminApi.getAffiliateReferrals(id, { page: pageReferrals, per_page: 20 }),
        adminApi.getAffiliateCommissions({ affiliate_id: id, page: 1, per_page: 50 }),
        adminApi.getAffiliateWithdrawals({ affiliate_id: id, page: 1, per_page: 50 }),
      ])

      setData(summaryRes.data)
      setReferrals(referralsRes.data)
      setMaxPageReferrals(referralsRes.meta.total_pages)
      setCommissions(commissionsRes.data)
      setWithdrawals(withdrawalsRes.data)
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.getDetailedMessage())
      } else {
        toast.error('Nao foi possivel carregar o perfil deste afiliado.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [id, pageReferrals])

  const handleApproveAffiliate = async () => {
    setBusyId('approve')
    try {
      await adminApi.approveAffiliate(id)
      toast.success('Afiliado aprovado com sucesso.')
      await loadAll()
    } catch {
      toast.error('Erro ao aprovar')
    } finally {
      setBusyId(null)
    }
  }

  const handleBlockAffiliate = async () => {
    setBusyId('block')
    try {
      await adminApi.blockAffiliate(id, 'Admin block')
      toast.success('Afiliado bloqueado.')
      await loadAll()
    } catch {
      toast.error('Erro ao bloquear')
    } finally {
      setBusyId(null)
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground p-8">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando perfil do afiliado...
      </div>
    )
  }

  if (!data) return <div className="p-8">Perfil nao encontrado.</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/admin/afiliados"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{data.affiliate.display_name}</h1>
          <p className="text-sm text-muted-foreground font-mono">
            {data.affiliate.email} • {data.affiliate.referral_code}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {data.affiliate.status !== 'active' && (
            <Button size="sm" onClick={handleApproveAffiliate} disabled={busyId === 'approve'}>
              <ShieldCheck className="h-4 w-4 mr-2" /> Aprovar
            </Button>
          )}
          {data.affiliate.status !== 'blocked' && (
            <Button size="sm" variant="destructive" onClick={handleBlockAffiliate} disabled={busyId === 'block'}>
              <Ban className="h-4 w-4 mr-2" /> Bloquear
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-[13px] text-muted-foreground font-medium mb-1 truncate">Status</div>
            <div className="font-semibold capitalize text-lg">{data.affiliate.status}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-[13px] text-muted-foreground font-medium mb-1 truncate">Pendente (Pago)</div>
            <div className="font-semibold text-lg">{money(data.summary.balances.pending)} <span className="text-muted-foreground font-normal text-sm">({money(data.summary.balances.paid)})</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-[13px] text-muted-foreground font-medium mb-1 truncate">Comissao Total</div>
            <div className="font-semibold text-lg">{money(data.summary.total_commission_generated)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-[13px] text-muted-foreground font-medium mb-1 truncate">Ativos / Indicados</div>
            <div className="font-semibold text-lg">{data.summary.total_active_referrals} / {data.summary.total_referrals}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visao Geral</TabsTrigger>
          <TabsTrigger value="referrals">Referrals ({data.summary.total_referrals})</TabsTrigger>
          <TabsTrigger value="withdrawals">Saques</TabsTrigger>
          <TabsTrigger value="commissions">Comissoes Brutas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metricas Operacionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Volume de Deposito dos Indicados</span>
                  <span className="font-medium">{money(data.summary.total_deposit_amount)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Total de Posicoes</span>
                  <span className="font-medium">{data.summary.total_positions_count} uni.</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Receita Bruta Gerada</span>
                  <span className="font-medium text-green-500">{money(data.summary.revenue_generated)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comissoes e Repasses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Soma de Comissoes Geradas</span>
                  <span className="font-medium">{money(data.summary.total_commission_generated)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Soma Repassada/Paga</span>
                  <span className="font-medium text-green-500">{money(data.summary.total_commission_paid)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Settlement</span>
                  <span className="font-medium text-muted-foreground">Diario 00:00 Brasilia</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Fila de Cadastros Retidos pelo Afiliado</CardTitle>
                <CardDescription>Lista de logs do evento de referrals</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setPageReferrals(p => Math.max(1, p - 1))} disabled={pageReferrals === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => setPageReferrals(p => Math.min(maxPageReferrals, p + 1))} disabled={pageReferrals === maxPageReferrals}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b text-left">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Usuario ID</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-center">Data e Hora</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-center">Acoes Feitas</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-center">Status</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Comissao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map(r => (
                      <tr key={r.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-4 align-middle font-mono text-[11px]">{r.user_id}</td>
                        <td className="p-4 align-middle text-center">{new Date(r.registered_at).toLocaleString('pt-BR')}</td>
                        <td className="p-4 align-middle text-center">
                          <div className="flex gap-2 justify-center items-center">
                            {r.deposited ? <Badge variant="outline" className="bg-green-500/10 text-green-500 border-none">Depositou ({money(r.total_deposit_amount)})</Badge> : <Badge variant="outline" className="opacity-50">S/ Deposito</Badge>}
                            {r.active && <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-none">{r.operations_count} Op</Badge>}
                          </div>
                        </td>
                        <td className="p-4 align-middle text-center font-medium capitalize text-xs">
                          {r.status}
                        </td>
                        <td className="p-4 align-middle text-right font-medium">
                          {money(r.commission_generated)}
                        </td>
                      </tr>
                    ))}
                    {referrals.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sem indicados.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historico de Repasses do Afiliado</CardTitle>
              <CardDescription>Creditos automaticos na carteira principal do usuario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {withdrawals.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">Nenhum repasse registrado.</div>}
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="rounded border p-4 text-sm bg-card/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-lg">{money(withdrawal.net_amount || withdrawal.requested_amount)}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">Destino: {withdrawal.payment_method === 'wallet_credit' ? 'Carteira principal do usuario' : withdrawal.payment_method}</div>
                    </div>
                    <Badge variant={withdrawal.status === 'paid' ? 'default' : 'secondary'} className="uppercase">
                      {withdrawal.status}
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {new Date(withdrawal.paid_at || withdrawal.requested_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mapeamento Bruto de Comissoes</CardTitle>
              <CardDescription>Eventos de comissionamento de sistema atribuidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b text-left">
                    <tr className="border-b transition-colors">
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Data</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Tipo / Fonte</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Status</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(c => (
                      <tr key={c.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle text-xs">{new Date(c.created_at).toLocaleString('pt-BR')}</td>
                        <td className="p-4 align-middle font-mono text-xs">{c.source_type}</td>
                        <td className="p-4 align-middle text-xs capitalize">{c.status}</td>
                        <td className="p-4 align-middle text-right font-medium">{money(c.amount)}</td>
                      </tr>
                    ))}
                    {commissions.length === 0 && (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhuma comissao.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
