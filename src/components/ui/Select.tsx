// src/components/ui/Select.tsx
"use client";
import { forwardRef, SelectHTMLAttributes } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      className,
      containerClassName,
      id,
      value,
      ...props
    },
    ref,
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-semibold text-text mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          <select
            ref={ref}
            id={selectId}
            value={value}
            className={cn(
              "w-full appearance-none rounded-xl border bg-bg-muted px-4 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:bg-bg-elevated focus:outline-none focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all shadow-sm disabled:bg-bg-muted disabled:text-text-muted disabled:cursor-not-allowed",
              error
                ? "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30 text-red-900 dark:text-red-300"
                : "border-border",
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helperText
                  ? `${selectId}-helper`
                  : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled={!!value}>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-text transition-colors pointer-events-none" />
        </div>
        {error ? (
          <p
            id={`${selectId}-error`}
            className="mt-1.5 text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        ) : helperText ? (
          <p
            id={`${selectId}-helper`}
            className="mt-1.5 text-xs text-text-muted"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = "Select";
