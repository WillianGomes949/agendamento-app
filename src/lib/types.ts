// src/lib/types.ts
// Tipos centralizados — alinhados com o backend Google Apps Script
// src/lib/types.ts
import type { z } from "zod";
import type { statusServicoEnum, formularioServicoSchema } from "./schemas";

export type StatusServico = z.infer<typeof statusServicoEnum>;
export type FormularioServico = z.infer<typeof formularioServicoSchema>;

export interface Servico {
  id: string;
  tecnico: string;
  data: string;
  diaSemana: string;
  horario: string;
  tipoServico: string;
  ordemServico?: string;
  observacao?: string;
  cliente: { nome: string; contato: string };
  veiculo: { placa: string; marcaModelo: string };
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  status: StatusServico;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Cliente {
  nome: string;
  contato: string;
}

export interface Veiculo {
  placa: string;
  marcaModelo: string;
}

export interface Endereco {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface FiltrosServicos {
  busca?: string;
  data?: string;
  status?: StatusServico;
  tecnico?: string;
  clienteNome?: string;
  veiculoPlaca?: string;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  success: boolean;
  requestId: string;
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  data: T[];
}

export interface ApiError {
  success: false;
  error: string;
  details?: string;
  requestId?: string;
  _httpStatus: number;
  _timestamp: string;
}