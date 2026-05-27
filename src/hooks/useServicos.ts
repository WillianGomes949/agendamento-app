// src/hooks/useServicos.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getServicos,
  createServico,
  updateServico,
  deleteServico,
} from "@/lib/gas-api";
import { sanitizarDadosGAS } from "@/lib/utils-format";
import type { Servico, FormularioServico, FiltrosServicos } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 50;
const CACHE_KEY = "@TrackApp:servicos";
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos de cache

// Variável global para impedir requisições simultâneas aos serviços
let globalServicosPromise: Promise<any> | null = null;
let activeFiltersKey = "";

/**
 * Converte data BR (DD/MM/YYYY) para timestamp UTC (timezone-safe)
 */
const parseBrDate = (br: string): number => {
  if (!br || !/^\d{2}\/\d{2}\/\d{4}$/.test(br)) return NaN;
  const [d, m, y] = br.split("/").map(Number);
  return Date.UTC(y, m - 1, d, 12, 0, 0);
};

/**
 * Verifica se uma data BR é válida
 */
const isValidBrDate = (date: string): boolean => {
  if (!date) return false;
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(date)) return false;

  const [day, month, year] = date.split("/").map(Number);
  const jsDate = new Date(year, month - 1, day);
  return (
    jsDate.getFullYear() === year &&
    jsDate.getMonth() === month - 1 &&
    jsDate.getDate() === day
  );
};

