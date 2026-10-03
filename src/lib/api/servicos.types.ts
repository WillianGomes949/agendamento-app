// src/lib/api/servicos.types.ts
// Tipos isomórficos de serviços.

export interface ServicoFiltros {
  tecnico?: string;
  status?: string;
  data?: string;
  dataInicio?: string;
  dataFim?: string;
  tipoServico?: string;
  clienteNome?: string;
  veiculoPlaca?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}