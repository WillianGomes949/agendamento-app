// src/components/features/FilterBar.tsx
"use client";

import {
  Search,
  Filter,
  X,
  Calendar,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { FiltrosServicos } from "@/lib/types";
import { Select } from "@/components/ui/Select";
import { useConfig } from "@/hooks/useConfig";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FilterBarProps {
  filters: FiltrosServicos;
  onChange: (filters: Partial<FiltrosServicos>) => void;
  datas: string[];
  tecnicos: string[];
  cidades: string[];
  totalResults?: number;
  onClear?: () => void;
  isLoading?: boolean;
  // Controles opcionais de ordenação e layout
  ordenarPor?: string;
  direcao?: "asc" | "desc";
  onSortChange?: (ordenarPor: string, direcao: "asc" | "desc") => void;
  visualizacao?: "cards" | "lista";
  onVisualizacaoChange?: (v: "cards" | "lista") => void;
}

interface ActiveFilter {
  label: string;
  value: string;
  type: keyof FiltrosServicos | "ordenacao";
  onRemove: () => void;
}

// === UTILITÁRIOS DE DATA ===
const isoToBrDate = (isoDate: string): string => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
};

const brToIsoDate = (brDate?: string): string => {
  if (!brDate) return "";
  const parts = brDate.split("/");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
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

const formatDateToBr = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
};

const getEndOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return d;
};

