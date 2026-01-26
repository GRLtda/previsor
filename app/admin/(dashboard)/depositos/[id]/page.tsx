"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Loader2,
    User,
    Wallet,
    Calendar,
    Clock,
    CreditCard,
    Copy,
    Check,
    RefreshCw,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";

interface DepositDetail {
    id: string;
    user_id: string;
    user_email: string;
    user_full_name: string;
    wallet_id: string;
    amount: string;
    amount_formatted: string;
    fee_amount?: string;
    fee_amount_formatted?: string;
    net_amount?: string;
    net_amount_formatted?: string;
    status: string;
    gateway_transaction_id: string | null;
    pix_e2e_id: string | null;
    pix_qrcode?: string;
    pix_copy_paste?: string;
    expires_at: string;
    paid_at: string | null;
    created_at: string;
}

export default function DepositDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [deposit, setDeposit] = useState<DepositDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadDeposit();
    }, [id]);

    const loadDeposit = async () => {
        setLoading(true);
        try {
            const response = await adminApi.getDeposit(id);
            setDeposit((response.data as any)?.deposit || response.data as any);
        } catch (error) {
            console.error("Error loading deposit:", error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            paid: "default",
            pending: "secondary",
            failed: "destructive",
            expired: "outline",
        };
        const labels: Record<string, string> = {
            paid: "Pago",
            pending: "Pendente",
            failed: "Falhou",
            expired: "Expirado",
        };
        return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("pt-BR");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!deposit) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Deposito nao encontrado</p>
                <Button variant="link" onClick={() => router.back()}>
                    Voltar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">Detalhes do Deposito</h1>
                    <p className="text-muted-foreground font-mono text-sm">{deposit.id}</p>
                </div>
                <Button variant="outline" onClick={loadDeposit}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Informações do Depósito */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Informacoes do Deposito
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Valor</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {deposit.amount_formatted}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <div className="mt-1">{getStatusBadge(deposit.status)}</div>
                            </div>
                            {deposit.fee_amount_formatted && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Taxa</p>
                                    <p className="font-medium">{deposit.fee_amount_formatted}</p>
                                </div>
                            )}
                            {deposit.net_amount_formatted && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Valor Liquido</p>
                                    <p className="font-medium">{deposit.net_amount_formatted}</p>
                                </div>
                            )}
                        </div>

                        <hr className="my-4" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" /> Criado em
                                </p>
                                <p className="font-medium">{formatDate(deposit.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Expira em
                                </p>
                                <p className="font-medium">{formatDate(deposit.expires_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pago em</p>
                                <p className="font-medium">{formatDate(deposit.paid_at)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">ID da Carteira</p>
                                <p className="font-mono text-sm truncate">{deposit.wallet_id}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status e Usuario */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Usuario
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Nome</p>
                            <p className="font-medium">{deposit.user_full_name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{deposit.user_email}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">ID do Usuario</p>
                            <p className="font-mono text-sm truncate">{deposit.user_id}</p>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push(`/admin/usuarios/${deposit.user_id}`)}
                        >
                            Ver Perfil do Usuario
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Informações do Gateway */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        Informacoes do Gateway
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">ID da Transacao (Gateway)</p>
                            <div className="flex items-center gap-2">
                                <p className="font-mono text-sm truncate">
                                    {deposit.gateway_transaction_id || "-"}
                                </p>
                                {deposit.gateway_transaction_id && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => copyToClipboard(deposit.gateway_transaction_id!)}
                                    >
                                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">PIX E2E ID</p>
                            <p className="font-mono text-sm">{deposit.pix_e2e_id || "-"}</p>
                        </div>
                    </div>

                    {deposit.pix_copy_paste && (
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">PIX Copia e Cola</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">
                                    {deposit.pix_copy_paste}
                                </code>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(deposit.pix_copy_paste!)}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    {deposit.pix_qrcode && (
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">QR Code PIX</p>
                            <div className="bg-white p-4 rounded-lg inline-block">
                                <img src={deposit.pix_qrcode} alt="QR Code PIX" className="w-48 h-48" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
