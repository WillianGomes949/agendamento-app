// src/hooks/useServicos.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getServicos, createServico, updateServico, deleteServico } from "@/lib/gas-api";
import { sanitizarDadosGAS, formatarDataExibicao, formatarHorarioExibicao } from "@/lib/utils-format";
import type { Servico, FormularioServico, FiltrosServicos } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 50;

export function useServicos(initialFilters?: FiltrosServicos) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 });
  const [filters, setFilters] = useState<FiltrosServicos>(initialFilters || {});

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getServicos({ ...filters, page, pageSize: DEFAULT_PAGE_SIZE });

      if (result.meta) {
        setMeta(result.meta);
      }

      // ✅ Sanitiza dados do GAS para garantir strings corretas
      const sanitizedData = (result.data || []).map(servico => {
        const limpo = sanitizarDadosGAS(servico as Record<string, unknown>);

        return {
          id: String(limpo.id ?? ""),
          tecnico: String(limpo.tecnico ?? ""),
          data: formatarDataExibicao(limpo.data as string | Date),
          diaSemana: String(limpo.diaSemana ?? ""),
          horario: formatarHorarioExibicao(limpo.horario as string | Date),
          tipoServico: String(limpo.tipoServico ?? ""),
          ordemServico: limpo.ordemServico || null,
          observacao: limpo.observacao || null,
          cliente: {
            nome: String(limpo.cliente?.nome ?? ""),
            contato: String(limpo.cliente?.contato ?? "")
          },
          veiculo: {
            placa: String(limpo.veiculo?.placa ?? ""),
            marcaModelo: String(limpo.veiculo?.marcaModelo ?? "")
          },
          endereco: {
            rua: String(limpo.endereco?.rua ?? ""),
            numero: String(limpo.endereco?.numero ?? ""),
            bairro: String(limpo.endereco?.bairro ?? ""),
            cidade: String(limpo.endereco?.cidade ?? ""),
            estado: String(limpo.endereco?.estado ?? ""),
            cep: String(limpo.endereco?.cep ?? "")
          },
         status: String(limpo.status || "PENDENTE") as any,
          criadoEm: String(limpo.criadoEm ?? ""),
          atualizadoEm: String(limpo.atualizadoEm ?? "")
        };
      });

      setServicos(sanitizedData);
      setError(null);
    } catch (err) {
      console.error("[useServicos] Erro ao carregar:", err);
      setError(err instanceof Error ? err.message : "Falha ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (data: FormularioServico) => {
    setError(null);
    setIsCreating(true);
    try {
      await createServico(data);
      await load();
      return { success: true as const };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao criar serviço";
      setError(msg);
      console.error(err);
      return { success: false as const, error: msg };
    } finally {
      setIsCreating(false);
    }
  }, [load]);

  const update = useCallback(async (id: string, data: Partial<Servico>) => {
    setError(null);
    setIsUpdating(true);
    try {
      await updateServico(id, data);
      await load();
      return { success: true as const };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao atualizar serviço";
      setError(msg);
      console.error(err);
      return { success: false as const, error: msg };
    } finally {
      setIsUpdating(false);
    }
  }, [load]);

  const remove = useCallback(async (id: string) => {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteServico(id);
      await load();
      return { success: true as const };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao remover serviço";
      setError(msg);
      console.error(err);
      return { success: false as const, error: msg };
    } finally {
      setIsDeleting(false);
    }
  }, [load]);

  const setPage = useCallback((page: number) => {
    load(page);
  }, [load]);

  const datasDisponiveis = useMemo(() =>
    [...new Set(servicos
      .filter(s => s.data && /^\d{2}\/\d{2}\/\d{4}$/.test(s.data))
      .map(s => s.data)
    )].sort((a, b) => {
      const [d1, m1, y1] = a.split('/').map(Number);
      const [d2, m2, y2] = b.split('/').map(Number);
      return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
    }), [servicos]);

  const tecnicos = useMemo(() => 
    [...new Set(servicos.map(s => s.tecnico).filter(Boolean))], 
    [servicos]
  );

  return {
    servicos,
    loading,
    error,
    meta,
    filters,
    setFilters,
    setPage,
    create,
    update,
    remove,
    refresh: load,
    datasDisponiveis,
    tecnicos,
    isCreating,
    isUpdating,
    isDeleting,
  };
}