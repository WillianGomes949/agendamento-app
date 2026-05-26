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
  ChevronLeft,
  HelpCircle,
  Star,
  TrendingUp,
  Clock
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onCloseMobile: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: Home, badge: null },
  { label: "Agendamentos", href: "/agendamentos", icon: CalendarDays, badge: "12" },
  { label: "Serviços", href: "/servicos", icon: Wrench, badge: null },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3, badge: null },
  { label: "Técnicos", href: "/tecnicos", icon: Users, badge: null },
  { label: "Configurações", href: "/configuracoes", icon: Settings, badge: null },
];

const quickActions = [
  { label: "Novo Agendamento", href: "/agendamentos/novo", icon: Clock, color: "text-blue-500" },
  { label: "Relatório Rápido", href: "/relatorios/rapido", icon: TrendingUp, color: "text-green-500" },
  { label: "Favoritos", href: "/favoritos", icon: Star, color: "text-yellow-500" },
];

export default function Sidebar({ isOpen, isCollapsed, onCloseMobile, onHoverStart, onHoverEnd }: SidebarProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverStart?.();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverEnd?.();
  };

  const sidebarWidth = isCollapsed && !isHovered ? "5rem" : "16rem";

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
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
          x: isOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col overflow-hidden lg:shadow-lg lg:shadow-gray-200/50"
        style={{ boxShadow: isHovered ? "4px 0 20px rgba(0,0,0,0.05)" : "none" }}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16">
          {(!isCollapsed || isHovered) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">TA</span>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                TrackApp
              </span>
            </motion.div>
          )}
          {isCollapsed && !isHovered && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm mx-auto">
              <span className="text-white font-bold text-sm">TA</span>
            </div>
          )}
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 ml-auto"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {/* Main Menu */}
          <div className="mb-4">
            {(!isCollapsed || isHovered) && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                Menu Principal
              </p>
            )}
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => onCloseMobile()}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-600 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    size={20}
                    className={`flex-shrink-0 ${isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}`}
                    aria-hidden="true"
                  />
                  {(!isCollapsed || isHovered) && (
                    <>
                      <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {isCollapsed && !isHovered && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-100">
            {(!isCollapsed || isHovered) && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                Ações Rápidas
              </p>
            )}
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  onClick={() => onCloseMobile()}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon size={18} className={`${action.color} flex-shrink-0`} />
                  {(!isCollapsed || isHovered) && (
                    <span className="text-sm whitespace-nowrap">{action.label}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Help Section */}
          <div className="pt-4 border-t border-gray-100">
            {(!isCollapsed || isHovered) && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                Suporte
              </p>
            )}
            <Link
              href="/ajuda"
              onClick={() => onCloseMobile()}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <HelpCircle size={18} className="flex-shrink-0" />
              {(!isCollapsed || isHovered) && (
                <span className="text-sm whitespace-nowrap">Ajuda & Suporte</span>
              )}
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          {(!isCollapsed || isHovered) ? (
            <div className="text-center">
              <p className="text-xs text-gray-400">TrackApp v1.0.0</p>
              <p className="text-xs text-gray-400 mt-0.5">© 2026</p>
            </div>
          ) : (
            <div className="w-8 h-0.5 bg-gray-200 rounded-full mx-auto" />
          )}
        </div>
      </motion.aside>
    </>
  );
}