// src/app/servicos/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useServicos } from "@/hooks/useServicos";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/features/StatusBadge";
import {
  formatarDataExibicao,
  formatarHorarioExibicao,
} from "@/lib/utils-format";
import type { Servico, FormularioServico, FiltrosServicos } from "@/lib/types";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import ServicoDetalhesModal from "@/components/modals/ServicoDetalhesModal";
import { Toaster, toast } from "react-hot-toast";
import { ServicoCard } from "@/components/features/ServiceCard";
import { ErrorModal } from "@/components/modals/ErrorModal";
import { useErrorModal } from "@/hooks/useErrorModal";
import { FilterBar } from "@/components/features/FilterBar";
import ServicoForm from "@/components/modals/ServicoForm";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

type Direcao = "asc" | "desc";

const normalizeStatus = (s?: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ")
    .trim();

export default function ServicosPage() {
  const {
    servicos,
    loading,
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isDeleting,
  } = useServicos();

  // Estados de Filtros e Ordenação
  const [filters, setFilters] = useState<FiltrosServicos>({});
  const [ordenarPor, setOrdenarPor] = useState<string>("data");
  const [direcao, setDirecao] = useState<Direcao>("desc");
  const [visualizacao, setVisualizacao] = useState<"cards" | "lista">("cards");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [deletingServico, setDeletingServico] = useState<Servico | null>(null);
  const [detalhesServicoId, setDetalhesServicoId] = useState<string | null>(
    null,
  );

  const { errorModal, showError, closeModal } = useErrorModal();

  const handleFilterChange = useCallback(
    (newFilters: Partial<FiltrosServicos>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleSortChange = useCallback(
    (novoOrdenarPor: string, novaDirecao: "asc" | "desc") => {
      setOrdenarPor(novoOrdenarPor);
      setDirecao(novaDirecao);
    },
    [],
  );

  // Listas para os filtros dinâmicos
  const datasUnicas = useMemo(() => {
    const set = new Set<string>();
    servicos.forEach((s) => {
      if (s.data && s.status?.toLowerCase() !== "deletado") set.add(s.data);
    });
    return Array.from(set).sort((a, b) => {
      const [da, ma, ya] = a.split("/").map(Number);
      const [db, mb, yb] = b.split("/").map(Number);
      return (
        new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime()
      );
    });
  }, [servicos]);

  const tecnicosUnicos = useMemo(() => {
    const set = new Set<string>();
    servicos.forEach((s) => {
      if (s.tecnico && s.status?.toLowerCase() !== "deletado")
        set.add(s.tecnico);
    });
    return Array.from(set).sort();
  }, [servicos]);

  const cidadesUnicas = useMemo(() => {
    const set = new Set<string>();
    servicos.forEach((s) => {
      const cidade = s.endereco?.cidade?.trim();
      if (cidade && s.status?.toLowerCase() !== "deletado") set.add(cidade);
    });
    return Array.from(set).sort();
  }, [servicos]);

  // Filtragem e Ordenação
  const servicosFiltrados = useMemo(() => {
    const resultado = servicos.filter((s) => {
      if (s.status?.toLowerCase() === "deletado") return false;

      // Busca textual
      if (filters.busca) {
        const q = filters.busca.toLowerCase().trim();
        const match =
          s.cliente?.nome?.toLowerCase().includes(q) ||
          s.veiculo?.placa?.toLowerCase().includes(q) ||
          s.endereco?.cidade?.toLowerCase().includes(q) ||
          s.tecnico?.toLowerCase().includes(q) ||
          (s.ordemServico || "").toLowerCase().includes(q) ||
          (s.tipoServico || "").toLowerCase().includes(q) ||
          s.id?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Data específica
      if (filters.data && s.data !== filters.data) return false;

      // Status
      if (
        filters.status &&
        normalizeStatus(s.status) !== normalizeStatus(filters.status)
      )
        return false;

      // Técnico
      if (filters.tecnico && s.tecnico !== filters.tecnico) return false;

      // Cidade
      if (
        filters.cidade &&
        s.endereco?.cidade?.trim().toLowerCase() !==
          filters.cidade.trim().toLowerCase()
      )
        return false;

      // Intervalo de datas
      if (filters.dataInicio || filters.dataFim) {
        if (!s.data) return false;
        const [d, m, y] = s.data.split("/").map(Number);
        const servicoTime = new Date(y, m - 1, d).getTime();

        if (filters.dataInicio) {
          const [di, mi, yi] = filters.dataInicio.split("/").map(Number);
          const inicio = new Date(yi, mi - 1, di).getTime();
          if (servicoTime < inicio) return false;
        }
        if (filters.dataFim) {
          const [df, mf, yf] = filters.dataFim.split("/").map(Number);
          const fim = new Date(yf, mf - 1, df).getTime();
          if (servicoTime > fim) return false;
        }
      }

      return true;
    });

    // Aplicação da Ordenação
    resultado.sort((a, b) => {
      let comparacao = 0;
      switch (ordenarPor) {
        case "data": {
          const [d1, m1, y1] = (a.data || "").split("/").map(Number);
          const [d2, m2, y2] = (b.data || "").split("/").map(Number);
          const t1 = isNaN(y1) ? 0 : new Date(y1, m1 - 1, d1).getTime();
          const t2 = isNaN(y2) ? 0 : new Date(y2, m2 - 1, d2).getTime();
          comparacao = t1 - t2;
          break;
        }
        case "status":
          comparacao = (a.status || "").localeCompare(b.status || "");
          break;
        case "tecnico":
          comparacao = (a.tecnico || "").localeCompare(b.tecnico || "");
          break;
        case "cliente":
          comparacao = (a.cliente?.nome || "").localeCompare(
            b.cliente?.nome || "",
          );
          break;
      }
      return direcao === "asc" ? comparacao : -comparacao;
    });

    return resultado;
  }, [servicos, filters, ordenarPor, direcao]);

  // Métricas para os Cards Principais
  const metricas = useMemo(() => {
    const total = servicos.length;
    const pendentes = servicos.filter(
      (s) => s.status?.toLowerCase() === "pendente",
    ).length;
    const emAndamento = servicos.filter(
      (s) =>
        normalizeStatus(s.status) === "em andamento" ||
        s.status?.toLowerCase() === "em_andamento",
    ).length;
    const concluidos = servicos.filter(
      (s) => normalizeStatus(s.status) === "concluido",
    ).length;
    return { total, pendentes, emAndamento, concluidos };
  }, [servicos]);

  const openEditForm = useCallback((servico: Servico) => {
    setEditingServico(servico);
    setIsFormOpen(true);
  }, []);

  const openDeleteConfirm = useCallback(
    (servico: Servico) => setDeletingServico(servico),
    [],
  );

  const handleCreate = useCallback(
    async (data: FormularioServico) => {
      const result = await create(data);
      if (result.success) {
        toast.success("Serviço criado com sucesso!");
        setIsFormOpen(false);
      } else {
        showError(result.error || "Erro ao criar serviço");
      }
    },
    [create, showError],
  );

  const handleUpdate = useCallback(
    async (id: string, data: Partial<Servico>) => {
      const result = await update(id, data);
      if (result.success) {
        toast.success("Serviço atualizado!");
        setEditingServico(null);
        setIsFormOpen(false);
      } else {
        showError(result.error || "Erro ao atualizar");
      }
    },
    [update, showError],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingServico) return;
    const result = await remove(deletingServico.id);
    if (result.success) {
      toast.success("Serviço removido!");
      setDeletingServico(null);
    } else {
      showError(result.error || "Erro ao remover");
    }
  }, [remove, deletingServico, showError]);

  if (loading && servicos.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-primary w-12 h-12 mb-4" />
        <p className="text-text-muted font-medium text-base">
          Carregando serviços...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-7xl mx-auto pb-12"
    >
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "shadow-lg rounded-xl font-medium text-sm border border-border",
          duration: 4000,
        }}
      />

      {/* Header Principal */}
      <motion.div
        variants={itemVariants}
        className="bg-bg-elevated p-6 rounded-2xl shadow-xs border border-border flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text mb-1">
            Gestão de Serviços
          </h1>
          <p className="text-text-muted text-sm max-w-xl">
            Acompanhe, ordene e gerencie todos os atendimentos cadastrados.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingServico(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 w-full md:w-auto justify-center shadow-xs py-2.5 px-5"
        >
          <Plus className="w-5 h-5" /> Novo Serviço
        </Button>
      </motion.div>

      {/* KPIs com Filtro Rápido */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card
          className={`p-4 flex items-center gap-4 transition-all cursor-pointer group hover:shadow-md border ${
            !filters.status
              ? "ring-2 ring-primary border-transparent"
              : "border-border"
          }`}
          onClick={() => handleFilterChange({ status: undefined })}
        >
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Total
            </p>
            <p className="text-xl font-black text-text mt-0.5">
              {metricas.total}
            </p>
          </div>
        </Card>

        <Card
          className={`p-4 flex items-center gap-4 transition-all cursor-pointer group hover:shadow-md border ${
            filters.status === "PENDENTE"
              ? "ring-2 ring-amber-500 border-transparent"
              : "border-border"
          }`}
          onClick={() => handleFilterChange({ status: "PENDENTE" })}
        >
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Pendentes
            </p>
            <p className="text-xl font-black text-text mt-0.5">
              {metricas.pendentes}
            </p>
          </div>
        </Card>

        <Card
          className={`p-4 flex items-center gap-4 transition-all cursor-pointer group hover:shadow-md border ${
            filters.status === "EM ANDAMENTO"
              ? "ring-2 ring-indigo-500 border-transparent"
              : "border-border"
          }`}
          onClick={() => handleFilterChange({ status: "EM ANDAMENTO" })}
        >
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-105 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Em Andamento
            </p>
            <p className="text-xl font-black text-text mt-0.5">
              {metricas.emAndamento}
            </p>
          </div>
        </Card>

        <Card
          className={`p-4 flex items-center gap-4 transition-all cursor-pointer group hover:shadow-md border ${
            filters.status === "CONCLUIDO"
              ? "ring-2 ring-emerald-500 border-transparent"
              : "border-border"
          }`}
          onClick={() => handleFilterChange({ status: "CONCLUIDO" })}
        >
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-105 transition-transform">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Concluídos
            </p>
            <p className="text-xl font-black text-text mt-0.5">
              {metricas.concluidos}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* COMPONENTE FILTERBAR */}
      <motion.div variants={itemVariants}>
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          datas={datasUnicas}
          tecnicos={tecnicosUnicos}
          cidades={cidadesUnicas}
          totalResults={servicosFiltrados.length}
          onClear={handleClearFilters}
          isLoading={loading}
          ordenarPor={ordenarPor}
          direcao={direcao}
          onSortChange={handleSortChange}
          visualizacao={visualizacao}
          onVisualizacaoChange={setVisualizacao}
        />
      </motion.div>

      {/* LISTAGEM DE SERVIÇOS */}
      <AnimatePresence mode="wait">
        {servicosFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col items-center justify-center py-16 px-4 bg-bg-elevated rounded-2xl border border-border text-center shadow-xs"
          >
            <div className="w-16 h-16 bg-bg-muted rounded-full flex items-center justify-center mb-4 border border-border">
              <Wrench className="w-8 h-8 text-text-muted/60" />
            </div>
            <h3 className="text-lg font-bold text-text mb-1">
              Nenhum serviço encontrado
            </h3>
            <p className="text-text-muted max-w-md mb-6 text-xs">
              Não encontramos nenhum atendimento correspondente aos filtros
              aplicados.
            </p>
            <Button onClick={handleClearFilters} variant="outline" size="sm">
              Limpar Filtros
            </Button>
          </motion.div>
        ) : visualizacao === "cards" ? (
          <motion.div
            key="cards"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {servicosFiltrados.map((servico) => (
              <ServicoCard
                key={servico.id}
                servico={servico}
                variants={itemVariants}
                onEdit={openEditForm}
                onDelete={openDeleteConfirm}
                onViewDetails={setDetalhesServicoId}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="lista"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {servicosFiltrados.map((servico) => {
              const getBorderColor = () => {
                const s = normalizeStatus(servico.status);
                if (s === "concluido") return "border-l-emerald-500";
                if (s === "em andamento") return "border-l-indigo-500";
                if (s === "cancelado") return "border-l-rose-500";
                return "border-l-amber-500";
              };

              return (
                <motion.div
                  key={servico.id}
                  variants={itemVariants}
                  layout
                  onClick={() => setDetalhesServicoId(String(servico.id))}
                  className={`group bg-bg-elevated rounded-xl p-4 hover:shadow-md transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center gap-4 relative border border-border border-l-4 ${getBorderColor()}`}
                >
                  <div className="flex items-center gap-3.5 flex-[1.5] min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-bg-muted border border-border flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Car className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-text truncate group-hover:text-primary transition-colors">
                        {servico.cliente?.nome || "Cliente não informado"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono uppercase bg-bg-muted text-text px-1.5 py-0.5 rounded font-bold border border-border">
                          {servico.veiculo?.placa || "S/ PLACA"}
                        </span>
                        <span className="text-xs text-text-muted font-medium truncate">
                          OS: {servico.ordemServico || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden flex-1 md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center pl-2 lg:pl-0 border-t border-border/50 lg:border-t-0 pt-2 lg:pt-0">
                    <div className="flex flex-col">
                      <p className="text-xs font-semibold text-text flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-text-muted" />
                        {formatarDataExibicao(servico.data)}
                      </p>
                      <p className="text-[11px] text-text-muted flex items-center gap-1 font-medium mt-0.5">
                        <Clock className="w-3 h-3 text-text-muted" />
                        {formatarHorarioExibicao(servico.horario)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="text-xs font-semibold text-text truncate uppercase">
                        {servico.tecnico || "—"}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1 text-xs font-medium text-text truncate"
                      title={servico.endereco?.cidade}
                    >
                      <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span className="truncate">
                        {servico.endereco?.cidade || "Não informado"}
                      </span>
                    </div>

                    <div className="flex lg:justify-center">
                      <StatusBadge status={servico.status || "pendente"} />
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openEditForm(servico)}
                      className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(servico)}
                      className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <ServicoForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingServico(null);
        }}
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
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        itemName={deletingServico?.cliente?.nome || "este serviço"}
        isLoading={isDeleting}
      />

      <ServicoDetalhesModal
        id={detalhesServicoId || ""}
        isOpen={!!detalhesServicoId}
        onClose={() => setDetalhesServicoId(null)}
        onEdit={openEditForm}
        onDelete={openDeleteConfirm}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeModal}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
        httpStatus={errorModal.httpStatus}
      />
    </motion.div>
  );
}
