// src/lib/schemas.ts
import { z } from 'zod';

export const formularioServicoSchema = z.object({
  tecnico: z.string().min(2, "Técnico é obrigatório"),
  data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Formato inválido. Use DD/MM/YYYY"),
  horario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato inválido. Use HH:MM (ex: 14:30)"),
  tipoServico: z.string().min(3, "Informe o tipo de serviço"),
  observacao: z.string().max(500, "Máximo de 500 caracteres").optional().default(""),
  
  cliente: z.object({
    nome: z.string().min(3, "Nome do cliente é obrigatório"),
    contato: z.string().regex(/^\d{10,11}$/, "Contato deve ter 10 ou 11 dígitos")
  }),
  
  veiculo: z.object({
    placa: z.string().regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, "Placa inválida (ex: ABC1D23 ou ABC1234)"),
    marcaModelo: z.string().min(2, "Marca/Modelo é obrigatório")
  }),
  
  endereco: z.object({
    rua: z.string().min(3, "Rua é obrigatória"),
    numero: z.string().min(1, "Número é obrigatório"),
    bairro: z.string().min(2, "Bairro é obrigatório"),
    cidade: z.string().min(2, "Cidade é obrigatória"),
    estado: z.string().length(2, "Use a sigla do estado (ex: CE, SP)"),
    cep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos")
  })
});

export type FormularioSchema = z.infer<typeof formularioServicoSchema>;