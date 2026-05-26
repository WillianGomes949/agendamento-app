// src/lib/types.ts
// Tipos centralizados — alinhados com o backend Google Apps Script

export type StatusServico = 
  | "pendente" 
  | "em_andamento" 
  | "concluido" 
  | "cancelado" 
  | "deletado";

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
  data: string;
  diaSemana: string;
  horario: string;
  tipoServico: string;
  ordemServico: string | null;
  observacao: string | null;
  cliente: Cliente;
  veiculo: Veiculo;
  endereco: Endereco;
  status: StatusServico;
  criadoEm: string;
  atualizadoEm: string;
}

export interface FormularioServico {
  tecnico: string;
  data: string;
  horario: string;
  tipoServico: string;
  ordemServico?: string | null;
  observacao?: string | null;
  cliente: Cliente;
  veiculo: Veiculo;
  endereco: Endereco;
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