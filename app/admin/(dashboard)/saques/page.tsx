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
import { Pagination } from "@/components/shared/pagination";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<import("@/lib/types").AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      processing: "outline",
    };
    const labels: Record<string, string> = {
      completed: "Concluido",
      approved: "Aprovado",
      pending: "Pendente",
      rejected: "Rejeitado",
      processing: "Processando",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Saques</h1>
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

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por usuario ou ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="completed">Concluido</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
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
                      <TableHead>ID</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Chave PIX</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum saque encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      withdrawals.map((withdrawal: any) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell className="font-mono text-sm">
                            {withdrawal.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{withdrawal.user_full_name}</p>
                              <p className="text-sm text-muted-foreground">{withdrawal.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {withdrawal.pix_key_value ? `${withdrawal.pix_key_value.slice(0, 15)}...` : '-'}
                          </TableCell>
                          <TableCell className="font-medium text-red-600">
                            -{withdrawal.amount_formatted || formatCurrency(withdrawal.amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                          <TableCell>
                            {withdrawal.created_at
                              ? new Date(withdrawal.created_at).toLocaleDateString("pt-BR")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedWithdrawal(withdrawal)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {withdrawal.status === "pending" ? "Revisar" : "Ver"}
                            </Button>
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
