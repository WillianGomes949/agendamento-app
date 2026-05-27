// src/components/ui/Spinner.tsx
"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
type SpinnerVariant = "primary" | "secondary" | "white" | "slate";

interface SpinnerProps extends Omit<HTMLMotionProps<"div">, "children"> {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  showLabel?: boolean;
}

const sizeClasses: Record<SpinnerSize, string> = {
  xs: "w-3 h-3 border-[1.5px]",
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-[3px]",
  xl: "w-12 h-12 border-4",
};

const variantColors: Record<SpinnerVariant, string> = {
  primary: "border-slate-200 border-t-slate-900",
  secondary: "border-slate-200 border-t-slate-500",
  white: "border-white/30 border-t-white",
  slate: "border-slate-200 border-t-slate-600",
};

const labelSizeClasses: Record<SpinnerSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-sm font-medium",
  lg: "text-base font-medium",
  xl: "text-lg font-semibold",
};

export function Spinner({
  size = "md",
  variant = "primary",
  label = "Carregando...",
  showLabel = false,
  className,
  ...props
}: SpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "inline-flex flex-col items-center justify-center gap-3",
        className,
      )}
      {...props}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className={cn(
          "rounded-full border-solid",
          sizeClasses[size],
          variantColors[variant],
        )}
      />

      {showLabel && (
        <span className={cn("text-slate-500", labelSizeClasses[size])}>
          {label}
        </span>
      )}
    </motion.div>
  );
}

export function FullPageSpinner({
  label = "Carregando...",
}: {
  label?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-md">
      <Spinner size="xl" variant="primary" showLabel label={label} />
    </div>
  );
}

export function ButtonSpinner() {
  return <Spinner size="sm" variant="white" />;
}

export function InlineSpinner() {
  return <Spinner size="sm" variant="slate" />;
}
