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
import { useRouter } from "next/navigation";
import Loading from "./loading";
import { PlaceholderIcon } from "@/components/ui/placeholder-icon";
import { DataTable, ColumnDef } from "@/components/shared/data-table";
import { EventModal } from "./components/EventModal";

// ── Helpers & UI Components moved to EventModal ─────────────────────────

export default function AdminEventsPage() {
  const router = useRouter();
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
    setEditEvent(event);
  };

  const openCreateDialog = () => {
    setShowCreateDialog(true);
  };

  const closeDialog = () => {
    setShowCreateDialog(false);
    setEditEvent(null);
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
            onRowClick={(event) => router.push(`/admin/eventos/${event.id}`)}
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

        {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
        <EventModal
          isOpen={showCreateDialog || !!editEvent}
          onClose={closeDialog}
          eventToEdit={editEvent}
          categories={categories}
          onSaved={() => loadEvents()}
        />

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
