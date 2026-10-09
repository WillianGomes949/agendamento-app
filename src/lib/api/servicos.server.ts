// src/lib/api/servicos.server.ts
// Operações server-side de serviços.

import "server-only";

import { fetchApi } from "@/lib/Api-agendamento/client";
import { API_ACTIONS } from "@/lib/Api-agendamento/types";
import type { ApiResponse } from "@/lib/Api-agendamento/types";
import type { ServicoFiltros } from "./servicos.types";

export async function listarServicos<T = unknown>(
  filtros: ServicoFiltros,
): Promise<ApiResponse<T[]>> {
  return fetchApi<T[]>(API_ACTIONS.GET, filtros as Record<string, unknown>);
}

export async function criarServico<T = unknown>(
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(API_ACTIONS.CREATE, payload);
}

export async function atualizarServico<T = unknown>(
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(API_ACTIONS.UPDATE, payload);
}

export async function excluirServico<T = unknown>(
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(API_ACTIONS.DELETE, payload);
}

export async function getHorariosOcupados(params: {
  tecnico: string;
  data: string;
  excludeId?: string;
}): Promise<string[]> {
  const result = await fetchApi<string[]>(
    API_ACTIONS.GET_HORARIOS_OCUPADOS,
    params as Record<string, unknown>,
  );
  return result.data ?? [];
}