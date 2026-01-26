"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Plus,
  Minus,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { WalletInfo } from "@/lib/types";
import { StatCard } from "@/components/shared/stat-card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Pagination } from "@/components/shared/pagination";

export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalWallets: 0,
    totalBalance: 0,
    averageBalance: 0,
  });
  const [adjustWallet, setAdjustWallet] = useState<WalletInfo | null>(null);
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const searchParams = useSearchParams();

  const loadWallets = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page?: number; per_page?: number } = { page, per_page: 20 };

      const response = await adminApi.getWallets(params);
      setWallets(response.data || []);
      setTotalPages(response.meta?.total_pages || response.meta?.last_page || 1);

      const totalBalance = (response.data || []).reduce(
        (sum: number, w: WalletInfo) => sum + (w.balance || 0),
        0
      );
      setStats({
        totalWallets: response.meta?.total || 0,
        totalBalance,
        averageBalance: totalBalance / (response.meta?.total || 1),
      });
    } catch (error) {
      console.error("Error loading wallets:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const handleAdjust = async () => {
    if (!adjustWallet || !adjustAmount || !adjustReason) return;
    setActionLoading(true);
    try {
      const amountInCents = Math.round(parseFloat(adjustAmount.replace(',', '.')) * 100);

      if (isNaN(amountInCents) || amountInCents <= 0) {
        alert("Por favor, insira um valor valido");
        return;
      }

      if (adjustType === "credit") {
        await adminApi.creditWallet(adjustWallet.id, amountInCents, adjustReason);
      } else {
        await adminApi.debitWallet(adjustWallet.id, amountInCents, adjustReason);
      }

      await loadWallets();
      setAdjustWallet(null);
      setAdjustAmount("");
      setAdjustReason("");
    } catch (error) {
      console.error("Error:", error);
      alert("Erro ao realizar operacao. Tente novamente.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Carteiras</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total de Carteiras"
          value={stats.totalWallets}
          icon={Wallet}
          description="Usuarios com carteira"
        />
        <StatCard
          title="Saldo Total"
          value={formatCurrency(stats.totalBalance)}
          icon={Wallet}
          description="Somatoria de saldos"
        />
        <StatCard
          title="Saldo Medio"
          value={formatCurrency(stats.averageBalance)}
          icon={Wallet}
          description="Media por usuario"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Nivel de Risco</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma carteira encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    wallets.map((wallet: any) => (
                      <TableRow key={wallet.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{wallet.user_full_name}</p>
                            <p className="text-sm text-muted-foreground">{wallet.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {wallet.balance_formatted || formatCurrency(wallet.balance || 0)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${wallet.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {wallet.status === 'active' ? 'Ativo' : 'Congelado'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${wallet.risk_level === 'low'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : wallet.risk_level === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {wallet.risk_level === 'low' ? 'Baixo' : wallet.risk_level === 'medium' ? 'Medio' : 'Alto'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {wallet.created_at
                            ? new Date(wallet.created_at).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAdjustWallet(wallet);
                                setAdjustType("credit");
                              }}
                            >
                              <Plus className="mr-1 h-3 w-3" />
                              Creditar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAdjustWallet(wallet);
                                setAdjustType("debit");
                              }}
                            >
                              <Minus className="mr-1 h-3 w-3" />
                              Debitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Adjust Balance Dialog */}
      <Suspense fallback={null}>
        <Dialog open={!!adjustWallet} onOpenChange={() => setAdjustWallet(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {adjustType === "credit" ? "Creditar Saldo" : "Debitar Saldo"}
              </DialogTitle>
              <DialogDescription>
                {adjustType === "credit"
                  ? "Adicione saldo a carteira do usuario"
                  : "Remova saldo da carteira do usuario"}
              </DialogDescription>
            </DialogHeader>

            {adjustWallet && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium">{(adjustWallet as any).user_full_name}</p>
                  <p className="text-sm text-muted-foreground">{(adjustWallet as any).user_email}</p>
                  <p className="text-lg font-bold mt-2">
                    Saldo atual: {(adjustWallet as any).balance_formatted || formatCurrency(adjustWallet.balance || 0)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea
                    id="reason"
                    placeholder="Descreva o motivo do ajuste..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustWallet(null)}>
                Cancelar
              </Button>
              <Button
                variant={adjustType === "debit" ? "destructive" : "default"}
                onClick={handleAdjust}
                disabled={actionLoading || !adjustAmount || !adjustReason}
              >
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {adjustType === "credit" ? "Creditar" : "Debitar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Suspense>
    </div>
  );
}
