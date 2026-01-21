'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Search, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { Position } from '@/lib/types'

interface ProfilePositionsProps {
    positions: Position[]
    isLoading?: boolean
}

export function ProfilePositions({ positions, isLoading = false }: ProfilePositionsProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')

    const filteredPositions = positions.filter((pos) => {
        // Search filter
        if (search && !pos.marketStatement?.toLowerCase().includes(search.toLowerCase())) {
            return false
        }
        // Status filter
        if (statusFilter !== 'all' && pos.status !== statusFilter) {
            return false
        }
        return true
    })

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value / 100)
    }

    const formatPercent = (value: number) => {
        return `${(value * 100).toFixed(1)}¢`
    }

    const calculateProfitLoss = (pos: Position) => {
        if (pos.status === 'settled' && pos.payoutAmount !== null) {
            const pl = pos.payoutAmount - pos.amount
            return { value: pl, percent: (pl / pos.amount) * 100 }
        }
        return null
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar por Mercados, Tópicos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Status: Todas</SelectItem>
                        <SelectItem value="active">Abertas</SelectItem>
                        <SelectItem value="settled">Resolvidas</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tipo: Previsões</SelectItem>
                        <SelectItem value="YES">Sim</SelectItem>
                        <SelectItem value="NO">Não</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead>Resultado Previsto</TableHead>
                            <TableHead className="text-right">Preço De Entrada → Agora</TableHead>
                            <TableHead className="text-right">Previu No Valor De</TableHead>
                            <TableHead className="text-right">Para Ganhar</TableHead>
                            <TableHead className="text-right">Valor Atual</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="animate-pulse bg-muted h-4 w-48 mx-auto rounded" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : filteredPositions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                    Nenhuma previsão encontrada
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPositions.map((pos) => {
                                const pl = calculateProfitLoss(pos)
                                return (
                                    <TableRow key={pos.id}>
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-medium">
                                                    {pos.side === 'YES' ? '👍' : '👎'}
                                                </div>
                                                <div>
                                                    <Link
                                                        href={`/eventos/${pos.eventSlug || '#'}`}
                                                        className="font-medium hover:text-primary transition-colors line-clamp-1"
                                                    >
                                                        {pos.marketStatement || 'Mercado'}
                                                    </Link>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={cn(
                                                            "text-xs px-2 py-0.5 rounded-full",
                                                            pos.side === 'YES'
                                                                ? "bg-green-500/10 text-green-600"
                                                                : "bg-red-500/10 text-red-600"
                                                        )}>
                                                            {pos.side === 'YES' ? 'Sim' : 'Não'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {(pos.amount / 100).toFixed(2)} shares
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-muted-foreground">--</span>
                                            <span className="mx-1">→</span>
                                            <span>--</span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(pos.amount)}
                                        </TableCell>
                                        <TableCell className="text-right text-green-600 font-medium">
                                            {pos.payoutAmount ? formatCurrency(pos.payoutAmount) : '--'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {pl ? (
                                                <div>
                                                    <p className="font-medium">{formatCurrency(pos.payoutAmount || 0)}</p>
                                                    <p className={cn(
                                                        "text-xs",
                                                        pl.value >= 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {pl.value >= 0 ? '+' : ''}{formatCurrency(pl.value)} ({pl.percent.toFixed(2)}%)
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">--</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
