// src/app/servicos/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useServicos } from "@/hooks/useServicos";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Search,
  Plus,
  MoreHorizontal,
  Edit3,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Car,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  X,
  ArrowUpDown,
  Eye,
  File,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/features/StatusBadge";
import {
  formatarDataExibicao,
  formatarHorarioExibicao,
} from "@/lib/utils-format";
import type { Servico, FormularioServico } from "@/lib/types";
import ServicoForm from "@/components/modals/ServicoForm";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import ServicoDetalhesModal from "@/components/modals/ServicoDetalhesModal";
import { Toaster, toast } from "react-hot-toast";
import { ServicoCard } from "@/components/features/ServiceCard";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
};

type Ordenacao = "data" | "status" | "tecnico" | "cliente";
type Direcao = "asc" | "desc";

export default function ServicosPage() {
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

  const [buscaLocal, setBuscaLocal] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<Ordenacao>("data");
  const [direcao, setDirecao] = useState<Direcao>("desc");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroTecnico, setFiltroTecnico] = useState<string>("todos");
  const [filtroData, setFiltroData] = useState<string>("todas");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [deletingServico, setDeletingServico] = useState<Servico | null>(null);
  const [detalhesServicoId, setDetalhesServicoId] = useState<string | null>(
    null,
  );
  const [visualizacao, setVisualizacao] = useState<"cards" | "lista">("cards");

  // Filtros combinados
  const servicosFiltrados = useMemo(() => {
    let resultado = [...servicos];

    if (buscaLocal.trim()) {
      const termo = buscaLocal.toLowerCase().trim();
      resultado = resultado.filter((s) => {
        const matchCliente = s.cliente?.nome?.toLowerCase().includes(termo);
        const matchPlaca = s.veiculo?.placa?.toLowerCase().includes(termo);
        const matchCidade = s.endereco?.cidade?.toLowerCase().includes(termo);
        const matchTecnico = s.tecnico?.toLowerCase().includes(termo);
        const matchOS = (s.ordemServico || "").toLowerCase().includes(termo);
        return (
          matchCliente || matchPlaca || matchCidade || matchTecnico || matchOS
        );
      });
    }

    if (filtroStatus !== "todos") {
      resultado = resultado.filter((s) => s.status === filtroStatus);
    }

    if (filtroTecnico !== "todos") {
      resultado = resultado.filter((s) => s.tecnico === filtroTecnico);
    }

    if (filtroData !== "todas") {
      resultado = resultado.filter((s) => s.data === filtroData);
    }

    resultado.sort((a, b) => {
      let comparacao = 0;
      switch (ordenarPor) {
        case "data":
          const [d1, m1, y1] = (a.data || "").split("/").map(Number);
          const [d2, m2, y2] = (b.data || "").split("/").map(Number);
          comparacao =
            new Date(y1, m1 - 1, d1).getTime() -
            new Date(y2, m2 - 1, d2).getTime();
          break;
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
  }, [
    servicos,
    buscaLocal,
    filtroStatus,
    filtroTecnico,
    filtroData,
    ordenarPor,
    direcao,
  ]);

  // Métricas rápidas
  const metricas = useMemo(() => {
    const total = servicos.length;
    const pendentes = servicos.filter(
      (s) => s.status?.toLowerCase() === "pendente",
    ).length;
    const emAndamento = servicos.filter((s) => {
      const status = s.status?.toLowerCase().replace(/\s+/g, "_");
      return status === "em_andamento";
    }).length;
    const concluidos = servicos.filter((s) => {
      const status = s.status
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return status === "concluido";
    }).length;
    return { total, pendentes, emAndamento, concluidos };
  }, [servicos]);

  const toggleDirecao = useCallback(() => {
    setDirecao((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const openEditForm = useCallback((servico: Servico) => {
    setEditingServico(servico);
    setIsFormOpen(true);
  }, []);

  const openDeleteConfirm = useCallback((servico: Servico) => {
    setDeletingServico(servico);
  }, []);

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

  const limparFiltros = useCallback(() => {
    setBuscaLocal("");
    setFiltroStatus("todos");
    setFiltroTecnico("todos");
    setFiltroData("todas");
    setOrdenarPor("data");
    setDirecao("desc");
  }, []);

  const filtrosAtivos =
    buscaLocal ||
    filtroStatus !== "todos" ||
    filtroTecnico !== "todos" ||
    filtroData !== "todas";

  if (loading && servicos.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/20 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 w-12 h-12 relative z-10 mb-4" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse text-lg">
          Carregando seus serviços...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center border border-rose-100 mb-6 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Oops! Algo deu errado.
        </h2>
        <p className="text-slate-500 mt-3 max-w-md leading-relaxed text-lg">
          {error}
        </p>
        <Button
          variant="outline"
          className="mt-8 px-8 py-6 text-base"
          onClick={() => refresh()}
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "shadow-xl rounded-2xl font-medium text-sm border border-slate-100",
          duration: 4000,
        }}
      />

      {/* Cabeçalho */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Serviços
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-xl">
            Visão geral e gerenciamento completo de todos os serviços de
            rastreamento e manutenção.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingServico(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 w-full md:w-auto justify-center py-2.5 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Serviço
        </Button>
      </motion.div>

      {/* KPIs com Feedback Visual (Active State) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card
          className={`p-5 flex items-center gap-4 hoverable group cursor-pointer border-2 transition-all duration-300 ${
            filtroStatus === "todos"
              ? "border-blue-500 bg-blue-50/30 shadow-md"
              : "border-transparent hover:border-slate-200"
          }`}
          onClick={() => setFiltroStatus("todos")}
        >
          <div
            className={`p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
              filtroStatus === "todos"
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {metricas.total}
            </p>
          </div>
        </Card>

        <Card
          className={`p-5 flex items-center gap-4 hoverable group cursor-pointer border-2 transition-all duration-300 ${
            filtroStatus === "PENDENTE"
              ? "border-amber-500 bg-amber-50/30 shadow-md"
              : "border-transparent hover:border-slate-200"
          }`}
          onClick={() => setFiltroStatus("PENDENTE")}
        >
          <div
            className={`p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
              filtroStatus === "PENDENTE"
                ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pendentes
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {metricas.pendentes}
            </p>
          </div>
        </Card>

        <Card
          className={`p-5 flex items-center gap-4 hoverable group cursor-pointer border-2 transition-all duration-300 ${
            filtroStatus === "EM ANDAMENTO"
              ? "border-indigo-500 bg-indigo-50/30 shadow-md"
              : "border-transparent hover:border-slate-200"
          }`}
          onClick={() => setFiltroStatus("EM ANDAMENTO")}
        >
          <div
            className={`p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
              filtroStatus === "EM ANDAMENTO"
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                : "bg-indigo-50 text-indigo-600"
            }`}
          >
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Em Andamento
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {metricas.emAndamento}
            </p>
          </div>
        </Card>

        <Card
          className={`p-5 flex items-center gap-4 hoverable group cursor-pointer border-2 transition-all duration-300 ${
            filtroStatus === "CONCLUIDO"
              ? "border-emerald-500 bg-emerald-50/30 shadow-md"
              : "border-transparent hover:border-slate-200"
          }`}
          onClick={() => setFiltroStatus("CONCLUIDO")}
        >
          <div
            className={`p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
              filtroStatus === "CONCLUIDO"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Concluídos
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {metricas.concluidos}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Barra de Filtros e Busca */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-5"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, placa, OS..."
              value={buscaLocal}
              onChange={(e) => setBuscaLocal(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
            {buscaLocal && (
              <button
                onClick={() => setBuscaLocal("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap lg:flex-nowrap gap-3">
            <div className="relative flex-1 min-w-[140px]">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm"
              >
                <option value="todos">Status: Todos</option>
                <option value="PENDENTE">Pendente</option>
                <option value="EM ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 min-w-[140px]">
              <select
                value={filtroTecnico}
                onChange={(e) => setFiltroTecnico(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm"
              >
                <option value="todos">Técnico: Todos</option>
                {tecnicos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative flex-1 min-w-[140px]">
              <select
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all shadow-sm"
              >
                <option value="todas">Data: Todas</option>
                {datasDisponiveis.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <button
              onClick={toggleDirecao}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              title={
                direcao === "asc"
                  ? "Ordenação Crescente"
                  : "Ordenação Decrescente"
              }
            >
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline lg:hidden xl:inline">
                Ordem
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-slate-100 gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              <span className="font-bold text-slate-800">
                {servicosFiltrados.length}
              </span>{" "}
              resultados
            </span>
            {filtrosAtivos && (
              <button
                onClick={limparFiltros}
                className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors"
              >
                <Filter className="w-3.5 h-3.5" />
                Limpar filtros
              </button>
            )}
          </div>

          <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/50 self-start sm:self-auto">
            <button
              onClick={() => setVisualizacao("lista")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                visualizacao === "lista"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setVisualizacao("cards")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                visualizacao === "cards"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </motion.div>

      {/* Lista/Cards de Serviços */}
      <AnimatePresence mode="wait">
        {servicosFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center shadow-sm"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100 shadow-inner">
              <Wrench className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Nenhum serviço encontrado
            </h3>
            <p className="text-slate-500 max-w-md mb-8 text-base">
              {filtrosAtivos
                ? "Não encontramos resultados para a sua pesquisa. Tente ajustar os filtros ou remover termos da busca."
                : "Você ainda não possui serviços cadastrados. Comece adicionando um novo serviço para gerenciar suas atividades."}
            </p>
            {filtrosAtivos ? (
              <Button
                onClick={limparFiltros}
                variant="outline"
                className="px-6 py-2.5"
              >
                Limpar Todos os Filtros
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingServico(null);
                  setIsFormOpen(true);
                }}
                className="px-6 py-2.5 shadow-md"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Serviço
              </Button>
            )}
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
            className="space-y-3" // Espaçamento entre os cards alongados
          >
            {servicosFiltrados.map((servico) => (
              <motion.div
                key={servico.id}
                variants={itemVariants}
                layout
                onClick={() => setDetalhesServicoId(String(servico.id))}
                className="group bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer flex flex-col lg:flex-row lg:items-center gap-4 relative overflow-hidden"
              >
                {/* Indicador de status lateral (opcional, bem sutil) */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    servico.status?.toLowerCase() === "concluido"
                      ? "bg-emerald-500"
                      : servico.status?.toLowerCase() === "em andamento"
                        ? "bg-blue-500"
                        : servico.status?.toLowerCase() === "cancelado"
                          ? "bg-rose-500"
                          : "bg-orange-400"
                  }`}
                />

                {/* 1. Cliente e Veículo (Ocupa mais espaço) */}
                <div className="flex items-center gap-4 flex-[1.5] min-w-0 pl-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Car className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[15px] text-slate-900 truncate">
                      {servico.cliente?.nome || "Cliente não informado"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium tracking-wide">
                        {servico.veiculo?.placa || "S/ PLACA"}
                      </span>
                      <span className="text-[12px] text-slate-400 truncate">
                        OS: {servico.ordemServico || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid interno para alinhar os outros dados no desktop */}
                <div className="hidden flex-1 md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center pl-2 lg:pl-0 border-t border-slate-100 lg:border-t-0 pt-3 lg:pt-0">
                  {/* 2. Data e Horário */}
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar
                        className="w-4 h-4 text-slate-400"
                        strokeWidth={2}
                      />
                      {formatarDataExibicao(servico.data)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatarHorarioExibicao(servico.horario)}
                    </p>
                  </div>
                 
                    {/* 3. Técnico */}
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate uppercase">
                        {servico.tecnico || "—"}
                      </span>
                    </div>

                    {/* 4. Localização */}
                    <div
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-600 truncate"
                      title={servico.endereco?.cidade}
                    >
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {servico.endereco?.cidade || "Não informado"}
                      </span>
                    </div>

                    {/* 5. Status */}
                    <div className="flex lg:justify-center">
                      <StatusBadge
                        status={servico.status || "pendente"}
                        className="text-[11px] px-2.5 py-1"
                      />
                    </div>
                  </div>

                  {/* 6. Ações (Fixo à direita) */}
                  <div
                    className="flex items-center justify-end gap-2 lg:pl-4 content"
                     // Impede que os botões abram o modal
                  >
                    <div className="flex" onClick={(e) => e.stopPropagation()}>
 <button
                      onClick={() => openEditForm(servico)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100"
                      title="Editar"
                    >
                      <Edit3 className="w-4.5 h-4.5" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(servico)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                      title="Excluir"
                    >
                      <Trash2 className="w-4.5 h-4.5" strokeWidth={2} />
                    </button>
                    </div>
                   
                  </div>
                
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modais */}
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

      {/* Integração do Modal de Detalhes */}
      <ServicoDetalhesModal
        id={detalhesServicoId || ""}
        isOpen={!!detalhesServicoId}
        onClose={() => setDetalhesServicoId(null)}
        onEdit={openEditForm}
        onDelete={openDeleteConfirm}
      />
    </motion.div>
  );
}
