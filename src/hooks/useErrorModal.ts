// src/hooks/useErrorModal.ts
import { useState, useCallback } from "react";
import { parseErrorMessage } from "@/lib/error-parser";

interface ErrorModalState {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  httpStatus?: number;
}

export function useErrorModal() {
  const [state, setState] = useState<ErrorModalState>({
    isOpen: false,
    title: "Erro",
    message: "",
    details: undefined,
    httpStatus: undefined,
  });

  const showError = useCallback((error: unknown, customTitle?: string) => {
    const rawMessage =
      error instanceof Error ? error.message : String(error);
    
    const parsed = parseErrorMessage(rawMessage);
    
    setState({
      isOpen: true,
      title: customTitle || parsed.title || "Ops! Algo deu errado",
      message: parsed.message,
      details: parsed.details,
      httpStatus: parsed.httpStatus,
    });
  }, []);

  const closeModal = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    errorModal: state,
    showError,
    closeModal,
  };
}