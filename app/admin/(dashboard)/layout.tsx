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
  const { admin, isLoading, isAuthenticated, isMfaVerified } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Não está logado, redireciona para login
        router.push("/admin/login");
      } else if (!isMfaVerified) {
        // Está logado mas MFA não verificado, redireciona para MFA
        router.push("/admin/mfa");
      }
    }
  }, [isAuthenticated, isMfaVerified, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Não mostra nada se não estiver autenticado ou MFA não verificado
  if (!isAuthenticated || !isMfaVerified || !admin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
