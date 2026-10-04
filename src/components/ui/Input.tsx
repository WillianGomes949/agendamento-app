// src/components/ui/Input.tsx
"use client";
import { forwardRef, InputHTMLAttributes } from "react";
import { AlertCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-text mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {LeftIcon && (
            <LeftIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-text transition-colors pointer-events-none" />
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-xl border bg-bg-muted px-4 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:bg-bg-elevated focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all shadow-sm",
              LeftIcon && "pl-10",
              RightIcon && "pr-10",
              error
                ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30 text-red-900 dark:text-red-300"
                : "border-border",
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />
          {RightIcon && (
            <RightIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          )}
        </div>
        {error ? (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-xs text-text-muted"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
