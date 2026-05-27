// src/components/layout/Sidebar.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  CalendarDays,
  Wrench,
  Users,
  Settings,
  BarChart3,
  X,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useServicos } from "@/hooks/useServicos";

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
  {
    label: "Agendamentos",
    href: "/agendamentos",
    icon: CalendarDays,
    badgeKey: "agendamentos" as const,
  },
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Serviços", href: "/servicos", icon: Wrench },
  { label: "Técnicos", href: "/tecnicos", icon: Users },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
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

  // Pega a quantidade de serviços do hook
  const { servicos, loading } = useServicos();

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverStart?.();
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverEnd?.();
  };

  const sidebarWidth = isCollapsed && !isHovered ? "5rem" : "16rem";

  // Monta os itens com badge dinâmico
  const navItems = baseNavItems.map((item) => ({
    ...item,
    badge:
      item.label === "Agendamentos" && servicos.length > 0
        ? String(servicos.length)
        : undefined,
  }));

  return (
    <>
      {/* Mobile Overlay Profissional */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
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
        className="fixed top-0 left-0 h-full bg-white border-r border-slate-200/60 z-50 flex flex-col overflow-hidden shadow-2xl lg:shadow-none"
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 h-16">
          {(!isCollapsed || isHovered) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">TA</span>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                TrackApp
              </span>
            </motion.div>
          )}
          {isCollapsed && !isHovered && (
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">TA</span>
            </div>
          )}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-500 ml-auto"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-none">
          <div className="mb-6 space-y-1">
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
                  className={`flex items-center gap-3.5 px-3 py-3 lg:py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  {(!isCollapsed || isHovered) && (
                    <>
                      <span className="font-semibold text-sm whitespace-nowrap">
                        {item.label}
                      </span>
                      {badge && (
                        <span
                          className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                      {/* Loading spinner */}
                      {item.badgeKey === "agendamentos" &&
                        isLoading &&
                        !badge && (
                          <span className="ml-auto">
                            <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                          </span>
                        )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-100">
          {!isCollapsed || isHovered ? (
            <Link
              href="/ajuda"
              onClick={() => onCloseMobile()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <HelpCircle size={18} />
              <span className="text-sm font-semibold">Suporte</span>
            </Link>
          ) : (
            <div className="flex justify-center">
              <HelpCircle size={18} className="text-slate-400" />
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
