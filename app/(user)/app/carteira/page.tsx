'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { userApi, ApiClientError } from '@/lib/api/client'
import type { Wallet, WalletEntry, Deposit, Withdrawal } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { StatCard } from '@/components/shared/stat-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { DataTable } from '@/components/shared/data-table'
import { toast } from 'sonner'
import { 
  Wallet as WalletIcon, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  Copy,
  CheckCircle,
  Info,
  AlertCircle,
} from 'lucide-react'

function WalletPageContent() {
  const searchParams = useSearchParams()
  const { user, isOtpVerified } = useAuth()
  
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [entries, setEntries] = useState<WalletEntry[]>([])
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Deposit modal
  const [depositModalOpen, setDepositModalOpen] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [currentDeposit, setCurrentDeposit] = useState<Deposit | null>(null)
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Withdraw modal
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [pixKeyType, setPixKeyType] = useState('')
  const [pixKeyValue, setPixKeyValue] = useState('')
  const [isCreatingWithdraw, setIsCreatingWithdraw] = useState(false)

  const defaultTab = searchParams.get('tab') || 'extrato'

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [walletRes, entriesRes, depositsRes, withdrawalsRes] = await Promise.all([
        userApi.getWallet(),
        userApi.getStatement({ limit: 20 }),
        userApi.getDeposits({ limit: 20 }),
        userApi.getWithdrawals({ limit: 20 }),
      ])
      setWallet(walletRes.data.wallet)
      setEntries(entriesRes.data.entries)
      setDeposits(depositsRes.data.deposits)
      setWithdrawals(withdrawalsRes.data.withdrawals)
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOtpVerified) {
      fetchData()
    } else {
      setIsLoading(false)
    }
  }, [isOtpVerified, fetchData])

  const handleCreateDeposit = async () => {
    const amountCents = Math.round(Number.parseFloat(depositAmount) * 100)
    if (amountCents < 1000) {
      toast.error('Valor minimo: R$ 10,00')
      return
    }

    setIsCreatingDeposit(true)
    try {
      const response = await userApi.createDepositIntention(amountCents)
      setCurrentDeposit(response.data.deposit)
      toast.success('QR Code PIX gerado!')
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    } finally {
      setIsCreatingDeposit(false)
    }
  }

  const handleCopyPix = () => {
    if (currentDeposit?.pix_copy_paste) {
      navigator.clipboard.writeText(currentDeposit.pix_copy_paste)
      setCopied(true)
      toast.success('Codigo PIX copiado!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreateWithdraw = async () => {
    const amountCents = Math.round(Number.parseFloat(withdrawAmount) * 100)
    if (amountCents < 1000) {
      toast.error('Valor minimo: R$ 10,00')
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
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message)
      }
    } finally {
      setIsCreatingWithdraw(false)
    }
  }

  if (!isOtpVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-4 py-6">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Verificacao Necessaria</h3>
              <p className="text-sm text-yellow-700">
                Verifique seu telefone para acessar a carteira.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const kycApproved = user?.kyc?.status === 'approved'

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Carteira</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="Saldo Disponivel"
              value={wallet?.balance_formatted || 'R$ 0,00'}
              icon={WalletIcon}
            />
            <Card className="cursor-pointer hover:border-primary/50" onClick={() => setDepositModalOpen(true)}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <ArrowDownToLine className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Depositar</p>
                  <p className="font-semibold">Via PIX</p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer ${kycApproved ? 'hover:border-primary/50' : 'opacity-50'}`}
              onClick={() => kycApproved && setWithdrawModalOpen(true)}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <ArrowUpFromLine className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sacar</p>
                  <p className="font-semibold">
                    {kycApproved ? 'Via PIX' : 'KYC Necessario'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Fee Warning */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="flex items-center gap-3 py-4">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Taxa de 2% aplicada em depositos e saques. O valor liquido sera creditado/debitado.
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="extrato">Extrato</TabsTrigger>
          <TabsTrigger value="depositos">Depositos</TabsTrigger>
          <TabsTrigger value="saques">Saques</TabsTrigger>
        </TabsList>

        <TabsContent value="extrato">
          <DataTable
            columns={[
              {
                key: 'created_at',
                header: 'Data',
                render: (item: WalletEntry) => new Date(item.created_at).toLocaleDateString('pt-BR'),
              },
              {
                key: 'description',
                header: 'Descricao',
              },
              {
                key: 'type',
                header: 'Tipo',
                render: (item: WalletEntry) => <StatusBadge status={item.type} />,
              },
              {
                key: 'amount',
                header: 'Valor',
                render: (item: WalletEntry) => (
                  <span className={item.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                    {item.type === 'credit' ? '+' : '-'}{item.amount_formatted}
                  </span>
                ),
              },
              {
                key: 'balance_after',
                header: 'Saldo',
                render: (item: WalletEntry) => item.balance_after_formatted,
              },
            ]}
            data={entries}
            isLoading={isLoading}
            emptyMessage="Nenhuma movimentacao encontrada"
          />
        </TabsContent>

        <TabsContent value="depositos">
          <DataTable
            columns={[
              {
                key: 'created_at',
                header: 'Data',
                render: (item: Deposit) => new Date(item.created_at).toLocaleDateString('pt-BR'),
              },
              {
                key: 'amount',
                header: 'Valor',
                render: (item: Deposit) => item.amount_formatted,
              },
              {
                key: 'net_amount',
                header: 'Liquido',
                render: (item: Deposit) => item.net_amount_formatted || '-',
              },
              {
                key: 'status',
                header: 'Status',
                render: (item: Deposit) => <StatusBadge status={item.status} />,
              },
            ]}
            data={deposits}
            isLoading={isLoading}
            emptyMessage="Nenhum deposito encontrado"
          />
        </TabsContent>

        <TabsContent value="saques">
          <DataTable
            columns={[
              {
                key: 'created_at',
                header: 'Data',
                render: (item: Withdrawal) => new Date(item.created_at).toLocaleDateString('pt-BR'),
              },
              {
                key: 'amount',
                header: 'Valor',
                render: (item: Withdrawal) => item.amount_formatted,
              },
              {
                key: 'net_amount',
                header: 'Liquido',
                render: (item: Withdrawal) => item.net_amount_formatted || '-',
              },
              {
                key: 'pix_key',
                header: 'Chave PIX',
                render: (item: Withdrawal) => item.pix_key_masked || item.pix_key_type,
              },
              {
                key: 'status',
                header: 'Status',
                render: (item: Withdrawal) => <StatusBadge status={item.status} />,
              },
            ]}
            data={withdrawals}
            isLoading={isLoading}
            emptyMessage="Nenhum saque encontrado"
          />
        </TabsContent>
      </Tabs>

      {/* Deposit Modal */}
      <Dialog open={depositModalOpen} onOpenChange={(open) => {
        setDepositModalOpen(open)
        if (!open) {
          setCurrentDeposit(null)
          setDepositAmount('')
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Depositar via PIX</DialogTitle>
            <DialogDescription>
              {currentDeposit 
                ? 'Escaneie o QR Code ou copie o codigo PIX'
                : 'Digite o valor que deseja depositar'
              }
            </DialogDescription>
          </DialogHeader>

          {!currentDeposit ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="10"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">Minimo: R$ 10,00</p>
              </div>

              {Number.parseFloat(depositAmount) >= 10 && (
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor do deposito:</span>
                    <span>R$ {Number.parseFloat(depositAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Taxa (2%):</span>
                    <span>-R$ {(Number.parseFloat(depositAmount) * 0.02).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Valor creditado:</span>
                    <span className="text-green-600">
                      R$ {(Number.parseFloat(depositAmount) * 0.98).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleCreateDeposit}
                disabled={isCreatingDeposit || Number.parseFloat(depositAmount) < 10}
              >
                {isCreatingDeposit ? 'Gerando PIX...' : 'Gerar QR Code PIX'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {currentDeposit.pix_qrcode_image && (
                <div className="flex justify-center">
                  <img 
                    src={currentDeposit.pix_qrcode_image || "/placeholder.svg"} 
                    alt="QR Code PIX" 
                    className="w-48 h-48"
                  />
                </div>
              )}

              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span>{currentDeposit.amount_formatted}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa:</span>
                  <span>-{currentDeposit.fee_amount_formatted}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Creditado:</span>
                  <span className="text-green-600">{currentDeposit.net_amount_formatted}</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full gap-2 bg-transparent"
                onClick={handleCopyPix}
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado!' : 'Copiar PIX Copia e Cola'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Expira em: {new Date(currentDeposit.expires_at).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                Minimo: R$ 10,00 | Disponivel: {wallet?.balance_formatted}
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
                  <SelectItem value="random">Chave Aleatoria</SelectItem>
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
                  'Chave aleatoria'
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
                  <span>Voce recebera:</span>
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

function Loading() {
  return null
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    }>
      <WalletPageContent />
    </Suspense>
  )
}

export { Loading }
