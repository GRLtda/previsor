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
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { Position } from "@/lib/types";
import { StatCard } from "@/components/shared/stat-card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const Loading = () => null;

export default function AdminPositionsPage() {
  const searchParams = useSearchParams();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    closed: 0,
    totalVolume: 0,
  });

  const loadPositions = useCallback(async () => {
    setLoading(true);
    try {
      // A API admin nao tem endpoint de positions, usando dados vazios por enquanto
      // TODO: Adicionar endpoint de positions na API admin
      setPositions([]);
      setTotalPages(1);

      setStats({
        total: 0,
        open: 0,
        closed: 0,
        totalVolume: 0,
      });
    } catch (error) {
      console.error("Error loading positions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "default",
      closed: "secondary",
      won: "default",
      lost: "destructive",
    };
    const labels: Record<string, string> = {
      open: "Aberta",
      closed: "Fechada",
      won: "Vencedora",
      lost: "Perdedora",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Posicoes</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Posicoes"
            value={stats.total}
            icon={TrendingUp}
            description="Todas as posicoes"
          />
          <StatCard
            title="Posicoes Abertas"
            value={stats.open}
            icon={TrendingUp}
            description="Posicoes ativas"
            variant="warning"
          />
          <StatCard
            title="Posicoes Fechadas"
            value={stats.closed}
            icon={TrendingUp}
            description="Posicoes encerradas"
          />
          <StatCard
            title="Volume Total"
            value={formatCurrency(stats.totalVolume)}
            icon={TrendingUp}
            description="Volume negociado"
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
                    placeholder="Buscar por usuario ou mercado..."
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
                  <SelectItem value="open">Aberta</SelectItem>
                  <SelectItem value="closed">Fechada</SelectItem>
                  <SelectItem value="won">Vencedora</SelectItem>
                  <SelectItem value="lost">Perdedora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
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
                      <TableHead>Mercado</TableHead>
                      <TableHead>Opcao</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Preco Medio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhuma posicao encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      positions.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{position.userName}</p>
                              <p className="text-sm text-muted-foreground">{position.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="truncate">{position.marketTitle}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{position.optionTitle}</Badge>
                          </TableCell>
                          <TableCell>{position.quantity}</TableCell>
                          <TableCell>{formatCurrency(position.averagePrice)}</TableCell>
                          <TableCell>{getStatusBadge(position.status)}</TableCell>
                          <TableCell>
                            {new Date(position.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Pagina {page} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}
