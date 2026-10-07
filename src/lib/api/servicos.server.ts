// src/lib/api/servicos.server.ts
// Operações server-side de serviços.

import "server-only";

import { fetchGas } from "@/lib/gas/client";
import { GAS_ACTIONS } from "@/lib/gas/types";
import type { GasResponse } from "@/lib/gas/types";
import type { ServicoFiltros } from "./servicos.types";

export async function listarServicos<T = unknown>(
  filtros: ServicoFiltros,
): Promise<GasResponse<T[]>> {
  return fetchGas<T[]>(GAS_ACTIONS.GET, filtros as Record<string, unknown>);
}

export async function criarServico<T = unknown>(
  payload: Record<string, unknown>,
): Promise<GasResponse<T>> {
  return fetchGas<T>(GAS_ACTIONS.CREATE, payload);
}

export async function atualizarServico<T = unknown>(
  payload: Record<string, unknown>,
): Promise<GasResponse<T>> {
  return fetchGas<T>(GAS_ACTIONS.UPDATE, payload);
}

export async function excluirServico<T = unknown>(
  payload: Record<string, unknown>,
): Promise<GasResponse<T>> {
  return fetchGas<T>(GAS_ACTIONS.DELETE, payload);
}

export async function getHorariosOcupados(params: {
  tecnico: string;
  data: string;
  excludeId?: string;
}): Promise<string[]> {
  const result = await fetchGas<string[]>(
    GAS_ACTIONS.GET_HORARIOS_OCUPADOS,
    params as Record<string, unknown>,
  );
  return result.data ?? [];
}