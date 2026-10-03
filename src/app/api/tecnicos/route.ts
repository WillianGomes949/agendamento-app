// src/app/api/tecnicos/route.ts
// Cliente HTTP para CRUD de técnicos

const API_BASE = '/api/config';

interface Tecnico {
  nome: string;
  ativo: boolean;
}

interface TecnicoStats {
  nome: string;
  totalServicos: number;
  servicosConcluidos: number;
  servicosPendentes: number;
}

async function apiFetch<T>(
  action: string,
  data?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'Erro desconhecido');
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  const result = await response.json();

  if (!result || result.success !== true) {
    const errorMsg = result?.error || 'Erro desconhecido do servidor';
    const details = result?.details;
    throw new Error(details ? `${errorMsg} (${details})` : errorMsg);
  }

  return result;
}

export async function getTecnicos(): Promise<Tecnico[]> {
  const response = await fetch(`${API_BASE}?tipo=tecnicos`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Falha ao carregar técnicos`);
  }
  const result = await response.json();
  if (!result || result.success !== true) {
    throw new Error(result?.error || 'Falha ao carregar técnicos');
  }
  return (result.data || []).map((nome: string) => ({ nome, ativo: true }));
}

export async function getTecnicosComStats(): Promise<TecnicoStats[]> {
  const response = await fetch(`${API_BASE}?tipo=tecnicos`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Falha ao carregar técnicos`);
  }
  const result = await response.json();
  if (!result || result.success !== true) {
    throw new Error(result?.error || 'Falha ao carregar técnicos');
  }

  // Busca também as estatísticas
  const statsResponse = await fetch('/api/servicos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'STATS', data: {} }),
    cache: 'no-store',
  });

  const tecnicos: string[] = result.data || [];
  const stats = statsResponse.ok ? await statsResponse.json() : null;

  return tecnicos.map((nome: string) => {
    const porTecnico = stats?.data?.porTecnico || {};
    const total = porTecnico[nome] || 0;
    return {
      nome,
      totalServicos: total,
      servicosConcluidos: 0, // Pode ser expandido com mais dados
      servicosPendentes: 0,
    };
  });
}

export async function createTecnico(nome: string): Promise<Tecnico> {
  const result = await apiFetch<{ data: Tecnico }>('CREATE_TECNICO', { nome });
  return result.data;
}

export async function updateTecnico(
  nomeAntigo: string,
  updates: { nome?: string; ativo?: boolean }
): Promise<Tecnico> {
  const result = await apiFetch<{ data: Tecnico }>('UPDATE_TECNICO', {
    nomeAntigo,
    ...updates,
  });
  return result.data;
}

export async function deleteTecnico(nome: string): Promise<void> {
  await apiFetch('DELETE_TECNICO', { nome });
}