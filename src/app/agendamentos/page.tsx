// src/app/agendamentos/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useServicos } from "@/hooks/useServicos";
import { FilterBar } from "@/components/features/FilterBar";
import { ServiceList } from "@/components/features/ServiceList";
import { FloatingActionButton } from "@/components/features/FloatingActionButton";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import ServicoForm from "@/components/modals/ServicoForm";
import type { FiltrosServicos, Servico, FormularioServico } from "@/lib/types";
import { Loader2, AlertCircle, CheckCircle, Plus } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function AgendamentosPage() {
  const { 
    servicos, 
    loading, 
    error, 
    refresh, 
    datasDisponiveis, 
    tecnicos,
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isDeleting
  } = useServicos();

  const [filters, setFilters] = useState<FiltrosServicos>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [deletingServico, setDeletingServico] = useState<Servico | null>(null);

  // ✅ FILTRO CLIENT-SIDE com debounce implícito via useMemo
  const filtered = useMemo(
    () =>
      servicos.filter((s) => {
        if (!s?.id) return false;

        if (filters.data && s.data !== filters.data) return false;
        if (filters.tecnico && s.tecnico !== filters.tecnico) return false;
        if (filters.status && s.status !== filters.status) return false;

        if (filters.busca) {
          const t = filters.busca.toLowerCase();
          const clienteNome = s.cliente?.nome?.toLowerCase() || "";
          const veiculoPlaca = s.veiculo?.placa?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
          const enderecoCidade = s.endereco?.cidade?.toLowerCase() || "";
          const tecnicoNome = s.tecnico?.toLowerCase() || "";

          const searchTerm = t.replace(/[^a-z0-9]/g, "");

          return (
            clienteNome.includes(t) ||
            veiculoPlaca.includes(searchTerm) ||
            enderecoCidade.includes(t) ||
            tecnicoNome.includes(t)
          );
        }
        return true;
      }),
    [servicos, filters],
  );

  const handleFilterChange = useCallback((f: Partial<FiltrosServicos>) =>
    setFilters((prev) => ({ ...prev, ...f })),
  []);

  const handleCreate = useCallback(async (data: FormularioServico) => {
    const result = await create(data);
    if (result.success) {
      toast.success("Serviço criado com sucesso!");
      setIsFormOpen(false);
    } else {
      toast.error(result.error || "Erro ao criar serviço");
    }
  }, [create]);

  const handleUpdate = useCallback(async (id: string, data: Partial<Servico>) => {
    const result = await update(id, data);
    if (result.success) {
      toast.success("Serviço atualizado com sucesso!");
      setEditingServico(null);
      setIsFormOpen(false);
    } else {
      toast.error(result.error || "Erro ao atualizar serviço");
    }
  }, [update]);

  const handleDelete = useCallback(async () => {
    if (!deletingServico) return;
    const result = await remove(deletingServico.id);
    if (result.success) {
      toast.success("Serviço removido com sucesso!");
      setDeletingServico(null);
    } else {
      toast.error(result.error || "Erro ao remover serviço");
    }
  }, [remove, deletingServico]);

  const openEditForm = useCallback((servico: Servico) => {
    setEditingServico(servico);
    setIsFormOpen(true);
  }, []);

  const openDeleteConfirm = useCallback((servico: Servico) => {
    setDeletingServico(servico);
  }, []);

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false);
    setEditingServico(null);
  }, []);

  if (loading && servicos.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster position="top-right" />

      <header className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
            <p className="text-gray-500 mt-1">
              Gerencie serviços de rastreamento e manutenção
            </p>
          </div>
          <button
            onClick={() => {
              setEditingServico(null);
              setIsFormOpen(true);
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </span>
            <button
              onClick={() => refresh()}
              className="underline text-sm font-medium hover:text-red-900"
            >
              Tentar novamente
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
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
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

        <ServiceList 
          servicos={filtered} 
          onEdit={openEditForm}
          onDelete={openDeleteConfirm}
        />
      </section>

      <FloatingActionButton 
        onClick={() => {
          setEditingServico(null);
          setIsFormOpen(true);
        }}
        ariaLabel="Novo agendamento"
      />

      <ServicoForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={editingServico ? 
          (data) => handleUpdate(editingServico.id, data) : 
          handleCreate
        }
        initialData={editingServico}
        isLoading={isCreating || isUpdating}
      />

      <DeleteConfirmModal
        isOpen={!!deletingServico}
        onClose={() => setDeletingServico(null)}
        onConfirm={handleDelete}
        title="Excluir serviço"
        message="Tem certeza que deseja excluir este serviço?"
        itemName={deletingServico?.cliente?.nome || "este serviço"}
        isLoading={isDeleting}
      />
    </main>
  );
}