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
  hidden: { opacity: 0, y: 12 },
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
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="mt-3 text-sm font-medium text-text-muted">
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
      className="mx-auto max-w-7xl space-y-6 pb-12"
    >
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "!rounded-lg !bg-bg-elevated !text-text !border !border-border !shadow-lg backdrop-blur-md",
          duration: 4000,
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#e11d48", secondary: "#fff" } },
        }}
      />

      {/* Header Principal */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm md:flex-row md:items-center sm:p-6"
      >
        <div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-text md:text-3xl">
            Gestão de Serviços
          </h1>
          <p className="max-w-xl text-sm text-text-muted">
            Acompanhe, ordene e gerencie todos os atendimentos cadastrados.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingServico(null);
            setIsFormOpen(true);
          }}
          className="w-full md:w-auto"
        >
          Novo Serviço
        </Button>
      </motion.div>

      {/* KPIs com Filtro Rápido */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4"
      >
        <Card
          padding="none"
          role="button"
          tabIndex={0}
          aria-pressed={!filters.status}
          onClick={() => handleFilterChange({ status: undefined })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFilterChange({ status: undefined });
            }
          }}
          className={`flex cursor-pointer items-center gap-4 p-4 transition-all hover:shadow-md ${
            !filters.status
              ? "border-transparent ring-2 ring-primary"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-center rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Total
            </p>
            <p className="mt-0.5 text-xl font-semibold leading-none tracking-tight text-text">
              {metricas.total}
            </p>
          </div>
        </Card>

        <Card
          padding="none"
          role="button"
          tabIndex={0}
          aria-pressed={filters.status === "PENDENTE"}
          onClick={() => handleFilterChange({ status: "PENDENTE" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFilterChange({ status: "PENDENTE" });
            }
          }}
          className={`flex cursor-pointer items-center gap-4 p-4 transition-all hover:shadow-md ${
            filters.status === "PENDENTE"
              ? "border-transparent ring-2 ring-amber-500"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-center rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Pendentes
            </p>
            <p className="mt-0.5 text-xl font-semibold leading-none tracking-tight text-text">
              {metricas.pendentes}
            </p>
          </div>
        </Card>

        <Card
          padding="none"
          role="button"
          tabIndex={0}
          aria-pressed={filters.status === "EM ANDAMENTO"}
          onClick={() => handleFilterChange({ status: "EM ANDAMENTO" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFilterChange({ status: "EM ANDAMENTO" });
            }
          }}
          className={`flex cursor-pointer items-center gap-4 p-4 transition-all hover:shadow-md ${
            filters.status === "EM ANDAMENTO"
              ? "border-transparent ring-2 ring-indigo-500"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-center rounded-lg bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Em Andamento
            </p>
            <p className="mt-0.5 text-xl font-semibold leading-none tracking-tight text-text">
              {metricas.emAndamento}
            </p>
          </div>
        </Card>

        <Card
          padding="none"
          role="button"
          tabIndex={0}
          aria-pressed={filters.status === "CONCLUIDO"}
          onClick={() => handleFilterChange({ status: "CONCLUIDO" })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleFilterChange({ status: "CONCLUIDO" });
            }
          }}
          className={`flex cursor-pointer items-center gap-4 p-4 transition-all hover:shadow-md ${
            filters.status === "CONCLUIDO"
              ? "border-transparent ring-2 ring-emerald-500"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-center rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Concluídos
            </p>
            <p className="mt-0.5 text-xl font-semibold leading-none tracking-tight text-text">
              {metricas.concluidos}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* FILTERBAR */}
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-elevated px-4 py-16 text-center shadow-sm"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-bg-muted/50">
              <Wrench className="h-7 w-7 text-text-muted/60" aria-hidden />
            </div>
            <h3 className="mb-1 text-base font-semibold tracking-tight text-text">
              Nenhum serviço encontrado
            </h3>
            <p className="mb-6 max-w-md text-xs text-text-muted">
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
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
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
                  className={`group flex cursor-pointer flex-col gap-4 rounded-lg border border-border border-l-4 bg-bg-elevated p-4 transition-all hover:shadow-md lg:flex-row lg:items-center ${getBorderColor()}`}
                >
                  {/* Cliente + Veículo */}
                  <div className="flex min-w-0 flex-[1.5] items-center gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-muted/40 transition-colors group-hover:bg-primary/10">
                      <Car className="h-5 w-5 text-text-muted transition-colors group-hover:text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-tight text-text transition-colors group-hover:text-primary">
                        {servico.cliente?.nome || "Cliente não informado"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="rounded-md border border-border bg-bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-text">
                          {servico.veiculo?.placa || "S/ PLACA"}
                        </span>
                        <span className="truncate text-xs font-medium text-text-muted">
                          OS: {servico.ordemServico || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes (desktop) */}
                  <div className="hidden flex-1 gap-3 border-t border-border/50 pt-2 md:grid md:grid-cols-2 lg:grid-cols-4 lg:border-t-0 lg:pl-0 lg:pt-0">
                    <div className="flex flex-col">
                      <p className="flex items-center gap-1 text-xs font-semibold text-text">
                        <Calendar className="h-3.5 w-3.5 text-text-muted" />
                        {formatarDataExibicao(servico.data)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-text-muted">
                        <Clock className="h-3 w-3 text-text-muted" />
                        {formatarHorarioExibicao(servico.horario)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                      <span className="truncate text-xs font-semibold uppercase text-text">
                        {servico.tecnico || "—"}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1 truncate text-xs font-medium text-text"
                      title={servico.endereco?.cidade}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                      <span className="truncate">
                        {servico.endereco?.cidade || "Não informado"}
                      </span>
                    </div>

                    <div className="flex lg:justify-center">
                      <StatusBadge status={servico.status || "pendente"} />
                    </div>
                  </div>

                  {/* Ações */}
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => openEditForm(servico)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                      title="Editar"
                      aria-label="Editar serviço"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteConfirm(servico)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:hover:text-rose-400"
                      title="Excluir"
                      aria-label="Excluir serviço"
                    >
                      <Trash2 className="h-4 w-4" />
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
