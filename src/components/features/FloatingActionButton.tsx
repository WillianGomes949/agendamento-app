// src/components/features/FloatingActionButton.tsx
"use client";
import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  isOpen = false,
  className,
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/20 ring-1 ring-inset ring-white/15 transition-colors hover:bg-accent/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        className,
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{ rotate: isOpen ? 45 : 0 }}
      aria-label={isOpen ? "Fechar" : "Novo agendamento"}
    >
      {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
    </motion.button>
  );
}
