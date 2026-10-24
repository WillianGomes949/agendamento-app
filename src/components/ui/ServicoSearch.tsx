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
  "w-full h-10 px-3 rounded-xl text-sm bg-bg-muted text-text border border-border outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary";

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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
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
            className="w-full h-11 pl-10 pr-10 rounded-xl text-sm bg-bg-elevated text-text placeholder:text-text-muted border border-border outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          {isPending ? (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
          ) : (
            (query || activeFiltersCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  clearAll();
                  setOpen(false);
                }}
                aria-label="Limpar pesquisa"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-text-muted hover:text-text hover:bg-bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label="Filtros"
          className={`relative h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border transition-colors ${
            showFilters || activeFiltersCount > 0
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-bg-elevated border-border text-text-muted hover:text-text"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="mt-3 p-4 bg-bg-elevated border border-border rounded-2xl shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
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
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
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
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
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
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Resultados */}
      {panelOpen && (
        <div className="absolute z-40 left-0 right-0 mt-2 bg-bg-elevated border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-4 py-2 text-xs font-semibold text-text-muted border-b border-border bg-bg-muted/50">
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
              className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-border/50"
            >
              {visible.map((s, i) => (
                <li
                  key={s.id}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseDown={(e) => e.preventDefault()} // mantém o foco no input
                  onClick={() => handleSelect(s)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    i === activeIndex ? "bg-bg-muted" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text truncate">
                        {s.cliente?.nome || "Sem cliente"}
                      </p>
                      <p className="text-xs text-text-muted truncate">
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
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {s.data} {s.horario ? `às ${s.horario}` : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {s.tecnico || "Não atribuído"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {extra > 0 && (
            <div className="px-4 py-2 text-xs text-center text-text-muted border-t border-border bg-bg-muted/50">
              +{extra} {extra === 1 ? "resultado" : "resultados"} — refine a
              pesquisa para ver mais
            </div>
          )}
        </div>
      )}
    </div>
  );
}
