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

  const iconColorClass =
    apiStatus === "checking"
      ? "text-text-muted animate-spin"
      : apiStatus === "online"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-rose-600 dark:text-rose-400";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-bg-elevated/85 px-4 backdrop-blur-xl md:px-6">
      {/* Esquerda: Menu & Logo */}
      <div className="flex flex-1 items-center gap-2 sm:gap-4">
        <button
          onClick={isMobile ? onToggleMobile : onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
          aria-label={isMobile ? "Abrir menu" : "Alternar menu lateral"}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Direita: Ações & Perfil */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Indicador de Status da API (unificado desktop/mobile) */}
        <div
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-bg-muted/40 px-2.5"
          title={apiConfig.label}
        >
          <ApiIcon size={14} className={iconColorClass} />
          <span className="hidden text-xs font-medium text-text-muted md:inline">
            {apiConfig.label}
          </span>
          <div
            className={`hidden h-2 w-2 rounded-full ${apiConfig.color} md:block`}
          />
        </div>

        {/* Menu do Usuário */}
        <div className="inline-flex h-10 items-center gap-3 rounded-lg border border-border bg-bg-muted/40 pl-3 pr-1">
          <div className="hidden text-right sm:block">
            <p className="text-[13px] font-semibold leading-tight text-text">
              {usuario?.tecnico_nome}
            </p>
            <p className="text-[11px] leading-tight text-text-muted">
              {usuario?.role === "master" ? "Administrador" : "Técnico"}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-rose-600 transition-colors hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:text-rose-400"
            title="Sair do sistema"
            aria-label="Sair do sistema"
          >
            <LogOut size={16} />
            <span className="sr-only">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