const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export function FilterBar({
  filters,
  onChange,
  datas,
  tecnicos,
  cidades,
  totalResults = 0,
  onClear,
  isLoading = false,
  ordenarPor,
  direcao = "desc",
  onSortChange,
  visualizacao,
  onVisualizacaoChange,
}: FilterBarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { options: configOptions, loading: configLoading } = useConfig();

  const [localDataInicio, setLocalDataInicio] = useState<string>(
    brToIsoDate(filters.dataInicio)
  );
  const [localDataFim, setLocalDataFim] = useState<string>(
    brToIsoDate(filters.dataFim)
  );

  useEffect(() => {
    setLocalDataInicio(brToIsoDate(filters.dataInicio));
  }, [filters.dataInicio]);

  useEffect(() => {
    setLocalDataFim(brToIsoDate(filters.dataFim));
  }, [filters.dataFim]);

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    return [
      filters.busca,
      filters.data,
      filters.status,
      filters.tecnico,
      filters.cidade,
      filters.dataInicio,
      filters.dataFim,
    ].filter(Boolean).length;
  }, [
    filters.busca,
    filters.data,
    filters.status,
    filters.tecnico,
    filters.cidade,
    filters.dataInicio,
    filters.dataFim,
  ]);

  const handleClearAll = useCallback(() => {
    onChange({
      busca: undefined,
      data: undefined,
      status: undefined,
      tecnico: undefined,
      cidade: undefined,
      dataInicio: undefined,
      dataFim: undefined,
    });
    setLocalDataInicio("");
    setLocalDataFim("");
    if (onClear) onClear();
  }, [onChange, onClear]);

  const removeFilter = useCallback(
    (type: keyof FiltrosServicos) => {
      const newFilters: Partial<FiltrosServicos> = {};
      switch (type) {
        case "busca":
          newFilters.busca = undefined;
          break;
        case "data":
          newFilters.data = undefined;
          break;
        case "status":
          newFilters.status = undefined;
          break;
        case "tecnico":
          newFilters.tecnico = undefined;
          break;
        case "cidade":
          newFilters.cidade = undefined;
          break;
        case "dataInicio":
          newFilters.dataInicio = undefined;
          setLocalDataInicio("");
          break;
        case "dataFim":
          newFilters.dataFim = undefined;
          setLocalDataFim("");
          break;
      }
      onChange(newFilters);
    },
    [onChange]
  );

  const handleDataInicioChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isoValue = e.target.value;
      setLocalDataInicio(isoValue);
      const brValue = isoValue ? isoToBrDate(isoValue) : undefined;
      onChange({
        dataInicio: brValue,
        data: undefined,
      });
    },
    [onChange]
  );

  const handleDataFimChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isoValue = e.target.value;
      setLocalDataFim(isoValue);
      const brValue = isoValue ? isoToBrDate(isoValue) : undefined;
      onChange({
        dataFim: brValue,
        data: undefined,
      });
    },
    [onChange]
  );

  const quickActions = useMemo(
    () => [
      {
        label: "Hoje",
        action: () => {
          const today = formatDateToBr(new Date());
          onChange({
            data: today,
            dataInicio: undefined,
            dataFim: undefined,
          });
          setLocalDataInicio("");
          setLocalDataFim("");
          setIsAdvancedOpen(false);
        },
      },
      {
        label: "Esta Semana",
        action: () => {
          const now = new Date();
          const startOfWeek = getStartOfWeek(now);
          const endOfWeek = getEndOfWeek(now);
          onChange({
            data: undefined,
            dataInicio: formatDateToBr(startOfWeek),
            dataFim: formatDateToBr(endOfWeek),
          });
          setLocalDataInicio(brToIsoDate(formatDateToBr(startOfWeek)));
          setLocalDataFim(brToIsoDate(formatDateToBr(endOfWeek)));
          setIsAdvancedOpen(false);
        },
      },
      {
        label: "Este Mês",
        action: () => {
          const now = new Date();
          const startOfMonth = getStartOfMonth(now);
          const endOfMonth = getEndOfMonth(now);
          onChange({
            data: undefined,
            dataInicio: formatDateToBr(startOfMonth),
            dataFim: formatDateToBr(endOfMonth),
          });
          setLocalDataInicio(brToIsoDate(formatDateToBr(startOfMonth)));
          setLocalDataFim(brToIsoDate(formatDateToBr(endOfMonth)));
          setIsAdvancedOpen(false);
        },
      },
      {
        label: "Próximos 7 dias",
        action: () => {
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          onChange({
            data: undefined,
            dataInicio: formatDateToBr(today),
            dataFim: formatDateToBr(nextWeek),
          });
          setLocalDataInicio(brToIsoDate(formatDateToBr(today)));
          setLocalDataFim(brToIsoDate(formatDateToBr(nextWeek)));
          setIsAdvancedOpen(false);
        },
      },
    ],
    [onChange]
  );

  const statusOptions = configLoading
    ? [{ value: "", label: "Carregando..." }]
    : [{ value: "", label: "Todos os status" }, ...configOptions.status];

  const dataOptions = [
    { value: "", label: "Todas as datas" },
    ...datas.filter(isValidBrDate).map((d) => ({ value: d, label: d })),
  ];

  const tecnicoOptions = [
    { value: "", label: "Todos os técnicos" },
    ...tecnicos.map((t) => ({ value: t, label: t })),
  ];

  const cidadeOptions = [
    { value: "", label: "Todas as cidades" },
    ...cidades.map((c) => ({ value: c, label: c })),
  ];

  const sortSelectOptions = [
    { value: "data", label: "Ordenar por: Data" },
    { value: "status", label: "Ordenar por: Status" },
    { value: "tecnico", label: "Ordenar por: Técnico" },
    { value: "cliente", label: "Ordenar por: Cliente" },
  ];

  const activeFiltersList: ActiveFilter[] = useMemo(() => {
    const list: ActiveFilter[] = [];
    if (filters.busca) {
      list.push({
        label: "Busca",
        value: filters.busca,
        type: "busca",
        onRemove: () => removeFilter("busca"),
      });
    }
    if (filters.cidade) {
      list.push({
        label: "Cidade",
        value: filters.cidade,
        type: "cidade",
        onRemove: () => removeFilter("cidade"),
      });
    }
    if (filters.tecnico) {
      list.push({
        label: "Técnico",
        value: filters.tecnico,
        type: "tecnico",
        onRemove: () => removeFilter("tecnico"),
      });
    }
    if (filters.status) {
      const statusLabel =
        configOptions.status.find((s) => s.value === filters.status)?.label ||
        filters.status;
      list.push({
        label: "Status",
        value: statusLabel,
        type: "status",
        onRemove: () => removeFilter("status"),
      });
    }
    if (filters.data && isValidBrDate(filters.data)) {
      list.push({
        label: "Data",
        value: filters.data,
        type: "data",
        onRemove: () => removeFilter("data"),
      });
    }
    if (filters.dataInicio && isValidBrDate(filters.dataInicio)) {
      list.push({
        label: "Início",
        value: filters.dataInicio,
        type: "dataInicio",
        onRemove: () => removeFilter("dataInicio"),
      });
    }
    if (filters.dataFim && isValidBrDate(filters.dataFim)) {
      list.push({
        label: "Fim",
        value: filters.dataFim,
        type: "dataFim",
        onRemove: () => removeFilter("dataFim"),
      });
    }
    return list;
  }, [filters, configOptions.status, removeFilter]);

  // Atalho de Teclado (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-bg-elevated rounded-2xl border border-border shadow-sm transition-shadow duration-200">
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
            {/* Campo de Busca */}
            <div className="lg:col-span-3">
              <Input
                ref={searchInputRef}
                placeholder="Buscar cliente, placa, OS..."
                value={filters.busca || ""}
                onChange={(e) =>
                  onChange({ busca: e.target.value || undefined })
                }
                leftIcon={Search}
                aria-label="Buscar serviços"
                disabled={isLoading}
              />
            </div>
