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
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { FiltrosServicos } from "@/lib/types";
import { Select } from "@/components/ui/Select";
import { useConfig } from "@/hooks/useConfig";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FilterBarProps {
  filters: FiltrosServicos;
  onChange: (filters: Partial<FiltrosServicos>) => void;
  datas: string[];
  tecnicos: string[];
  totalResults?: number;
  onClear?: () => void;
  isLoading?: boolean;
}

interface ActiveFilter {
  label: string;
  value: string;
  type: keyof FiltrosServicos;
  onRemove: () => void;
}

// === FUNÇÕES AUXILIARES DE DATA REFATORADAS ===

/**
 * Converte data do formato ISO (YYYY-MM-DD) para formato BR (DD/MM/YYYY)
 */
const isoToBrDate = (isoDate: string): string => {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
};

/**
 * Converte data do formato BR (DD/MM/YYYY) para formato ISO (YYYY-MM-DD)
 */
const brToIsoDate = (brDate?: string): string => {
  if (!brDate) return "";
  const parts = brDate.split("/");
  if (parts.length !== 3) return "";
  const [day, month, year] = parts;
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

/**
 * Valida se uma string está no formato DD/MM/YYYY
 */
const isValidBrDate = (date: string): boolean => {
  if (!date) return false;
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(date)) return false;
  
  const [day, month, year] = date.split("/").map(Number);
  const jsDate = new Date(year, month - 1, day);
  return jsDate.getFullYear() === year && 
         jsDate.getMonth() === month - 1 && 
         jsDate.getDate() === day;
};

/**
 * Formata uma data Date para string BR (DD/MM/YYYY)
 */
const formatDateToBr = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Calcula o primeiro dia da semana (domingo)
 */
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
};

/**
 * Calcula o último dia da semana (sábado)
 */
const getEndOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return d;
};

/**
 * Calcula o primeiro dia do mês
 */
const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Calcula o último dia do mês
 */
