import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default'

const statusMap: Record<string, { label: string; variant: StatusVariant }> = {
  // General
  active: { label: 'Ativo', variant: 'success' },
  inactive: { label: 'Inativo', variant: 'default' },
  
  // User status
  suspended: { label: 'Suspenso', variant: 'error' },
  deleted: { label: 'Deletado', variant: 'error' },
  
  // KYC status
  pending: { label: 'Pendente', variant: 'warning' },
  approved: { label: 'Aprovado', variant: 'success' },
  rejected: { label: 'Rejeitado', variant: 'error' },
  
  // Market status
  draft: { label: 'Rascunho', variant: 'default' },
  open: { label: 'Aberto', variant: 'success' },
  closed: { label: 'Fechado', variant: 'warning' },
  settled: { label: 'Liquidado', variant: 'info' },
  canceled: { label: 'Cancelado', variant: 'error' },
  archived: { label: 'Arquivado', variant: 'default' },
  
  // Transaction status
  paid: { label: 'Pago', variant: 'success' },
  failed: { label: 'Falhou', variant: 'error' },
  expired: { label: 'Expirado', variant: 'error' },
  processing: { label: 'Processando', variant: 'warning' },
  completed: { label: 'Concluido', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'error' },
  
  // Wallet
  frozen: { label: 'Congelado', variant: 'error' },
  
  // Position
  refunded: { label: 'Reembolsado', variant: 'info' },
  
  // Risk levels
  low: { label: 'Baixo', variant: 'success' },
  medium: { label: 'Medio', variant: 'warning' },
  high: { label: 'Alto', variant: 'error' },
  
  // Ledger types
  credit: { label: 'Credito', variant: 'success' },
  debit: { label: 'Debito', variant: 'error' },
  
  // Boolean / Sides
  YES: { label: 'SIM', variant: 'success' },
  NO: { label: 'NAO', variant: 'error' },
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-muted text-muted-foreground border-border',
}

interface StatusBadgeProps {
  status: string
  customLabel?: string
  className?: string
}

export function StatusBadge({ status, customLabel, className }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, variant: 'default' as StatusVariant }
  
  return (
    <Badge
      variant="outline"
      className={cn(variantStyles[config.variant], className)}
    >
      {customLabel || config.label}
    </Badge>
  )
}
