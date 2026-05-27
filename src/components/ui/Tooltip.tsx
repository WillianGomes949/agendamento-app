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
  dark: "bg-slate-900 text-white shadow-lg shadow-slate-900/20",
  light:
    "bg-white text-slate-900 border border-slate-200/80 shadow-xl shadow-slate-200/50",
  info: "bg-blue-600 text-white shadow-lg shadow-blue-900/20",
  warning: "bg-amber-500 text-white shadow-lg shadow-amber-900/20",
  error: "bg-rose-600 text-white shadow-lg shadow-rose-900/20",
};

// Bordas da seta ajustadas para as cores do novo Design System
const arrowBorderClasses: Record<
  TooltipPosition,
  Record<TooltipVariant, string>
> = {
  top: {
    dark: "border-t-slate-900",
    light: "border-t-white",
    info: "border-t-blue-600",
    warning: "border-t-amber-500",
    error: "border-t-rose-600",
  },
  bottom: {
    dark: "border-b-slate-900",
    light: "border-b-white",
    info: "border-b-blue-600",
    warning: "border-b-amber-500",
    error: "border-b-rose-600",
  },
  left: {
    dark: "border-l-slate-900",
    light: "border-l-white",
    info: "border-l-blue-600",
    warning: "border-l-amber-500",
    error: "border-l-rose-600",
  },
  right: {
    dark: "border-r-slate-900",
    light: "border-r-white",
    info: "border-r-blue-600",
    warning: "border-r-amber-500",
    error: "border-r-rose-600",
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
            initial={{
              opacity: 0,
              scale: 0.95,
              y: position === "top" ? 5 : position === "bottom" ? -5 : 0,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: position === "top" ? 5 : position === "bottom" ? -5 : 0,
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-50 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap pointer-events-none",
              positionClasses[position],
              variantClasses[variant],
              className,
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
                  "absolute w-0 h-0 border-[5px] border-transparent",
                  arrowPositionClasses[position],
                  arrowBorderClasses[position][variant],
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
    <Tooltip
      content={content}
      position="top"
      variant="light"
      className={className}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-slate-500 text-xs font-bold hover:bg-slate-200 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1",
          className,
        )}
        aria-label="Ajuda"
      >
        ?
      </button>
    </Tooltip>
  );
}
