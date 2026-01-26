"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  TrendingUp,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { User, Position, Transaction } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<import("@/lib/types").AdminUser | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<"block" | "unblock" | "approveKyc" | "rejectKyc" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const userRes = await adminApi.getUser(id);
      setUser(userRes.data?.user || null);
      // A API nao tem endpoints para positions/transactions de usuario especifico
      setPositions([]);
      setTransactions([]);
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!user || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "block") {
        await adminApi.updateUserStatus(user.id, "blocked", "Bloqueado pelo administrador");
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
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
        <p className="text-muted-foreground">Usuario nao encontrado</p>
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
          <h1 className="text-3xl font-bold">{(user as any).full_name || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        {(user as any).status === "active" ? (
          <Button variant="destructive" onClick={() => setActionType("block")}>
            <Ban className="mr-2 h-4 w-4" />
            Bloquear Usuario
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setActionType("unblock")}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Desbloquear Usuario
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informacoes Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome Completo</p>
                <p className="font-medium">{(user as any).full_name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{(user as any).cpf || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Telefone
                </p>
                <p className="font-medium">{user.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Data de Nascimento
                </p>
                <p className="font-medium">
                  {(user as any).birth_date
                    ? new Date((user as any).birth_date).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Endereco
                </p>
                <p className="font-medium">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status da Conta</p>
              <Badge
                variant={(user as any).status === "active" ? "default" : "destructive"}
                className="mt-1"
              >
                {(user as any).status === "active" ? "Ativo" : "Bloqueado"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status KYC</p>
              <Badge
                variant={
                  (user as any).kyc_status === "approved"
                    ? "default"
                    : (user as any).kyc_status === "pending"
                      ? "secondary"
                      : "destructive"
                }
                className="mt-1"
              >
                {(user as any).kyc_status === "approved"
                  ? "Aprovado"
                  : (user as any).kyc_status === "pending"
                    ? "Pendente"
                    : (user as any).kyc_status === "rejected"
                      ? "Rejeitado"
                      : "Nao enviado"}
              </Badge>
              {/* Botões de ação KYC */}
              {(user as any).kyc_status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => setActionType("approveKyc")}
                  >
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setActionType("rejectKyc")}
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cadastrado em</p>
              <p className="font-medium">
                {(user as any).created_at
                  ? new Date((user as any).created_at).toLocaleDateString("pt-BR")
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo da Carteira</p>
              <p className="text-2xl font-bold text-primary">
                {(user as any).wallet?.balance_formatted || "R$ 0,00"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Posicoes
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Transacoes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mercado</TableHead>
                    <TableHead>Opcao</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preco Medio</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nenhuma posicao encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    positions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell className="font-medium">
                          {position.marketTitle}
                        </TableCell>
                        <TableCell>{position.optionTitle}</TableCell>
                        <TableCell>{position.quantity}</TableCell>
                        <TableCell>{formatCurrency(position.averagePrice)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              position.status === "open" ? "default" : "secondary"
                            }
                          >
                            {position.status === "open" ? "Aberta" : "Fechada"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nenhuma transacao encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {transaction.type === "deposit"
                              ? "Deposito"
                              : transaction.type === "withdrawal"
                                ? "Saque"
                                : transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={
                            transaction.type === "deposit"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {transaction.type === "deposit" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "default"
                                : transaction.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {transaction.status === "completed"
                              ? "Concluido"
                              : transaction.status === "pending"
                                ? "Pendente"
                                : "Falhou"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!actionType}
        onOpenChange={() => setActionType(null)}
        title={
          actionType === "block"
            ? "Bloquear Usuario"
            : actionType === "unblock"
              ? "Desbloquear Usuario"
              : actionType === "approveKyc"
                ? "Aprovar KYC"
                : "Rejeitar KYC"
        }
        description={
          actionType === "block"
            ? `Tem certeza que deseja bloquear o usuario ${(user as any).full_name || user.email}? Ele nao podera acessar a plataforma.`
            : actionType === "unblock"
              ? `Tem certeza que deseja desbloquear o usuario ${(user as any).full_name || user.email}?`
              : actionType === "approveKyc"
                ? `Tem certeza que deseja aprovar a verificacao KYC do usuario ${(user as any).full_name || user.email}?`
                : `Tem certeza que deseja rejeitar a verificacao KYC do usuario ${(user as any).full_name || user.email}?`
        }
        confirmText={
          actionType === "block"
            ? "Bloquear"
            : actionType === "unblock"
              ? "Desbloquear"
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