export function useServicos(initialFilters?: FiltrosServicos) {
  const [servicosRaw, setServicosRaw] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 1,
  });
  const [filters, setFilters] = useState<FiltrosServicos>(initialFilters || {});

  const load = useCallback(
    async (page = 1, forceRefresh = false) => {
      setLoading(true);
      setError(null);

      const currentFiltersStr = JSON.stringify({ ...filters, page });
      const cacheStorageKey = `${CACHE_KEY}_${currentFiltersStr}`;

      try {
        if (!forceRefresh) {
          const cached = sessionStorage.getItem(cacheStorageKey);
          if (cached) {
            const { data, meta: cachedMeta, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              setServicosRaw(data);
              if (cachedMeta) setMeta(cachedMeta);
              setLoading(false);
              return;
            }
          }
        }

        if (
          !globalServicosPromise ||
          forceRefresh ||
          activeFiltersKey !== currentFiltersStr
        ) {
          activeFiltersKey = currentFiltersStr;
          // API recebe apenas filtros que suporta
          const apiFilters = {
            page,
            pageSize: DEFAULT_PAGE_SIZE,
            ...(filters.status && { status: filters.status }),
            ...(filters.tecnico && { tecnico: filters.tecnico }),
            ...(filters.data && { data: filters.data }),
          };
          globalServicosPromise = getServicos(apiFilters);
        }

        const result = await globalServicosPromise;

        if (result.meta) {
          setMeta(result.meta);
        }

        const sanitizedData = (result.data || []).map((servico: any) => {
          const limpo = sanitizarDadosGAS(servico as Record<string, unknown>);

          const cliente = limpo.cliente as Record<string, unknown> | undefined;
          const veiculo = limpo.veiculo as Record<string, unknown> | undefined;
          const endereco = limpo.endereco as
            | Record<string, unknown>
            | undefined;

          return {
            id: String(limpo.id ?? ""),
            tecnico: String(limpo.tecnico ?? ""),
            data: String(limpo.data ?? ""),
            diaSemana: String(limpo.diaSemana ?? ""),
            horario: String(limpo.horario ?? ""),
            tipoServico: String(limpo.tipoServico ?? ""),
            ordemServico: limpo.ordemServico || null,
            observacao: limpo.observacao || null,
            cliente: {
              nome: String(cliente?.nome ?? ""),
              contato: String(cliente?.contato ?? ""),
            },
            veiculo: {
              placa: String(veiculo?.placa ?? ""),
              marcaModelo: String(veiculo?.marcaModelo ?? ""),
            },
            endereco: {
              rua: String(endereco?.rua ?? ""),
              numero: String(endereco?.numero ?? ""),
              bairro: String(endereco?.bairro ?? ""),
              cidade: String(endereco?.cidade ?? ""),
              estado: String(endereco?.estado ?? ""),
              cep: String(endereco?.cep ?? ""),
            },
            status: String(limpo.status || "PENDENTE"),
            criadoEm: String(limpo.criadoEm ?? ""),
            atualizadoEm: String(limpo.atualizadoEm ?? ""),
          };
        });
        setServicosRaw(sanitizedData);

        sessionStorage.setItem(
          cacheStorageKey,
          JSON.stringify({
            data: sanitizedData,
            meta: result.meta,
            timestamp: Date.now(),
          }),
        );
      } catch (err) {
        console.error("[useServicos] Erro ao carregar:", err);
        setError(
          err instanceof Error ? err.message : "Falha ao carregar dados",
        );
      } finally {
        globalServicosPromise = null;
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const clearCacheAndReload = async () => {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith(CACHE_KEY)) sessionStorage.removeItem(key);
    });
    await load(1, true);
  };

  const create = useCallback(
    async (data: FormularioServico) => {
      setError(null);
      setIsCreating(true);
      try {
        await createServico(data);
        await clearCacheAndReload();
        return { success: true as const };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Falha ao criar serviço";
        setError(msg);
        console.error(err);
        return { success: false as const, error: msg };
      } finally {
        setIsCreating(false);
      }
    },
    [load],
  );

  const update = useCallback(
    async (id: string, data: Partial<Servico>) => {
      setError(null);
      setIsUpdating(true);
      try {
        await updateServico(id, data);
        await clearCacheAndReload();
        return { success: true as const };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Falha ao atualizar serviço";
        setError(msg);
        console.error(err);
        return { success: false as const, error: msg };
      } finally {
        setIsUpdating(false);
      }
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      setError(null);
      setIsDeleting(true);
      try {
        await deleteServico(id);
        await clearCacheAndReload();
        return { success: true as const };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Falha ao remover serviço";
        setError(msg);
        console.error(err);
        return { success: false as const, error: msg };
      } finally {
        setIsDeleting(false);
      }
    },
    [load],
  );

  const setPage = useCallback(
    (page: number) => {
      load(page, false);
    },
    [load],
  );

  // FILTROS CLIENT-SIDE (aplicados sobre os dados da API)
  const servicos = useMemo(() => {
    if (!filters || Object.keys(filters).length === 0) return servicosRaw;

    return servicosRaw.filter((s) => {
      // Busca textual
      if (filters.busca) {
        const busca = filters.busca.toLowerCase().trim();
        if (!busca) return true;
        const match =
          s.cliente.nome.toLowerCase().includes(busca) ||
          s.veiculo.placa.toLowerCase().includes(busca) ||
          s.endereco.cidade.toLowerCase().includes(busca) ||
          (s.ordemServico || "").toLowerCase().includes(busca);

        if (!match) return false;
      }

      // Data única
      if (filters.data && s.data !== filters.data) return false;

      // Intervalo de datas — CORRIGIDO: comparação UTC segura
      if (filters.dataInicio || filters.dataFim) {
        if (!s.data || !isValidBrDate(s.data)) return false;

        const dataServico = parseBrDate(s.data);
        if (isNaN(dataServico)) return false;

        if (filters.dataInicio && isValidBrDate(filters.dataInicio)) {
          const dataInicio = parseBrDate(filters.dataInicio);
          if (!isNaN(dataInicio) && dataServico < dataInicio) return false;
        }

        if (filters.dataFim && isValidBrDate(filters.dataFim)) {
          const dataFim = parseBrDate(filters.dataFim);
          if (!isNaN(dataFim) && dataServico > dataFim) return false;
        }
      }

      // Status
      if (filters.status && s.status !== filters.status) return false;

      // Técnico
      if (filters.tecnico && s.tecnico !== filters.tecnico) return false;

      return true;
    });
  }, [servicosRaw, filters]);

  // Extrair datas disponíveis dos serviços FILTRADOS
  const datasDisponiveis = useMemo(() => {
    return [
      ...new Set(
        servicos
          .filter((s) => s.data && /^\d{2}\/\d{2}\/\d{4}$/.test(s.data))
          .map((s) => s.data),
      ),
    ].sort((a, b) => {
      const [d1, m1, y1] = a.split("/").map(Number);
      const [d2, m2, y2] = b.split("/").map(Number);
      return (
        new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime()
      );
    });
  }, [servicos]);

  const tecnicos = useMemo(() => {
    return [...new Set(servicos.map((s) => s.tecnico).filter(Boolean))];
  }, [servicos]);

  // META baseada nos serviços filtrados (para contagem de cards na tela)
  const metaFiltrada = useMemo(() => {
    const total = servicos.length;
    return {
      total,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      totalPages: Math.ceil(total / DEFAULT_PAGE_SIZE) || 1,
    };
  }, [servicos]);

  // Contagem de agendamentos pendentes (não concluídos)
   const agendamentosPendentes = useMemo(() => {
    return servicos.filter((s) => {
      const status = s.status?.toUpperCase() || "";
      return status !== "CONCLUIDO" && status !== "FINALIZADO" && status !== "CANCELADO";
    }).length;
  }, [servicos]);

  return {
    servicos, // ← já filtrados
    error,
    meta: metaFiltrada, // ← total reflete servicos.length
    filters, // ← exposto para a página usar
    setFilters, // ← exposto para a página usar
    loading,
    setPage,
    create,
    update,
    remove,
    refresh: clearCacheAndReload,
    datasDisponiveis,
    tecnicos,
    isCreating,
    isUpdating,
    isDeleting,
    agendamentosPendentes,
  };
}
