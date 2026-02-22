"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { Market, Event } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Loading() {
  return null;
}

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [resolveMarket, setResolveMarket] = useState<Market | null>(null);
  const [cancelMarket, setCancelMarket] = useState<Market | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    eventId: "",
    title: "",
    description: "",
    closingDate: "",
    options: [
      { title: "Sim", initialPrice: 50 },
      { title: "Nao", initialPrice: 50 },
    ],
  });

  const searchParams = useSearchParams();

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    try {
      // Usa a API publica para listar eventos e seus mercados
      const { userApi } = await import("@/lib/api/client");
      const eventsRes = await userApi.getEvents({ status: "active", limit: 100 });
      setEvents(eventsRes.events || []);

      // Coleta todos os mercados de todos os eventos
      const allMarkets: Market[] = [];
      for (const event of eventsRes.events || []) {
        if (event.markets) {
          for (const market of event.markets) {
            allMarkets.push({
              ...market,
              event: { id: event.id, slug: event.slug, title: event.title, category: event.category },
            });
          }
        }
      }

      // Aplica filtro de status
      const filteredMarkets = statusFilter === "all"
        ? allMarkets
        : allMarkets.filter(m => m.status === statusFilter);

      setMarkets(filteredMarkets);
      setTotalPages(1);
      setTotalItems(filteredMarkets.length);
    } catch (error) {
      console.error("Error loading markets:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      await adminApi.createMarket({
        eventId: formData.eventId,
        statement: formData.title,
        opensAt: new Date().toISOString(),
        closesAt: formData.closingDate,
        resolvesAt: formData.closingDate,
      });
      loadMarkets();
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveMarket || !selectedOption) return;
    setFormLoading(true);
    try {
      const result = selectedOption === "yes" ? "YES" : "NO";
      await adminApi.resolveMarket(resolveMarket.id, result);
      toast.success("Mercado resolvido com sucesso!");
      loadMarkets();
      setResolveMarket(null);
      setSelectedOption("");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao resolver mercado");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelMarket = async () => {
    if (!cancelMarket) return;
    setFormLoading(true);
    try {
      await adminApi.cancelMarket(cancelMarket.id);
      toast.success("Mercado cancelado e valores estornados!");
      loadMarkets();
      setCancelMarket(null);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erro ao cancelar mercado");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      eventId: "",
      title: "",
      description: "",
      closingDate: "",
      options: [
        { title: "Sim", initialPrice: 50 },
        { title: "Nao", initialPrice: 50 },
      ],
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      closed: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
      resolved: "bg-blue-50 text-blue-600 border-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20",
      cancelled: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
    };
    const labels: Record<string, string> = {
      open: "Aberto",
      closed: "Fechado",
      resolved: "Resolvido",
      cancelled: "Cancelado",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const columns: ColumnDef<Market>[] = [
    {
      header: "Mercado",
      cell: (market: any) => (
        <div>
          <p className="font-medium text-sm max-w-[300px] sm:max-w-md line-clamp-2">{market.statement}</p>
        </div>
      ),
    },
    {
      header: "Evento",
      cell: (market: any) => (
        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground border-border bg-transparent max-w-[200px] truncate">
          {market.event?.title || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (market: any) => getStatusBadge(market.status),
    },
    {
      header: "Volume",
      cell: (market: any) => <span className="text-sm font-medium">{formatCurrency(market.liquidityB || 0)}</span>,
    },
    {
      header: "Encerramento",
      cell: (market: any) => (
        <span className="text-sm text-muted-foreground">
          {market.closesAt ? new Date(market.closesAt).toLocaleDateString("pt-BR") : "-"}
        </span>
      ),
    },
    {
      header: "Ações",
      className: "text-right",
      cell: (market: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/mercados/${market.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </Link>
            </DropdownMenuItem>
            {market.status === "closed" && (
              <DropdownMenuItem onClick={() => setResolveMarket(market)}>
                <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                Resolver
              </DropdownMenuItem>
            )}
            {market.status !== "resolved" && market.status !== "cancelled" && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => setCancelMarket(market)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mercados</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie os mercados de previsão, acompanhe volumes e resolva resultados.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Mercado
          </Button>
        </div>

        {/* ── Filters ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mercados..."
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
                <SelectItem value="open">Aberto</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full">
          <DataTable
            data={markets}
            columns={columns}
            keyExtractor={(market) => market.id}
            selectable={true}
            selectedIds={selectedMarkets}
            onSelectionChange={setSelectedMarkets}
            isLoading={loading}
            emptyMessage="Nenhum mercado encontrado."
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              totalItems: totalItems,
              itemsPerPage: 20, /* the api limits at 100 for events, so it might return all markets, adjusting for visual only since it's client side filtered here but keeping consistency */
              onPageChange: setPage,
            }}
            bulkActions={(selectedIds) => (
              <>
                <Button size="sm" variant="secondary" className="h-8">
                  Exportar ({selectedIds.length})
                </Button>
                <Button size="sm" variant="destructive" className="h-8">
                  Cancelar Selecionados
                </Button>
              </>
            )}
          />
        </div>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Mercado</DialogTitle>
              <DialogDescription>Crie um novo mercado de previsao</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventId">Evento</Label>
                <Select
                  value={formData.eventId}
                  onValueChange={(value) => setFormData({ ...formData, eventId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titulo</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Lula sera reeleito em 2026?"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o mercado..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closingDate">Data de Encerramento</Label>
                <Input
                  id="closingDate"
                  type="datetime-local"
                  value={formData.closingDate}
                  onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Opcoes</Label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option.title}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index].title = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        placeholder="Titulo da opcao"
                      />
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={option.initialPrice}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index].initialPrice = parseInt(e.target.value) || 50;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        className="w-20"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={formLoading || !formData.title || !formData.eventId}
              >
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Resolve Dialog */}
        <Dialog open={!!resolveMarket} onOpenChange={() => setResolveMarket(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolver Mercado</DialogTitle>
              <DialogDescription>
                Selecione a opcao vencedora para resolver o mercado "{resolveMarket?.statement}"
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Label>Opcao Vencedora</Label>
              <div className="space-y-2">
                <Button
                  variant={selectedOption === "yes" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedOption("yes")}
                >
                  Sim
                </Button>
                <Button
                  variant={selectedOption === "no" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedOption("no")}
                >
                  Nao
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveMarket(null)}>
                Cancelar
              </Button>
              <Button onClick={handleResolve} disabled={formLoading || !selectedOption}>
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resolver Mercado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!cancelMarket}
          onOpenChange={() => setCancelMarket(null)}
          title="Cancelar Mercado"
          description={`Tem certeza que deseja cancelar o mercado "${cancelMarket?.statement}"? Todos os valores investidos serao devolvidos 100% aos usuarios. Esta acao nao pode ser desfeita.`}
          confirmText="Confirmar Cancelamento"
          variant="destructive"
          onConfirm={handleCancelMarket}
          isLoading={formLoading}
        />
      </div>
    </Suspense>
  );
}
