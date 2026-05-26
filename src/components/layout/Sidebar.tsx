// src/components/layout/Sidebar.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Home, CalendarDays, Wrench, Users, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/agendamentos", icon: Home },
  { label: "Agendamentos", href: "/agendamentos", icon: CalendarDays },
  { label: "Serviços", href: "/agendamentos", icon: Wrench },
  { label: "Técnicos", href: "#", icon: Users },
  { label: "Configurações", href: "#", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
}

export default function Sidebar({ isOpen, isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? "4rem" : "16rem",
          x: isOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col overflow-hidden lg:translate-x-0 lg:shadow-none shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16">
          {!isCollapsed && (
            <span className="font-bold text-xl text-blue-600 tracking-tight">
              TrackApp
            </span>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "#" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}
                />
                {!isCollapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          {!isCollapsed && (
            <p className="text-xs text-gray-400 text-center">v1.0.0 • TrackApp © 2026</p>
          )}
        </div>
      </motion.aside>
    </>
  );
}