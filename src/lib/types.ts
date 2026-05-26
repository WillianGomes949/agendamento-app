// src/lib/types.ts
export type StatusServico = 'pendente' | 'aguardando' | 'concluido' | 'cancelado';

export type DiaSemana = 
  | 'SEGUNDA' | 'TERÇA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SÁBADO' | 'DOMINGO';

export type TipoServico = 
  | 'SUBSTITUIÇÃO DE CHIP' 
  | 'INSTALAÇÃO' 
  | 'MANUTENÇÃO' 
  | 'RETIRADA' 
  | string; // Flexibilidade para variações do mock

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
  id: number;
  tecnico: string;
  data: string;          // DD/MM/YYYY
  diaSemana: DiaSemana;
  horario: string;       // HH:00
  tipoServico: TipoServico;
  ordemServico: string | null;
  observacao: string | null;
  cliente: Cliente;
  veiculo: Veiculo;
  endereco: Endereco;
  status: StatusServico;
}

export interface FiltrosServicos {
  data?: string;
  tecnico?: string;
  status?: StatusServico  | "";
  tipoServico?: TipoServico;
  busca?: string;
}

export interface FormularioServico {
   tecnico: string;
  data: string;
  horario: string;
  tipoServico: TipoServico;
  cliente: Cliente;
  veiculo: Veiculo;
  endereco: Endereco;
  observacao: string;
  status?: StatusServico;
}

