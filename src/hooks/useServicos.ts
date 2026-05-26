// src/hooks/useServicos.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchServicos, criarServico, atualizarServico, removerServico } from "@/app/actions";
import type { Servico, FormularioServico } from "@/lib/types";

export function useServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchServicos();
      setServicos(data);
      setError(null);
    } catch {
      setError("Falha ao carregar dados da planilha");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async (data: FormularioServico) => { await criarServico(data); await load(); };
  const update = async (id: number, data: Partial<Servico>) => { await atualizarServico(id, data); await load(); };
  const remove = async (id: number) => { await removerServico(id); await load(); };

  const datasDisponiveis = useMemo(() =>
    [...new Set(servicos.map(s => s.data))].sort((a, b) => {
      const [d1, m1, y1] = a.split('/').map(Number);
      const [d2, m2, y2] = b.split('/').map(Number);
      return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
    }), [servicos]);

  const tecnicos = useMemo(() => [...new Set(servicos.map(s => s.tecnico))], [servicos]);

  return { servicos, loading, error, create, update, remove, refresh: load, datasDisponiveis, tecnicos };
}