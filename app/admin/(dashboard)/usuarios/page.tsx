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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { User } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable, ColumnDef } from "@/components/shared/data-table";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<import("@/lib/types").AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [kycFilter, setKycFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionUser, setActionUser] = useState<import("@/lib/types").AdminUser | null>(null);
  const [actionType, setActionType] = useState<"block" | "unblock" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const searchParams = useSearchParams();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        page?: number;
        per_page?: number;
        search?: string;
        status?: string;
        kyc_status?: string;
      } = { page, per_page: 20 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (kycFilter !== "all") params.kyc_status = kycFilter;

      const response = await adminApi.getUsers(params);
      setUsers(response.data || []);
      setTotalPages(response.meta?.total_pages || response.meta?.last_page || 1);
      setTotalItems(response.meta?.total || 0);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, kycFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleAction = async () => {
    if (!actionUser || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "block") {
        await adminApi.updateUserStatus(actionUser.id, "blocked", "Bloqueado pelo administrador");
      } else {
        await adminApi.updateUserStatus(actionUser.id, "active", "Desbloqueado pelo administrador");
      }
      loadUsers();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setActionLoading(false);
      setActionUser(null);
      setActionType(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      blocked: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
      pending: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      blocked: "Bloqueado",
      pending: "Pendente",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getKycBadge = (status: string) => {
    const variants: Record<string, string> = {
      approved: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
      pending: "bg-amber-50 text-amber-600 border-amber-100 dark:border-amber-900/30 dark:bg-amber-900/20",
      rejected: "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20",
      not_submitted: "bg-slate-50 text-slate-600 border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400",
    };
    const labels: Record<string, string> = {
      approved: "Aprovado",
      pending: "Pendente",
      rejected: "Rejeitado",
      not_submitted: "Não enviado",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[status] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const columns: ColumnDef<import("@/lib/types").AdminUser>[] = [
    {
      header: "Usuário",
      accessorKey: "email",
      cell: (user: any) => (
        <div className="flex items-center gap-3 py-1">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-muted flex items-center justify-center border text-xs font-semibold text-muted-foreground">
            {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm leading-tight">{user.full_name || "Usuário"}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "CPF",
      cell: (user: any) => <span className="text-sm text-muted-foreground">{user.cpf || "-"}</span>,
    },
    {
      header: "Status",
      cell: (user: any) => getStatusBadge(user.status),
    },
    {
      header: "KYC",
      cell: (user: any) => getKycBadge(user.kyc_status),
    },
    {
      header: "Cadastro",
      cell: (user: any) => (
        <span className="text-sm text-muted-foreground">
          {user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "-"}
        </span>
      ),
    },
    {
      header: "Ações",
      className: "text-right",
      cell: (user: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/usuarios/${user.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalhes
              </Link>
            </DropdownMenuItem>
            {user.status === "active" ? (
              <DropdownMenuItem
                onClick={() => {
                  setActionUser(user);
                  setActionType("block");
                }}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Ban className="mr-2 h-4 w-4" />
                Bloquear
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => {
                  setActionUser(user);
                  setActionType("unblock");
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Desbloquear
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os usuários cadastrados e seus status na plataforma.
          </p>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
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
              <SelectItem value="blocked">Bloqueado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={kycFilter} onValueChange={setKycFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-background">
              <SelectValue placeholder="KYC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo KYC</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
              <SelectItem value="not_submitted">Não enviado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full">
        <DataTable
          data={users}
          columns={columns}
          keyExtractor={(user) => user.id}
          selectable={true}
          selectedIds={selectedUsers}
          onSelectionChange={setSelectedUsers}
          isLoading={loading}
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
                Bloquear Selecionados
              </Button>
            </>
          )}
        />
      </div>

      <ConfirmDialog
        open={!!actionUser && !!actionType}
        onOpenChange={() => {
          setActionUser(null);
          setActionType(null);
        }}
        title={actionType === "block" ? "Bloquear Usuario" : "Desbloquear Usuario"}
        description={
          actionType === "block"
            ? `Tem certeza que deseja bloquear o usuario ${(actionUser as any)?.full_name || actionUser?.email}? Ele nao podera acessar a plataforma.`
            : `Tem certeza que deseja desbloquear o usuario ${(actionUser as any)?.full_name || actionUser?.email}?`
        }
        confirmText={actionType === "block" ? "Bloquear" : "Desbloquear"}
        variant={actionType === "block" ? "destructive" : "default"}
        onConfirm={handleAction}
        isLoading={actionLoading}
      />
    </div>
  );
}
