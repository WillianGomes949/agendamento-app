// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarContato(contato: string): string {
  if (!contato) return "";
  const numeros = contato.replace(/\D/g, "");
  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }
  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }
  return contato;
}

export function formatarPlaca(placa: string): string {
  if (!placa) return "";
  const limpa = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (limpa.length === 7) {
    // Formato Mercosul: ABC1D23
    return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
  }
  if (limpa.length === 6) {
    // Formato antigo: ABC-1234 (com um zero implícito)
    return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
  }
  return limpa;
}

export function formatarCep(cep: string): string {
  if (!cep) return "";
  const numeros = cep.replace(/\D/g, "");
  if (numeros.length === 8) {
    return `${numeros.slice(0, 5)}-${numeros.slice(5)}`;
  }
  return cep;
}

export function validarDataBR(data: string): boolean {
  if (!data) return false;
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(data)) return false;
  const [dia, mes, ano] = data.split("/").map(Number);
  const date = new Date(ano, mes - 1, dia);
  return (
    date.getFullYear() === ano &&
    date.getMonth() === mes - 1 &&
    date.getDate() === dia
  );
}