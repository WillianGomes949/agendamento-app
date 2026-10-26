// src/hooks/useServicos.ts
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getServicos,
  createServico,
  updateServico,
  deleteServico,
} from "@/lib/api-agendamento";
import { sanitizarDadosAPI } from "@/lib/utils-format";
import type { Servico, FormularioServico, FiltrosServicos } from "@/lib/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { useMemo, useState } from "react";

const QUERY_KEY = "servicos";

function sanitizarServico(raw: any): Servico {
  const limpo = sanitizarDadosAPI(raw);
  const cliente = (limpo.cliente ?? {}) as Record<string, unknown>;
  const veiculo = (limpo.veiculo ?? {}) as Record<string, unknown>;
  const endereco = (limpo.endereco ?? {}) as Record<string, unknown>;

  return {
    id: String(limpo.id ?? ""),
    tecnico: String(limpo.tecnico ?? ""),
    data: String(limpo.data ?? ""),
    diaSemana: String(limpo.diaSemana ?? ""),
    horario: String(limpo.horario ?? ""),
    tipoServico: String(limpo.tipoServico ?? ""),
    ordemServico:
      limpo.ordemServico != null ? String(limpo.ordemServico) : null,
    observacao: limpo.observacao != null ? String(limpo.observacao) : null,
    cliente: {
      nome: String(cliente.nome ?? ""),
      contato: String(cliente.contato ?? ""),
    },
    veiculo: {
      placa: String(veiculo.placa ?? ""),
      marcaModelo: String(veiculo.marcaModelo ?? ""),
    },
    endereco: {
      rua: String(endereco.rua ?? ""),
      numero: String(endereco.numero ?? ""),
      bairro: String(endereco.bairro ?? ""),
      cidade: String(endereco.cidade ?? ""),
      estado: String(endereco.estado ?? ""),
      cep: String(endereco.cep ?? ""),
    },
    status: String(limpo.status ?? "PENDENTE") as Servico["status"],
    criadoEm: String(limpo.criadoEm ?? ""),
    atualizadoEm: String(limpo.atualizadoEm ?? ""),
  };
}

const parseBrDate = (br: string): number => {
  if (!br || !/^\d{2}\/\d{2}\/\d{4}$/.test(br)) return NaN;
  const [d, m, y] = br.split("/").map(Number);
  return Date.UTC(y, m - 1, d, 12, 0, 0);
};

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

export function useServicos(initialFilters: FiltrosServicos = {}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FiltrosServicos>(initialFilters);
  const [page, setPage] = useState(1);

  const apiFilters = useMemo<FiltrosServicos>(
    () => ({
      page,
      pageSize: DEFAULT_PAGE_SIZE,
      ...(filters.status && { status: filters.status }),
      ...(filters.tecnico && { tecnico: filters.tecnico }),
      ...(filters.data && { data: filters.data }),
    }),
    [page, filters.status, filters.tecnico, filters.data],
  );

  const {
    data: rawData,
    isLoading,
    error,
    isPlaceholderData,
  } = useQuery({
    queryKey: [QUERY_KEY, apiFilters],
    queryFn: () => getServicos(apiFilters),
    placeholderData: keepPreviousData,
    select: (res) => ({
      ...res,
      data: (res.data ?? []).map(sanitizarServico),
    }),
  });

  const servicosRaw = (rawData?.data ?? []) as Servico[];

  // Filtros client-side (busca textual, intervalo de datas)
  const servicos = useMemo(() => {
    let result = servicosRaw;

    if (filters.busca) {
      const termo = filters.busca.toLowerCase().trim();
      result = result.filter((s) => {
        const alvo = [
          s.cliente?.nome,
          s.veiculo?.placa,
          s.endereco?.cidade,
          s.ordemServico ?? "",
          s.tecnico,
        ]
          .join(" ")
          .toLowerCase();
        return alvo.includes(termo);
      });
    }

    if (filters.dataInicio || filters.dataFim) {
      result = result.filter((s) => {
        if (!s.data) return false;
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
        return true;
      });
    }

    return result;
  }, [servicosRaw, filters.busca, filters.dataInicio, filters.dataFim]);

  // MUTATIONS
  const createMutation = useMutation({
    mutationFn: (payload: FormularioServico) => createServico(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & Partial<Servico>) =>
      updateServico(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });

  // Helpers derivados
  const datasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    servicos.forEach((s) => {
      if (s.data && /^\d{2}\/\d{2}\/\d{4}$/.test(s.data)) set.add(s.data);
    });
    return Array.from(set).sort((a, b) => {
      const [d1, m1, y1] = a.split("/").map(Number);
      const [d2, m2, y2] = b.split("/").map(Number);
      return (
        new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime()
      );
    });
  }, [servicos]);

  const tecnicos = useMemo(
    () => [...new Set(servicos.map((s) => s.tecnico).filter(Boolean))],
    [servicos],
  );

  const metaFiltrada = {
    total: servicos.length,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: Math.ceil(servicos.length / DEFAULT_PAGE_SIZE) || 1,
  };

  const agendamentosPendentes = useMemo(() => {
    return servicos.filter((s) => {
      const status = s.status?.toUpperCase() ?? "";
      return !["CONCLUIDO", "FINALIZADO", "CANCELADO", "DELETADO"].includes(
        status,
      );
    }).length;
  }, [servicos]);

  return {
    servicos,
    error: error ? (error as Error).message : null,
    meta: metaFiltrada,
    filters,
    setFilters,
    loading: isLoading,
    setPage,
    isPlaceholderData,

    create: async (data: FormularioServico) => {
      try {
        await createMutation.mutateAsync(data);
        return { success: true as const };
      } catch (err) {
        return {
          success: false as const,
          error: err instanceof Error ? err.message : "Falha ao criar",
        };
      }
    },
    update: async (id: string, data: Partial<Servico>) => {
      try {
        await updateMutation.mutateAsync({ id, ...data });
        return { success: true as const };
      } catch (err) {
        return {
          success: false as const,
          error: err instanceof Error ? err.message : "Falha ao atualizar",
        };
      }
    },
    remove: async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        return { success: true as const };
      } catch (err) {
        return {
          success: false as const,
          error: err instanceof Error ? err.message : "Falha ao remover",
        };
      }
    },

    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    refresh: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    datasDisponiveis,
    tecnicos,
    agendamentosPendentes,
  };
}
