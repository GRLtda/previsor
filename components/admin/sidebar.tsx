"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Shield,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { useAdminAuth } from "@/contexts/admin-auth-context";
import { Logo } from "@/components/ui/logo";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Usuarios",
    icon: Users,
    children: [
      { title: "Lista de Usuarios", href: "/admin/usuarios" },
      { title: "Verificacao KYC", href: "/admin/kyc" },
    ],
  },
  {
    title: "Catalogo",
    icon: Calendar,
    children: [
      { title: "Eventos", href: "/admin/eventos" },
      { title: "Mercados", href: "/admin/mercados" },
    ],
  },
  {
    title: "Posicoes",
    href: "/admin/posicoes",
    icon: TrendingUp,
  },
  {
    title: "Financeiro",
    icon: Wallet,
    children: [
      { title: "Carteiras", href: "/admin/carteiras" },
      { title: "Depositos", href: "/admin/depositos" },
      { title: "Saques", href: "/admin/saques" },
    ],
  },
  {
    title: "Administradores",
    href: "/admin/administradores",
    icon: Shield,
  },
  {
    title: "Auditoria",
    href: "/admin/auditoria",
    icon: FileText,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  return (
    <aside className="w-64 bg-card border-r min-h-screen flex flex-col">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Logo width={120} height={40} />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          if (item.children) {
            const isOpen = openMenus.includes(item.title);
            const isActive = item.children.some((child) =>
              pathname.startsWith(child.href)
            );

            return (
              <Collapsible
                key={item.title}
                open={isOpen || isActive}
                onOpenChange={() => toggleMenu(item.title)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between",
                      isActive && "bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        (isOpen || isActive) && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-7 space-y-1 mt-1">
                  {item.children.map((child) => (
                    <Link key={child.href} href={child.href}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start",
                          pathname === child.href && "bg-primary/10 text-primary"
                        )}
                      >
                        {child.title}
                      </Button>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3",
                  pathname === item.href && "bg-primary/10 text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-4 px-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {admin?.name?.charAt(0) || "A"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{admin?.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">
              {admin?.role || "Administrador"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
