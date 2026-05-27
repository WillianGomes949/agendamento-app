// src/components/layout/Header.tsx
"use client";

import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { useState, useRef } from "react";
import Link from "next/link";

import { useClickOutside } from "@/hooks/useClickOutside";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
  isSidebarCollapsed: boolean;
  isMobile: boolean;
}

export default function Header({
  onToggleSidebar,
  onToggleMobile,
  isSidebarCollapsed,
  isMobile,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
 

  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchRef, () => setSearchOpen(false));
  useClickOutside(notificationsRef, () => setNotificationsOpen(false));
  useClickOutside(userMenuRef, () => setUserMenuOpen(false));

  const notifications = [
    {
      id: 1,
      title: "Novo agendamento",
      message: "Serviço agendado para hoje às 14h",
      time: "5 min atrás",
      read: false,
    },
    {
      id: 2,
      title: "Atualização de sistema",
      message: "Novas funcionalidades disponíveis",
      time: "1 hora atrás",
      read: false,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 h-16 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Esquerda: Menu & Logo */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button
          onClick={isMobile ? onToggleMobile : onToggleSidebar}
          className="md:hidden p-2.5 -ml-2 lg:ml-0 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
          aria-label={isMobile ? "Abrir menu" : "Alternar menu lateral"}
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm sm:text-base">
              TA
            </span>
          </div>
          <h1 className="hidden sm:block text-lg font-extrabold tracking-tight text-slate-900">
            TrackApp
          </h1>
        </div>
      </div>

      {/* Direita: Ações & Perfil */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notificações */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Notificações</h3>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${!notif.read ? "bg-blue-50/30" : ""}`}
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {notif.title}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {notif.message}
                    </p>
                    <p className="text-xs font-medium text-slate-400 mt-2">
                      {notif.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Menu do Usuário */}
        <div className="relative ml-1 sm:ml-2" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 hover:bg-slate-100 rounded-xl transition-colors group"
          >
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
              WG
            </div>
            <span className="hidden md:block text-sm font-semibold text-slate-700">
              Willian
            </span>
            <ChevronDown
              size={14}
              className="hidden md:block text-slate-400 group-hover:text-slate-600 transition-colors"
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <p className="font-bold text-slate-900">Willian Gomes</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  contato@williangomes.dev
                </p>
              </div>
              <div className="p-2 space-y-1">
                <Link
                  href="/perfil"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <User size={18} className="text-slate-400" />
                  Meu Perfil
                </Link>
                <Link
                  href="/configuracoes"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <SettingsIcon size={18} className="text-slate-400" />
                  Configurações
                </Link>
              </div>
              <div className="p-2 border-t border-slate-100">
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full">
                  <LogOut size={18} />
                  Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
