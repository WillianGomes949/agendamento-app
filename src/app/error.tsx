// src/app/error.tsx
"use client";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
          <AlertCircle
            className="h-6 w-6 text-rose-600 dark:text-rose-400"
            aria-hidden
          />
        </div>
        <h2 className="mb-1.5 text-lg font-semibold tracking-tight text-text">
          Algo deu errado
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          {error.message || "Ocorreu um erro inesperado."}
        </p>
        {error.digest && (
          <p className="mb-4 text-xs text-text-muted">
            Código: <span className="font-mono">{error.digest}</span>
          </p>
        )}
        <Button onClick={reset} variant="primary" size="lg" className="w-full">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
