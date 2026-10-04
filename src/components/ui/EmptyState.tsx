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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center bg-bg-elevated rounded-2xl border-2 border-dashed border-border",
        className,
      )}
    >
      <div className="w-16 h-16 bg-bg-muted rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-border">
        <Icon className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-xl font-bold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}
