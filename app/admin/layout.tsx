"use client";

import { Toaster } from "@/components/ui/sonner";
import { AdminAuthProvider } from "@/contexts/admin-auth-context";
import { AdminThemeProvider } from "@/contexts/admin-theme-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminThemeProvider>
        {children}
        <Toaster position="top-right" />
      </AdminThemeProvider>
    </AdminAuthProvider>
  );
}
