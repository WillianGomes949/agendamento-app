// src/app/error.tsx
"use client";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="max-w-md w-full bg-bg-elevated p-8 rounded-2xl shadow-lg border border-border text-center">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Algo deu errado</h2>
        <p className="text-text-muted mb-6">
          {error.message || "Ocorreu um erro inesperado."}
        </p>
        <button
          onClick={reset}
          className="w-full py-3 px-4 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
