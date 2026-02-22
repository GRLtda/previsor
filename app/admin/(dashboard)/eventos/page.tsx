"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Camera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { adminApi, ApiClientError } from "@/lib/api/client";
import type { Event } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import { PlaceholderIcon } from '@/components/ui/placeholder-icon';
import { DataTable, ColumnDef } from "@/components/shared/data-table";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setTotalItems(response.totalCount || 0);
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
      await adminApi.updateEvent(editEvent.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        imageUrl: formData.imageUrl || undefined,
        startsAt: formData.startDate || undefined,
        endsAt: formData.endDate || undefined,
      });
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
      startDate: event.startsAt?.split("T")[0] || "",
      endDate: event.endsAt?.split("T")[0] || "",
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

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = (height / width) * maxDim;
              width = maxDim;
            } else {
              width = (width / height) * maxDim;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Canvas compression failed"));
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    setIsUploading(true);

    try {
      let fileToUpload: File | Blob = originalFile;

      if (originalFile.size > 5 * 1024 * 1024) {
        toast.info("Imagem grande, otimizando para o envio...");
        fileToUpload = await compressImage(originalFile);
      }

      const formDataUpload = new FormData();
      formDataUpload.append("file", fileToUpload, originalFile.name);

      const response = await adminApi.uploadEventImage(formDataUpload);
      setFormData((prev) => ({ ...prev, imageUrl: response.data.imageUrl }));
      toast.success("Imagem enviada com sucesso!");
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
      } else {
        toast.error("Erro ao fazer upload da imagem");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      draft: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
      closed: "bg-muted text-muted-foreground border-border",
      cancelled: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      draft: "Rascunho",
      closed: "Encerrado",
      cancelled: "Cancelado",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const columns: ColumnDef<Event>[] = [
    {
      header: "Evento",
      cell: (event: any) => (
        <div className="flex items-center gap-3 py-1">
          <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center border">
            {event.imageUrl ? (
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            ) : null}
            <div style={{ display: event.imageUrl ? 'none' : 'flex' }}>
              <PlaceholderIcon size={40} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm leading-tight max-w-[300px] sm:max-w-md truncate">{event.title}</span>
            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px] sm:max-w-md">
              {event.description}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Categoria",
      cell: (event: any) => (
        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium text-muted-foreground border-border bg-transparent">
          {event.category || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (event: any) => getStatusBadge(event.status),
    },
    {
      header: "Mercados",
      cell: (event: any) => <span className="text-sm">{event.marketsCount || 0}</span>,
    },
    {
      header: "Data",
      cell: (event: any) => (
        <span className="text-sm text-muted-foreground">
          {event.startsAt ? new Date(event.startsAt).toLocaleDateString("pt-BR") : "-"}
        </span>
      ),
    },
    {
      header: "Ações",
      className: "text-right",
      cell: (event: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
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
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
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
            <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie os eventos, adicione descrições e controle status.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
        </div>

        {/* ── Filters ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
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
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="closed">Encerrado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="w-full">
          <DataTable
            data={events}
            columns={columns}
            keyExtractor={(event) => event.id}
            selectable={true}
            selectedIds={selectedEvents}
            onSelectionChange={setSelectedEvents}
            isLoading={loading}
            emptyMessage="Nenhum evento encontrado."
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              totalItems: totalItems,
              itemsPerPage: 20,
              onPageChange: setPage,
            }}
            bulkActions={(selectedIds) => (
              <>
                <Button size="sm" variant="secondary" className="h-8">
                  Exportar ({selectedIds.length})
                </Button>
                <Button size="sm" variant="destructive" className="h-8">
                  Excluir Selecionados
                </Button>
              </>
            )}
          />
        </div>

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
                  <Label>Imagem do Evento</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded border flex items-center justify-center bg-muted overflow-hidden relative group cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.imageUrl ? (
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="h-10 grow"
                    >
                      {isUploading ? "Enviando..." : "Subir arquivo"}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                  {formData.imageUrl && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {formData.imageUrl.split('/').pop()}
                    </p>
                  )}
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
          isLoading={formLoading}
        />
      </div>
    </Suspense>
  );
}
