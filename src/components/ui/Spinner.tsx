// src/components/ui/Spinner.tsx
"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";
type SpinnerVariant = "primary" | "secondary" | "white" | "gray";

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
  lg: "w-8 h-8 border-3",
  xl: "w-12 h-12 border-4",
};

const variantColors: Record<SpinnerVariant, string> = {
  primary: "border-blue-200 border-t-blue-600",
  secondary: "border-purple-200 border-t-purple-600",
  white: "border-white/30 border-t-white",
  gray: "border-gray-200 border-t-gray-600",
};

const labelSizeClasses: Record<SpinnerSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
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
        "inline-flex flex-col items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear",
        }}
        className={cn(
          "rounded-full border-solid",
          sizeClasses[size],
          variantColors[variant]
        )}
      />
      
      {showLabel && (
        <span className={cn("text-gray-500", labelSizeClasses[size])}>
          {label}
        </span>
      )}
    </motion.div>
  );
}

// Componente de tela cheia para loading de página
export function FullPageSpinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <Spinner size="xl" variant="primary" showLabel label={label} />
    </div>
  );
}

// Componente para loading dentro de botões
export function ButtonSpinner() {
  return <Spinner size="sm" variant="white" />;
}

// Componente para loading inline
export function InlineSpinner() {
  return <Spinner size="sm" variant="gray" />;
}