// src/components/ui/Card.tsx
"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLMotionProps<"div"> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5 md:p-6",
  lg: "p-6 sm:p-8 md:p-10",
};

export function Card({ 
  children, 
  className, 
  hoverable = false, 
  padding = "md", 
  ...props 
}: CardProps) {
  return (
    <motion.div
      whileHover={
        hoverable 
          ? { y: -2, boxShadow: "0 12px 24px -8px rgba(15, 23, 42, 0.08)" } 
          : undefined
      }
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "bg-white rounded-2xl border border-slate-200/60 shadow-sm transition-colors",
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}