"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [resolveMarket, setResolveMarket] = useState<Market | null>(null);
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
      loadMarkets();
      setResolveMarket(null);
      setSelectedOption("");
    } catch (error) {
      console.error("Error:", error);
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
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "default",
      closed: "secondary",
      resolved: "outline",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      open: "Aberto",
      closed: "Fechado",
      resolved: "Resolvido",
      cancelled: "Cancelado",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Mercados</h1>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Mercado
          </Button>
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
                    placeholder="Buscar mercados..."
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
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
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
                      <TableHead>Mercado</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>Encerramento</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {markets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum mercado encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      markets.map((market) => (
                        <TableRow key={market.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{market.statement}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{market.event?.title || "-"}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(market.status)}</TableCell>
                          <TableCell>{formatCurrency(market.liquidityB || 0)}</TableCell>
                          <TableCell>
                            {market.closesAt
                              ? new Date(market.closesAt).toLocaleDateString("pt-BR")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
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
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Resolver
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
      </div>
    </Suspense>
  );
}
