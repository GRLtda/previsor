"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  MoreHorizontal,
  Edit,
  Ban,
  CheckCircle,
  Loader2,
  Shield,
  Key,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { Admin } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function AdminAdministratorsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
  const [actionAdmin, setActionAdmin] = useState<Admin | null>(null);
  const [actionType, setActionType] = useState<"block" | "unblock" | "resetMfa" | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAdministrators({ page, per_page: 20 });
      setAdmins(response.data.map((admin: any) => ({
        id: admin.id,
        email: admin.email,
        name: admin.fullName,
        role: admin.role,
        status: admin.status,
        mfaEnabled: admin.mfaEnabled,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      })) as any);
      setTotalPages(response.meta?.total_pages || 1);
    } catch (error) {
      console.error("Error loading admins:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      // TODO: Adicionar endpoint de criar admin na API
      loadAdmins();
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editAdmin) return;
    setFormLoading(true);
    try {
      // TODO: Adicionar endpoint de update admin na API
      loadAdmins();
      setEditAdmin(null);
      resetForm();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionAdmin || !actionType) return;
    setFormLoading(true);
    try {
      // TODO: Adicionar endpoints de block/unblock/resetMfa admin na API
      loadAdmins();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setFormLoading(false);
      setActionAdmin(null);
      setActionType(null);
    }
  };

  const openEditDialog = (admin: Admin) => {
    setFormData({
      name: admin.name || "",
      email: admin.email,
      password: "",
      role: admin.role,
    });
    setEditAdmin(admin);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "admin",
    });
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      super_admin: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:border-indigo-900/30 dark:bg-indigo-900/20",
      admin: "bg-blue-50 text-blue-600 border-blue-100 dark:border-blue-900/30 dark:bg-blue-900/20",
      support: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20",
    };
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      support: "Suporte",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${variants[role] || "bg-muted text-muted-foreground border-border"}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status === "active"
        ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20"
        : "bg-rose-50 text-rose-600 border-rose-100 dark:border-rose-900/30 dark:bg-rose-900/20"
        }`}>
        {status === "active" ? "Ativo" : "Bloqueado"}
      </span>
    );
  };

  const columns: ColumnDef<Admin>[] = [
    {
      header: "Administrador",
      cell: (admin) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm leading-tight">{admin.name || "Administrador"}</span>
            <span className="text-xs text-muted-foreground line-clamp-1">{admin.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Função",
      cell: (admin) => getRoleBadge(admin.role),
    },
    {
      header: "Status",
      cell: (admin) => getStatusBadge(admin.status || "active"),
    },
    {
      header: "MFA",
      cell: (admin) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${admin.mfaEnabled
          ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-900/20"
          : "bg-muted text-muted-foreground border-border"
          }`}>
          {admin.mfaEnabled ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      header: "Último Acesso",
      cell: (admin) => (
        <span className="text-sm text-muted-foreground">
          {admin.lastLoginAt
            ? new Date(admin.lastLoginAt).toLocaleDateString("pt-BR")
            : "-"}
        </span>
      ),
    },
    {
      header: "Ações",
      className: "text-right",
      cell: (admin) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEditDialog(admin)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {admin.mfaEnabled && (
              <DropdownMenuItem
                onClick={() => {
                  setActionAdmin(admin);
                  setActionType("resetMfa");
                }}
              >
                <Key className="mr-2 h-4 w-4" />
                Resetar MFA
              </DropdownMenuItem>
            )}
            {admin.status === "active" ? (
              <DropdownMenuItem
                onClick={() => {
                  setActionAdmin(admin);
                  setActionType("block");
                }}
                className="text-destructive"
              >
                <Ban className="mr-2 h-4 w-4" />
                Bloquear
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => {
                  setActionAdmin(admin);
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
          <h1 className="text-2xl font-bold tracking-tight">Administradores</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os acessos administrativos e permissões da plataforma.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="h-9">
          <Plus className="mr-2 h-4 w-4" />
          Novo Admin
        </Button>
      </div>

      <div className="w-full">
        <DataTable
          data={admins}
          columns={columns}
          keyExtractor={(admin) => admin.id}
          selectable={true}
          selectedIds={selectedAdmins}
          onSelectionChange={setSelectedAdmins}
          isLoading={loading}
          emptyMessage="Nenhum administrador encontrado."
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            onPageChange: setPage,
            itemsPerPage: 20,
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editAdmin}
        onOpenChange={() => {
          setShowCreateDialog(false);
          setEditAdmin(null);
          resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editAdmin ? "Editar Administrador" : "Novo Administrador"}
            </DialogTitle>
            <DialogDescription>
              {editAdmin
                ? "Edite as informacoes do administrador"
                : "Preencha as informacoes do novo administrador"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            {!editAdmin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Senha forte"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Funcao</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a funcao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditAdmin(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={editAdmin ? handleUpdate : handleCreate}
              disabled={
                formLoading ||
                !formData.name ||
                (!editAdmin && (!formData.email || !formData.password))
              }
            >
              {formLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editAdmin ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!actionAdmin && !!actionType}
        onOpenChange={() => {
          setActionAdmin(null);
          setActionType(null);
        }}
        title={
          actionType === "block"
            ? "Bloquear Administrador"
            : actionType === "unblock"
              ? "Desbloquear Administrador"
              : "Resetar MFA"
        }
        description={
          actionType === "block"
            ? `Tem certeza que deseja bloquear ${actionAdmin?.name}?`
            : actionType === "unblock"
              ? `Tem certeza que deseja desbloquear ${actionAdmin?.name}?`
              : `Tem certeza que deseja resetar o MFA de ${actionAdmin?.name}? Ele precisara configurar novamente.`
        }
        confirmText={
          actionType === "block"
            ? "Bloquear"
            : actionType === "unblock"
              ? "Desbloquear"
              : "Resetar"
        }
        variant={actionType === "block" ? "destructive" : "default"}
        onConfirm={handleAction}
        isLoading={formLoading}
      />
    </div>
  );
}
