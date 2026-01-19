import React from "react"
import { AuthGuard } from "./auth-guard"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
