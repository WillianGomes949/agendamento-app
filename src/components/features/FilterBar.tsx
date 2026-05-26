// src/components/features/FilterBar.tsx
"use client";

import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { StatusServico, FiltrosServicos } from "@/lib/types";
import { Select } from "@/components/ui/Select";

interface FilterBarProps {
  filters: FiltrosServicos;
  onChange: (filters: Partial<FiltrosServicos>) => void;
  datas: string[];
  tecnicos: string[];
}

const STATUS_OPTIONS: { value: StatusServico | ""; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
  { value: "deletado", label: "Deletado" },
];

export function FilterBar({ filters, onChange, datas, tecnicos }: FilterBarProps) {
  const hasFilters = filters.data || filters.status || filters.tecnico || filters.busca;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          <Input
            placeholder="Buscar por nome, placa ou cidade..."
            value={filters.busca || ""}
            onChange={(e) => onChange({ busca: e.target.value || undefined })}
            className="pl-9"
            aria-label="Buscar serviços"
          />
        </div>

        <Select
          label="Data"
          value={filters.data || ""}
          onChange={(e) => onChange({ data: e.target.value || undefined })}
          options={[
            { value: "", label: "Todas as datas" },
            ...datas.map(d => ({ value: d, label: d }))
          ]}
        />

        <Select
          label="Status"
          value={filters.status || ""}
          onChange={(e) => onChange({ status: (e.target.value as StatusServico) || undefined })}
          options={STATUS_OPTIONS}
        />

        <Select
          label="Técnico"
          value={filters.tecnico || ""}
          onChange={(e) => onChange({ tecnico: e.target.value || undefined })}
          options={[
            { value: "", label: "Todos os técnicos" },
            ...tecnicos.map(t => ({ value: t, label: t }))
          ]}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Filter className="w-3 h-3" aria-hidden="true" />
          <span>Filtros aplicados em tempo real</span>
        </div>

        {hasFilters && (
          <button
            onClick={() => onChange({})}
            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}