// src/components/features/StatusBadge.tsx
"use client";

import { Clock, Hourglass, CheckCircle, XCircle, Trash2, type LucideIcon } from "lucide-react";
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
    classes: "bg-amber-50 text-amber-700 ring-amber-600/20" 
  },
  em_andamento: { 
    label: "Em Andamento", 
    icon: Hourglass, 
    classes: "bg-blue-50 text-blue-700 ring-blue-600/20" 
  },
  concluido: { 
    label: "Concluído", 
    icon: CheckCircle, 
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" 
  },
  cancelado: { 
    label: "Cancelado", 
    icon: XCircle, 
    classes: "bg-rose-50 text-rose-700 ring-rose-600/20" 
  },
  deletado: { 
    label: "Deletado", 
    icon: Trash2, 
    classes: "bg-slate-50 text-slate-500 ring-slate-500/20 line-through opacity-75" 
  },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normalizedKey = (status || "pendente")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  const config = STATUS_CONFIG[normalizedKey];

  if (!config) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ring-1 ring-inset bg-slate-50 text-slate-600 ring-slate-200",
        className
      )}>
        {status}
      </span>
    );
  }

  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ring-1 ring-inset",
      config.classes,
      className
    )}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}