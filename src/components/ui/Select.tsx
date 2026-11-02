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
            className="mb-1.5 block text-[13px] font-medium tracking-tight text-text"
          >
            {label}
          </label>
        )}
        <div className="group relative">
          <select
            ref={ref}
            id={selectId}
            value={value}
            className={cn(
              "h-10 w-full cursor-pointer appearance-none rounded-lg border bg-bg-muted/30 px-3 text-sm tracking-tight text-text shadow-sm transition-colors focus:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-text/30 disabled:cursor-not-allowed disabled:opacity-60",
              error
                ? "border-rose-500 bg-rose-500/5 focus:border-rose-500 focus:ring-rose-500/20"
                : "border-border focus:border-text",
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
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-text" />
        </div>
        {error ? (
          <p
            id={`${selectId}-error`}
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
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
