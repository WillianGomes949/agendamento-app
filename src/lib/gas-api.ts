// src/lib/gas-api.ts
// Cliente HTTP para API Route interna (proxy para GAS)
// ✅ CORRETO: Chama /api/servicos em vez de GAS diretamente

import type { Servico, FormularioServico, FiltrosServicos, PaginatedResponse } from "./types";

const API_BASE = "/api/servicos";

// Helper genérico para fetch
async function apiFetch<T>(
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(API_BASE, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Erro desconhecido");
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  const result = await response.json();

  if (!result || result.success !== true) {
    const errorMsg = result?.error || "Erro desconhecido do servidor";
    const details = result?.details;
    throw new Error(details ? `${errorMsg} (${details})` : errorMsg);
  }

  return result;
}

// ─── CRUD Operations ───────────────────────────────────────

export async function getServicos(filters?: FiltrosServicos): Promise<PaginatedResponse<Servico>> {
  // Para GET com filtros, usamos query params
  const url = new URL(API_BASE, window.location.origin);
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Falha ao carregar serviços`);
  }
  const result = await response.json();
  if (!result || result.success !== true) {
    throw new Error(result?.error || "Falha ao carregar serviços");
  }
  return result;
}

export async function createServico(data: FormularioServico): Promise<{ success: boolean; id: string; data: Servico }> {
  return apiFetch("POST", { ...data });
}

export async function updateServico(id: string, data: Partial<Servico>): Promise<{ success: boolean; data: Servico }> {
  return apiFetch("PATCH", { id, ...data });
}

export async function deleteServico(id: string): Promise<{ success: boolean; message: string }> {
  return apiFetch("DELETE", { id });
}

export async function getStats(): Promise<{ success: boolean; data: Record<string, Record<string, number>> }> {
  const response = await fetch(`${API_BASE}/stats`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Falha ao carregar estatísticas`);
  }
  return response.json();
}