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

// Usa variáveis do tema para inverter automaticamente no dark mode
const variantClasses: Record<TooltipVariant, string> = {
  dark: "bg-accent text-accent-foreground shadow-lg shadow-accent/20",
  light:
    "bg-bg-elevated text-text border border-border shadow-xl shadow-black/5",
  info: "bg-blue-600 text-white shadow-lg shadow-blue-900/20 dark:bg-blue-500 dark:shadow-blue-500/20",
  warning:
    "bg-amber-500 text-white shadow-lg shadow-amber-900/20 dark:bg-amber-400 dark:text-amber-950 dark:shadow-amber-500/20",
  error:
    "bg-rose-600 text-white shadow-lg shadow-rose-900/20 dark:bg-rose-500 dark:shadow-rose-500/20",
};

// Bordas da seta ajustadas para as cores do novo Design System
const arrowBorderClasses: Record<
  TooltipPosition,
  Record<TooltipVariant, string>
> = {
  top: {
    dark: "border-t-accent",
    light: "border-t-bg-elevated",
    info: "border-t-blue-600 dark:border-t-blue-500",
    warning: "border-t-amber-500 dark:border-t-amber-400",
    error: "border-t-rose-600 dark:border-t-rose-500",
  },
  bottom: {
    dark: "border-b-accent",
    light: "border-b-bg-elevated",
    info: "border-b-blue-600 dark:border-b-blue-500",
    warning: "border-b-amber-500 dark:border-b-amber-400",
    error: "border-b-rose-600 dark:border-b-rose-500",
  },
  left: {
    dark: "border-l-accent",
    light: "border-l-bg-elevated",
    info: "border-l-blue-600 dark:border-l-blue-500",
    warning: "border-l-amber-500 dark:border-l-amber-400",
    error: "border-l-rose-600 dark:border-l-rose-500",
  },
  right: {
    dark: "border-r-accent",
    light: "border-r-bg-elevated",
    info: "border-r-blue-600 dark:border-r-blue-500",
    warning: "border-r-amber-500 dark:border-r-amber-400",
    error: "border-r-rose-600 dark:border-r-rose-500",
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
          "inline-flex items-center justify-center w-4 h-4 rounded-full bg-bg-muted text-text-muted text-xs font-bold hover:bg-bg-muted/80 hover:text-text transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1",
          className,
        )}
        aria-label="Ajuda"
      >
        ?
      </button>
    </Tooltip>
  );
}
