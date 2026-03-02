"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  Loader2,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  XCircle,
  ShieldCheck,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Clock,
  ArrowRight
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<import("@/lib/types").AdminUser | null>(null);
  const [wallet, setWallet] = useState<any | null>(null);
  const [activities, setActivities] = useState<import("@/lib/types").LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [actionType, setActionType] = useState<"block" | "unblock" | "approveKyc" | "rejectKyc" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUser();
    loadActivities();
  }, [id]);

  const loadUser = async () => {
    try {
      const userRes = await adminApi.getUser(id);
      setUser(userRes.data?.user || null);

      if (userRes.data?.wallet) {
        setWallet(userRes.data.wallet);
      } else if ((userRes.data?.user as any)?.wallet) {
        setWallet((userRes.data?.user as any).wallet);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    setLoadingActivity(true);
    try {
      const res = await adminApi.getLedger({ user_id: id, per_page: 8 });
      setActivities(res.data || []);
    } catch (error) {
      console.error("Error loading activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleAction = async () => {
    if (!user || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "block") {
        await adminApi.updateUserStatus(user.id, "suspended", "Bloqueado pelo administrador");
      } else if (actionType === "unblock") {
        await adminApi.updateUserStatus(user.id, "active", "Desbloqueado pelo administrador");
      } else if (actionType === "approveKyc") {
        await adminApi.approveKyc(user.id, "full", "Aprovado pelo administrador");
      } else if (actionType === "rejectKyc") {
        await adminApi.rejectKyc(user.id, "Documentos invalidos", "Rejeitado pelo administrador");
      }
      loadUser();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setActionLoading(false);
      setActionType(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Usuário não encontrado</p>
        <Button variant="link" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Resumo do Usuário</h1>
          <p className="text-muted-foreground">Gerencie as informações e o status desta conta</p>
        </div>

        {wallet && wallet.id && (
          <Button variant="outline" onClick={() => router.push(`/admin/carteiras/${wallet.id}`)}>
            <Wallet className="mr-2 h-4 w-4" />
            Ver Carteira
          </Button>
        )}

        {(user as any).status === "active" ? (
          <Button variant="destructive" onClick={() => setActionType("block")}>
            <Ban className="mr-2 h-4 w-4" />
            Bloquear
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setActionType("unblock")}>
            <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
            Desbloquear
          </Button>
        )}
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Avatar Section - Side by Side layout */}
            <div className="flex flex-row items-center gap-6 md:min-w-[320px]">
              <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
                {(user as any).avatar_url && <AvatarImage src={(user as any).avatar_url} alt={(user as any).full_name} />}
                <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                  {(user as any).full_name ? (user as any).full_name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold leading-tight">{(user as any).full_name || user.email}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge variant={(user as any).status === "active" ? "outline" : "destructive"} className="mt-2 w-fit">
                  {(user as any).status === "active" ? "Ativo" : "Suspenso"}
                </Badge>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 lg:border-l lg:pl-10">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">CPF</p>
                <p className="font-semibold text-base">{(user as any).cpf || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Telefone
                </p>
                <p className="font-semibold text-base">{user.phone || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Data de Nascimento
                </p>
                <p className="font-semibold text-base">
                  {(user as any).birth_date
                    ? new Date((user as any).birth_date).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Endereço
                </p>
                <p className="font-semibold text-base">-</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speedometers (Stat Cards Row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Card */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Saldo da Carteira</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
              <Wallet className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {wallet?.balance_formatted || "R$ 0,00"}
          </p>
          <div className="mt-0.5">
            {wallet?.id ? (
              <Link
                href={`/admin/carteiras/${wallet.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
              >
                Ver detalhes do saldo <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma carteira vinculada</p>
            )}
          </div>
        </div>

        {/* Status da Conta */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Status da Conta</p>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              (user as any).status === "active" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"
            )}>
              <CheckCircle className={cn(
                "h-4 w-4",
                (user as any).status === "active" ? "text-emerald-500" : "text-rose-500"
              )} />
            </div>
          </div>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            (user as any).status === "active" ? "text-emerald-600" : "text-rose-600"
          )}>
            {(user as any).status === "active" ? "Ativa" : "Suspensa"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Permissão de acesso à plataforma</p>
        </div>

        {/* Status KYC */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Status KYC</p>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full",
              (user as any).kyc_status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                (user as any).kyc_status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20' :
                  'bg-rose-50 dark:bg-rose-900/20'
            )}>
              <ShieldCheck className={cn(
                "h-4 w-4",
                (user as any).kyc_status === 'approved' ? 'text-emerald-500' :
                  (user as any).kyc_status === 'pending' ? 'text-amber-500' :
                    'text-rose-500'
              )} />
            </div>
          </div>
          <p className={cn(
            "text-2xl font-bold tracking-tight",
            (user as any).kyc_status === 'approved' ? 'text-emerald-600' :
              (user as any).kyc_status === 'pending' ? 'text-amber-600' :
                'text-rose-600'
          )}>
            {(user as any).kyc_status === "approved"
              ? "Aprovado"
              : (user as any).kyc_status === "pending"
                ? "Pendente"
                : (user as any).kyc_status === "rejected"
                  ? "Rejeitado"
                  : "Não enviado"}
          </p>
          <div className="mt-2">
            {(user as any).kyc_status === "pending" ? (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs px-2 flex-1" onClick={() => setActionType("approveKyc")}>
                  Aprovar
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-rose-600 border-rose-200 hover:bg-rose-50 flex-1" onClick={() => setActionType("rejectKyc")}>
                  Rejeitar
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Verificação em dia</p>
            )}
          </div>
        </div>

        {/* Cadastro */}
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">Cadastrado em</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20">
              <Calendar className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">
            {(user as any).created_at
              ? new Date((user as any).created_at).toLocaleDateString("pt-BR")
              : "-"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Data de registro da conta</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingActivity ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>Nenhuma atividade financeira recente.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        activity.entry_type === 'credit' ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-rose-50 dark:bg-rose-900/20"
                      )}>
                        {activity.reference_type === 'BET' ? (
                          <TrendingUp className="h-4 w-4 text-indigo-500" />
                        ) : activity.reference_type === 'DEPOSIT' ? (
                          <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                        ) : activity.reference_type === 'WITHDRAWAL' ? (
                          <ArrowUpCircle className="h-4 w-4 text-rose-500" />
                        ) : (
                          <Activity className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase opacity-70">
                            • {activity.reference_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-bold",
                        activity.entry_type === 'credit' ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {activity.entry_type === 'credit' ? '+' : '-'} {activity.amount_formatted}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Saldo: {activity.balance_after_formatted}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!actionType}
        onOpenChange={() => setActionType(null)}
        title={
          actionType === "block"
            ? "Suspender Usuário"
            : actionType === "unblock"
              ? "Ativar Usuário"
              : actionType === "approveKyc"
                ? "Aprovar KYC"
                : "Rejeitar KYC"
        }
        description={
          actionType === "block"
            ? `Tem certeza que deseja suspender o usuário ${(user as any).full_name || user.email}? Ele não poderá acessar a plataforma.`
            : actionType === "unblock"
              ? `Tem certeza que deseja ativar o usuário ${(user as any).full_name || user.email}?`
              : actionType === "approveKyc"
                ? `Tem certeza que deseja aprovar a verificação KYC do usuário ${(user as any).full_name || user.email}?`
                : `Tem certeza que deseja rejeitar a verificação KYC do usuário ${(user as any).full_name || user.email}?`
        }
        confirmText={
          actionType === "block"
            ? "Suspender"
            : actionType === "unblock"
              ? "Ativar"
              : actionType === "approveKyc"
                ? "Aprovar"
                : "Rejeitar"
        }
        variant={actionType === "block" || actionType === "rejectKyc" ? "destructive" : "default"}
        onConfirm={handleAction}
        isLoading={actionLoading}
      />
    </div>
  );
}
