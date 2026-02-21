"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowDownCircle,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { Deposit } from "@/lib/types";
import { StatCard } from "@/components/shared/stat-card";
import { useSearchParams } from "next/navigation"
import { Suspense } from "react";
import Loading from "./loading";
import Link from "next/link";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<import("@/lib/types").AdminDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalAmount: 0,
  });

  const searchParams = useSearchParams();

  const loadDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page?: number; per_page?: number; status?: string } = { page, per_page: 20 };
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await adminApi.getDeposits(params);
      setDeposits(response.data || []);
      setTotalPages(response.meta?.total_pages || response.meta?.last_page || 1);

      setStats({
        total: response.meta?.total || 0,
        pending: 0,
        completed: response.meta?.total || 0,
        totalAmount: 0,
      });
    } catch (error) {
      console.error("Error loading deposits:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      pending: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
      failed: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
      expired: "bg-muted text-muted-foreground border-border",
    };
    const labels: Record<string, string> = {
      completed: "Concluido",
      pending: "Pendente",
      failed: "Falhou",
      expired: "Expirado",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const columns: ColumnDef<any>[] = [
    {
      header: "ID",
      cell: (deposit: any) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {deposit.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      header: "Usuário",
      cell: (deposit: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm leading-tight">{deposit.user_full_name}</span>
          <span className="text-xs text-muted-foreground line-clamp-1">{deposit.user_email}</span>
        </div>
      ),
    },
    {
      header: "Valor",
      cell: (deposit: any) => (
        <span className="font-medium text-emerald-600">
          {deposit.amount_formatted}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (deposit: any) => getStatusBadge(deposit.status),
    },
    {
      header: "Data",
      cell: (deposit: any) => (
        <span className="text-sm text-muted-foreground">
          {deposit.created_at ? new Date(deposit.created_at).toLocaleDateString("pt-BR") : "-"}
        </span>
      ),
    },
    {
      header: "Ações",
      className: "text-right",
      cell: (deposit: any) => (
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Link href={`/admin/depositos/${deposit.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Depósitos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visualize e gerencie os depósitos dos usuários.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Depositos"
            value={stats.total}
            icon={ArrowDownCircle}
            description="Todos os depositos"
          />
          <StatCard
            title="Pendentes"
            value={stats.pending}
            icon={ArrowDownCircle}
            description="Aguardando confirmacao"
            variant="warning"
          />
          <StatCard
            title="Concluidos"
            value={stats.completed}
            icon={ArrowDownCircle}
            description="Depositos confirmados"
            variant="success"
          />
          <StatCard
            title="Volume Total"
            value={formatCurrency(stats.totalAmount)}
            icon={ArrowDownCircle}
            description="Total depositado"
          />
        </div>

        {/* ── Filters ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-full rounded-lg border bg-background"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Concluido</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full">
          <DataTable
            data={deposits}
            columns={columns}
            keyExtractor={(deposit) => deposit.id}
            selectable={true}
            selectedIds={selectedDeposits}
            onSelectionChange={setSelectedDeposits}
            isLoading={loading}
            emptyMessage="Nenhum depósito encontrado."
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              totalItems: stats.total,
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
      </div>
    </Suspense>
  );
}
