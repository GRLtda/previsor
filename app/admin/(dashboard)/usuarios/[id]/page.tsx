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
  const [user, setUser] = useState<User | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState<"block" | "unblock" | null>(null);
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
      } else {
        await adminApi.updateUserStatus(user.id, "active", "Desbloqueado pelo administrador");
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
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        {user.status === "active" ? (
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
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{user.cpf || "-"}</p>
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
                  {user.birthDate
                    ? new Date(user.birthDate).toLocaleDateString("pt-BR")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Endereco
                </p>
                <p className="font-medium">
                  {user.address
                    ? `${user.address.street}, ${user.address.number} - ${user.address.city}/${user.address.state}`
                    : "-"}
                </p>
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
                variant={user.status === "active" ? "default" : "destructive"}
                className="mt-1"
              >
                {user.status === "active" ? "Ativo" : "Bloqueado"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status KYC</p>
              <Badge
                variant={
                  user.kycStatus === "approved"
                    ? "default"
                    : user.kycStatus === "pending"
                      ? "secondary"
                      : "destructive"
                }
                className="mt-1"
              >
                {user.kycStatus === "approved"
                  ? "Aprovado"
                  : user.kycStatus === "pending"
                    ? "Pendente"
                    : user.kycStatus === "rejected"
                      ? "Rejeitado"
                      : "Nao enviado"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cadastrado em</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo da Carteira</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(user.walletBalance || 0)}
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
        title={actionType === "block" ? "Bloquear Usuario" : "Desbloquear Usuario"}
        description={
          actionType === "block"
            ? `Tem certeza que deseja bloquear o usuario ${user.name}? Ele nao podera acessar a plataforma.`
            : `Tem certeza que deseja desbloquear o usuario ${user.name}?`
        }
        confirmText={actionType === "block" ? "Bloquear" : "Desbloquear"}
        variant={actionType === "block" ? "destructive" : "default"}
        onConfirm={handleAction}
        loading={actionLoading}
      />
    </div>
  );
}
