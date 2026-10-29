import { z } from "zod";

// Enum de Status alinhado com o backend (tabela agendamentos_config)
export const statusServicoEnum = z.enum([
  "PENDENTE",
  "EM ANDAMENTO",
  "CONCLUIDO",
  "CANCELADO",
  "DELETADO",
]);

export const clienteSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  contato: z
    .string()
    .min(10, "Informe um telefone válido com DDD (mínimo 10 dígitos)")
    .regex(/^\d+$/, "O contato deve conter apenas números"),
});

export const veiculoSchema = z.object({
  placa: z
    .string()
    .min(7, "Placa deve ter 7 caracteres")
    .max(8, "Placa inválida")
    // Aceita formato antigo (ABC1234) e Mercosul (ABC1D23)
    .regex(
      /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/i,
      "Formato de placa inválido (Ex: ABC1234 ou ABC1D23)",
    ),
  marcaModelo: z.string().min(2, "Informe a marca e modelo do veículo"),
});

// Lista de UFs batendo com a função agendamento_ufs() do backend
const ufsValidas = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export const enderecoSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, "CEP inválido (deve conter 8 dígitos)"),
  rua: z.string().min(3, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  estado: z.string().refine((val) => ufsValidas.includes(val.toUpperCase()), {
    message: "UF inválida",
  }),
});

export const servicoDadosSchema = z.object({
  tecnico: z.string().min(1, "Selecione o técnico responsável"),
  data: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato DD/MM/AAAA"),
  horario: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário inválido (use HH:MM)"),
  tipoServico: z.string().min(1, "Selecione o tipo de serviço"),
  status: statusServicoEnum.default("PENDENTE"),
  ordemServico: z.string().nullable().optional(),
});

// Schema completo do formulário
export const formularioServicoSchema = servicoDadosSchema.extend({
  cliente: clienteSchema,
  veiculo: veiculoSchema,
  endereco: enderecoSchema,
  observacao: z.string().optional().nullable(),
});

// Schemas específicos para validação por etapa (Wizard)
export const STEP_SCHEMAS = [
  servicoDadosSchema,
  z.object({ cliente: clienteSchema, veiculo: veiculoSchema }),
  z.object({ endereco: enderecoSchema }),
  formularioServicoSchema,
];

export type FormularioSchema = z.infer<typeof formularioServicoSchema>;
export type StatusServicoType = z.infer<typeof statusServicoEnum>;
