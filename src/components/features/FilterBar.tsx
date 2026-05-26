// src/components/features/FilterBar.tsx
"use client";

import { Search, Filter, X, Calendar, User, Tag, ChevronDown, Clock, RefreshCw, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { FiltrosServicos } from "@/lib/types";
import { Select } from "@/components/ui/Select";
import { useConfig } from "@/hooks/useConfig";
import { useState, useCallback, useEffect, useRef } from "react";
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

export function FilterBar({ 
  filters, 
  onChange, 
  datas, 
  tecnicos, 
  totalResults = 0,
  onClear,
  isLoading = false 
}: FilterBarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ start: "", end: "" });
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { options: configOptions, loading: configLoading } = useConfig();

  const hasFilters = filters.data || filters.status || filters.tecnico || filters.busca || 
                     filters.dataInicio || filters.dataFim;

  // Contar filtros ativos
  const activeFiltersCount = [
    filters.busca, filters.data, filters.status, filters.tecnico,
    filters.dataInicio, filters.dataFim
  ].filter(Boolean).length;

  // Limpar todos os filtros
  const handleClearAll = useCallback(() => {
    onChange({});
    setTempDateRange({ start: "", end: "" });
    if (onClear) onClear();
  }, [onChange, onClear]);

  // Remover filtro específico
  const removeFilter = (type: keyof FiltrosServicos) => {
    const newFilters: Partial<FiltrosServicos> = {};
    if (type === 'busca') newFilters.busca = undefined;
    if (type === 'data') newFilters.data = undefined;
    if (type === 'status') newFilters.status = undefined;
    if (type === 'tecnico') newFilters.tecnico = undefined;
    if (type === 'dataInicio') newFilters.dataInicio = undefined;
    if (type === 'dataFim') newFilters.dataFim = undefined;
    onChange(newFilters);
  };

  // Preparar opções
  const statusOptions = configLoading
    ? [{ value: "", label: "Carregando status..." }]
    : [
        { value: "", label: "Todos os status" },
        ...configOptions.status
      ];

  const dataOptions = [
    { value: "", label: "Todas as datas" },
    ...datas.map(d => ({ value: d, label: d }))
  ];

  const tecnicoOptions = [
    { value: "", label: "Todos os técnicos" },
    ...tecnicos.map(t => ({ value: t, label: t }))
  ];

  // Lista de filtros ativos para exibição
  const activeFiltersList: ActiveFilter[] = [
    filters.busca && {
      label: "Busca",
      value: filters.busca,
      type: "busca",
      onRemove: () => removeFilter("busca")
    },
    filters.data && {
      label: "Data",
      value: filters.data,
      type: "data",
      onRemove: () => removeFilter("data")
    },
    filters.status && {
      label: "Status",
      value: configOptions.status.find(s => s.value === filters.status)?.label || filters.status,
      type: "status",
      onRemove: () => removeFilter("status")
    },
    filters.tecnico && {
      label: "Técnico",
      value: filters.tecnico,
      type: "tecnico",
      onRemove: () => removeFilter("tecnico")
    },
    filters.dataInicio && {
      label: "Data Início",
      value: filters.dataInicio,
      type: "dataInicio",
      onRemove: () => removeFilter("dataInicio")
    },
    filters.dataFim && {
      label: "Data Fim",
      value: filters.dataFim,
      type: "dataFim",
      onRemove: () => removeFilter("dataFim")
    }
  ].filter(Boolean) as ActiveFilter[];

  // Atalho de teclado para focar na busca (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-4">
      {/* Main Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="p-4">
          {/* Primary Filters Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Search Field - Ocupa mais espaço */}
            <div className="lg:col-span-5 relative">
              <div className={`relative transition-all duration-200 ${searchFocused ? 'scale-[1.01]' : ''}`}>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-blue-500' : 'text-gray-400'}`} />
                <Input
                label="Buscar serviços"
                  ref={searchInputRef}
                  placeholder="Buscar por nome, placa, cidade ou OS..."
                  value={filters.busca || ""}
                  onChange={(e) => onChange({ busca: e.target.value || undefined })}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className={`pl-9 transition-all ${searchFocused ? 'border-blue-300 ring-2 ring-blue-100' : ''}`}
                  aria-label="Buscar serviços"
                  disabled={isLoading}
                />
             
              </div>
            </div>

            {/* Date Filter */}
            <div className="lg:col-span-2">
              <Select
                label="Data"
                value={filters.data || ""}
                onChange={(e) => onChange({ data: e.target.value || undefined })}
                options={dataOptions}
                icon={<Calendar size={14} />}
                disabled={isLoading || configLoading}
                className="bg-gray-50 hover:bg-white transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="lg:col-span-2">
              <Select
                label="Status"
                value={filters.status || ""}
                onChange={(e) => onChange({ status: e.target.value as any || undefined })}
                options={statusOptions}
                icon={<Tag size={14} />}
                disabled={isLoading || configLoading}
                className="bg-gray-50 hover:bg-white transition-colors"
              />
            </div>

            {/* Technician Filter */}
            <div className="lg:col-span-2">
              <Select
                label="Técnico"
                value={filters.tecnico || ""}
                onChange={(e) => onChange({ tecnico: e.target.value || undefined })}
                options={tecnicoOptions}
                icon={<User size={14} />}
                disabled={isLoading}
                className="bg-gray-50 hover:bg-white transition-colors"
              />
            </div>

            {/* Advanced Filters Button */}
            <div className="lg:col-span-1 flex items-end">
              <button
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isAdvancedOpen || activeFiltersCount > 1
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
                aria-label="Filtros avançados"
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Filtros</span>
                {activeFiltersCount > 1 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount - 1}
                  </span>
                )}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Active Filters Chips */}
          <AnimatePresence>
            {activeFiltersList.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 pt-3 border-t border-gray-100"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Filtros ativos:</span>
                  {activeFiltersList.map((filter) => (
                    <motion.span
                      key={filter.type}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium group hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-blue-500 text-[10px] font-semibold uppercase">{filter.label}:</span>
                      <span className="max-w-[200px] truncate">{filter.value}</span>
                      <button
                        onClick={filter.onRemove}
                        className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                        aria-label={`Remover filtro ${filter.label}`}
                      >
                        <X size={12} />
                      </button>
                    </motion.span>
                  ))}
                  
                  {activeFiltersList.length > 1 && (
                    <button
                      onClick={handleClearAll}
                      className="ml-2 text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
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

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-100 bg-gray-50/50"
            >
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                      <Calendar size={14} />
                      Intervalo de Datas
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date"
                        label="Data Inicial"
                        value={tempDateRange.start || filters.dataInicio || ""}
                        onChange={(e) => {
                          setTempDateRange(prev => ({ ...prev, start: e.target.value }));
                          onChange({ dataInicio: e.target.value || undefined });
                        }}
                        className="bg-white"
                      />
                      <Input
                        type="date"
                        label="Data Final"
                        value={tempDateRange.end || filters.dataFim || ""}
                        onChange={(e) => {
                          setTempDateRange(prev => ({ ...prev, end: e.target.value }));
                          onChange({ dataFim: e.target.value || undefined });
                        }}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} />
                      Período Rápido
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "Hoje", action: () => {
                          const today = new Date().toISOString().split('T')[0];
                          onChange({ data: today });
                          setIsAdvancedOpen(false);
                        }},
                        { label: "Esta Semana", action: () => {
                          const today = new Date();
                          const weekStart = new Date(today.setDate(today.getDate() - today.getDay())).toISOString().split('T')[0];
                          onChange({ dataInicio: weekStart });
                          setIsAdvancedOpen(false);
                        }},
                        { label: "Este Mês", action: () => {
                          const today = new Date();
                          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                          onChange({ dataInicio: monthStart });
                          setIsAdvancedOpen(false);
                        }},
                        { label: "Próximos 7 dias", action: () => {
                          const today = new Date();
                          const nextWeek = new Date(today.setDate(today.getDate() + 7)).toISOString().split('T')[0];
                          onChange({ dataFim: nextWeek });
                          setIsAdvancedOpen(false);
                        }},
                      ].map(quick => (
                        <button
                          key={quick.label}
                          onClick={quick.action}
                          className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          {quick.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Clear Advanced Filters */}
                {(filters.dataInicio || filters.dataFim) && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setTempDateRange({ start: "", end: "" });
                        onChange({ dataInicio: undefined, dataFim: undefined });
                      }}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <X size={12} />
                      Limpar intervalo de datas
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Info Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
            <Filter size={14} className="text-gray-500" />
            <span className="font-medium text-gray-700">{totalResults}</span>
            <span className="text-gray-500">
              {totalResults === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>
          
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-400">
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-xs">Atualizando...</span>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 hidden md:block">
          Dica: Use <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">Ctrl+K</kbd> para focar na busca
        </div>
      </div>
    </div>
  );
}