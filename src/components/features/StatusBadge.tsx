// src/components/features/StatusBadge.tsx
"use client";

import {
  Clock,
  Hourglass,
  CheckCircle,
  XCircle,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  classes: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    classes:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-500/20",
  },
  em_andamento: {
    label: "Em Andamento",
    icon: Hourglass,
    classes:
      "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-500/20",
  },
  concluido: {
    label: "Concluído",
    icon: CheckCircle,
    classes:
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-500/20",
  },
  cancelado: {
    label: "Cancelado",
    icon: XCircle,
    classes:
      "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-600/20 dark:ring-rose-500/20",
  },
  deletado: {
    label: "Deletado",
    icon: Trash2,
    classes:
      "bg-bg-muted/60 text-text-muted ring-border/60 line-through opacity-75",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const normalizedKey = (status || "pendente")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  const config = STATUS_CONFIG[normalizedKey];

  if (!config) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md bg-bg-muted/60 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-text-muted ring-1 ring-inset ring-border/60",
          className,
        )}
      >
        {status}
      </span>
    );
  }

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider ring-1 ring-inset",
        config.classes,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
