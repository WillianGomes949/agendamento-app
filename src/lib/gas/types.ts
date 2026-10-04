// src/lib/gas/types.ts
// Tipos compartilhados entre handlers e clientes.

/** Payload aceito pelo GAS. */
export interface GasRequestPayload {
  action: string;
  data?: Record<string, unknown>;
}

/** Resposta padrão do GAS (sempre HTTP 200 no transporte). */
export interface GasResponse<T = unknown> {
  success: boolean;
  requestId?: string;
  data?: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  error?: string;
  details?: string;
  /** Status lógico real da operação (não o HTTP do transporte). */
  _httpStatus?: number;
  _timestamp?: string;
}

/** Ações suportadas pela API. */
export const GAS_ACTIONS = {
  // CRUD de serviços
  GET: "GET",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  STATS: "STATS",
  // Configuração
  GET_STATUS: "GET_STATUS",
  GET_TECNICOS: "GET_TECNICOS",
  GET_TIPOS: "GET_TIPOS",
  GET_HORARIOS: "GET_HORARIOS",
  // CRUD de técnicos
  GET_TECNICOS_COM_STATS: "GET_TECNICOS_COM_STATS",
  CREATE_TECNICO: "CREATE_TECNICO",
  UPDATE_TECNICO: "UPDATE_TECNICO",
  DELETE_TECNICO: "DELETE_TECNICO",
} as const;

export type GasAction = (typeof GAS_ACTIONS)[keyof typeof GAS_ACTIONS];