const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export function FilterBar({
  filters,
  onChange,
  datas,
  tecnicos,
  totalResults = 0,
  onClear,
  isLoading = false,
}: FilterBarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { options: configOptions, loading: configLoading } = useConfig();

  // Estados locais para os campos de data (formato ISO para o input)
  const [localDataInicio, setLocalDataInicio] = useState<string>(
    brToIsoDate(filters.dataInicio)
  );
  const [localDataFim, setLocalDataFim] = useState<string>(
    brToIsoDate(filters.dataFim)
  );

  // Sincroniza os estados locais quando os filtros mudam externamente
  useEffect(() => {
    setLocalDataInicio(brToIsoDate(filters.dataInicio));
  }, [filters.dataInicio]);

  useEffect(() => {
    setLocalDataFim(brToIsoDate(filters.dataFim));
  }, [filters.dataFim]);

  // Conta filtros ativos (exceto o campo de busca que é sempre visível)
  const activeFiltersCount = useMemo(() => {
    return [
      filters.data,
      filters.status,
      filters.tecnico,
      filters.dataInicio,
      filters.dataFim,
    ].filter(Boolean).length;
  }, [filters.data, filters.status, filters.tecnico, filters.dataInicio, filters.dataFim]);

  // Limpar todos os filtros
  const handleClearAll = useCallback(() => {
    onChange({
      busca: undefined,
      data: undefined,
      status: undefined,
      tecnico: undefined,
      dataInicio: undefined,
      dataFim: undefined,
    });
    setLocalDataInicio("");
    setLocalDataFim("");
    if (onClear) onClear();
  }, [onChange, onClear]);

  // Remover um filtro específico
  const removeFilter = useCallback((type: keyof FiltrosServicos) => {
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
  }, [onChange]);

  // Handler para mudança de data inicial
  const handleDataInicioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isoValue = e.target.value;
    setLocalDataInicio(isoValue);
    
    const brValue = isoValue ? isoToBrDate(isoValue) : undefined;
    onChange({ 
      dataInicio: brValue, 
      data: undefined // Remove filtro de data única quando usa intervalo
    });
  }, [onChange]);

  // Handler para mudança de data final
  const handleDataFimChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const isoValue = e.target.value;
    setLocalDataFim(isoValue);
    
    const brValue = isoValue ? isoToBrDate(isoValue) : undefined;
    onChange({ 
      dataFim: brValue, 
      data: undefined // Remove filtro de data única quando usa intervalo
    });
  }, [onChange]);

  // Ações de períodos rápidos
  const quickActions = useMemo(() => [
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
  ], [onChange]);

  // Opções dos selects
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

  // Lista de filtros ativos para exibição
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
    
    if (filters.data && isValidBrDate(filters.data)) {
      list.push({
        label: "Data",
        value: filters.data,
        type: "data",
        onRemove: () => removeFilter("data"),
      });
    }
    
    if (filters.status) {
      const statusLabel = configOptions.status.find((s) => s.value === filters.status)?.label || filters.status;
      list.push({
        label: "Status",
        value: statusLabel,
        type: "status",
        onRemove: () => removeFilter("status"),
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

  // Keyboard shortcut para focus na busca
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
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm transition-shadow duration-200">
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Campo de Busca */}
            <div className="lg:col-span-5">
              <Input
                ref={searchInputRef}
                placeholder="Buscar por nome, placa, cidade ou OS..."
                value={filters.busca || ""}
                onChange={(e) => onChange({ busca: e.target.value || undefined })}
                leftIcon={Search}
                aria-label="Buscar serviços"
                disabled={isLoading}
              />
            </div>

            {/* Selects Rápidos */}
            <div className="lg:col-span-2">
              <Select
                value={filters.data || ""}
                onChange={(e) => onChange({ data: e.target.value || undefined })}
                options={dataOptions}
                disabled={isLoading || configLoading}
              />
            </div>

            <div className="lg:col-span-2">
              <Select
                value={filters.status || ""}
                onChange={(e) => onChange({ status: (e.target.value as any) || undefined })}
                options={statusOptions}
                disabled={isLoading || configLoading}
              />
            </div>

            <div className="lg:col-span-2">
              <Select
                value={filters.tecnico || ""}
                onChange={(e) => onChange({ tecnico: e.target.value || undefined })}
                options={tecnicoOptions}
                disabled={isLoading}
              />
            </div>

            {/* Botão Filtros Avançados */}
            <div className="lg:col-span-1 flex items-end">
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className={`w-full h-10 flex items-center justify-center gap-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                  isAdvancedOpen || activeFiltersCount > 0
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden lg:hidden xl:inline">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span
                    className={`text-[10px] rounded-full w-5 h-5 flex items-center justify-center ${
                      isAdvancedOpen ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 pt-4 border-t border-slate-100"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-1">
                    Ativos:
                  </span>
                  {activeFiltersList.map((filter) => (
                    <motion.span
                      key={filter.type}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium group hover:bg-slate-200 transition-colors border border-slate-200/60"
                    >
                      <span className="text-slate-500 font-bold uppercase tracking-wide text-[10px]">
                        {filter.label}:
                      </span>
                      <span className="max-w-37 truncate">{filter.value}</span>
                      <button
                        onClick={filter.onRemove}
                        className="p-0.5 hover:bg-slate-300 rounded-md transition-colors text-slate-500 hover:text-slate-900"
                        aria-label={`Remover filtro ${filter.label}`}
                      >
                        <X size={14} />
                      </button>
                    </motion.span>
                  ))}

                  {activeFiltersList.length > 1 && (
                    <button
                      onClick={handleClearAll}
                      className="ml-2 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
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

        {/* Painel Avançado */}
        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-slate-100 bg-slate-50/50 rounded-b-2xl"
            >
              <div className="p-4 sm:p-5 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Intervalo de Datas - Usando input nativo */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Calendar size={14} /> Intervalo Personalizado
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-medium">Data Inicial</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all bg-white"
                          value={localDataInicio}
                          onChange={handleDataInicioChange}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500 font-medium">Data Final</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all bg-white"
                          value={localDataFim}
                          onChange={handleDataFimChange}
                          disabled={isLoading}
                          min={localDataInicio}
                        />
                      </div>
                    </div>
                    
                    {/* Indicador de intervalo ativo */}
                    {(filters.dataInicio || filters.dataFim) && (
                      <div className="text-xs text-slate-400 bg-white rounded-lg px-2 py-1 inline-block">
                        {filters.dataInicio && `De ${filters.dataInicio}`} 
                        {filters.dataInicio && filters.dataFim && " até "}
                        {filters.dataFim && filters.dataFim}
                      </div>
                    )}
                  </div>

                  {/* Períodos Rápidos */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} /> Períodos Rápidos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {quickActions.map((quick) => (
                        <button
                          key={quick.label}
                          onClick={quick.action}
                          className="px-4 py-2 text-sm font-medium bg-white border border-slate-200/60 rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          {quick.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
            <Filter size={14} className="text-slate-500" />
            <span className="font-bold text-slate-800">{totalResults}</span>
            <span className="text-slate-500 font-medium">
              {totalResults === 1 ? "resultado" : "resultados"}
            </span>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-500">
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-xs font-medium">Atualizando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}