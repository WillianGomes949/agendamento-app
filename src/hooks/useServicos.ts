// src/hooks/useServicos.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getServicos,
  createServico,
  updateServico,
  deleteServico,
} from "@/lib/gas-api";
import {
  sanitizarDadosGAS,
} from "@/lib/utils-format";
import type { Servico, FormularioServico, FiltrosServicos } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 50;
const CACHE_KEY = "@TrackApp:servicos";
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos de cache

// Variável global para impedir requisições simultâneas aos serviços
let globalServicosPromise: Promise<any> | null = null;
let activeFiltersKey = "";

export function useServicos(initialFilters?: FiltrosServicos) {
  const [servicos, setServicos] = useState<Servico[]>([]);
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

      // Gerar chave única para os filtros atuais
      const currentFiltersStr = JSON.stringify({ ...filters, page });
      const cacheStorageKey = `${CACHE_KEY}_${currentFiltersStr}`;

      try {
        // 1. Tentar ler do SessionStorage (se não for atualização forçada)
        if (!forceRefresh) {
          const cached = sessionStorage.getItem(cacheStorageKey);
          if (cached) {
            const { data, meta: cachedMeta, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_TTL) {
              setServicos(data);
              if (cachedMeta) setMeta(cachedMeta);
              setLoading(false);
              return;
            }
          }
        }

        // 2. Deduplicação em memória: previne vários componentes de fazer o fetch ao mesmo tempo
        if (
          !globalServicosPromise ||
          forceRefresh ||
          activeFiltersKey !== currentFiltersStr
        ) {
          activeFiltersKey = currentFiltersStr;
          globalServicosPromise = getServicos({
            ...filters,
            page,
            pageSize: DEFAULT_PAGE_SIZE,
          });
        }

        const result = await globalServicosPromise;

        if (result.meta) {
          setMeta(result.meta);
        }

        const sanitizedData = (result.data || []).map((servico: any) => {
          // ✅ Sanitiza uma vez só — já converte Date → string
          const limpo = sanitizarDadosGAS(servico as Record<string, unknown>);

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
              nome: String(limpo.cliente?.nome ?? ""),
              contato: String(limpo.cliente?.contato ?? ""),
            },
            veiculo: {
              placa: String(limpo.veiculo?.placa ?? ""),
              marcaModelo: String(limpo.veiculo?.marcaModelo ?? ""),
            },
            endereco: {
              rua: String(limpo.endereco?.rua ?? ""),
              numero: String(limpo.endereco?.numero ?? ""),
              bairro: String(limpo.endereco?.bairro ?? ""),
              cidade: String(limpo.endereco?.cidade ?? ""),
              estado: String(limpo.endereco?.estado ?? ""),
              cep: String(limpo.endereco?.cep ?? ""),
            },
            status: String(limpo.status || "PENDENTE"),
            criadoEm: String(limpo.criadoEm ?? ""),
            atualizadoEm: String(limpo.atualizadoEm ?? ""),
          };
        });

        setServicos(sanitizedData);

        // 3. Guardar no SessionStorage
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

  // Limpa o cache todo sempre que fazemos uma alteração na DB (Criar, Editar, Apagar)
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

  // Adicionar no hook, antes do return:
  const servicosFiltrados = useMemo(() => {
    if (!filters || Object.keys(filters).length === 0) return servicos;

    return servicos.filter((s) => {
      // Busca textual
      if (filters.busca) {
        const busca = filters.busca.toLowerCase();
        const match =
          s.cliente.nome.toLowerCase().includes(busca) ||
          s.veiculo.placa.toLowerCase().includes(busca) ||
          s.endereco.cidade.toLowerCase().includes(busca) ||
          (s.ordemServico || "").toLowerCase().includes(busca);
        if (!match) return false;
      }

      // Data única
      if (filters.data && s.data !== filters.data) return false;

      // Intervalo de datas
      if (filters.dataInicio || filters.dataFim) {
        const parseBrDate = (br: string) => {
          const [d, m, y] = br.split("/").map(Number);
          return new Date(y, m - 1, d).getTime();
        };
        const dataServico = parseBrDate(s.data);

        if (filters.dataInicio && dataServico < parseBrDate(filters.dataInicio))
          return false;
        if (filters.dataFim && dataServico > parseBrDate(filters.dataFim))
          return false;
      }

      // Status
      if (filters.status && s.status !== filters.status) return false;

      // Técnico
      if (filters.tecnico && s.tecnico !== filters.tecnico) return false;

      return true;
    });
  }, [servicos, filters]);

  // Extrair de servicosFiltrados, não de servicos crus
  const datasDisponiveis = useMemo(() => {
    return [
      ...new Set(
        servicosFiltrados
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
  }, [servicosFiltrados]);

  const tecnicos = useMemo(() => {
    return [
      ...new Set(servicosFiltrados.map((s) => s.tecnico).filter(Boolean)),
    ];
  }, [servicosFiltrados]);

  // Retorno final
  return {
    servicos: servicosFiltrados, 
    error,
    meta: {
      total: servicosFiltrados.length,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      totalPages: Math.ceil(servicosFiltrados.length / DEFAULT_PAGE_SIZE) || 1,
    },
    filters,
    setFilters,
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
  };
}
