// src/components/layout/Sidebar.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  CalendarDays,
  Wrench,
  Users,
  BarChart3,
  X,
  UserCog2,
  SunMoon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useServicos } from "@/hooks/useServicos";
import { ThemeSwitch, ThemeToggle } from "../ui/ThemeToggle";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  agendamentosPendentes?: number;
  isLoading?: boolean;
}

const baseNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Agendamentos", href: "/agendamentos", icon: CalendarDays, badgeKey: "agendamentos" as const},
  { label: "Serviços", href: "/servicos", icon: Wrench },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Técnicos", href: "/tecnicos", icon: Users },
  { label: "Usuários", href: "/usuarios", icon: UserCog2},
];

export default function Sidebar({
  isOpen,
  isCollapsed,
  onCloseMobile,
  onHoverStart,
  onHoverEnd,
  agendamentosPendentes,
  isLoading = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const { servicos } = useServicos();

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverStart?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverEnd?.();
  };

  const sidebarWidth = isCollapsed && !isHovered ? "5rem" : "18rem";
  const isExpanded = !isCollapsed || isHovered;

  const navItems = baseNavItems.map((item) => ({
    ...item,
    badge:
      item.label === "Agendamentos" && servicos.length > 0
        ? String(servicos.length)
        : undefined,
  }));

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
          x: isOpen ? 0 : window.innerWidth < 1024 ? "-100%" : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed left-0 top-0 z-50 flex h-full flex-col overflow-hidden border-r border-border bg-bg shadow-xl lg:shadow-none"
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          {isExpanded ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <span className="text-xs font-bold">Aa</span>
              </div>
              <span className="text-base font-semibold tracking-tight text-text">
                AgendaApp
              </span>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <span className="text-xs font-bold">Aa</span>
            </div>
          )}
          <button
            onClick={onCloseMobile}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 lg:hidden"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="no-scrollbar flex-1 space-y-0.5 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted/70">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const badge =
              item.badgeKey === "agendamentos" &&
              agendamentosPendentes !== undefined &&
              agendamentosPendentes > 0
                ? String(agendamentosPendentes)
                : undefined;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onCloseMobile()}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
                  isActive
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-text-muted hover:bg-bg-hover hover:text-text"
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {isExpanded && (
                  <>
                    <span className="tracking-tight whitespace-nowrap">
                      {item.label}
                    </span>
                    {badge && (
                      <span
                        className={`ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                          isActive
                            ? "bg-accent-foreground/20 text-accent-foreground"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                    {item.badgeKey === "agendamentos" &&
                      isLoading &&
                      !badge && (
                        <span className="ml-auto inline-block h-4 w-4 animate-spin rounded-full border-2 border-border-strong border-t-text-muted" />
                      )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="border-t border-border p-3">
          {isExpanded ? (
            <>
              <div className="hidden justify-center sm:flex">
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-center gap-3 rounded-lg border border-border bg-bg-muted/40 p-2 sm:hidden">
                <span className="text-xs font-medium text-text-muted">
                  Tema
                </span>
                <ThemeSwitch />
              </div>
            </>
          ) : (
            <div className="flex justify-center">
              <SunMoon size={18} className="text-text-muted" />
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
