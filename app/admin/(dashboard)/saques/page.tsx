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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  Eye,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { Withdrawal } from "@/lib/types";
import { StatCard } from "@/components/shared/stat-card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<import("@/lib/types").AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    pendingAmount: 0,
  });
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<import("@/lib/types").AdminWithdrawal | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const searchParams = useSearchParams();

  const loadWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page?: number; per_page?: number; status?: string } = { page, per_page: 20 };
      if (statusFilter !== "all") params.status = statusFilter;

      const response = await adminApi.getWithdrawals(params);
      setWithdrawals(response.data || []);
      setTotalPages(response.meta?.total_pages || response.meta?.last_page || 1);

      setStats({
        total: response.meta?.total || 0,
        pending: 0,
        approved: response.meta?.total || 0,
        pendingAmount: 0,
      });
    } catch (error) {
      console.error("Error loading withdrawals:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const handleReview = async () => {
    if (!selectedWithdrawal || !reviewAction) return;
    setActionLoading(true);
    try {
      if (reviewAction === "approve") {
        await adminApi.approveWithdrawal(selectedWithdrawal.id);
      } else {
        await adminApi.rejectWithdrawal(selectedWithdrawal.id, rejectReason);
      }
      loadWithdrawals();
      setSelectedWithdrawal(null);
      setReviewAction(null);
      setRejectReason("");
    } catch (error) {
      console.error("Error:", error);
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
    const variants: Record<string, string> = {
      completed: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      approved: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      pending: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
      rejected: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
      processing: "bg-blue-50 text-blue-600 border-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20",
    };
    const labels: Record<string, string> = {
      completed: "Concluido",
      approved: "Aprovado",
      pending: "Pendente",
      rejected: "Rejeitado",
      processing: "Processando",
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
      cell: (withdrawal: any) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {withdrawal.id.slice(0, 8)}...
        </span>
      ),
    },
    {
      header: "Usuário",
      cell: (withdrawal: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm leading-tight">{withdrawal.user_full_name}</span>
          <span className="text-xs text-muted-foreground line-clamp-1">{withdrawal.user_email}</span>
        </div>
      ),
    },
    {
      header: "Chave PIX",
      cell: (withdrawal: any) => (
        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
          {withdrawal.pix_key_value ? `${withdrawal.pix_key_value.slice(0, 15)}...` : '-'}
        </span>
      ),
    },
    {
      header: "Valor",
      cell: (withdrawal: any) => (
        <span className="font-medium text-red-600">
          -{withdrawal.amount_formatted || formatCurrency(withdrawal.amount)}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (withdrawal: any) => getStatusBadge(withdrawal.status),
    },
    {
      header: "Data",
      cell: (withdrawal: any) => (
        <span className="text-sm text-muted-foreground">
          {withdrawal.created_at ? new Date(withdrawal.created_at).toLocaleDateString("pt-BR") : "-"}
        </span>
      ),
    },
    {
      header: "Ações",
      className: "text-right",
      cell: (withdrawal: any) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground hover:text-foreground"
          onClick={() => setSelectedWithdrawal(withdrawal)}
        >
          <Eye className="mr-2 h-4 w-4" />
          {withdrawal.status === "pending" ? "Revisar" : "Ver"}
        </Button>
      ),
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Saques</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Visualize, aprove e gerencie os saques solicitados pelos usuários.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Saques"
            value={stats.total}
            icon={ArrowUpCircle}
            description="Todos os saques"
          />
          <StatCard
            title="Pendentes"
            value={stats.pending}
            icon={ArrowUpCircle}
            description="Aguardando aprovacao"
            variant="warning"
          />
          <StatCard
            title="Aprovados"
            value={stats.approved}
            icon={ArrowUpCircle}
            description="Saques processados"
            variant="success"
          />
          <StatCard
            title="Volume Pendente"
            value={formatCurrency(stats.pendingAmount)}
            icon={ArrowUpCircle}
            description="A ser processado"
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
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="completed">Concluido</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full">
          <DataTable
            data={withdrawals}
            columns={columns}
            keyExtractor={(withdrawal) => withdrawal.id}
            selectable={true}
            selectedIds={selectedWithdrawals}
            onSelectionChange={setSelectedWithdrawals}
            isLoading={loading}
            emptyMessage="Nenhum saque encontrado."
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
                <Button size="sm" variant="outline" className="h-8">
                  Aprovar Selecionados
                </Button>
                <Button size="sm" variant="destructive" className="h-8">
                  Rejeitar Selecionados
                </Button>
              </>
            )}
          />
        </div>

        {/* Review Dialog */}
        <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Saque</DialogTitle>
              <DialogDescription>
                Revise as informacoes e aprove ou rejeite o saque
              </DialogDescription>
            </DialogHeader>

            {selectedWithdrawal && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Usuario</p>
                    <p className="font-medium">{(selectedWithdrawal as any).user_full_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{(selectedWithdrawal as any).user_email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-xl font-bold text-red-600">
                      -{(selectedWithdrawal as any).amount_formatted || formatCurrency(selectedWithdrawal.amount)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedWithdrawal.status)}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Chave PIX ({(selectedWithdrawal as any).pix_key_type || 'N/A'})</p>
                  <p className="font-mono text-sm bg-muted p-2 rounded">
                    {(selectedWithdrawal as any).pix_key_value || '-'}
                  </p>
                </div>

                {reviewAction === "reject" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Motivo da Rejeicao</p>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Descreva o motivo da rejeicao..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              {selectedWithdrawal?.status === "pending" && (
                <>
                  {reviewAction === null ? (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => setReviewAction("reject")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rejeitar
                      </Button>
                      <Button onClick={() => setReviewAction("approve")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Aprovar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReviewAction(null);
                          setRejectReason("");
                        }}
                      >
                        Voltar
                      </Button>
                      <Button
                        variant={reviewAction === "reject" ? "destructive" : "default"}
                        onClick={handleReview}
                        disabled={actionLoading || (reviewAction === "reject" && !rejectReason)}
                      >
                        {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {reviewAction === "reject" ? "Confirmar Rejeicao" : "Confirmar Aprovacao"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
