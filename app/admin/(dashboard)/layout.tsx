"use client";

import React from "react"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useAdminAuth } from "@/contexts/admin-auth-context";
import { Loader2 } from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin, isLoading, isAuthenticated, isMfaVerified, mfaRequired } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && admin) {
      if (!isAuthenticated) {
        // Não está logado, redireciona para login
        router.push("/admin/login");
      } else if (!admin.mfaEnabled) {
        // Admin não tem MFA configurado, redireciona para setup
        router.push("/admin/mfa/setup");
      } else if (mfaRequired && !isMfaVerified) {
        // Está logado, MFA é requerido mas não verificado, redireciona para MFA
        router.push("/admin/mfa");
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isMfaVerified, mfaRequired, isLoading, router, admin]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não mostra nada se não estiver autenticado, MFA não configurado, ou MFA pendente
  const mfaPending = mfaRequired && !isMfaVerified;
  const mfaNotConfigured = admin && !admin.mfaEnabled;
  if (!isAuthenticated || mfaPending || mfaNotConfigured || !admin) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
