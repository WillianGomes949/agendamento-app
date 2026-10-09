// src/lib/api/config.server.ts
// Operações server-side de configuração.

import "server-only";

import { fetchApi } from "@/lib/Api-agendamento/client";
import { API_ACTIONS } from "@/lib/Api-agendamento/types";

export const TIPO_TO_ACTION = {
  status: API_ACTIONS.GET_STATUS,
  tecnicos: API_ACTIONS.GET_TECNICOS,
  tipos: API_ACTIONS.GET_TIPOS,
  horarios: API_ACTIONS.GET_HORARIOS,
} as const;

export type TipoConfig = keyof typeof TIPO_TO_ACTION;

export function isTipoConfig(value: string): value is TipoConfig {
  return value in TIPO_TO_ACTION;
}

export async function getConfig<T = unknown>(
  tipo: TipoConfig,
): Promise<unknown[]> {
  const action = TIPO_TO_ACTION[tipo];
  const result = await fetchApi<unknown[]>(action);
  return result.data ?? [];
}