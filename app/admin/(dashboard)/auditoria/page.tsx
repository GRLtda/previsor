"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataTable,
  ColumnDef,
} from "@/components/shared/data-table";
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
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  User,
  Shield,
  Calendar,
  Globe,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { AuditLog } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";

export default function AdminAuditPage() {
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page?: number; per_page?: number; action?: string } = { page, per_page: 50 };
      if (actionFilter !== "all") params.action = actionFilter;

      const response = await adminApi.getAuditLogs(params);
      setLogs(response.data || []);
      setTotalPages(response.meta?.total_pages || response.meta?.last_page || 1);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionBadge = (action: string) => {
    const variants: Record<string, string> = {
      create: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:border-indigo-900/30 dark:bg-indigo-900/20",
      update: "bg-blue-50 text-blue-600 border-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20",
      delete: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
      login: "bg-muted text-muted-foreground border-border",
      logout: "bg-muted text-muted-foreground border-border",
      approve: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      reject: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
      block: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
      unblock: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${variants[action] || "bg-muted text-muted-foreground border-border"}`}>
        {action}
      </span>
    );
  };

  const getEntityBadge = (entity: string) => {
    return (
      <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        {entity}
      </span>
    );
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      header: "Data/Hora",
      cell: (log: any) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {log.created_at
            ? new Date(log.created_at).toLocaleString("pt-BR")
            : "-"}
        </span>
      ),
    },
    {
      header: "Admin",
      cell: (log: any) => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-3 w-3 text-primary" />
          </div>
          <span className="text-sm font-medium">
            {log.admin?.fullName || log.admin?.email || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Ação",
      cell: (log) => getActionBadge(log.action),
    },
    {
      header: "Entidade",
      cell: (log: any) => getEntityBadge(log.resource_type || "-"),
    },
    {
      header: "Descrição",
      cell: (log: any) => (
        <span className="text-sm max-w-[200px] truncate block" title={log.description}>
          {log.description || "-"}
        </span>
      ),
    },
    {
      header: "IP",
      cell: (log: any) => (
        <span className="font-mono text-xs text-muted-foreground">
          {log.ip_address || "-"}
        </span>
      ),
    },
    {
      header: "Detalhes",
      className: "text-right",
      cell: (log) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setSelectedLog(log)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Logs de atividade administrativa e alterações no sistema.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por usuário ou ação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-9 bg-background"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 bg-background">
              <SelectValue placeholder="Ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas ações</SelectItem>
              <SelectItem value="create">Criar</SelectItem>
              <SelectItem value="update">Atualizar</SelectItem>
              <SelectItem value="delete">Excluir</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="approve">Aprovar</SelectItem>
              <SelectItem value="reject">Rejeitar</SelectItem>
              <SelectItem value="block">Bloquear</SelectItem>
              <SelectItem value="unblock">Desbloquear</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => loadLogs()}>
            <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="w-full">
          <DataTable
            data={logs}
            columns={columns}
            keyExtractor={(log) => log.id}
            isLoading={loading}
            emptyMessage="Nenhum log de auditoria encontrado."
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              onPageChange: setPage,
              itemsPerPage: 50,
            }}
          />
        </div>

        {/* Log Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Registro</DialogTitle>
              <DialogDescription>Informacoes completas do log de auditoria</DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Data/Hora
                    </p>
                    <p className="font-medium">
                      {(selectedLog as any).created_at
                        ? new Date((selectedLog as any).created_at).toLocaleString("pt-BR")
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Administrador
                    </p>
                    <p className="font-medium">
                      {(selectedLog as any).admin?.fullName || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedLog as any).admin?.email || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Acao</p>
                    {getActionBadge(selectedLog.action)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Entidade</p>
                    {getEntityBadge((selectedLog as any).resource_type || "-")}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" /> IP
                    </p>
                    <p className="font-mono text-sm">
                      {(selectedLog as any).ip_address || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">User Agent</p>
                    <p className="text-xs truncate">
                      {(selectedLog as any).user_agent || "-"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Descricao</p>
                  <p>{(selectedLog as any).description || "-"}</p>
                </div>

                {(selectedLog.metadata as any) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Metadados</p>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
