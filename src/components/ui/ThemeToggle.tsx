// src/components/ui/ThemeToggle.tsx
"use client";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/useTheme";

const options: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Claro" },
  { value: "system", icon: Monitor, label: "Sistema" },
  { value: "dark", icon: Moon, label: "Escuro" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema da interface"
      className="inline-flex items-center gap-1 p-1 rounded-xl bg-bg-muted border border-border"
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
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive ? "text-text" : "text-text-muted hover:text-text"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="theme-indicator"
                className="absolute inset-0 rounded-lg bg-bg-elevated shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="relative w-4 h-4" />
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
      className="relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-border-strong transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
    >
      <motion.span
        animate={{ x: isDark ? 28 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="pointer-events-none inline-flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated shadow ring-0"
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-text" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </motion.span>
    </button>
  );
}
