// src/hooks/useServicoSearch.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Servico } from "@/lib/types";

// ─── Utilitários ───────────────────────────────────────────────────────────
export const normalizeText = (v?: string | null) =>
  (v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const normalizeStatus = (s?: string | null) =>
  normalizeText(s || "pendente").replace(/[\s_-]+/g, " ");

const onlyAlnum = (v: string) => v.replace(/[^a-z0-9]/g, "");

const toTimestamp = (s: Servico): number => {
  const m = (s.data || "").match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return 0;
  const [, d, mo, y] = m;
  const h = (s.horario || "").match(/(\d{2}):(\d{2})/);
  return new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    h ? Number(h[1]) : 0,
    h ? Number(h[2]) : 0,
  ).getTime();
};

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Tipos ─────────────────────────────────────────────────────────────────
export interface ServicoSearchFilters {
  status: string;
  tecnico: string;
  tipoServico: string;
}

export interface SearchOption {
  value: string;
  label: string;
}

const EMPTY_FILTERS: ServicoSearchFilters = {
  status: "",
  tecnico: "",
  tipoServico: "",
};

interface IndexedServico {
  servico: Servico;
  text: string; // campos normalizados, separados por espaço
  compact: string; // campos só com [a-z0-9], separados por "|" (placa, telefone, CEP)
  status: string;
  tecnico: string;
  tipoServico: string;
  time: number;
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useServicoSearch(servicos: Servico[], debounceMs = 250) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ServicoSearchFilters>(EMPTY_FILTERS);
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  // Índice construído uma única vez por mudança de dados
  const index = useMemo<IndexedServico[]>(() => {
    return servicos
      .filter((s) => normalizeStatus(s.status) !== "deletado")
      .map((s) => {
        const fields = [
          s.cliente?.nome,
          s.cliente?.contato,
          s.veiculo?.placa,
          s.veiculo?.marcaModelo,
          s.ordemServico,
          s.tecnico,
          s.tipoServico,
          s.status,
          s.data,
          s.horario,
          s.endereco?.rua,
          s.endereco?.numero,
          s.endereco?.bairro,
          s.endereco?.cidade,
          s.endereco?.estado,
          s.endereco?.cep,
          s.observacao,
        ].map((f) => normalizeText(f));

        return {
          servico: s,
          text: fields.join(" "),
          compact: fields.map(onlyAlnum).join("|"),
          status: normalizeStatus(s.status),
          tecnico: s.tecnico || "",
          tipoServico: s.tipoServico || "",
          time: toTimestamp(s),
        };
      });
  }, [servicos]);

  // Opções dos filtros derivadas dos próprios dados
  const options = useMemo(() => {
    const statusMap = new Map<string, string>();
    const tecnicos = new Set<string>();
    const tipos = new Set<string>();

    index.forEach((i) => {
      if (!statusMap.has(i.status))
        statusMap.set(i.status, i.servico.status || "Pendente");
      if (i.tecnico) tecnicos.add(i.tecnico);
      if (i.tipoServico) tipos.add(i.tipoServico);
    });

    const toOptions = (set: Set<string>): SearchOption[] =>
      [...set]
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
        .map((v) => ({ value: v, label: v }));

    return {
      status: [...statusMap.entries()].map(([value, label]) => ({
        value,
        label,
      })) as SearchOption[],
      tecnicos: toOptions(tecnicos),
      tiposServico: toOptions(tipos),
    };
  }, [index]);

  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter(Boolean).length,
    [filters],
  );

  const hasActiveSearch = debouncedQuery.trim().length > 0 || activeFiltersCount > 0;

  const results = useMemo<Servico[]>(() => {
    if (!hasActiveSearch) return [];

    const terms = normalizeText(debouncedQuery).split(/\s+/).filter(Boolean);
    const now = Date.now();

    return index
      .filter((i) => {
        if (filters.status && i.status !== filters.status) return false;
        if (filters.tecnico && i.tecnico !== filters.tecnico) return false;
        if (filters.tipoServico && i.tipoServico !== filters.tipoServico)
          return false;

        // todos os termos precisam bater (AND)
        return terms.every((t) => {
          if (i.text.includes(t)) return true;
          const c = onlyAlnum(t);
          return c.length >= 2 && i.compact.includes(c);
        });
      })
      .sort((a, b) => Math.abs(a.time - now) - Math.abs(b.time - now)) // mais próximos de hoje primeiro
      .map((i) => i.servico);
  }, [index, debouncedQuery, filters, hasActiveSearch]);

  const setFilter = useCallback(
    <K extends keyof ServicoSearchFilters>(
      key: K,
      value: ServicoSearchFilters[K],
    ) => setFilters((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const clearAll = useCallback(() => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
  }, []);

  return {
    query,
    setQuery,
    filters,
    setFilter,
    clearFilters,
    clearAll,
    options,
    results,
    hasActiveSearch,
    activeFiltersCount,
    isPending: query !== debouncedQuery,
  };
}
