import { z } from "zod";

export const clienteSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  contato: z
    .string()
    .min(10, "Informe um telefone válido com DDD (mínimo 10 dígitos)"),
});

export const veiculoSchema = z.object({
  placa: z
    .string()
    .min(7, "Placa inválida (7 caracteres)")
    .max(7, "Placa inválida"),
  marcaModelo: z.string().min(2, "Informe a marca e modelo do veículo"),
});

export const enderecoSchema = z.object({
  cep: z.string().min(8, "CEP inválido (8 dígitos)"),
  rua: z.string().min(3, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  estado: z.string().length(2, "UF deve ter 2 letras"),
});

export const servicoDadosSchema = z.object({
  tecnico: z.string().min(1, "Selecione o técnico responsável"),
  data: z.string().min(10, "Informe uma data válida"),
  horario: z.string().min(1, "Selecione um horário"),
  tipoServico: z.string().min(1, "Selecione o tipo de serviço"),
  status: z.string().default("PENDENTE"),
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