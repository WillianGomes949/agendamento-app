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
import {
  Loader2,
  AlertCircle,
  Plus,
  CalendarX2,
} from "lucide-react";
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
    isDeleting,
  } = useServicos();

  const [filters, setFilters] = useState<FiltrosServicos>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [deletingServico, setDeletingServico] = useState<Servico | null>(null);

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
          const veiculoPlaca =
            s.veiculo?.placa?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
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

  const handleFilterChange = useCallback(
    (f: Partial<FiltrosServicos>) => setFilters((prev) => ({ ...prev, ...f })),
    [],
  );

  const handleCreate = useCallback(
    async (data: FormularioServico) => {
      const result = await create(data);
      if (result.success) {
        toast.success("Serviço criado com sucesso!");
        setIsFormOpen(false);
      } else {
        toast.error(result.error || "Erro ao criar serviço");
      }
    },
    [create],
  );

  const handleUpdate = useCallback(
    async (id: string, data: Partial<Servico>) => {
      const result = await update(id, data);
      if (result.success) {
        toast.success("Serviço atualizado com sucesso!");
        setEditingServico(null);
        setIsFormOpen(false);
      } else {
        toast.error(result.error || "Erro ao atualizar serviço");
      }
    },
    [update],
  );

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

  // Estado de Loading mais elegante
  if (loading && servicos.length === 0)
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 w-10 h-10 relative z-10" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">
          Carregando agendamentos...
        </p>
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Toaster
        position="top-right"
        toastOptions={{
          className: "shadow-lg rounded-xl font-medium text-sm",
          duration: 4000,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        {/* Cabeçalho refinado */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Agendamentos
            </h1>
            <p className="text-slate-500 mt-2 text-sm md:text-base max-w-xl">
              Gerencie seus serviços de rastreamento e manutenção de forma
              centralizada.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingServico(null);
              setIsFormOpen(true);
            }}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:ring-offset-slate-50"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>
        </header>

        <section className="space-y-6">
          {/* Alerta de Erro Modernizado */}
          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-800 px-5 py-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <span className="flex items-center gap-3 font-medium">
                <AlertCircle className="w-5 h-5 text-red-500" />
                {error}
              </span>
              <button
                onClick={() => refresh()}
                className="px-4 py-2 bg-white text-red-700 text-sm font-semibold rounded-lg border border-red-100 hover:bg-red-50 transition-colors shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              >
                Tentar novamente
              </button>
            </div>
          )}

          <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60">
            <FilterBar
              filters={filters}
              onChange={handleFilterChange}
              datas={datasDisponiveis}
              tecnicos={tecnicos}
            />
          </div>

          {/* Empty State Redesenhado */}
          {filtered.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <CalendarX2 className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-slate-500 max-w-sm mb-6">
                {filters.data ||
                filters.tecnico ||
                filters.status ||
                filters.busca
                  ? "Não encontramos resultados para os filtros aplicados. Tente ajustar sua busca."
                  : "Você ainda não possui serviços cadastrados. Comece adicionando um novo agendamento."}
              </p>

              {filters.data ||
              filters.tecnico ||
              filters.status ||
              filters.busca ? (
                <button
                  onClick={() => setFilters({})}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Limpar todos os filtros
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingServico(null);
                    setIsFormOpen(true);
                  }}
                  className="md:hidden px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Agendamento
                </button>
              )}
            </div>
          )}

          {/* Lista de Serviços */}
          {filtered.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
              <ServiceList
                servicos={filtered}
                onEdit={openEditForm}
                onDelete={openDeleteConfirm}
              />
            </div>
          )}
        </section>

        {/* FAB mantido apenas para mobile, garantindo que não colida com o layout desktop */}
        <div className="md:hidden">
          <FloatingActionButton
            onClick={() => {
              setEditingServico(null);
              setIsFormOpen(true);
            }}
          />
        </div>

        <ServicoForm
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSubmit={
            editingServico
              ? (data) => handleUpdate(editingServico.id, data)
              : handleCreate
          }
          initialData={editingServico}
          isLoading={isCreating || isUpdating}
        />

        <DeleteConfirmModal
          isOpen={!!deletingServico}
          onClose={() => setDeletingServico(null)}
          onConfirm={handleDelete}
          title="Excluir serviço"
          message={`Tem certeza que deseja excluir o agendamento? Esta ação não pode ser desfeita.`}
          itemName={deletingServico?.cliente?.nome.toLocaleUpperCase() || "este serviço"}
          isLoading={isDeleting}
        />
      </div>
    </main>
  );
}
