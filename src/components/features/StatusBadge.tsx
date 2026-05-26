// src/components/features/StatusBadge.tsx
"use client";

import { Clock, Hourglass, CheckCircle, XCircle, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  classes: string;
}

// ✅ Usamos string genérica ao invés de forçar o type restrito
const STATUS_CONFIG: Record<string, StatusConfig> = {
  pendente: { 
    label: "Pendente", 
    icon: Clock, 
    classes: "bg-yellow-50 text-yellow-700 border-yellow-200" 
  },
  em_andamento: { 
    label: "Em Andamento", 
    icon: Hourglass, 
    classes: "bg-blue-50 text-blue-700 border-blue-200" 
  },
  concluido: { 
    label: "Concluído", 
    icon: CheckCircle, 
    classes: "bg-green-50 text-green-700 border-green-200" 
  },
  cancelado: { 
    label: "Cancelado", 
    icon: XCircle, 
    classes: "bg-red-50 text-red-700 border-red-200" 
  },
  deletado: { 
    label: "Deletado", 
    icon: Trash2, 
    classes: "bg-gray-100 text-gray-500 border-gray-300 line-through opacity-75" 
  },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  // ✅ Normaliza o status que vem da planilha
  // Ex: "EM ANDAMENTO" -> "em_andamento" | "CONCLUÍDO" -> "concluido"
  const normalizedKey = (status || "pendente")
    .toLowerCase()
    .normalize("NFD") // Separa os acentos
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .replace(/\s+/g, "_"); // Troca espaços por underline

  const config = STATUS_CONFIG[normalizedKey];

  if (!config) {
    // Fallback para status novo/desconhecido criado na planilha
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-600 border-gray-200 uppercase",
        className
      )}>
        {status}
      </span>
    );
  }

  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      config.classes,
      className
    )}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}