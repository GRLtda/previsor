"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
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
  Eye,
  ExternalLink,
  MoreVertical,
  Copy,
  Check,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { WalletInfo } from "@/lib/types";
import { StatCard } from "@/components/shared/stat-card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
export default function AdminWalletsPage() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
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

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status === 'active'
        ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20'
        : 'bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20'
        }`}>
        {status === 'active' ? 'Ativo' : 'Congelado'}
      </span>
    );
  };

  const getRiskBadge = (risk: string) => {
    const variants: Record<string, string> = {
      low: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      medium: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
      high: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
    };
    const labels: Record<string, string> = {
      low: "Baixo",
      medium: "Médio",
      high: "Alto",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[risk] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[risk] || risk}
      </span>
    );
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "Usuário",
      cell: (wallet: any) => (
        <Link
          href={`/admin/usuarios/${wallet.user_id}`}
          className="flex items-center gap-3 group"
        >
          <Avatar className="h-8 w-8 rounded-full border shadow-sm transition-transform duration-200 group-hover:scale-105">
            <AvatarImage src={(wallet as any).user_avatar_url || ''} />
            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
              {wallet.user_full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm leading-tight text-foreground transition-colors group-hover:text-primary">
              {wallet.user_full_name}
            </span>
            <span className="text-xs text-muted-foreground line-clamp-1">{wallet.user_email}</span>
          </div>
        </Link>
      ),
    },
    {
      header: "ID da Carteira",
      cell: (wallet: any) => {
        const [copied, setCopied] = useState(false);

        const copyToClipboard = () => {
          navigator.clipboard.writeText(wallet.id);
          setCopied(true);
          toast.success("ID copiado para a área de transferência");
          setTimeout(() => setCopied(false), 2000);
        };

        return (
          <div className="flex items-center gap-2 group/copy">
            <code className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded border">
              {wallet.id.split('-')[0]}...
            </code>
            <button
              onClick={copyToClipboard}
              className="p-1 rounded-md hover:bg-muted opacity-0 group-hover/copy:opacity-100 transition-opacity"
              title="Copiar ID"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          </div>
        );
      },
    },
    {
      header: "Saldo",
      cell: (wallet: any) => (
        <span className="font-medium">
          {wallet.balance_formatted || formatCurrency(wallet.balance || 0)}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (wallet: any) => getStatusBadge(wallet.status),
    },
    {
      header: "Nível de Risco",
      cell: (wallet: any) => getRiskBadge(wallet.risk_level),
    },
    {
      header: "Criado em",
      cell: (wallet: any) => (
        <span className="text-sm text-muted-foreground">
          {wallet.created_at ? new Date(wallet.created_at).toLocaleDateString("pt-BR") : "-"}
        </span>
      ),
    },
    {
      header: "",
      className: "text-right",
      cell: (wallet: any) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ações da Carteira</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/admin/carteiras/${wallet.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Histórico
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setAdjustWallet(wallet);
                  setAdjustType("credit");
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                Creditar Saldo
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setAdjustWallet(wallet);
                  setAdjustType("debit");
                }}
                className="cursor-pointer"
              >
                <Minus className="mr-2 h-4 w-4" />
                Debitar Saldo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carteiras</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os saldos dos usuários e efetue ajustes de crédito ou débito.
          </p>
        </div>
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

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full rounded-lg border bg-background"
          />
        </div>
      </div>

      <div className="w-full">
        <DataTable
          data={wallets}
          columns={columns}
          keyExtractor={(wallet) => wallet.id}
          selectable={true}
          selectedIds={selectedWallets}
          onSelectionChange={setSelectedWallets}
          isLoading={loading}
          emptyMessage="Nenhuma carteira encontrada."
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            totalItems: stats.totalWallets,
            itemsPerPage: 20,
            onPageChange: setPage,
          }}
          bulkActions={(selectedIds) => (
            <>
              <Button size="sm" variant="secondary" className="h-8">
                Exportar ({selectedIds.length})
              </Button>
            </>
          )}
        />
      </div>

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
