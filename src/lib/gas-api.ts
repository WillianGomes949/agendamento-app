// src/lib/gas-api.ts
import type { Servico, FormularioServico } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_GAS_API_URL;
if (!API_URL) throw new Error('Defina NEXT_PUBLIC_GAS_API_URL no .env.local');

async function request<T>(body: { action: string; data?: any }): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export const getServicos = () => request<any>({ action: 'GET' });
export const createServico = (data: FormularioServico) => request<{ success: boolean; id: number }>({ action: 'CREATE', data });
export const updateServico = (data: Partial<Servico>) => request<{ success: boolean }>({ action: 'UPDATE', data });
export const deleteServico = (id: number) => request<{ success: boolean }>({ action: 'DELETE', data: { id } });