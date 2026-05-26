// src/components/features/FilterBar.tsx
"use client";

import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/Input";
import type { StatusServico, FiltrosServicos } from "@/lib/types";
import { Select } from "@/components/ui/Select";

// Remove a definição local de FilterState e importa de types
export function FilterBar({
  filters,
  onChange,
  datas,
  tecnicos,
}: {
  filters: FiltrosServicos;  // ← Usar o tipo importado
  onChange: (filters: Partial<FiltrosServicos>) => void;  // ← Partial para atualizações parciais
  datas: string[];
  tecnicos: string[];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Buscar por nome, placa ou cidade..."
            value={filters.busca || ""}  // ← Garantir string
            onChange={(e) => onChange({ ...filters, busca: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select
  value={filters.data || ""}
  onChange={(e) => onChange({ ...filters, data: e.target.value || undefined })}
  options={[
    { value: "", label: "Todas as datas" },
    ...datas.map(d => ({ value: d, label: d }))
  ]}
/>

<Select
  value={filters.status || ""}
  onChange={(e) => onChange({ ...filters, status: (e.target.value as StatusServico | "") || undefined })}
  options={[
    { value: "", label: "Todos os status" },
    { value: "pendente", label: "Pendente" },
    { value: "aguardando", label: "Aguardando" },
    { value: "concluido", label: "Concluído" },
    { value: "cancelado", label: "Cancelado" },
  ]}
/>

<Select
  value={filters.tecnico || ""}
  onChange={(e) => onChange({ ...filters, tecnico: e.target.value || undefined })}
  options={[
    { value: "", label: "Todos os técnicos" },
    ...tecnicos.map(t => ({ value: t, label: t }))
  ]}
/>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <Filter className="w-3 h-3" />
        <span>Filtros aplicados em tempo real</span>
      </div>
    </div>
  );
}