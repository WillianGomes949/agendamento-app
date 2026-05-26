// src/components/ui/Tooltip.tsx
"use client";

import { useState, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type TooltipPosition = "top" | "bottom" | "left" | "right";
type TooltipVariant = "dark" | "light" | "info" | "warning" | "error";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  delay?: number;
  offset?: number;
  className?: string;
  disabled?: boolean;
  showArrow?: boolean;
}

const positionClasses: Record<TooltipPosition, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const variantClasses: Record<TooltipVariant, string> = {
  dark: "bg-gray-900 text-white",
  light: "bg-white text-gray-900 border border-gray-200 shadow-lg",
  info: "bg-blue-600 text-white",
  warning: "bg-yellow-500 text-white",
  error: "bg-red-600 text-white",
};

// Arrow borders corrigidos por posição e variante
const arrowBorderClasses: Record<TooltipPosition, Record<TooltipVariant, string>> = {
  top: {
    dark: "border-t-gray-900",
    light: "border-t-white",
    info: "border-t-blue-600",
    warning: "border-t-yellow-500",
    error: "border-t-red-600",
  },
  bottom: {
    dark: "border-b-gray-900",
    light: "border-b-white",
    info: "border-b-blue-600",
    warning: "border-b-yellow-500",
    error: "border-b-red-600",
  },
  left: {
    dark: "border-l-gray-900",
    light: "border-l-white",
    info: "border-l-blue-600",
    warning: "border-l-yellow-500",
    error: "border-l-red-600",
  },
  right: {
    dark: "border-r-gray-900",
    light: "border-r-white",
    info: "border-r-blue-600",
    warning: "border-r-yellow-500",
    error: "border-r-red-600",
  },
};

const arrowPositionClasses: Record<TooltipPosition, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-1",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1",
  left: "left-full top-1/2 -translate-y-1/2 -ml-1",
  right: "right-full top-1/2 -translate-y-1/2 -mr-1",
};

export function Tooltip({
  content,
  children,
  position = "top",
  variant = "dark",
  delay = 200,
  offset = 8,
  className,
  disabled = false,
  showArrow = true,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cursor-help">{children}</div>

      <AnimatePresence>
        {isVisible && !disabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === "top" ? 5 : position === "bottom" ? -5 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === "top" ? 5 : position === "bottom" ? -5 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 px-2 py-1 text-xs rounded-md whitespace-nowrap pointer-events-none",
              positionClasses[position],
              variantClasses[variant],
              className
            )}
            style={{ 
              marginTop: position === "bottom" ? offset : undefined,
              marginBottom: position === "top" ? offset : undefined,
              marginLeft: position === "right" ? offset : undefined,
              marginRight: position === "left" ? offset : undefined,
            }}
          >
            {showArrow && (
              <div
                className={cn(
                  "absolute w-0 h-0 border-4 border-transparent",
                  arrowPositionClasses[position],
                  arrowBorderClasses[position][variant]
                )}
                aria-hidden="true"
              />
            )}
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente de tooltip para ícones de ajuda
interface HelpTooltipProps {
  content: ReactNode;
  className?: string;
}

export function HelpTooltip({ content, className }: HelpTooltipProps) {
  return (
    <Tooltip content={content} position="top" variant="light" className={className}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-xs font-medium hover:bg-gray-200 transition-colors",
          className
        )}
        aria-label="Ajuda"
      >
        ?
      </button>
    </Tooltip>
  );
}