"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import {
    ArrowLeft,
    Wallet,
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Info,
    BadgeCheck,
    History,
    ArrowUpCircle,
    ArrowDownCircle,
    Clock,
    User as UserIcon,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function WalletDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const response = await adminApi.getWallet(id as string);
                setData(response.data);
            } catch (err) {
                console.error("Error fetching wallet:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWallet();
    }, [id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <Skeleton className="h-[400px] rounded-xl" />
            </div>
        );
    }

    if (!data) return <div>Carteira não encontrada.</div>;

    const { wallet, recent_entries } = data;

    const columns: ColumnDef<any>[] = [
        {
            header: "Data",
            cell: (entry) => (
                <div className="flex flex-col text-sm">
                    <span className="font-medium">{new Date(entry.created_at).toLocaleDateString("pt-BR")}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(entry.created_at).toLocaleTimeString("pt-BR")}
                    </span>
                </div>
            ),
        },
        {
            header: "Tipo",
            cell: (entry) => (
                <Badge
                    variant="outline"
                    className={cn(
                        "font-medium py-0.5",
                        entry.type === 'credit'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30'
                            : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30'
                    )}
                >
                    {entry.type === 'credit' ? (
                        <ArrowUpCircle className="mr-1 h-3 w-3" />
                    ) : (
                        <ArrowDownCircle className="mr-1 h-3 w-3" />
                    )}
                    {entry.type === 'credit' ? 'Crédito' : 'Débito'}
                </Badge>
            ),
        },
        {
            header: "Valor",
            cell: (entry) => (
                <span className={cn(
                    "text-sm font-bold",
                    entry.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                )}>
                    {entry.type === 'credit' ? '+' : '-'}{entry.amount_formatted}
                </span>
            ),
        },
        {
            header: "Saldo Após",
            cell: (entry) => (
                <span className="text-sm font-medium">
                    {formatCurrency(entry.balance_after)}
                </span>
            ),
        },
        {
            header: "Referência",
            cell: (entry) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{entry.reference_type}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/70 truncate max-w-[120px]">{entry.reference_id}</span>
                </div>
            ),
        },
        {
            header: "Descrição",
            cell: (entry) => (
                <p className="text-sm text-muted-foreground max-w-[400px] truncate" title={entry.description}>
                    {entry.description || '-'}
                </p>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Histórico da Carteira</h1>
                    <p className="text-sm text-muted-foreground">
                        Extrato detalhado de transações e movimentações do usuário.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Saldo Atual Card */}
                <div className="rounded-xl border bg-card p-4 shadow-none">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground/80">Saldo Atual</p>
                        <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-blue-500" />
                        </div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold tracking-tight">{wallet.balance_formatted}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Saldo disponível em conta</p>
                    </div>
                </div>

                {/* Status da Carteira Card */}
                <div className="rounded-xl border bg-card p-4 shadow-none">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground/80">Status da Carteira</p>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${wallet.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                            <BadgeCheck className={`h-4 w-4 ${wallet.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold tracking-tight capitalize">
                                {wallet.status === 'active' ? 'Ativa' : 'Congelada'}
                            </div>
                            <Badge variant={wallet.status === 'active' ? 'default' : 'destructive'} className="h-4 px-1.5 text-[10px] font-bold">
                                {wallet.status === 'active' ? 'OK' : 'Bloqueada'}
                            </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Impacta saques e apostas</p>
                    </div>
                </div>

                {/* Usuário Detentor Card */}
                <div className="rounded-xl border bg-card p-4 shadow-none">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground/80">Usuário Detentor</p>
                        <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-blue-500" />
                        </div>
                    </div>
                    <Link href={`/admin/usuarios/${wallet.user_id}`} className="flex items-center gap-3 group">
                        <Avatar className="h-9 w-9 border transition-colors group-hover:border-primary/50">
                            {wallet.user_avatar_url && (
                                <AvatarImage src={wallet.user_avatar_url} />
                            )}
                            <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                                {wallet.user_full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm tracking-tight truncate group-hover:text-primary transition-colors">{wallet.user_full_name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{wallet.user_email}</span>
                        </div>
                    </Link>
                </div>

                {/* Informações Adicionais Card */}
                <div className="rounded-xl border bg-card p-4 shadow-none">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground/80">Informações Adicionais</p>
                        <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                            <Info className="h-4 w-4 text-amber-500" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">ID Carteira:</span>
                            <code className="font-mono text-muted-foreground/80">{wallet.id.slice(0, 8)}...</code>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">Membro desde:</span>
                            <span className="font-medium text-muted-foreground/80">
                                {new Date(wallet.created_at).toLocaleDateString("pt-BR")}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <DataTable
                data={recent_entries}
                columns={columns}
                isLoading={false}
                keyExtractor={(item) => item.id}
                emptyMessage="Nenhuma movimentação encontrada para esta carteira."
            />
        </div>
    );
}
