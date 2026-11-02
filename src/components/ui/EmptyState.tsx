// src/components/ui/EmptyState.tsx
"use client";
import { motion } from "framer-motion";
import { Inbox, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "Nada encontrado",
  description = "Não há registros correspondentes aos critérios selecionados.",
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-elevated px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-bg-muted/50">
        <Icon className="h-7 w-7 text-text-muted" aria-hidden />
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-text">
        {title}
      </h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-text-muted">
        {description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}
