// src/lib/types.ts
// Tipos centralizados — alinhados com o backend Google Apps Script / WordPress
import type { z } from "zod";
import type { statusServicoEnum, formularioServicoSchema } from "./schemas";

export type StatusServico = z.infer<typeof statusServicoEnum>;
export type FormularioServico = z.infer<typeof formularioServicoSchema>;

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

export interface Servico {
  id: string;
  tecnico: string;
  data: string; // Formato DD/MM/AAAA retornado pela API
  diaSemana: string;
  horario: string; // Formato HH:MM
  tipoServico: string;
  ordemServico?: string | null;
  observacao?: string | null;
  cliente: Cliente;
  veiculo: Veiculo;
  endereco: Endereco;
  status: StatusServico;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Tecnico {
  nome: string;
  ativo: boolean;
  cpf: string;
  cnpj: string;
  whatsapp: string;
  vinculo: string;
  totalServicos?: number;
  servicosConcluidos?: number;
  servicosPendentes?: number;
}

export interface FiltrosServicos {
  busca?: string;
  data?: string; // Formato DD/MM/AAAA
  status?: StatusServico | string;
  tecnico?: string;
  clienteNome?: string;
  cidade?: string;
  veiculoPlaca?: string;
  dataInicio?: string; // Formato DD/MM/AAAA
  dataFim?: string; // Formato DD/MM/AAAA
  page?: number;
  pageSize?: number;
  sortBy?: "data" | "horario" | "tecnico" | "status" | "clienteNome";
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
  _timestamp?: string;
}

export interface StatsResponse {
  total: number;
  porStatus: Record<string, number>;
  porTecnico: Record<string, number>;
  porTipoServico: Record<string, number>;
  porDiaSemana: Record<string, number>;
  porMes: Record<string, number>;
}
