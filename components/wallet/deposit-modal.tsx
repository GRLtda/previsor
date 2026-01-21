'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { QrCode, Copy, Check, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { userApi, ApiClientError } from '@/lib/api/client'
import { useAuth } from '@/contexts/auth-context'
import type { Deposit } from '@/lib/types'

interface DepositModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

type DepositStep = 'method' | 'amount' | 'pix'

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000]

export function DepositModal({ isOpen, onOpenChange }: DepositModalProps) {
    const { refreshUser } = useAuth()
    const [step, setStep] = useState<DepositStep>('method')
    const [amount, setAmount] = useState<number | ''>('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deposit, setDeposit] = useState<Deposit | null>(null)
    const [copied, setCopied] = useState(false)

    const handleClose = () => {
        onOpenChange(false)
        // Reset state after modal closes
        setTimeout(() => {
            setStep('method')
            setAmount('')
            setDeposit(null)
            setError(null)
            setCopied(false)
        }, 300)
    }

    const handleSelectPix = () => {
        setStep('amount')
        setError(null)
    }

    const handleAmountSubmit = async () => {
        if (!amount || amount < 10) return

        setIsLoading(true)
        setError(null)

        try {
            // Amount is in BRL, API expects cents
            const amountInCents = Math.round(amount * 100)
            const response = await userApi.createDepositIntention(amountInCents)

            setDeposit(response.data.deposit)
            setStep('pix')
        } catch (err) {
            if (err instanceof ApiClientError) {
                // Handle specific error codes
                switch (err.code) {
                    case 'DEPOSIT_MIN_AMOUNT':
                        setError('Valor mínimo para depósito é R$ 10,00')
                        break
                    case 'DEPOSIT_MAX_AMOUNT':
                        setError('Valor máximo para depósito excedido')
                        break
                    case 'WALLET_FROZEN':
                        setError('Sua carteira está congelada. Entre em contato com o suporte.')
                        break
                    case 'USER_NOT_VERIFIED':
                        setError('Você precisa verificar sua conta para fazer depósitos')
                        break
                    default:
                        setError(err.message || 'Erro ao criar depósito. Tente novamente.')
                }
            } else {
                setError('Erro ao criar depósito. Tente novamente.')
            }
            console.error('Failed to create deposit:', err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopyPixCode = async () => {
        if (!deposit?.pix_copy_paste) return
        try {
            await navigator.clipboard.writeText(deposit.pix_copy_paste)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    const handleBack = () => {
        if (step === 'amount') {
            setStep('method')
            setAmount('')
            setError(null)
        } else if (step === 'pix') {
            setStep('amount')
            setDeposit(null)
        }
    }

    const handleDepositComplete = async () => {
        // Refresh user data to update balance
        await refreshUser()
        handleClose()
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value)
    }

    // Format cents to BRL
    const formatCents = (cents: number) => {
        return formatCurrency(cents / 100)
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {step !== 'method' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 -ml-2"
                                onClick={handleBack}
                                disabled={isLoading}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <div>
                            <DialogTitle>
                                {step === 'method' && 'Depositar'}
                                {step === 'amount' && 'Valor do Depósito'}
                                {step === 'pix' && 'Pague com PIX'}
                            </DialogTitle>
                            <DialogDescription>
                                {step === 'method' && 'Escolha o método de pagamento'}
                                {step === 'amount' && 'Insira o valor que deseja depositar'}
                                {step === 'pix' && 'Escaneie o QR Code ou copie o código'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-4">
                    {/* Step 1: Method Selection */}
                    {step === 'method' && (
                        <div className="space-y-3">
                            <button
                                onClick={handleSelectPix}
                                className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                            >
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                    <QrCode className="w-6 h-6 text-[#00D4AA]" />
                                </div>
                                <div>
                                    <p className="font-semibold">PIX</p>
                                    <p className="text-sm text-muted-foreground">
                                        Instantâneo e sem taxas
                                    </p>
                                </div>
                            </button>

                            {/* More payment methods can be added here */}
                            <p className="text-xs text-center text-muted-foreground pt-2">
                                Mais métodos de pagamento em breve
                            </p>
                        </div>
                    )}

                    {/* Step 2: Amount Input */}
                    {step === 'amount' && (
                        <div className="space-y-6">
                            {/* Error Display */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Quick Select Amounts */}
                            <div className="grid grid-cols-5 gap-2">
                                {QUICK_AMOUNTS.map((quickAmount) => (
                                    <Button
                                        key={quickAmount}
                                        variant={amount === quickAmount ? 'default' : 'outline'}
                                        size="sm"
                                        className={cn(
                                            'text-xs font-medium',
                                            amount === quickAmount && 'bg-primary text-primary-foreground'
                                        )}
                                        onClick={() => setAmount(quickAmount)}
                                        disabled={isLoading}
                                    >
                                        R${quickAmount}
                                    </Button>
                                ))}
                            </div>

                            {/* Custom Amount Input */}
                            <div className="space-y-2">
                                <Label htmlFor="amount">Valor personalizado</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        R$
                                    </span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        min={10}
                                        step={1}
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(e.target.value ? Number(e.target.value) : '')
                                        }
                                        placeholder="0,00"
                                        className="pl-10 text-lg font-semibold"
                                        disabled={isLoading}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Mínimo: R$ 10,00
                                </p>
                            </div>

                            {/* Fee Info */}
                            {amount && amount >= 10 && (
                                <div className="text-sm text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-lg">
                                    <div className="flex justify-between">
                                        <span>Valor do depósito</span>
                                        <span>{formatCurrency(amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Taxa de processamento (2%)</span>
                                        <span className="text-destructive">-{formatCurrency(amount * 0.02)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1 text-foreground">
                                        <span>Você receberá</span>
                                        <span className="text-[#00C805]">{formatCurrency(amount * 0.98)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                className="w-full bg-[#0055FF] hover:bg-[#0044CC] font-semibold"
                                size="lg"
                                disabled={!amount || amount < 10 || isLoading}
                                onClick={handleAmountSubmit}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Gerando PIX...
                                    </>
                                ) : (
                                    `Depositar ${amount ? formatCurrency(amount) : ''}`
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Step 3: PIX Code */}
                    {step === 'pix' && deposit && (
                        <div className="space-y-6">
                            {/* QR Code */}
                            <div className="flex justify-center">
                                {deposit.pix_qrcode_image ? (
                                    <img
                                        src={deposit.pix_qrcode_image}
                                        alt="PIX QR Code"
                                        className="w-48 h-48 rounded-lg"
                                    />
                                ) : (
                                    <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                                        <QrCode className="w-32 h-32 text-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Amount Display */}
                            <div className="text-center space-y-1">
                                <p className="text-sm text-muted-foreground">Valor a pagar</p>
                                <p className="text-2xl font-bold text-primary">
                                    {deposit.amount_formatted}
                                </p>
                                {deposit.fee_amount && deposit.fee_amount > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                        Você receberá {deposit.net_amount_formatted} após taxa de {deposit.fee_amount_formatted}
                                    </p>
                                )}
                            </div>

                            {/* Copy PIX Code */}
                            {deposit.pix_copy_paste && (
                                <div className="space-y-2">
                                    <Label>Código PIX Copia e Cola</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={deposit.pix_copy_paste}
                                            readOnly
                                            className="text-xs font-mono"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={handleCopyPixCode}
                                            className="flex-shrink-0"
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Expiration Warning */}
                            {deposit.expires_at && (
                                <div className="text-center text-sm text-muted-foreground">
                                    <p>Este código expira em:</p>
                                    <p className="font-semibold text-foreground">
                                        {new Date(deposit.expires_at).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            )}

                            {/* Instructions */}
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-medium">Como pagar:</p>
                                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>Abra o app do seu banco</li>
                                    <li>Escolha pagar com PIX</li>
                                    <li>Escaneie o QR Code ou cole o código</li>
                                    <li>Confirme o pagamento</li>
                                </ol>
                                <p className="text-xs text-muted-foreground pt-2">
                                    O saldo será creditado automaticamente após a confirmação.
                                </p>
                            </div>

                            {/* Close Button */}
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleDepositComplete}
                            >
                                Já fiz o pagamento
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
