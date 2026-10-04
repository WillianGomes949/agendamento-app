// src/components/layout/Header.tsx
"use client";
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { useState, useRef } from "react";
import Link from "next/link";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useApiHealth, type ApiStatus } from "@/hooks/useApiHealth";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
  isSidebarCollapsed: boolean;
  isMobile: boolean;
}

const STATUS_CONFIG: Record<
  ApiStatus,
  { color: string; label: string; icon: typeof Wifi }
> = {
  online: {
    color: "bg-emerald-500",
    label: "API Online",
    icon: Wifi,
  },
  offline: {
    color: "bg-rose-500",
    label: "API Offline",
    icon: WifiOff,
  },
  checking: {
    color: "bg-text-muted animate-pulse",
    label: "Verificando...",
    icon: Loader2,
  },
};

export default function Header({
  onToggleSidebar,
  onToggleMobile,
  isSidebarCollapsed,
  isMobile,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const apiStatus = useApiHealth();
  const apiConfig = STATUS_CONFIG[apiStatus];
  const ApiIcon = apiConfig.icon;

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
    <header className="sticky top-0 z-30 bg-bg-elevated/80 backdrop-blur-lg border-b border-border h-16 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Esquerda: Menu & Logo */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button
          onClick={isMobile ? onToggleMobile : onToggleSidebar}
          className="md:hidden p-2.5 -ml-2 lg:ml-0 hover:bg-bg-muted rounded-xl transition-colors text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label={isMobile ? "Abrir menu" : "Alternar menu lateral"}
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-accent rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-accent-foreground font-bold text-sm sm:text-base">
              TA
            </span>
          </div>
          <h1 className="hidden sm:block text-lg font-extrabold tracking-tight text-text">
            TrackApp
          </h1>
        </div>
      </div>

      {/* Direita: Ações & Perfil */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Indicador de Status da API */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-muted border border-border"
          title={apiConfig.label}
        >
          <ApiIcon
            size={14}
            className={
              apiStatus === "checking"
                ? "text-text-muted animate-spin"
                : apiStatus === "online"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
            }
          />
          <span className="text-xs font-semibold text-text-muted">
            {apiConfig.label}
          </span>
          <div className={`w-2 h-2 rounded-full ${apiConfig.color}`} />
        </div>

        {/* Indicador Mobile */}
        <div
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-bg-muted border border-border"
          title={apiConfig.label}
        >
          <ApiIcon
            size={16}
            className={
              apiStatus === "checking"
                ? "text-text-muted animate-spin"
                : apiStatus === "online"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
            }
          />
        </div>

        {/* Notificações */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2.5 hover:bg-bg-muted rounded-xl transition-colors text-text-muted"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-bg-elevated" />
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-bg-elevated rounded-2xl shadow-xl shadow-border/50 border border-border overflow-hidden animate-in slide-in-from-top-2">
              <div className="p-4 border-b border-border flex justify-between items-center bg-bg-muted/50">
                <h3 className="font-bold text-text">Notificações</h3>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-bg-muted transition-colors border-b border-border last:border-0 ${
                      !notif.read ? "bg-blue-50/30 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-text">
                      {notif.title}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      {notif.message}
                    </p>
                    <p className="text-xs font-medium text-text-muted mt-2">
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
            className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 hover:bg-bg-muted rounded-xl transition-colors group"
          >
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold text-xs shadow-sm">
              WG
            </div>
            <span className="hidden md:block text-sm font-semibold text-text">
              Willian
            </span>
            <ChevronDown
              size={14}
              className="hidden md:block text-text-muted group-hover:text-text transition-colors"
            />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-bg-elevated rounded-2xl shadow-xl shadow-border/50 border border-border overflow-hidden animate-in slide-in-from-top-2">
              <div className="p-4 border-b border-border bg-bg-muted/50">
                <p className="font-bold text-text">Willian Gomes</p>
                <p className="text-xs text-text-muted mt-0.5">
                  contato@williangomes.dev
                </p>
              </div>
              <div className="p-2 space-y-1">
                <Link
                  href="/perfil"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text hover:bg-bg-muted rounded-xl transition-colors"
                >
                  <User size={18} className="text-text-muted" />
                  Meu Perfil
                </Link>
                <Link
                  href="/configuracoes"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text hover:bg-bg-muted rounded-xl transition-colors"
                >
                  <SettingsIcon size={18} className="text-text-muted" />
                  Configurações
                </Link>
              </div>
              <div className="p-2 border-t border-border">
                <button className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors w-full">
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
