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
        "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl shadow-xl shadow-accent/30 flex items-center justify-center transition-all focus:outline-none focus:ring-4 focus:ring-accent/20",
        "bg-accent hover:bg-accent/90 active:scale-95 text-accent-foreground",
        className,
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{ rotate: isOpen ? 45 : 0 }}
      aria-label={isOpen ? "Fechar" : "Novo agendamento"}
    >
      {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
    </motion.button>
  );
}
