// src/components/ExportButtons.tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FileDown,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { exportCSV, exportPDF, type ColumnDef } from "@/lib/exportUtils";
import { Button } from "@/components/ui/Button";

type ExportStatus = "idle" | "loading" | "success" | "error";

type Props<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  filename: string;
  title?: string;
  /** Exibe apenas ícones (compacto) */
  compact?: boolean;
  className?: string;
};

export function ExportButtons<T>({
  data,
  columns,
  filename,
  title,
  compact = false,
  className = "",
}: Props<T>) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [message, setMessage] = useState("");

  const resetStatus = () => {
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 3500);
  };

  const handleExport = useCallback(
    async (type: "csv" | "pdf") => {
      if (!data || data.length === 0) {
        setStatus("error");
        setMessage("Não há dados para exportar no período selecionado.");
        resetStatus();
        return;
      }

      try {
        setStatus("loading");
        await new Promise((r) => setTimeout(r, 250));

        const opts = { filename, title, columns, data };
        if (type === "csv") exportCSV(opts);
        else exportPDF(opts);

        setStatus("success");
        setMessage(
          `${type.toUpperCase()} exportado com sucesso (${data.length} registros).`,
        );
      } catch (err) {
        console.error("Erro ao exportar:", err);
        setStatus("error");
        setMessage("Falha ao gerar o arquivo. Tente novamente.");
      } finally {
        resetStatus();
      }
    },
    [data, columns, filename, title],
  );

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={FileText}
          onClick={() => handleExport("csv")}
          disabled={status === "loading"}
          aria-label="Exportar CSV"
           className="h-10 cursor-pointer appearance-none rounded-lg border border-border bg-bg-muted/30 px-3 text-sm font-medium text-text transition-colors hover:bg-green-600/50 focus:border-text focus:outline-none focus:ring-2 focus:ring-text/30 hover:text-green-800"
        >
          {compact ? (
            <span className="sr-only">CSV</span>
          ) : (
            <>
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          icon={FileDown}
          onClick={() => handleExport("pdf")}
          disabled={status === "loading"}
          aria-label="Exportar PDF"
           className="h-10 cursor-pointer appearance-none rounded-lg border border-border bg-bg-muted/30 px-3 text-sm font-medium text-text transition-colors hover:bg-amber-600/50 hover:text-amber-800 focus:border-text focus:outline-none focus:ring-2 focus:ring-text/30"
        >
          {compact ? (
            <span className="sr-only">PDF</span>
          ) : (
            <>
              <span className="hidden sm:inline">Exportar PDF</span>
              <span className="sm:hidden">PDF</span>
            </>
          )}
        </Button>

        {status === "loading" && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
        )}
      </div>

      {/* Feedback abaixo dos botões */}
      <AnimatePresence>
        {status !== "idle" && message && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`mt-2 flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium ${
              status === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : status === "error"
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  : "border-border bg-bg-muted/40 text-text-muted"
            }`}
            role="status"
            aria-live="polite"
          >
            {status === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : status === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Download
                className="h-4 w-4 shrink-0 animate-pulse"
                aria-hidden
              />
            )}
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
