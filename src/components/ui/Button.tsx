// src/components/ui/Button.tsx
"use client";
import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { Loader2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 focus-visible:ring-text/50",
  secondary:
    "bg-bg-muted/60 text-text border border-border hover:bg-bg-hover focus-visible:ring-border",
  outline:
    "border border-border bg-transparent text-text hover:bg-bg-hover focus-visible:ring-border",
  ghost:
    "bg-transparent text-text-muted hover:bg-bg-hover hover:text-text focus-visible:ring-border",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500/50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 gap-1.5 text-xs font-medium",
  md: "h-10 px-4 gap-2 text-sm font-semibold",
  lg: "h-12 px-6 gap-2 text-base font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading,
      icon: Icon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={!isDisabled ? { scale: 1.01 } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "inline-flex select-none items-center justify-center whitespace-nowrap rounded-lg tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : Icon ? (
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
        ) : null}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
