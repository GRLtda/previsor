"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, ShieldAlert, Loader2 } from "lucide-react";
import { adminApi, userApi } from "@/lib/api/client";
import type { Market } from "@/lib/types";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminMarketDetailsPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    const [market, setMarket] = useState<Market | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadMarket = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // We use userApi because there is no adminApi.getMarket in client.ts yet
            // Though userApi.getMarket requires authentication if not public, wait...
            const response = await userApi.getMarket(id);
            setMarket((response as any)?.data?.market || (response as any)?.data || response);
        } catch (err: any) {
            console.error("Error loading market details:", err);
            setError("Não foi possível carregar os detalhes do mercado.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadMarket();
    }, [loadMarket]);

    const handleAction = async (action: 'open' | 'close' | 'resolve' | 'cancel', payload?: any) => {
        if (!market) return;
        setActionLoading(true);
        try {
            let res;
            if (action === 'open') res = await adminApi.openMarket(id);
            else if (action === 'close') res = await adminApi.closeMarket(id);
            else if (action === 'cancel') res = await adminApi.cancelMarket(id);
            else if (action === 'resolve') res = await adminApi.resolveMarket(id, payload.result);

            toast.success(`Ação '${action}' concluída com sucesso!`);
            loadMarket();
        } catch (err: any) {
            console.error(`Error performing ${action}:`, err);
            toast.error(err.message || "Erro ao realizar operação no mercado.");
        } finally {
            setActionLoading(false);
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            open: "default",
            draft: "secondary",
            closed: "secondary",
            settled: "outline",
            canceled: "destructive",
        };
        const labels: Record<string, string> = {
            open: "Aberto",
            draft: "Rascunho",
            closed: "Fechado",
            settled: "Resolvido",
            canceled: "Cancelado",
        };
        return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !market) {
        return (
            <div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
                <p className="text-xl font-semibold text-destructive">{error || "Mercado não encontrado"}</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Detalhes do Mercado</h1>
                </div>
                <div className="flex items-center gap-2">
                    {market.status === "draft" && (
                        <Button variant="default" className="gap-2" onClick={() => handleAction('open')} disabled={actionLoading}>
                            <Check className="h-4 w-4" /> Abrir Mercado
                        </Button>
                    )}
                    {market.status === "open" && (
                        <Button variant="secondary" className="gap-2" onClick={() => handleAction('close')} disabled={actionLoading}>
                            <X className="h-4 w-4" /> Fechar Mercado
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações do Mercado</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold">{market.statement}</h3>
                                <p className="text-sm text-muted-foreground mt-1">ID: {market.id}</p>
                                {market.eventId && (
                                    <p className="text-sm text-muted-foreground">Evento ID: {market.eventId}</p>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {getStatusBadge(market.status)}
                                {market.result && <Badge variant={market.result === 'YES' ? 'default' : 'destructive'}>Resultado: {market.result === 'YES' ? 'Sim' : 'Não'}</Badge>}
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/10">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Probabilidade Sim</h4>
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{market.probYes ?? 0}%</p>
                                    <p className="text-xs text-muted-foreground">Pool: R$ {((market.qYes ?? 0) / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Probabilidade Não</h4>
                                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{market.probNo ?? 0}%</p>
                                    <p className="text-xs text-muted-foreground">Pool: R$ {((market.qNo ?? 0) / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Liquidez Total</h4>
                                    <p className="text-2xl font-bold mt-1">R$ {((market.liquidityB ?? 0) / 100).toFixed(2)}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Fee</h4>
                                    <p className="text-2xl font-bold mt-1">{(market.feeBps ?? 0) / 100}%</p>
                                    <p className="text-xs text-muted-foreground">{market.feeBps} bps</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Abertura</h4>
                                    <p className="font-medium mt-1">
                                        {market.opensAt ? new Date(market.opensAt).toLocaleString("pt-BR") : "-"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Fechamento</h4>
                                    <p className="font-medium mt-1">
                                        {market.closesAt ? new Date(market.closesAt).toLocaleString("pt-BR") : "-"}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-muted-foreground">Liquidação</h4>
                                    <p className="font-medium mt-1">
                                        {market.resolvesAt ? new Date(market.resolvesAt).toLocaleString("pt-BR") : (market.settledAt ? new Date(market.settledAt).toLocaleString("pt-BR") : "-")}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ações Críticas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {['closed', 'open'].includes(market.status) && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="w-full justify-start text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200" variant="outline" disabled={actionLoading}>
                                            <Check className="mr-2 h-4 w-4" />
                                            Resolver como SIM
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmação de Resolução</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tem certeza que deseja resolver o mercado <strong>"{market.statement}"</strong> como <strong>SIM</strong>? Esta ação liquidará as posições e distribuirá os prêmios. Isso não pode ser desfeito.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAction('resolve', { result: 'YES' })} className="bg-emerald-600 hover:bg-emerald-700">Resolver SIM</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {['closed', 'open'].includes(market.status) && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="w-full justify-start text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border-rose-200" variant="outline" disabled={actionLoading}>
                                            <X className="mr-2 h-4 w-4" />
                                            Resolver como NÃO
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmação de Resolução</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Tem certeza que deseja resolver o mercado <strong>"{market.statement}"</strong> como <strong>NÃO</strong>? Esta ação liquidará as posições e distribuirá os prêmios. Isso não pode ser desfeito.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAction('resolve', { result: 'NO' })} className="bg-rose-600 hover:bg-rose-700">Resolver NÃO</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

                            {!['settled', 'canceled'].includes(market.status) && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" disabled={actionLoading}>
                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                            Cancelar Mercado
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancelar Mercado</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                O cancelamento do mercado devolverá 100% dos fundos para os usuários. Deseja prosseguir com o cancelamento de <strong>"{market.statement}"</strong>?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Voltar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAction('cancel')} className="bg-destructive hover:bg-destructive/90">Sim, Cancelar Mercado</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
