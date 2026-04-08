'use client'

import { useEffect, useState } from 'react'
import { Plus, Loader2, Pencil } from 'lucide-react'
import { adminApi } from '@/lib/api/client'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AdminAffiliateRules() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    scope_type: 'global',
    source_type: 'market_buy_fee',
    level: 1,
    basis: 'revenue',
    rate_bps: 0,
    hold_days: 0,
    priority: 0,
  })

  const loadRules = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getAffiliateRules()
      setRules(res.data.rules || [])
    } catch {
      toast.error('Erro ao listar regras.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRules()
  }, [])

  const handleEdit = (rule: any) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name || '',
      scope_type: rule.scope_type || 'global',
      source_type: rule.source_type || 'market_buy_fee',
      level: rule.level || 1,
      basis: rule.basis || 'revenue',
      rate_bps: rule.rate_bps || 0,
      hold_days: 0,
      priority: rule.priority || 0,
    })
    setOpen(true)
  }

  const handleAddNew = () => {
    setEditingRule(null)
    setFormData({
      name: '',
      scope_type: 'global',
      source_type: 'market_buy_fee',
      level: 1,
      basis: 'revenue',
      rate_bps: 0,
      hold_days: 0,
      priority: 0,
    })
    setOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        id: editingRule?.id,
        scope_type: formData.scope_type as 'global' | 'affiliate' | 'campaign',
        source_type: formData.source_type as 'market_buy_fee' | 'market_sell_fee' | 'deposit_fee' | 'withdraw_fee',
        basis: formData.basis as 'revenue' | 'commission',
        hold_days: 0,
        active: editingRule?.active ?? true,
      }
      await adminApi.upsertAffiliateRule(payload)
      toast.success('Regra salva com sucesso!')
      setOpen(false)
      await loadRules()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar regra')
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Carregando regras...
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Regras de Comissionamento</CardTitle>
          <CardDescription>
            Configure percentuais e subniveis do programa. A liberacao do saldo e diaria e acontece sempre na proxima 00:00 de Brasilia.
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo (Scope)</Label>
                  <Select value={formData.scope_type} onValueChange={(v) => setFormData({ ...formData, scope_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="affiliate">Afiliado Especifico</SelectItem>
                      <SelectItem value="campaign">Campanha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Origem (Source)</Label>
                  <Select value={formData.source_type} onValueChange={(v) => setFormData({ ...formData, source_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market_buy_fee">Taxa de Compra (Market)</SelectItem>
                      <SelectItem value="market_sell_fee">Taxa de Venda (Market)</SelectItem>
                      <SelectItem value="deposit_fee">Deposito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nivel (Subniveis)</Label>
                  <Input type="number" min={1} value={formData.level} onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })} />
                </div>

                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Input type="number" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Base</Label>
                  <Select value={formData.basis} onValueChange={(v) => setFormData({ ...formData, basis: v as 'revenue' | 'commission' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Receita</SelectItem>
                      <SelectItem value="commission">Comissao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Taxa (BPS)</Label>
                  <Input type="number" value={formData.rate_bps} onChange={(e) => setFormData({ ...formData, rate_bps: parseInt(e.target.value) })} />
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                <div className="font-medium text-foreground">Liquidacao do saldo</div>
                <div className="mt-1">
                  Toda comissao criada durante o dia fica pendente ate a proxima 00:00 de Brasilia.
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="text-left text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="py-3 px-4 font-semibold">Nome</th>
                <th className="py-3 px-4 font-semibold">Escopo</th>
                <th className="py-3 px-4 font-semibold">Tipo de Fonte</th>
                <th className="py-3 px-4 font-semibold">Nivel</th>
                <th className="py-3 px-4 font-semibold">Taxa (BPS)</th>
                <th className="py-3 px-4 font-semibold">Liquidacao</th>
                <th className="py-3 px-4 font-semibold text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhuma regra configurada.</td>
                </tr>
              )}

              {rules.map((rule, idx) => (
                <tr key={rule.id || idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{rule.name}</td>
                  <td className="py-3 px-4">{rule.scope_type}</td>
                  <td className="py-3 px-4">{rule.source_type}</td>
                  <td className="py-3 px-4">{rule.level}</td>
                  <td className="py-3 px-4">
                    {rule.rate_bps} <span className="text-muted-foreground">({(rule.rate_bps / 100).toFixed(2)}%)</span>
                  </td>
                  <td className="py-3 px-4">Diaria 00:00 Brasilia</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(rule)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
