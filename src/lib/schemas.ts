// src/lib/schemas.ts
import { z } from "zod";

export const clienteSchema = z.object({
  nome: z.string().min(1, "Nome do cliente é obrigatório"),
  contato: z.string().min(10, "Contato deve ter pelo menos 10 dígitos").max(11, "Contato deve ter no máximo 11 dígitos"),
});

export const veiculoSchema = z.object({
  placa: z.string().min(6, "Placa inválida").max(7, "Placa inválida"),
  marcaModelo: z.string().min(1, "Marca/modelo é obrigatório"),
});

export const enderecoSchema = z.object({
  rua: z.string().min(1, "Rua é obrigatória"),
  numero: z.string().min(1, "Número é obrigatório"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres"),
  cep: z.string().length(8, "CEP deve ter 8 dígitos"),
});

export const formularioServicoSchema = z.object({
  tecnico: z.string().min(1, "Técnico é obrigatório"),
  data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato DD/MM/YYYY"),
  horario: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Horário deve estar no formato HH:MM"),
  tipoServico: z.string().min(1, "Tipo de serviço é obrigatório"),
  ordemServico: z.string().nullable().optional(),
  observacao: z.string().optional(),
  cliente: clienteSchema,
  veiculo: veiculoSchema,
  endereco: enderecoSchema,
});

export type FormularioSchema = z.infer<typeof formularioServicoSchema>;