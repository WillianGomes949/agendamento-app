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

export function FloatingActionButton({ onClick, isOpen = false, className }: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
        "bg-blue-600 hover:bg-blue-700 active:scale-95",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{ rotate: isOpen ? 45 : 0 }}
    >
      {isOpen ? (
        <X className="w-6 h-6 text-white" />
      ) : (
        <Plus className="w-6 h-6 text-white" />
      )}
    </motion.button>
  );
}