"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Camera,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";
import { adminApi, ApiClientError } from "@/lib/api/client";
import type { Market, Event } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";
import { Suspense } from "react";

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

function toDatetimeLocal(dateStr: string) {
  if (!dateStr) return "";
  // accepts ISO or date-only
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
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
}

const PERIOD_PILLS = [
  { label: "3 dias", fn: (s: string) => addDays(s, 3) },
  { label: "7 dias", fn: (s: string) => addDays(s, 7) },
  { label: "1 mês", fn: (s: string) => addMonths(s, 1) },
  { label: "3 meses", fn: (s: string) => addMonths(s, 3) },
  { label: "6 meses", fn: (s: string) => addMonths(s, 6) },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketDraft {
  statement: string;
}

function defaultDraft(): MarketDraft {
  return { statement: "" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Loading() { return null; }

// Image hero (same component pattern as in eventos)
interface ImageHeroSmProps {
  imageUrl: string;
  isUploading: boolean;
  onClick: () => void;
  onClear?: () => void;
}

function ImageHeroSm({ imageUrl, isUploading, onClick, onClear }: ImageHeroSmProps) {
  return (
    <div
      className="relative w-full h-36 rounded-xl overflow-hidden cursor-pointer group border border-border bg-muted/40"
      onClick={!isUploading ? onClick : undefined}
    >
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Imagem do mercado"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-1.5 bg-white/90 text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow">
              <Camera className="h-3.5 w-3.5" />
              Trocar foto
            </div>
          </div>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </div>
          <span className="text-xs font-medium">
            {isUploading ? "Enviando…" : "Clique para adicionar foto"}
          </span>
        </div>
      )}
      {isUploading && imageUrl && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

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
  // pendingFile: stored locally, only uploaded on submit
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // imageUrl = confirmed server URL (e.g. from event image suggestion)
  // previewUrl = local blob preview OR confirmed server URL shown in hero

  // Form state
  const [eventId, setEventId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [drafts, setDrafts] = useState<MarketDraft[]>([defaultDraft()]);

  // Derived: selected event object (for image suggestion + date default)
  const selectedEvent = events.find((e) => e.id === eventId) ?? null;

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    try {
      const { userApi } = await import("@/lib/api/client");
      const eventsRes = await userApi.getEvents({ status: "active", limit: 100 });
      setEvents(eventsRes.events || []);

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

      const filtered = statusFilter === "all" ? allMarkets : allMarkets.filter((m) => m.status === statusFilter);
      setMarkets(filtered);
      setTotalPages(1);
      setTotalItems(filtered.length);
    } catch (error) {
      console.error("Error loading markets:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadMarkets(); }, [loadMarkets]);

  // ── When event changes, pre-fill closing date from event end ──────────────
  useEffect(() => {
    if (selectedEvent?.endsAt) {
      setClosingDate(toDatetimeLocal(selectedEvent.endsAt));
    } else if (!closingDate) {
      const def = addMonths(todayStr(), 1);
      setClosingDate(`${def}T23:59`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // ── Open dialog with defaults ──────────────────────────────────────────────
  const openCreateDialog = () => {
    setEventId("");
    setImageUrl("");
    const def = addMonths(todayStr(), 1);
    setClosingDate(`${def}T23:59`);
    setDrafts([defaultDraft()]);
    setShowCreateDialog(true);
  };

  const resetForm = () => {
    setEventId("");
    setImageUrl("");
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setPendingFile(null);
    const def = addMonths(todayStr(), 1);
    setClosingDate(`${def}T23:59`);
    setDrafts([defaultDraft()]);
  };

  // ── Bulk create ────────────────────────────────────────────────────────────

  // Upload pending file and return server URL (or imageUrl if already set)
  const uploadPendingFile = async (): Promise<string | undefined> => {
    if (!pendingFile) return imageUrl || undefined;
    const fileToUpload = pendingFile.size > 5 * 1024 * 1024
      ? await compressImage(pendingFile)
      : pendingFile;
    const fd = new FormData();
    fd.append("file", fileToUpload, pendingFile.name);
    const res = await adminApi.uploadEventImage(fd);
    return res.data.imageUrl;
  };

  const handleCreate = async () => {
    const validDrafts = drafts.filter((d) => d.statement.trim());
    if (!eventId) { toast.error("Selecione um evento"); return; }
    if (!validDrafts.length) { toast.error("Adicione pelo menos uma afirmação"); return; }
    const shortDrafts = validDrafts.filter((d) => d.statement.trim().length < 5);
    if (shortDrafts.length > 0) {
      toast.error(`As afirmações precisam ter pelo menos 5 caracteres`);
      return;
    }
    setFormLoading(true);
    let created = 0;
    let failed = 0;
    try {
      // Upload image once before creating all markets
      const uploadedImageUrl = await uploadPendingFile();
      for (const draft of validDrafts) {
        try {
          await adminApi.createMarket({
            eventId,
            statement: draft.statement,
            opensAt: new Date().toISOString(),
            closesAt: closingDate ? new Date(closingDate).toISOString() : new Date(closingDate).toISOString(),
            resolvesAt: closingDate ? new Date(closingDate).toISOString() : new Date(closingDate).toISOString(),
            ...(uploadedImageUrl ? { imageUrl: uploadedImageUrl } : {}),
          });
          created++;
        } catch {
          failed++;
        }
      }
      if (created > 0) toast.success(`${created} mercado${created > 1 ? "s" : ""} criado${created > 1 ? "s" : ""}!`);
      if (failed > 0) toast.error(`${failed} mercado${failed > 1 ? "s" : ""} falhou`);
      loadMarkets();
      setShowCreateDialog(false);
      resetForm();
    } finally {
      setFormLoading(false);
    }
  };

  // ── Draft management ───────────────────────────────────────────────────────
  const addDraft = () => setDrafts((prev) => [...prev, defaultDraft()]);
  const removeDraft = (i: number) => setDrafts((prev) => prev.filter((_, idx) => idx !== i));
  const updateDraft = (i: number, value: string) =>
    setDrafts((prev) => prev.map((d, idx) => (idx === i ? { statement: value } : d)));

  // ── Image file selection (deferred — no upload yet) ────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    const localUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setPreviewUrl(localUrl);
    // Clear the confirmed imageUrl so hero shows the local preview
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Quick-pick period ──────────────────────────────────────────────────────
  const applyPeriod = (fn: (s: string) => string) => {
    const base = closingDate ? closingDate.split("T")[0] : todayStr();
    const newDate = fn(base);
    setClosingDate(`${newDate}T23:59`);
  };

  // ── Resolve / cancel ───────────────────────────────────────────────────────
  const handleResolve = async () => {
    if (!resolveMarket || !selectedOption) return;
    setFormLoading(true);
    try {
      const result = selectedOption === "yes" ? "YES" : "NO";
      await adminApi.resolveMarket(resolveMarket.id, result);
      toast.success("Mercado resolvido!");
      loadMarkets();
      setResolveMarket(null);
      setSelectedOption("");
    } catch {
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
    } catch {
      toast.error("Erro ao cancelar mercado");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Status badge ───────────────────────────────────────────────────────────
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      closed: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
      resolved: "bg-blue-50 text-blue-600 border-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20",
      cancelled: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
    };
    const labels: Record<string, string> = { open: "Aberto", closed: "Fechado", resolved: "Resolvido", cancelled: "Cancelado" };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);

  // ── Table columns ──────────────────────────────────────────────────────────
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
    { header: "Status", cell: (market: any) => getStatusBadge(market.status) },
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

  // ── Render ─────────────────────────────────────────────────────────────────

  const canCreate = drafts.some((d) => d.statement.trim()) && !!eventId;

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mercados</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie os mercados de previsão, acompanhe volumes e resolva resultados.
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Mercado
          </Button>
        </div>

        {/* Filters */}
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

        {/* Table */}
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
              itemsPerPage: 20,
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

        {/* ── Create Dialog ─────────────────────────────────────────────────── */}
        <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); resetForm(); } }}>
          <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl gap-0 max-h-[90vh] overflow-y-auto">
            {/* Image hero */}
            <div className="px-6 pt-6 pb-0">
              <ImageHeroSm
                imageUrl={previewUrl || imageUrl}
                isUploading={false}
                onClick={() => fileInputRef.current?.click()}
                onClear={previewUrl || imageUrl ? () => {
                  if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl("");
                  setPendingFile(null);
                  setImageUrl("");
                } : undefined}
              />
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {/* Suggestion: use event image */}
              {selectedEvent?.imageUrl && selectedEvent.imageUrl !== imageUrl && !previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    // It's a confirmed server URL — no need to upload again
                    setImageUrl(selectedEvent.imageUrl!);
                    setPendingFile(null);
                    if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
                    setPreviewUrl(selectedEvent.imageUrl!);
                  }}
                  className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                >
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    className="h-8 w-8 rounded-md object-cover border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground leading-none mb-0.5 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Sugestão
                    </p>
                    <p className="text-xs text-foreground truncate">Usar foto do evento</p>
                  </div>
                </button>
              )}
            </div>

            {/* Header */}
            <DialogHeader className="px-6 pt-4 pb-0">
              <DialogTitle className="text-lg font-semibold">Novo Mercado</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Crie um ou mais mercados de previsão rapidamente.
              </DialogDescription>
            </DialogHeader>

            {/* Form body */}
            <div className="px-6 py-4 space-y-4">
              {/* Evento */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Evento</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger className="rounded-lg">
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

              {/* Data de encerramento */}
              <div className="space-y-1.5">
                <Label htmlFor="closingDate" className="text-sm font-medium">Data de Encerramento</Label>
                <Input
                  id="closingDate"
                  type="datetime-local"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="rounded-lg"
                />
                {/* Period pills */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium mr-0.5">Rápido:</span>
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
              </div>

              {/* Mercados (bulk) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Mercados
                    {drafts.length > 1 && (
                      <span className="ml-1.5 text-[11px] text-muted-foreground font-normal">
                        ({drafts.length} mercados)
                      </span>
                    )}
                  </Label>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                  {drafts.map((draft, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {drafts.length > 1 && (
                        <span className="flex h-8 w-6 items-center justify-center text-[11px] text-muted-foreground font-medium shrink-0 pt-1">
                          {i + 1}.
                        </span>
                      )}
                      <div className="flex-1 space-y-0.5">
                        <Input
                          value={draft.statement}
                          onChange={(e) => updateDraft(i, e.target.value)}
                          placeholder={i === 0 ? "Ex: Lula será reeleito em 2026?" : "Outro mercado..."}
                          className={`rounded-lg flex-1 ${draft.statement.trim().length > 0 && draft.statement.trim().length < 5 ? "border-destructive" : ""}`}
                        />
                        {draft.statement.trim().length > 0 && draft.statement.trim().length < 5 && (
                          <p className="text-[11px] text-destructive pl-1">Mínimo de 5 caracteres</p>
                        )}
                      </div>
                      {drafts.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeDraft(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addDraft}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors mt-1 pl-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar outro mercado
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border bg-muted/20">
              <span className="text-xs text-muted-foreground">
                {drafts.filter((d) => d.statement.trim()).length} de {drafts.length} mercado{drafts.length !== 1 ? "s" : ""} preenchido{drafts.length !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }} className="rounded-lg">
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={formLoading || !canCreate}
                  className="rounded-lg min-w-[90px]"
                >
                  {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {drafts.filter((d) => d.statement.trim()).length > 1
                    ? `Criar ${drafts.filter((d) => d.statement.trim()).length} Mercados`
                    : "Criar Mercado"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Resolve Dialog ────────────────────────────────────────────────── */}
        <Dialog open={!!resolveMarket} onOpenChange={() => setResolveMarket(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Resolver Mercado</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground line-clamp-2">
                &ldquo;{resolveMarket?.statement}&rdquo;
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label className="text-sm font-medium">Opção Vencedora</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedOption === "yes" ? "default" : "outline"}
                  className="rounded-lg"
                  onClick={() => setSelectedOption("yes")}
                >
                  ✅ Sim
                </Button>
                <Button
                  variant={selectedOption === "no" ? "default" : "outline"}
                  className="rounded-lg"
                  onClick={() => setSelectedOption("no")}
                >
                  ❌ Não
                </Button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setResolveMarket(null)} className="flex-1 rounded-lg">
                Cancelar
              </Button>
              <Button onClick={handleResolve} disabled={formLoading || !selectedOption} className="flex-1 rounded-lg">
                {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resolver
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel confirm */}
        <ConfirmDialog
          open={!!cancelMarket}
          onOpenChange={() => setCancelMarket(null)}
          title="Cancelar Mercado"
          description={`Tem certeza que deseja cancelar o mercado "${cancelMarket?.statement}"? Todos os valores investidos serão devolvidos 100% aos usuários. Esta ação não pode ser desfeita.`}
          confirmText="Confirmar Cancelamento"
          variant="destructive"
          onConfirm={handleCancelMarket}
          isLoading={formLoading}
        />
      </div>
    </Suspense>
  );
}
