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
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Loader2,
  Camera,
  X,
} from "lucide-react";
import { adminApi, ApiClientError } from "@/lib/api/client";
import type { Event } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";
import { Suspense } from "react";
import Loading from "./loading";
import { PlaceholderIcon } from "@/components/ui/placeholder-icon";
import { DataTable, ColumnDef } from "@/components/shared/data-table";

// ── Helpers ───────────────────────────────────────────────────────────────────

function localDateStr(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStr() {
  return localDateStr(new Date());
}

function addDays(base: string, days: number) {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + days);
  return localDateStr(d);
}

function addMonths(base: string, months: number) {
  const d = new Date(base + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return localDateStr(d);
}

const PERIOD_PILLS = [
  { label: "3 dias", fn: (s: string) => addDays(s, 3) },
  { label: "7 dias", fn: (s: string) => addDays(s, 7) },
  { label: "1 mês", fn: (s: string) => addMonths(s, 1) },
  { label: "3 meses", fn: (s: string) => addMonths(s, 3) },
  { label: "6 meses", fn: (s: string) => addMonths(s, 6) },
];

// ── Image Hero ────────────────────────────────────────────────────────────────

interface ImageHeroProps {
  imageUrl: string;
  isUploading: boolean;
  onClick: () => void;
  onClear?: () => void;
}

function ImageHero({ imageUrl, isUploading, onClick, onClear }: ImageHeroProps) {
  return (
    <div
      className="relative w-full h-44 rounded-xl overflow-hidden cursor-pointer group border border-border bg-muted/40"
      onClick={!isUploading ? onClick : undefined}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Imagem do evento"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {/* overlay on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/90 text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
              <Camera className="h-3.5 w-3.5" />
              Trocar foto
            </div>
          </div>
          {/* clear button */}
          {onClear && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground select-none">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted border border-border">
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </div>
          <span className="text-xs font-medium">
            {isUploading ? "Enviando imagem…" : "Clique para adicionar foto"}
          </span>
          <span className="text-[11px] text-muted-foreground/70">PNG, JPG ou WEBP</span>
        </div>
      )}

      {/* uploading overlay on existing image */}
      {isUploading && imageUrl && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<import("@/lib/types").Category[]>([]);
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
  // pendingFile: file selected but not yet uploaded — only sent on submit
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = todayStr();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    imageUrl: "",
    startDate: today,
    endDate: addMonths(today, 1),
    resolveRules: "",
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string; limit?: number; offset?: number } = {
        limit: 20,
        offset: (page - 1) * 20,
      };
      if (statusFilter !== "all") params.status = statusFilter;

      const { userApi } = await import("@/lib/api/client");
      const response = await userApi.getEvents(params);
      setEvents(response.events || []);
      setTotalPages(Math.ceil((response.totalCount || 0) / 20));
      setTotalItems(response.totalCount || 0);

      const catResponse = await userApi.getCategories();
      if (catResponse.success && catResponse.data) {
        setCategories(catResponse.data.categories || []);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Upload the pending file and return the resulting URL (or existing imageUrl)
  const uploadPendingFile = async (): Promise<string | undefined> => {
    if (!pendingFile) return formData.imageUrl || undefined;
    const fileToUpload = pendingFile.size > 5 * 1024 * 1024
      ? await compressImage(pendingFile)
      : pendingFile;
    const fd = new FormData();
    fd.append("file", fileToUpload, pendingFile.name);
    const res = await adminApi.uploadEventImage(fd);
    return res.data.imageUrl;
  };

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      const uploadedUrl = await uploadPendingFile();
      const createRes = await adminApi.createEvent({
        title: formData.title,
        slug: formData.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-"),
        description: formData.description,
        category: formData.category,
        startsAt: formData.startDate ? new Date(formData.startDate + "T00:00").toISOString() : new Date().toISOString(),
        endsAt: formData.endDate ? new Date(formData.endDate + "T23:59").toISOString() : new Date().toISOString(),
        resolveRules: formData.resolveRules,
        sourceUrls: [],
      });
      if (uploadedUrl && createRes.data?.id) {
        await adminApi.updateEvent(createRes.data.id, { imageUrl: uploadedUrl });
      }
      loadEvents();
      setShowCreateDialog(false);
      resetForm();
      toast.success("Evento criado com sucesso!");
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof ApiClientError) toast.error(error.message);
      else toast.error("Erro ao criar evento");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editEvent) return;
    setFormLoading(true);
    try {
      const uploadedUrl = await uploadPendingFile();
      await adminApi.updateEvent(editEvent.id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        imageUrl: uploadedUrl || undefined,
        startsAt: formData.startDate ? new Date(formData.startDate + "T00:00").toISOString() : undefined,
        endsAt: formData.endDate ? new Date(formData.endDate + "T23:59").toISOString() : undefined,
        resolveRules: formData.resolveRules,
      });
      loadEvents();
      setEditEvent(null);
      resetForm();
      toast.success("Evento atualizado!");
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof ApiClientError) toast.error(error.message);
      else toast.error("Erro ao salvar evento");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEvent) return;
    setFormLoading(true);
    try {
      const response = await adminApi.cancelEvent(deleteEvent.id);
      if (response.success) {
        toast.success(
          `Evento cancelado! ${response.data.cancelledMarketsCount} mercados cancelados e R$ ${(response.data.totalRefunded / 100).toFixed(2)} estornados.`
        );
        loadEvents();
        setDeleteEvent(null);
      }
    } catch (error) {
      console.error("Error:", error);
      if (error instanceof ApiClientError) toast.error(error.message);
      else toast.error("Erro ao cancelar evento");
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
      startDate: event.startsAt ? localDateStr(new Date(event.startsAt)) : today,
      endDate: event.endsAt ? localDateStr(new Date(event.endsAt)) : addMonths(today, 1),
      resolveRules: event.resolveRules || "",
    });
    setPendingFile(null);
    setPreviewUrl(event.imageUrl || "");
    setEditEvent(event);
  };

  const openCreateDialog = () => {
    const t = todayStr();
    setFormData({
      title: "",
      description: "",
      category: "",
      imageUrl: "",
      startDate: t,
      endDate: addMonths(t, 1),
      resolveRules: "",
    });
    setPendingFile(null);
    setPreviewUrl("");
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    const t = todayStr();
    setFormData({
      title: "",
      description: "",
      category: "",
      imageUrl: "",
      startDate: t,
      endDate: addMonths(t, 1),
      resolveRules: "",
    });
    // Revoke object URL to avoid memory leaks
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl("");
  };

  const closeDialog = () => {
    setShowCreateDialog(false);
    setEditEvent(null);
    resetForm();
  };

  // ── Image upload ───────────────────────────────────────────────────────────

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
            if (width > height) { height = (height / width) * maxDim; width = maxDim; }
            else { width = (width / height) * maxDim; height = maxDim; }
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => { if (blob) resolve(blob); else reject(new Error("Canvas compression failed")); },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Revoke previous blob URL if any
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const localUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setPreviewUrl(localUrl);
    // Clear form imageUrl so we always use previewUrl as the display source
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Quick-pick period ──────────────────────────────────────────────────────

  const applyPeriod = (fn: (s: string) => string) => {
    setFormData((prev) => ({ ...prev, endDate: fn(prev.startDate || todayStr()) }));
  };

  // ── Status badge ───────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      draft: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
      closed: "bg-muted text-muted-foreground border-border",
      cancelled: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
    };
    const labels: Record<string, string> = { active: "Ativo", draft: "Rascunho", closed: "Encerrado", cancelled: "Cancelado" };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[status] || status}
      </span>
    );
  };

  // ── Table columns ──────────────────────────────────────────────────────────

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
                  e.currentTarget.style.display = "none";
                  const ph = e.currentTarget.nextElementSibling as HTMLElement;
                  if (ph) ph.style.display = "flex";
                }}
              />
            ) : null}
            <div style={{ display: event.imageUrl ? "none" : "flex" }}>
              <PlaceholderIcon size={40} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm leading-tight max-w-[300px] sm:max-w-md truncate">{event.title}</span>
            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[300px] sm:max-w-md">{event.description}</span>
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
    { header: "Status", cell: (event: any) => getStatusBadge(event.status) },
    { header: "Mercados", cell: (event: any) => <span className="text-sm">{event.marketsCount || 0}</span> },
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
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const isDialogOpen = showCreateDialog || !!editEvent;

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie os eventos, adicione descrições e controle status.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
        </div>

        {/* Filters */}
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

        {/* Table */}
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

        {/* ── Create / Edit Dialog ──────────────────────────────────────────── */}
        <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl gap-0">
            {/* Image hero — no padding, full width */}
            <div className="px-6 pt-6 pb-0">
              <ImageHero
                imageUrl={previewUrl}
                isUploading={false}
                onClick={() => fileInputRef.current?.click()}
                onClear={previewUrl ? () => {
                  if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl("");
                  setPendingFile(null);
                  setFormData((p) => ({ ...p, imageUrl: "" }));
                } : undefined}
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Header */}
            <DialogHeader className="px-6 pt-4 pb-0">
              <DialogTitle className="text-lg font-semibold">
                {editEvent ? "Editar Evento" : "Novo Evento"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {editEvent ? "Edite as informações do evento." : "Preencha as informações do novo evento."}
              </DialogDescription>
            </DialogHeader>

            {/* Form body */}
            <div className="px-6 py-4 space-y-4">
              {/* Título */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Eleições 2026"
                  className="rounded-lg"
                />
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o evento..."
                  rows={2}
                  className="rounded-lg resize-none"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-sm font-medium">Data de Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-sm font-medium">Data de Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="rounded-lg"
                  />
                </div>
              </div>

              {/* Quick-pick pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium mr-0.5">Duração:</span>
                {PERIOD_PILLS.map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => applyPeriod(pill.fn)}
                    className="px-2.5 py-1 rounded-full border border-border text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Regras */}
              <div className="space-y-1.5">
                <Label htmlFor="resolveRules" className="text-sm font-medium">Regras e Resolução</Label>
                <Textarea
                  id="resolveRules"
                  value={formData.resolveRules}
                  onChange={(e) => setFormData({ ...formData, resolveRules: e.target.value })}
                  placeholder="Descreva as regras para resolução dos mercados deste evento..."
                  rows={2}
                  className="rounded-lg resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
              <Button variant="outline" onClick={closeDialog} className="rounded-lg">
                Cancelar
              </Button>
              <Button
                onClick={editEvent ? handleUpdate : handleCreate}
                disabled={formLoading || !formData.title}
                className="rounded-lg min-w-[90px]"
              >
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editEvent ? "Salvar" : "Criar Evento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel confirm */}
        <ConfirmDialog
          open={!!deleteEvent}
          onOpenChange={() => setDeleteEvent(null)}
          title="Cancelar Evento"
          description={`Tem certeza que deseja cancelar o evento "${deleteEvent?.title}"? Todos os mercados associados serão cancelados e os valores investidos serão devolvidos 100% aos usuários. Esta ação não pode ser desfeita.`}
          confirmText="Confirmar Cancelamento"
          variant="destructive"
          onConfirm={handleDelete}
          isLoading={formLoading}
        />
      </div>
    </Suspense>
  );
}
