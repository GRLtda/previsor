"use client";

import { Toaster } from "@/components/ui/sonner";
import { AdminAuthProvider } from "@/contexts/admin-auth-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      {children}
      <Toaster position="top-right" />
    </AdminAuthProvider>
  );
}
