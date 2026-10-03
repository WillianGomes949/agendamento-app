// src/app/api/tecnicos/route.ts
// Cliente HTTP para CRUD de técnicos — todas as chamadas via POST

const API_BASE = "/api/config";

export interface Tecnico {
  nome: string;
  ativo: boolean;
}

export interface TecnicoStats {
  nome: string;
  ativo: boolean;
  totalServicos: number;
  servicosConcluidos: number;
  servicosPendentes: number;
}

/**
 * Cliente genérico para o Apps Script.
 * Todas as ações usam POST com { action, data }.
 */
async function apiFetch<T>(
  action: string,
  data?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Erro desconhecido");
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  const result = await response.json();

  // Apps Script sempre retorna 200, mas o status lógico vem no body
  if (result?._httpStatus && result._httpStatus >= 400) {
    throw new Error(
      result.details
        ? `${result.error || "Erro"} (${result.details})`
        : result.error || "Erro desconhecido do servidor",
    );
  }

  if (!result || result.success !== true) {
    const errorMsg = result?.error || "Erro desconhecido do servidor";
    const details = result?.details;
    throw new Error(details ? `${errorMsg} (${details})` : errorMsg);
  }

  return result;
}

/**
 * Normaliza um item bruto da API em { nome, ativo }.
 * Suporta tanto string[] (legado) quanto { nome, ativo }[] (novo).
 */
function normalizarTecnico(
  item: unknown,
): { nome: string; ativo: boolean } | null {
  if (typeof item === "string") {
    const nome = item.trim();
    return nome ? { nome, ativo: true } : null;
  }
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const nome = String(obj?.nome ?? "").trim();
    if (!nome) return null;
    const ativoRaw = obj?.ativo;
    const ativo =
      ativoRaw === undefined ||
      ativoRaw === true ||
      ["true", "sim", "yes", "1", "x"].includes(String(ativoRaw).toLowerCase());
    return { nome, ativo };
  }
  return null;
}

/**
 * Lista todos os técnicos (ativos e inativos).
 * Usa GET_TECNICOS via POST — o endpoint /api/config só aceita POST.
 */
export async function getTecnicos(): Promise<Tecnico[]> {
  const result = await apiFetch<{ data: unknown[] }>('GET_TECNICOS', {});
  return (result.data || []).map((item: unknown) => {
    if (typeof item === 'string') {
      return { nome: item.trim(), ativo: true };
    }
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      return {
        nome: String(obj?.nome ?? '').trim(),
        ativo: obj?.ativo !== false,
      };
    }
    return null;
  }).filter((t): t is Tecnico => t !== null);
}

/**
 * Lista técnicos com estatísticas de serviços.
 */
export async function getTecnicosComStats(): Promise<TecnicoStats[]> {
  // 1) Busca técnicos via POST
  const tecnicosResult = await apiFetch<{ data: unknown[] }>('GET_TECNICOS', {});

  // 2) Busca estatísticas
  let porTecnico: Record<string, number> = {};
  try {
    const statsResult = await apiFetch<{
      data: { porTecnico?: Record<string, number> };
    }>('STATS', {});
    porTecnico = statsResult.data?.porTecnico || {};
  } catch {
    // stats opcional
  }

  // 3) Normaliza e mapeia
  return (tecnicosResult.data || [])
    .map((item: unknown) => {
      if (typeof item === 'string') {
        return { nome: item.trim(), ativo: true };
      }
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const nome = String(obj?.nome ?? '').trim();
        const ativo = obj?.ativo !== false;
        return nome ? { nome, ativo } : null;
      }
      return null;
    })
    .filter((t): t is { nome: string; ativo: boolean } => t !== null)
    .map((t) => ({
      nome: t.nome,
      ativo: t.ativo,
      totalServicos: porTecnico[t.nome] ?? 0,
      servicosConcluidos: 0,
      servicosPendentes: 0,
    }));
}

export async function createTecnico(nome: string): Promise<Tecnico> {
  const result = await apiFetch<{ data: Tecnico }>("CREATE_TECNICO", { nome });
  return result.data;
}

export async function updateTecnico(
  nomeAntigo: string,
  updates: { nome?: string; ativo?: boolean },
): Promise<Tecnico> {
  const result = await apiFetch<{ data: Tecnico }>("UPDATE_TECNICO", {
    nomeAntigo,
    ...updates,
  });
  return result.data;
}

export async function deleteTecnico(nome: string): Promise<void> {
  await apiFetch("DELETE_TECNICO", { nome });
}
