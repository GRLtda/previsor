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
import { Pagination } from "@/components/shared/pagination";

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<import("@/lib/types").AdminDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      expired: "outline",
    };
    const labels: Record<string, string> = {
      completed: "Concluido",
      pending: "Pendente",
      failed: "Falhou",
      expired: "Expirado",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Depositos</h1>
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
                  <SelectItem value="completed">Concluido</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
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
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum deposito encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      deposits.map((deposit: any) => (
                        <TableRow key={deposit.id}>
                          <TableCell className="font-mono text-sm">
                            {deposit.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{deposit.user_full_name}</p>
                              <p className="text-sm text-muted-foreground">{deposit.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {deposit.amount_formatted}
                          </TableCell>
                          <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                          <TableCell>
                            {deposit.created_at
                              ? new Date(deposit.created_at).toLocaleDateString("pt-BR")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/depositos/${deposit.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
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
      </div>
    </Suspense>
  );
}
