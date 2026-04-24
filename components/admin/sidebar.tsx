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
  Settings,
  Moon,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/contexts/admin-auth-context";
import { useAdminTheme } from "@/contexts/admin-theme-context";
import { Logo } from "@/components/ui/logo";
import { AnimatePresence, motion } from "framer-motion";

interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { title: string; href: string }[];
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    label: "Menu Principal",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Usuarios",
        icon: Users,
        children: [{ title: "Lista de Usuarios", href: "/admin/usuarios" }],
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
          { title: "Afiliados", href: "/admin/afiliados" },
        ],
      },
    ],
  },
  {
    label: "Sistema",
    items: [
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
    ],
  },
  {
    label: "Configuracoes",
    items: [
      {
        title: "Aparencia",
        icon: Settings,
        children: [
          { title: "Categorias", href: "/admin/categorias" },
          { title: "Banners", href: "/admin/banners" },
        ],
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();
  const { isDark, toggleTheme } = useAdminTheme();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    for (const section of menuSections) {
      for (const item of section.items) {
        if (
          item.children?.some((child) => pathname.startsWith(child.href)) &&
          !openMenus.includes(item.title)
        ) {
          setOpenMenus((prev) => [...prev, item.title]);
        }
      }
    }
  }, [pathname, isMounted, openMenus]);

  const toggleMenu = (title: string) =>
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((chunk) => chunk[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  if (!isMounted) return null;

  return (
    <aside className="relative flex w-[260px] flex-col bg-sidebar text-sidebar-foreground select-none transition-colors">
      <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-border/80" />

      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <Logo width={110} height={34} />
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ring-1 ring-inset ring-border">
          Admin
        </span>
      </div>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {menuSections.map((section, index) => (
          <div key={section.label} className={cn(index > 0 && "mt-6")}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {section.label}
            </p>

            <div className="space-y-0.5">
              {section.items.map((item) =>
                item.children ? (
                  <CollapsibleMenuItem
                    key={item.title}
                    item={item}
                    pathname={pathname}
                    isOpen={openMenus.includes(item.title)}
                    onToggle={() => toggleMenu(item.title)}
                  />
                ) : (
                  <SimpleMenuItem
                    key={item.href}
                    item={item as MenuItem & { href: string }}
                    pathname={pathname}
                  />
                )
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-border p-3">
        <div className="rounded-xl bg-secondary/70 p-3 transition-colors hover:bg-secondary">
          <button
            onClick={toggleTheme}
            className="mb-3 flex w-full items-center justify-between rounded-lg border border-border bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-accent/10 hover:text-foreground"
          >
            <span>{isDark ? "Desativar dark mode" : "Ativar dark mode"}</span>
            {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-border">
              {getInitials(admin?.fullName || admin?.name || "AD")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {admin?.fullName || admin?.name || "Admin"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{admin?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair da conta
          </button>
        </div>
      </div>
    </aside>
  );
}

function SimpleMenuItem({
  item,
  pathname,
}: {
  item: MenuItem & { href: string };
  pathname: string;
}) {
  const isActive = pathname.startsWith(item.href);

  return (
    <Link href={item.href} className="block">
      <div
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
          isActive
            ? "bg-accent/10 text-foreground"
            : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        <span>{item.title}</span>
      </div>
    </Link>
  );
}

function CollapsibleMenuItem({
  item,
  pathname,
  isOpen,
  onToggle,
}: {
  item: MenuItem;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isActiveParent = item.children?.some((child) => pathname.startsWith(child.href));

  return (
    <div>
      <button
        onClick={onToggle}
        className={cn(
          "group relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
          isActiveParent
            ? "text-foreground"
            : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
        )}
      >
        {isActiveParent && (
          <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
        )}
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            isActiveParent ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )}
        />
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="relative ml-[21px] border-l border-border py-1 pl-4">
              {item.children?.map((child) => {
                const isActiveChild = pathname === child.href;

                return (
                  <Link key={child.href} href={child.href} className="block">
                    <div
                      className={cn(
                        "relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12.5px] transition-all duration-150",
                        isActiveChild
                          ? "bg-accent/10 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                          isActiveChild ? "bg-primary" : "bg-border"
                        )}
                      />
                      {child.title}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
