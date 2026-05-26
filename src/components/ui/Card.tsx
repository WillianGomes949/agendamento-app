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
  sm: "p-3",
  md: "p-4 md:p-5",
  lg: "p-6 md:p-8",
};

export function Card({ 
  children, 
  className, 
  hoverable = false, 
  padding = "md", 
  ...props // <- Recebe e repassa variants, initial, animate, etc.
}: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -2, boxShadow: "0 8px 16px -4px rgba(0,0,0,0.1)" } : undefined}
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm",
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}