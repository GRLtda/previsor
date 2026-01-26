"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  MoreHorizontal,
  Edit,
  Ban,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Key,
} from "lucide-react";
import { adminApi } from "@/lib/api/client";
import type { Admin } from "@/lib/types";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Pagination } from "@/components/shared/pagination";

export default function AdminAdministratorsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      name: admin.name,
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
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      super_admin: "default",
      admin: "secondary",
      support: "outline",
    };
    const labels: Record<string, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      support: "Suporte",
    };
    return <Badge variant={variants[role] || "outline"}>{labels[role] || role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === "active" ? "default" : "destructive"}>
        {status === "active" ? "Ativo" : "Bloqueado"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Administradores</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Admin
        </Button>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Administrador</TableHead>
                    <TableHead>Funcao</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MFA</TableHead>
                    <TableHead>Ultimo Acesso</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum administrador encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{admin.name}</p>
                              <p className="text-sm text-muted-foreground">{admin.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(admin.role)}</TableCell>
                        <TableCell>{getStatusBadge(admin.status)}</TableCell>
                        <TableCell>
                          <Badge variant={admin.mfaEnabled ? "default" : "outline"}>
                            {admin.mfaEnabled ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {admin.lastLoginAt
                            ? new Date(admin.lastLoginAt).toLocaleDateString("pt-BR")
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                isLoading={loading}
              />
            </>
          )}
        </CardContent>
      </Card>

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
