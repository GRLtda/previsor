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
  Shield,
  FileText,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/contexts/admin-auth-context";
import { Logo } from "@/components/ui/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Usuários",
    icon: Users,
    children: [
      { title: "Lista de Usuários", href: "/admin/usuarios" },
      { title: "Verificação KYC", href: "/admin/kyc" },
    ],
  },
  {
    title: "Catálogo",
    icon: Calendar,
    children: [
      { title: "Eventos", href: "/admin/eventos" },
      { title: "Mercados", href: "/admin/mercados" },
    ],
  },
  {
    title: "Posições",
    href: "/admin/posicoes",
    icon: TrendingUp,
  },
  {
    title: "Financeiro",
    icon: Wallet,
    children: [
      { title: "Carteiras", href: "/admin/carteiras" },
      { title: "Depósitos", href: "/admin/depositos" },
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-expand menus based on current path
  useEffect(() => {
    if (!isMounted) return;

    // Only auto-expand if no menus are open (initial load) or checking if current path is buried
    const activeParent = menuItems.find(item =>
      item.children?.some(child => pathname.startsWith(child.href))
    );

    if (activeParent && !openMenus.includes(activeParent.title)) {
      setOpenMenus(prev => [...prev, activeParent.title]);
    }
  }, [pathname, isMounted]);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (!isMounted) return null;

  return (
    <aside className="w-64 bg-card border-r h-full flex flex-col z-20">
      <div className="p-6 border-b bg-card">
        <div className="flex items-center gap-3">
          <Logo width={120} height={38} />
          <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground border">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.children) {
            const isActiveParent = item.children.some((child) =>
              pathname.startsWith(child.href)
            );
            const isOpen = openMenus.includes(item.title);

            return (
              <Collapsible
                key={item.title}
                open={isOpen}
                onOpenChange={() => toggleMenu(item.title)}
                className="space-y-1"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between h-9 px-3 font-normal",
                      isActiveParent
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className={cn(
                        "h-4 w-4",
                        isActiveParent ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span>{item.title}</span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200 opacity-50",
                        isOpen && "rotate-180"
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-1 pb-1">
                  {item.children.map((child) => {
                    const isActiveChild = pathname === child.href;
                    return (
                      <Link key={child.href} href={child.href} className="block pl-10">
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start h-8 px-2 text-sm font-normal",
                            isActiveChild
                              ? "text-primary font-medium bg-primary/10"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                          )}
                        >
                          {child.title}
                        </Button>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="block">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-9 px-3 gap-3 font-normal",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span>{item.title}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t mt-auto">
        <div className="flex items-center gap-3 mb-4 px-1">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
              {getInitials(admin?.fullName || admin?.name || "AD")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {admin?.fullName || admin?.name || "Admin"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {admin?.email}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-muted-foreground hover:text-primary hover:bg-primary/5"
          onClick={logout}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
