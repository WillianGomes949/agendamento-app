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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/60 shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div className="flex-1 mt-1">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    {message}{" "}
                    {itemName && (
                      <div className=" text-red-400 mt-2 gap-0 flex flex-col py-2 px-4 bg-red-50 rounded-xl border border-red-100">
                        <p>Agendamento de: </p>
                        <span className="font-bold text-red-500 block">
                          {itemName}
                        </span>
                      </div>
                    )}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-100 rounded-xl -mr-2"
                  aria-label="Fechar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
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
