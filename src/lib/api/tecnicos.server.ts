// src/lib/api/tecnicos.server.ts
// Operações server-side de técnicos.
import "server-only";
import { unstable_cache } from "next/cache";
import { fetchApi } from "@/lib/Api-agendamento/client";
import { API_ACTIONS } from "@/lib/Api-agendamento/types";
import type { ApiResponse } from "@/lib/Api-agendamento/types";

export async function getTecnicosComStats(): Promise<ApiResponse<unknown[]>> {
  return fetchApi<unknown[]>(API_ACTIONS.GET_TECNICOS_COM_STATS);
}

export async function getTecnicos(): Promise<ApiResponse<unknown[]>> {
  return fetchApi<unknown[]>(API_ACTIONS.GET_TECNICOS);
}

export async function createTecnico<T = unknown>(
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(API_ACTIONS.CREATE_TECNICO, payload);
}

export async function updateTecnico<T = unknown>(
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(API_ACTIONS.UPDATE_TECNICO, payload);
}

export async function deleteTecnico<T = unknown>(
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(API_ACTIONS.DELETE_TECNICO, payload);
}

// Cache para lista de técnicos com stats (usado em páginas que precisam de dados frescos)
export const getTecnicosComStatsCached = unstable_cache(
  async (): Promise<unknown[]> => {
    const result = await getTecnicosComStats();
    return result.data ?? [];
  },
  ["tecnicos-com-stats"],
  { revalidate: 30, tags: ["tecnicos"] },
);