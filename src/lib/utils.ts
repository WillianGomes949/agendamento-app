// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StatusServico } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarPlaca(placa: string): string {
  if (!placa) return "";
  return placa.toString().toUpperCase().replace(/[^\w]/g, "");
}

export function formatarContato(contato: unknown): string {
  const digits = contato?.toString().replace(/\D/g, "") || "";
  
  // Alinhado com o schema (10 ou 11 dígitos)
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  
  // Retorna o original se não for válido (fallback)
  return contato?.toString() || "";
}

export function getStatusColor(status: StatusServico): string {
  const colors: Record<StatusServico, string> = {
    pendente: "bg-yellow-100 text-yellow-800 border-yellow-200",
    aguardando: "bg-blue-100 text-blue-800 border-blue-200",
    concluido: "bg-green-100 text-green-800 border-green-200",
    cancelado: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}