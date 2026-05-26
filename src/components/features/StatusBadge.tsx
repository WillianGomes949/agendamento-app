"use client";

import { Clock, Hourglass, CheckCircle, XCircle, LucideIcon } from "lucide-react";
import type { StatusServico } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<StatusServico, { label: string; icon: LucideIcon; classes: string }> = {
  pendente: { label: "Pendente", icon: Clock, classes: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  aguardando: { label: "Aguardando", icon: Hourglass, classes: "bg-blue-50 text-blue-700 border-blue-200" },
  concluido: { label: "Concluído", icon: CheckCircle, classes: "bg-green-50 text-green-700 border-green-200" },
  cancelado: { label: "Cancelado", icon: XCircle, classes: "bg-red-50 text-red-700 border-red-200" },
};

export function StatusBadge({ status, className }: { status: StatusServico; className?: string }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", config.classes, className)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}