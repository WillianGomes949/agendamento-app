// src/app/agendamentos/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useServicos } from "@/hooks/useServicos";
import { FilterBar } from "@/components/features/FilterBar";
import { ServiceList } from "@/components/features/ServiceList";
import type { FiltrosServicos } from "@/lib/types";
import { Loader2, AlertCircle } from "lucide-react";

export default function AgendamentosPage() {
  const { servicos, loading, error, refresh, datasDisponiveis, tecnicos } =
    useServicos();
  const [filters, setFilters] = useState<FiltrosServicos>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = useMemo(
    () =>
      servicos.filter((s) => {
        if (filters.data && s.data !== filters.data) return false;
        if (filters.tecnico && s.tecnico !== filters.tecnico) return false;
        if (filters.status && s.status !== filters.status) return false;
        if (filters.busca) {
          const t = filters.busca.toLowerCase();
          if (
            !s.cliente.nome.toLowerCase().includes(t) &&
            !s.veiculo.placa.toLowerCase().includes(t) &&
            !s.endereco.cidade.toLowerCase().includes(t)
          )
            return false;
        }
        return true;
      }),
    [servicos, filters],
  );

  const handleFilterChange = (f: Partial<FiltrosServicos>) =>
    setFilters((prev) => ({ ...prev, ...f }));

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
        <p className="text-gray-500 mt-1">
          Gerencie serviços de rastreamento e manutenção
        </p>
      </header>

      <section className="max-w-6xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="underline text-sm font-medium hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefreshing ? "Atualizando..." : "Tentar novamente"}
            </button>
          </div>
        )}

        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          datas={datasDisponiveis}
          tecnicos={tecnicos}
        />
        
        {filtered.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500">Nenhum agendamento encontrado</p>
            {(filters.data || filters.tecnico || filters.status || filters.busca) && (
              <button
                onClick={() => setFilters({})}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
        
        <ServiceList servicos={filtered} />
      </section>
    </main>
  );
}