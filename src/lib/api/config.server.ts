// src/lib/api/config.server.ts
// Operações server-side de configuração.

import "server-only";

import { fetchGas } from "@/lib/gas/client";
import { GAS_ACTIONS } from "@/lib/gas/types";

export const TIPO_TO_ACTION = {
  status: GAS_ACTIONS.GET_STATUS,
  tecnicos: GAS_ACTIONS.GET_TECNICOS,
  tipos: GAS_ACTIONS.GET_TIPOS,
  horarios: GAS_ACTIONS.GET_HORARIOS,
} as const;

export type TipoConfig = keyof typeof TIPO_TO_ACTION;

export function isTipoConfig(value: string): value is TipoConfig {
  return value in TIPO_TO_ACTION;
}

export async function getConfig<T = unknown>(
  tipo: TipoConfig,
): Promise<unknown[]> {
  const action = TIPO_TO_ACTION[tipo];
  const result = await fetchGas<unknown[]>(action);
  return result.data ?? [];
}