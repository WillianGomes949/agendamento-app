// src/components/modals/DeleteConfirmModal.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  itemName?: string;
  isLoading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar exclusão",
  message = "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.",
  itemName,
  isLoading = false,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lg"
          >
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
                  <AlertTriangle
                    className="h-5 w-5 text-rose-600 dark:text-rose-400"
                    aria-hidden
                  />
                </div>
                <div className="mt-0.5 flex-1">
                  <h3 className="text-base font-semibold leading-tight tracking-tight text-text">
                    {title}
                  </h3>
                  <div className="mt-2 text-sm leading-relaxed text-text-muted">
                    {message}{" "}
                    {itemName && (
                      <div className="mt-2 flex flex-col rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2">
                        <span className="block font-semibold text-rose-600 dark:text-rose-400">
                          {itemName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                  aria-label="Fechar modal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={onConfirm}
                  isLoading={isLoading}
                  icon={isLoading ? undefined : AlertTriangle}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? "Excluindo..." : "Excluir"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