<div className="grid grid-cols-2 gap-3.5 lg:grid-cols-8 lg:col-span-8 sm:w-full">
 {/* Select: Cidade */}
            <div className="lg:col-span-2">
              <Select
                value={filters.cidade || ""}
                onChange={(e) =>
                  onChange({ cidade: e.target.value || undefined })
                }
                options={cidadeOptions}
                disabled={isLoading}
              />
            </div>

            {/* Select: Técnico */}
            <div className="lg:col-span-2">
              <Select
                value={filters.tecnico || ""}
                onChange={(e) =>
                  onChange({ tecnico: e.target.value || undefined })
                }
                options={tecnicoOptions}
                disabled={isLoading}
              />
            </div>

            {/* Select: Status */}
            <div className="lg:col-span-2">
              <Select
                value={filters.status || ""}
                onChange={(e) =>
                  onChange({ status: (e.target.value as any) || undefined })
                }
                options={statusOptions}
                disabled={isLoading || configLoading}
              />
            </div>

            {/* Select: Data */}
            <div className="lg:col-span-2">
              <Select
                value={filters.data || ""}
                onChange={(e) =>
                  onChange({ data: e.target.value || undefined })
                }
                options={dataOptions}
                disabled={isLoading || configLoading}
              />
            </div>

</div>
           
            {/* Botão de Filtros Avançados */}
            <div className="relative lg:col-span-1 flex items-end">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className={`w-full h-10 flex items-center justify-center gap-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  isAdvancedOpen || activeFiltersCount > 0
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "bg-bg-muted text-text hover:bg-bg border border-border"
                }`}
                title="Abrir Filtros Avançados"
              >
                <SlidersHorizontal size={15} />
                <span className="hidden xl:inline">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span
                    className={`absolute right-0 top-0 text-[11px] rounded-full w-4 h-4 flex items-center justify-center font-bold ${
                      isAdvancedOpen
                        ? "bg-accent-foreground/20 text-accent-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Chips de Filtros Ativos */}
          <AnimatePresence>
            {activeFiltersList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 pt-3.5 border-t border-border/70"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider mr-1">
                    Ativos:
                  </span>
                  {activeFiltersList.map((filter) => (
                    <motion.span
                      key={filter.type}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-muted text-text rounded-lg text-xs font-medium border border-border"
                    >
                      <span className="text-text-muted font-bold uppercase tracking-wide text-[10px]">
                        {filter.label}:
                      </span>
                      <span className="max-w-[130px] truncate">{filter.value}</span>
                      <button
                        type="button"
                        onClick={filter.onRemove}
                        className="p-0.5 hover:bg-border-strong rounded-md transition-colors text-text-muted hover:text-text"
                        aria-label={`Remover filtro ${filter.label}`}
                      >
                        <X size={13} />
                      </button>
                    </motion.span>
                  ))}
                  {activeFiltersList.length > 1 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="ml-2 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RefreshCw size={12} />
                      Limpar todos
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Painel Avançado de Filtros e Ordenação */}
        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border bg-bg-muted/40 rounded-b-2xl"
            >
              <div className="p-4 sm:p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Intervalo de Datas */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} /> Intervalo de Datas
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] text-text-muted font-medium mb-1 block">
                          Data Inicial
                        </label>
                        <input
                          type="date"
                          className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-bg-elevated text-text"
                          value={localDataInicio}
                          onChange={handleDataInicioChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-text-muted font-medium mb-1 block">
                          Data Final
                        </label>
                        <input
                          type="date"
                          className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-bg-elevated text-text"
                          value={localDataFim}
                          onChange={handleDataFimChange}
                          disabled={isLoading}
                          min={localDataInicio}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Períodos Rápidos */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={14} /> Atantes Rápidos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((quick) => (
                        <button
                          key={quick.label}
                          type="button"
                          onClick={quick.action}
                          className="px-3 py-1.5 text-xs font-medium bg-bg-elevated border border-border rounded-lg hover:border-primary/50 hover:bg-bg transition-colors shadow-xs text-text"
                        >
                          {quick.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Opções de Ordenação (quando disponibilizadas) */}
                  {onSortChange && ordenarPor && (
                    <div className="space-y-2.5 md:col-span-2 lg:col-span-1">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowUpDown size={14} /> Configuração de Ordem
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Select
                            value={ordenarPor}
                            onChange={(e) =>
                              onSortChange(e.target.value, direcao)
                            }
                            options={sortSelectOptions}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onSortChange(
                              ordenarPor,
                              direcao === "asc" ? "desc" : "asc"
                            )
                          }
                          className="h-9 px-3 bg-bg-elevated border border-border rounded-xl text-xs font-semibold text-text hover:bg-bg transition-colors flex items-center gap-1.5"
                          title={
                            direcao === "asc"
                              ? "Ordem Crescente"
                              : "Ordem Decrescente"
                          }
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          <span>{direcao === "asc" ? "ASC" : "DESC"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Bar de Resultados e Alternância de Layout */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-muted rounded-lg border border-border">
            <Filter size={13} className="text-text-muted" />
            <span className="font-bold text-text">{totalResults}</span>
            <span className="text-text-muted font-medium">
              {totalResults === 1 ? "resultado" : "resultados"}
            </span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1.5 text-text-muted">
              <RefreshCw size={13} className="animate-spin" />
              <span className="font-medium">Atualizando...</span>
            </div>
          )}
        </div>

        {/* Toggle de Layout (Cards / Lista) caso ativado */}
        {onVisualizacaoChange && visualizacao && (
          <div className="flex items-center p-0.5 bg-bg-muted rounded-lg border border-border">
            <button
              type="button"
              onClick={() => onVisualizacaoChange("cards")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                visualizacao === "cards"
                  ? "bg-bg-elevated text-primary shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => onVisualizacaoChange("lista")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
                visualizacao === "lista"
                  ? "bg-bg-elevated text-primary shadow-xs"
                  : "text-text-muted hover:text-text"
              }`}
            >
              <List size={13} />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}