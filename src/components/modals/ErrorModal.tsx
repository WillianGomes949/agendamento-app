// src/components/modals/ErrorModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, Copy, Check } from "lucide-react";
import { useState } from "react";
import { getErrorColor, parseErrorMessage } from "@/lib/error-parser";
import { Button } from "@/components/ui/Button";

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

  const isAmber = color === "amber";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
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
            className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lg"
          >
            <div className="p-5">
              {/* Header com Ícone */}
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                    isAmber
                      ? "border-amber-500/20 bg-amber-500/10"
                      : "border-rose-500/20 bg-rose-500/10"
                  }`}
                >
                  <AlertCircle
                    className={`h-5 w-5 ${
                      isAmber
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                    aria-hidden
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold leading-tight tracking-tight text-text">
                      {title}
                    </h3>
                    <button
                      onClick={onClose}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                      aria-label="Fechar modal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {message}
                  </p>
                </div>
              </div>

              {/* Detalhes Técnicos (opcional) */}
              {details && (
                <div className="mt-4 rounded-lg border border-border bg-bg-muted/40 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      Detalhes técnicos
                    </p>
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-elevated px-2 py-1 text-[10px] font-semibold text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                      title="Copiar detalhes"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-text">
                    {details}
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Fechar
                </Button>
                {onRetry && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      onRetry();
                      onClose();
                    }}
                    className="w-full sm:w-auto"
                  >
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
