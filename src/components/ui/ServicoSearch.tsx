// src/components/features/ServicoSearch.tsx
"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  Calendar as CalendarIcon,
  User,
  Loader2,
} from "lucide-react";
import { StatusBadge } from "@/components/features/StatusBadge";
import { useServicoSearch } from "@/hooks/useServicoSearch";
import type { Servico } from "@/lib/types";

interface Props {
  servicos: Servico[];
  onSelect: (servico: Servico) => void;
  className?: string;
}

const MAX_VISIBLE = 8;

const selectClass =
  "h-10 w-full cursor-pointer appearance-none rounded-lg border border-border bg-bg-muted/30 px-3 text-sm tracking-tight text-text outline-none transition-colors focus:border-text focus:ring-2 focus:ring-text/30";

export function ServicoSearch({ servicos, onSelect, className = "" }: Props) {
  const {
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
    isPending,
  } = useServicoSearch(servicos);

  const [open, setOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const id = useId();
  const listId = `${id}-list`;
  const containerRef = useRef<HTMLDivElement>(null);

  const visible = results.slice(0, MAX_VISIBLE);
  const extra = results.length - visible.length;
  const panelOpen = open && hasActiveSearch;

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Reseta o item ativo quando os resultados mudam
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Mantém o item ativo visível durante a navegação por teclado
  useEffect(() => {
    if (!panelOpen) return;
    document
      .getElementById(`${id}-opt-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, panelOpen, id]);

  const handleSelect = (servico: Servico) => {
    onSelect(servico);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!panelOpen || visible.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = visible[activeIndex];
      if (item) handleSelect(item);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Barra de pesquisa */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="text"
            role="combobox"
            aria-expanded={panelOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              panelOpen && visible.length > 0
                ? `${id}-opt-${activeIndex}`
                : undefined
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por cliente, placa, OS, telefone, endereço..."
            className="h-10 w-full rounded-lg border border-border bg-bg-elevated pl-9 pr-9 text-sm tracking-tight text-text outline-none transition-colors placeholder:text-text-muted/50 focus:border-text focus:ring-2 focus:ring-text/30"
          />
          {isPending ? (
            <Loader2
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-text-muted"
              aria-hidden
            />
          ) : (
            (query || activeFiltersCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setOpen(false);
                }}
                aria-label="Limpar pesquisa"
                className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label="Filtros"
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
            showFilters || activeFiltersCount > 0
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-bg-elevated text-text-muted hover:text-text"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-md bg-primary px-1 text-[10px] font-bold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mt-3 rounded-lg border border-border bg-bg-elevated p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Status
              </span>
              <select
                className={selectClass}
                value={filters.status}
                onChange={(e) => {
                  setFilter("status", e.target.value);
                  setOpen(true);
                }}
              >
                <option value="">Todos</option>
                {options.status.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Técnico
              </span>
              <select
                className={selectClass}
                value={filters.tecnico}
                onChange={(e) => {
                  setFilter("tecnico", e.target.value);
                  setOpen(true);
                }}
              >
                <option value="">Todos</option>
                {options.tecnicos.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Tipo de serviço
              </span>
              <select
                className={selectClass}
                value={filters.tipoServico}
                onChange={(e) => {
                  setFilter("tipoServico", e.target.value);
                  setOpen(true);
                }}
              >
                <option value="">Todos</option>
                {options.tiposServico.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-xs font-medium text-rose-600 transition-colors hover:underline dark:text-rose-400"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Resultados */}
      {panelOpen && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-lg">
          <div className="border-b border-border bg-bg-muted/40 px-4 py-2 text-xs font-semibold text-text-muted">
            {results.length === 0
              ? "Nenhum resultado"
              : `${results.length} ${results.length === 1 ? "resultado" : "resultados"}`}
          </div>

          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-muted">
              Nenhum serviço encontrado para essa pesquisa.
            </div>
          ) : (
            <ul
              id={listId}
              role="listbox"
              className="no-scrollbar max-h-80 divide-y divide-border/50 overflow-y-auto"
            >
              {visible.map((s, i) => (
                <li
                  key={s.id}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(s)}
                  className={`cursor-pointer px-4 py-3 transition-colors ${
                    i === activeIndex ? "bg-bg-hover" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">
                        {s.cliente?.nome || "Sem cliente"}
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        <span className="font-mono font-semibold uppercase">
                          {s.veiculo?.placa || "S/ PLACA"}
                        </span>
                        {s.veiculo?.marcaModelo
                          ? ` · ${s.veiculo.marcaModelo}`
                          : ""}
                        {s.ordemServico ? ` · ${s.ordemServico}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={s.status || "pendente"} />
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {s.data} {s.horario ? `às ${s.horario}` : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {s.tecnico || "Não atribuído"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {extra > 0 && (
            <div className="border-t border-border bg-bg-muted/40 px-4 py-2 text-center text-xs text-text-muted">
              +{extra} {extra === 1 ? "resultado" : "resultados"} — refine a
              pesquisa para ver mais
            </div>
          )}
        </div>
      )}
    </div>
  );
}
