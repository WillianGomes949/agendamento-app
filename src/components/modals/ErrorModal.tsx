// src/components/modals/ErrorModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { getErrorColor, parseErrorMessage } from "@/lib/error-parser";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string;
  httpStatus?: number;
  onRetry?: () => void;
}

export function ErrorModal({
  isOpen,
  onClose,
  title: customTitle,
  message: rawMessage,
  details: rawDetails,
  httpStatus: rawStatus,
  onRetry,
}: ErrorModalProps) {
  const [copied, setCopied] = useState(false);

  const parsed = parseErrorMessage(rawMessage);
  const message = parsed.message;
  const details = rawDetails ?? parsed.details;
  const httpStatus = rawStatus ?? parsed.httpStatus;
  const title = customTitle || "Ops! Algo deu errado";

  const color = getErrorColor(httpStatus);

  const handleCopy = async () => {
    const textToCopy = details
      ? `${title}: ${message}\n\nDetalhes: ${details}`
      : `${title}: ${message}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-bg-elevated rounded-2xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              {/* Header com Ícone */}
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    color === "amber"
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
                      : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                  }`}
                >
                  <AlertCircle
                    className={`w-6 h-6 ${
                      color === "amber"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-text leading-tight">
                      {customTitle || "Ops! Algo deu errado"}
                    </h3>
                    <button
                      onClick={onClose}
                      className="shrink-0 p-1.5 text-text-muted hover:text-text hover:bg-bg-muted rounded-xl transition-colors"
                      aria-label="Fechar modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              {/* Detalhes Técnicos (opcional) */}
              {details && (
                <div className="mt-4 p-3 bg-bg-muted rounded-xl border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      Detalhes técnicos
                    </p>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-text-muted hover:text-text bg-bg-elevated border border-border rounded-lg transition-colors"
                      title="Copiar detalhes"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-text break-all whitespace-pre-wrap leading-relaxed">
                    {details}
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-text bg-bg-muted hover:bg-bg border border-border rounded-xl transition-colors"
                >
                  Fechar
                </button>
                {onRetry && (
                  <button
                    onClick={() => {
                      onRetry();
                      onClose();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent/90 rounded-xl transition-colors shadow-sm"
                  >
                    Tentar Novamente
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
