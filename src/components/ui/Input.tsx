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
            className="mb-1.5 block text-[13px] font-medium tracking-tight text-text"
          >
            {label}
          </label>
        )}
        <div className="group relative">
          {LeftIcon && (
            <LeftIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-text" />
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-10 w-full rounded-lg border bg-bg-muted/30 px-3 text-sm tracking-tight text-text shadow-sm transition-colors placeholder:text-text-muted/50 focus:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-text/30 disabled:cursor-not-allowed disabled:opacity-60",
              LeftIcon && "pl-9",
              RightIcon && "pr-9",
              error
                ? "border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-border focus:border-text",
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
            <RightIcon className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-text" />
          )}
        </div>
        {error ? (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
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
