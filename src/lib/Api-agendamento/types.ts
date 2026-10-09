// src/lib/API/types.ts
// Tipos compartilhados entre handlers e clientes.

/** Payload aceito pelo API. */
export interface ApiRequestPayload {
  action: string;
  data?: Record<string, unknown>;
  apiKey: string;
}

/** Resposta padrão do API (sempre HTTP 200 no transporte). */
export interface ApiResponse<T = unknown> {
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
export const API_ACTIONS = {
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
  GET_HORARIOS_OCUPADOS: "GET_HORARIOS_OCUPADOS",
} as const;

export type APIAction = (typeof API_ACTIONS)[keyof typeof API_ACTIONS];
