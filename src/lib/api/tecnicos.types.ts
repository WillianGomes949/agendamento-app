// src/lib/api/tecnicos.types.ts
export interface Tecnico {
  nome: string;
  ativo: boolean;
  cpf?: string;
  cnpj?: string;
  whatsapp?: string;
  vinculo?: string;
}

export interface TecnicoStats extends Tecnico {
  totalServicos: number;
  servicosConcluidos: number;
  servicosPendentes: number;
}

export function normalizarTecnico(item: unknown): Tecnico | null {
  if (typeof item === "string") {
    const nome = item.trim();
    return nome ? { nome, ativo: true } : null;
  }
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const nome = String(obj.nome ?? "").trim();
    if (!nome) return null;

    const ativoRaw = obj.ativo;
    const ativo =
      ativoRaw === undefined ||
      ativoRaw === true ||
      ["true", "sim", "yes", "1", "x"].includes(String(ativoRaw).toLowerCase());

    const tecnico: Tecnico = { nome, ativo };
    if (obj.cpf !== undefined) tecnico.cpf = String(obj.cpf).trim();
    if (obj.cnpj !== undefined) tecnico.cnpj = String(obj.cnpj).trim();
    if (obj.whatsapp !== undefined) tecnico.whatsapp = String(obj.whatsapp).trim();
    if (obj.vinculo !== undefined) tecnico.vinculo = String(obj.vinculo).trim();

    return tecnico;
  }
  return null;
}

export function normalizarListaTecnicos(items: unknown[]): Tecnico[] {
  return items.map(normalizarTecnico).filter((t): t is Tecnico => t !== null);
}