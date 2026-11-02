// src/components/ui/ThemeToggle.tsx
"use client";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/useTheme";

const options: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Claro" },
  { value: "dark", icon: Moon, label: "Escuro" },
  { value: "system", icon: Monitor, label: "Sistema" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-bg-elevated/60 p-0.5 backdrop-blur-md"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.value)}
            className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-sm tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
              isActive ? "text-text" : "text-text-muted hover:text-text"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-full bg-bg shadow-sm ring-1 ring-border/60"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="relative h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="relative hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* Versão simples (apenas toggle claro/escuro) */
export function ThemeSwitch() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="relative inline-flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full border border-border bg-bg-elevated/60 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <motion.span
        animate={{ x: isDark ? 28 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="pointer-events-none flex h-7 w-7 items-center justify-center rounded-full bg-bg shadow-sm ring-1 ring-border/60"
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-text" aria-hidden />
        ) : (
          <Sun className="h-3.5 w-3.5 text-amber-500" aria-hidden />
        )}
      </motion.span>
    </button>
  );
}
