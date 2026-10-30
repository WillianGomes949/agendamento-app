// src/components/layout/Header.tsx
"use client";
import { Menu, Wifi, WifiOff, Loader2, LogOut } from "lucide-react";
import { useApiHealth, type ApiStatus } from "@/hooks/useApiHealth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleMobile: () => void;
  isSidebarCollapsed: boolean;
  isMobile: boolean;
  usuario?: {
    tecnico_nome: string;
    email: string;
    role: string;
  };
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
  isMobile,
  usuario,
}: HeaderProps) {
  const apiStatus = useApiHealth();
  const apiConfig = STATUS_CONFIG[apiStatus];
  const ApiIcon = apiConfig.icon;

  // ✅ Agora este hook funcionará corretamente no App Router
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        toast.success("Até logo!");
        router.push("/"); // Redireciona para o login
        router.refresh(); // Força a atualização dos cookies no servidor
      } else {
        throw new Error("Erro ao sair");
      }
    } catch {
      toast.error("Falha ao fazer logout");
    }
  };

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
          <h1 className="hidden sm:block text-lg font-extrabold tracking-tight text-text">
            AgendaApp
          </h1>
        </div>
      </div>

      {/* Direita: Ações & Perfil */}
      <div className="flex items-center gap-1 sm:gap-2 ">
        {/* Indicador de Status da API */}
        <div
          className="hidden md:flex px-3 h-11 items-center gap-4 p-1 rounded-xl bg-bg-muted border border-border"
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
          className="md:hidden flex px-3 h-11 items-center gap-4 p-1 rounded-xl bg-bg-muted border border-border"
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

        {/* Menu do Usuário */}
        <div className="items-center gap-4 inline-flex p-1 rounded-xl bg-bg-muted border border-border">
          <div className="text-right hidden sm:block mx-3">
            <p className="text-sm font-semibold text-text">
              {usuario?.tecnico_nome}
            </p>
            <p className="text-xs text-text-muted">
              {usuario?.role === "master" ? "Administrador" : "Técnico"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
            title="Sair do sistema"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
