"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { Position as BasePosition } from "@/lib/types";
import { StatCard } from "@/components/shared/stat-card";

interface Position extends BasePosition {
  userFullName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  optionTitle: string;
  quantity: number;
  avgPrice: number;
  amount: number;
  marketTitle: string;
  marketId: string;
  marketImageUrl?: string;
}
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const Loading = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

export default function AdminPositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    totalVolume: 0,
  });

  const loadPositions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPositions({
        page,
        per_page: 20,
        status: statusFilter,
        search: search || undefined,
      });

      // API returns { success: true, data: { data: [...], meta: { ... } } }
      const data = (response.data as any) || {};
      const positionsList = data.data || [];
      const meta = data.meta || {};

      setPositions(positionsList);
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.total || 0);
      setStats({
        total: meta.total || 0,
        open: meta.openPositionsCount || 0,
        closed: meta.closedPositionsCount || 0,
        totalVolume: meta.totalVolume || 0,
      });

    } catch (error) {
      console.error("Error loading positions:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-blue-50 text-blue-600 border-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20",
      settled: "bg-slate-50 text-slate-600 border-slate-200 dark:border-slate-800 dark:bg-slate-900/20",
      canceled: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
      refunded: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
    };
    const labels: Record<string, string> = {
      active: "Ativa",
      settled: "Finalizada",
      canceled: "Cancelada",
      refunded: "Reembolsada",
    };

    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const columns: ColumnDef<Position>[] = [
    {
      header: "Usuário",
      cell: (position: any) => (
        <Link
          href={`/admin/usuarios/${position.userId}`}
          className="flex items-center gap-3 py-1 group"
        >
          <Avatar className="h-9 w-9 border transition-colors group-hover:border-primary/50">
            {position.userAvatarUrl && (
              <AvatarImage src={position.userAvatarUrl} alt={position.userFullName} />
            )}
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">
              {position.userFullName ? position.userFullName.substring(0, 2).toUpperCase() : "US"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm leading-tight text-foreground transition-colors group-hover:text-primary">
              {position.userFullName || 'Usuário'}
            </span>
            <span className="text-xs text-muted-foreground">
              {position.userEmail || '-'}
            </span>
          </div>
        </Link>
      ),
    },
    {
      header: "Mercado",
      cell: (position: Position) => (
        <Link
          href={`/admin/mercados/${position.marketId}`}
          className="flex items-center gap-3 max-w-[300px] group"
        >
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center transition-colors group-hover:border-primary/50">
            {position.marketImageUrl ? (
              <img
                src={position.marketImageUrl}
                alt={position.marketTitle}
                className="h-full w-full object-cover"
              />
            ) : (
              <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
            )}
          </div>
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors" title={position.marketTitle}>
            {position.marketTitle}
          </p>
        </Link>
      ),
    },
    {
      header: "Opção",
      cell: (position: Position) => {
        const isYes = position.optionTitle.toLowerCase() === 'sim';
        const isNo = position.optionTitle.toLowerCase() === 'não';

        return (
          <span className={cn(
            "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold border",
            isYes && "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30",
            isNo && "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:border-rose-900/30",
            !isYes && !isNo && "bg-muted/50 text-muted-foreground border-border"
          )}>
            {position.optionTitle}
          </span>
        );
      },
    },
    {
      header: "Investimento",
      cell: (position: Position) => (
        <span className="text-sm font-semibold">{formatCurrency(position.amount)}</span>
      ),
    },
    {
      header: "Quantidade",
      cell: (position: Position) => (
        <span className="text-sm font-medium">
          {typeof position.quantity === 'number' ? position.quantity.toFixed(4) : position.quantity}
        </span>
      ),
    },
    {
      header: "Preço Médio",
      cell: (position: Position) => (
        <span className="text-sm">{formatCurrency(position.avgPrice)}</span>
      ),
    },
    {
      header: "Status",
      cell: (position: Position) => getStatusBadge(position.status),
    },
    {
      header: "Data",
      cell: (position: Position) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {new Date(position.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight">Posições</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visualize e gerencie todas as posições dos usuários nos mercados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total de Posições"
          value={stats.total}
          icon={TrendingUp}
          description="Todas as posições"
        />
        <StatCard
          title="Posições Abertas"
          value={stats.open}
          icon={TrendingUp}
          description="Posições ativas"
          variant="warning"
        />
        <StatCard
          title="Posições Fechadas"
          value={stats.closed}
          icon={TrendingUp}
          description="Posições encerradas"
        />
        <StatCard
          title="Volume Total"
          value={formatCurrency(stats.totalVolume)}
          icon={TrendingUp}
          description="Volume negociado"
        />
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário ou mercado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full rounded-lg border bg-background"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Aberta</SelectItem>
              <SelectItem value="settled">Finalizada</SelectItem>
              <SelectItem value="canceled">Cancelada</SelectItem>
              <SelectItem value="refunded">Reembolsada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full">
        <DataTable
          data={positions}
          columns={columns}
          isLoading={loading}
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems,
            itemsPerPage: 20,
            onPageChange: setPage,
          }}
          emptyMessage="Nenhuma posição encontrada."
        />
      </div>
    </div>
  );
}

