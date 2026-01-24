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
  Trash,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { Event } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import { PlaceholderIcon } from '@/components/ui/placeholder-icon';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
  });

  const searchParams = useSearchParams();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string; limit?: number; offset?: number } = {
        limit: 20,
        offset: (page - 1) * 20
      };
      if (statusFilter !== "all") params.status = statusFilter;

      // Usa a API publica de eventos (userApi) para listagem
      const { userApi } = await import("@/lib/api/client");
      const response = await userApi.getEvents(params);
      setEvents(response.events || []);
      setTotalPages(Math.ceil((response.totalCount || 0) / 20));
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      await adminApi.createEvent({
        title: formData.title,
        slug: formData.title.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        category: formData.category,
        startsAt: formData.startDate,
        endsAt: formData.endDate,
        resolveRules: '',
        sourceUrls: [],
      });
      loadEvents();
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editEvent) return;
    setFormLoading(true);
    try {
      // A API admin nao tem endpoint de update para eventos, apenas criar
      // Por enquanto apenas recarrega
      loadEvents();
      setEditEvent(null);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEvent) return;
    setFormLoading(true);
    try {
      // A API admin nao tem endpoint de delete para eventos
      loadEvents();
      setDeleteEvent(null);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const openEditDialog = (event: Event) => {
    setFormData({
      title: event.title,
      description: event.description || "",
      category: event.category || "",
      imageUrl: event.imageUrl || "",
      startDate: event.startDate?.split("T")[0] || "",
      endDate: event.endDate?.split("T")[0] || "",
    });
    setEditEvent(event);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      imageUrl: "",
      startDate: "",
      endDate: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      draft: "secondary",
      closed: "outline",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      draft: "Rascunho",
      closed: "Encerrado",
      cancelled: "Cancelado",
    };
    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>;
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Eventos</h1>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
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
                    placeholder="Buscar eventos..."
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
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="closed">Encerrado</SelectItem>
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
                      <TableHead>Evento</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mercados</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum evento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded overflow-hidden bg-muted flex items-center justify-center">
                                {event.imageUrl ? (
                                  <img
                                    src={event.imageUrl}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                      const placeholder = e.currentTarget.nextElementSibling as HTMLElement
                                      if (placeholder) placeholder.style.display = 'flex'
                                    }}
                                  />
                                ) : null}
                                <div style={{ display: event.imageUrl ? 'none' : 'flex' }}>
                                  <PlaceholderIcon size={40} />
                                </div>
                              </div>
                              <div>
                                <p className="font-medium">{event.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {event.description}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.category || "-"}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(event.status)}</TableCell>
                          <TableCell>{event.marketsCount || 0}</TableCell>
                          <TableCell>
                            {event.startDate
                              ? new Date(event.startDate).toLocaleDateString("pt-BR")
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
                                  <Link href={`/admin/eventos/${event.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver detalhes
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(event)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeleteEvent(event)}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
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

        {/* Create/Edit Dialog */}
        <Dialog
          open={showCreateDialog || !!editEvent}
          onOpenChange={() => {
            setShowCreateDialog(false);
            setEditEvent(null);
            resetForm();
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editEvent ? "Editar Evento" : "Novo Evento"}</DialogTitle>
              <DialogDescription>
                {editEvent
                  ? "Edite as informacoes do evento"
                  : "Preencha as informacoes do novo evento"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Eleicoes 2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o evento..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="politics">Politica</SelectItem>
                      <SelectItem value="sports">Esportes</SelectItem>
                      <SelectItem value="economy">Economia</SelectItem>
                      <SelectItem value="entertainment">Entretenimento</SelectItem>
                      <SelectItem value="technology">Tecnologia</SelectItem>
                      <SelectItem value="other">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL da Imagem</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditEvent(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={editEvent ? handleUpdate : handleCreate}
                disabled={formLoading || !formData.title}
              >
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editEvent ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!deleteEvent}
          onOpenChange={() => setDeleteEvent(null)}
          title="Excluir Evento"
          description={`Tem certeza que deseja excluir o evento "${deleteEvent?.title}"? Esta acao nao pode ser desfeita.`}
          confirmText="Excluir"
          variant="destructive"
          onConfirm={handleDelete}
          loading={formLoading}
        />
      </div>
    </Suspense>
  );
}
