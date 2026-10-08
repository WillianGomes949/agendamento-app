// src/app/servicos/page.tsx
"use client";
import { useState, useMemo, useCallback } from "react";
import { useServicos } from "@/hooks/useServicos";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Search,
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
  ChevronDown,
  X,
  ArrowUpDown,
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
import { ErrorModal } from "@/components/modals/ErrorModal";
import { useErrorModal } from "@/hooks/useErrorModal";

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

type Ordenacao = "data" | "status" | "tecnico" | "cliente";
type Direcao = "asc" | "desc";

export default function ServicosPage() {
  const {
    servicos,
    loading,
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
  const { errorModal, showError, closeModal } = useErrorModal();

  const servicosFiltrados = useMemo(() => {
    let resultado = [...servicos];
    if (buscaLocal.trim()) {
      const termo = buscaLocal.toLowerCase().trim();
      resultado = resultado.filter(
        (s) =>
          s.cliente?.nome?.toLowerCase().includes(termo) ||
          s.veiculo?.placa?.toLowerCase().includes(termo) ||
          s.endereco?.cidade?.toLowerCase().includes(termo) ||
          s.tecnico?.toLowerCase().includes(termo) ||
          (s.ordemServico || "").toLowerCase().includes(termo),
      );
    }
    if (filtroStatus !== "todos")
      resultado = resultado.filter((s) => s.status === filtroStatus);
    if (filtroTecnico !== "todos")
      resultado = resultado.filter((s) => s.tecnico === filtroTecnico);
    if (filtroData !== "todas")
      resultado = resultado.filter((s) => s.data === filtroData);
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

  const metricas = useMemo(() => {
    const total = servicos.length;
    const pendentes = servicos.filter(
      (s) => s.status?.toLowerCase() === "pendente",
    ).length;
    const emAndamento = servicos.filter(
      (s) => s.status?.toLowerCase().replace(/\s+/g, "_") === "em_andamento",
    ).length;
    const concluidos = servicos.filter(
      (s) =>
        s.status
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") === "concluido",
    ).length;
    return { total, pendentes, emAndamento, concluidos };
  }, [servicos]);

  const toggleDirecao = useCallback(
    () => setDirecao((prev) => (prev === "asc" ? "desc" : "asc")),
    [],
  );
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
        // Mostra o modal estilizado em vez do toast
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
          <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/20 dark:bg-blue-400/20 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 w-12 h-12 relative z-10 mb-4" />
        </div>
        <p className="text-text-muted font-medium animate-pulse text-lg mt-2">
          A carregar serviços...
        </p>
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
            "shadow-lg rounded-xl font-medium text-sm border border-border",
          duration: 4000,
        }}
      />

      <motion.div
        variants={itemVariants}
        className="bg-bg-elevated p-6 rounded-2xl shadow-sm border border-border flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text mb-2">
            Serviços
          </h1>
          <p className="text-text-muted text-sm md:text-base max-w-xl">
            Visão geral e gestão completa de todos os serviços.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingServico(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 w-full md:w-auto justify-center shadow-sm hover:shadow-md transition-all py-3 px-6"
        >
          <Plus className="w-5 h-5" /> Novo Serviço
        </Button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <Card
          className={`p-5 flex items-center gap-4 transition-all duration-300 cursor-pointer group hover:shadow-md ${
            filtroStatus === "todos"
              ? "ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-1 ring-offset-bg"
              : ""
          }`}
          onClick={() => setFiltroStatus("todos")}
        >
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-all duration-300">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Total
            </p>
            <p className="text-2xl font-extrabold text-text mt-0.5">
              {metricas.total}
            </p>
          </div>
        </Card>
        <Card
          className={`p-5 flex items-center gap-4 transition-all duration-300 cursor-pointer group hover:shadow-md ${
            filtroStatus === "PENDENTE"
              ? "ring-2 ring-amber-500 dark:ring-amber-400 ring-offset-1 ring-offset-bg"
              : ""
          }`}
          onClick={() => setFiltroStatus("PENDENTE")}
        >
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-all duration-300">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Pendentes
            </p>
            <p className="text-2xl font-extrabold text-text mt-0.5">
              {metricas.pendentes}
            </p>
          </div>
        </Card>
        <Card
          className={`p-5 flex items-center gap-4 transition-all duration-300 cursor-pointer group hover:shadow-md ${
            filtroStatus === "EM ANDAMENTO"
              ? "ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-1 ring-offset-bg"
              : ""
          }`}
          onClick={() => setFiltroStatus("EM ANDAMENTO")}
        >
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 transition-all duration-300">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Em Andamento
            </p>
            <p className="text-2xl font-extrabold text-text mt-0.5">
              {metricas.emAndamento}
            </p>
          </div>
        </Card>
        <Card
          className={`p-5 flex items-center gap-4 transition-all duration-300 cursor-pointer group hover:shadow-md ${
            filtroStatus === "CONCLUIDO"
              ? "ring-2 ring-emerald-500 dark:ring-emerald-400 ring-offset-1 ring-offset-bg"
              : ""
          }`}
          onClick={() => setFiltroStatus("CONCLUIDO")}
        >
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-all duration-300">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Concluídos
            </p>
            <p className="text-2xl font-extrabold text-text mt-0.5">
              {metricas.concluidos}
            </p>
          </div>
        </Card>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-bg-elevated rounded-2xl border border-border shadow-sm p-5 space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, placa, OS..."
              value={buscaLocal}
              onChange={(e) => setBuscaLocal(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-bg-muted border border-border rounded-xl text-sm font-medium text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent focus:bg-bg-elevated transition-all shadow-sm"
            />
            {buscaLocal && (
              <button
                onClick={() => setBuscaLocal("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text hover:bg-bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap lg:flex-nowrap gap-3">
            <div className="relative flex-1 min-w-35">
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-bg-muted border border-border rounded-xl text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent cursor-pointer hover:bg-bg transition-colors shadow-sm"
              >
                <option value="todos">Status: Todos</option>
                <option value="PENDENTE">Pendente</option>
                <option value="EM ANDAMENTO">Em Andamento</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
            <div className="relative flex-1 min-w-35">
              <select
                value={filtroTecnico}
                onChange={(e) => setFiltroTecnico(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-bg-muted border border-border rounded-xl text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent cursor-pointer hover:bg-bg transition-colors shadow-sm"
              >
                <option value="todos">Técnico: Todos</option>
                {tecnicos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
            <div className="relative flex-1 min-w-35">
              <select
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-3 bg-bg-muted border border-border rounded-xl text-sm font-semibold text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent cursor-pointer hover:bg-bg transition-colors shadow-sm"
              >
                <option value="todas">Data: Todas</option>
                {datasDisponiveis.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
            <button
              onClick={toggleDirecao}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-bg-elevated border border-border rounded-xl text-sm font-semibold text-text hover:bg-bg-muted transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              title={
                direcao === "asc"
                  ? "Ordenação Crescente"
                  : "Ordenação Decrescente"
              }
            >
              <ArrowUpDown className="w-4 h-4 text-text-muted" />
              <span className="hidden sm:inline lg:hidden xl:inline">
                Ordem
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-border gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text bg-bg-muted px-3 py-1.5 rounded-lg border border-border">
              <span className="font-bold text-text">
                {servicosFiltrados.length}
              </span>{" "}
              resultados
            </span>
            {filtrosAtivos && (
              <button
                onClick={limparFiltros}
                className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1.5 transition-colors px-2"
              >
                <Filter className="w-4 h-4" /> Limpar filtros
              </button>
            )}
          </div>
          <div className="flex items-center p-1 bg-bg-muted rounded-lg border border-border shadow-inner self-start sm:self-auto">
            <button
              onClick={() => setVisualizacao("lista")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                visualizacao === "lista"
                  ? "bg-bg-elevated text-text shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setVisualizacao("cards")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 ${
                visualizacao === "cards"
                  ? "bg-bg-elevated text-text shadow-sm"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {servicosFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20 px-4 bg-bg-elevated rounded-2xl border border-border text-center shadow-sm"
          >
            <div className="w-20 h-20 bg-bg-muted rounded-full flex items-center justify-center mb-5 border border-border">
              <Wrench className="w-10 h-10 text-text-muted/50" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">
              Nenhum serviço encontrado
            </h3>
            <p className="text-text-muted max-w-md mb-8 text-base">
              {filtrosAtivos
                ? "Não encontrámos resultados para a sua pesquisa. Tente ajustar os filtros."
                : "Ainda não possui serviços registados. Comece por adicionar um novo serviço."}
            </p>
            {filtrosAtivos ? (
              <Button
                onClick={limparFiltros}
                variant="outline"
                className="px-6 py-2.5"
              >
                Limpar Filtros
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
                <Plus className="w-5 h-5 mr-2" /> Criar Primeiro Serviço
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
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
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
            className="space-y-4"
          >
            {servicosFiltrados.map((servico) => {
              const getBorderColor = () => {
                const s = servico.status?.toLowerCase();
                if (s === "concluido")
                  return "border-emerald-500 dark:border-emerald-400";
                if (s === "em andamento" || s === "em_andamento")
                  return "border-indigo-500 dark:border-indigo-400";
                if (s === "cancelado")
                  return "border-rose-500 dark:border-rose-400";
                return "border-amber-400 dark:border-amber-500";
              };
              return (
                <motion.div
                  key={servico.id}
                  variants={itemVariants}
                  layout
                  onClick={() => setDetalhesServicoId(String(servico.id))}
                  className={`group bg-bg-elevated rounded-xl p-4 sm:p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col lg:flex-row lg:items-center gap-4 relative overflow-hidden border border-border border-l-4 hover:border-l-blue-500 dark:hover:border-l-blue-400 ${getBorderColor()}`}
                >
                  <div className="flex items-center gap-4 flex-[1.5] min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-bg-muted border border-border flex items-center justify-center shrink-0 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 group-hover:border-blue-100 dark:group-hover:border-blue-800 transition-colors">
                      <Car className="w-6 h-6 text-text-muted group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base text-text truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                        {servico.cliente?.nome || "Cliente não informado"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono uppercase bg-bg-muted text-text px-2 py-0.5 rounded font-bold tracking-wider border border-border">
                          {servico.veiculo?.placa || "S/ PLACA"}
                        </span>
                        <span className="text-xs text-text-muted font-medium truncate">
                          OS: {servico.ordemServico || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden flex-1 md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center pl-2 lg:pl-0 border-t border-border lg:border-t-0 pt-3 lg:pt-0">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold text-text flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        {formatarDataExibicao(servico.data)}
                      </p>
                      <p className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-text-muted" />
                        {formatarHorarioExibicao(servico.horario)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-text-muted" />
                      </div>
                      <span className="text-sm font-semibold text-text truncate uppercase">
                        {servico.tecnico || "—"}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-sm font-medium text-text truncate"
                      title={servico.endereco?.cidade}
                    >
                      <MapPin className="w-4 h-4 text-text-muted shrink-0" />
                      <span className="truncate">
                        {servico.endereco?.cidade || "Não informado"}
                      </span>
                    </div>
                    <div className="flex lg:justify-center">
                      <StatusBadge status={servico.status || "pendente"} />
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-end gap-1 lg:pl-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => openEditForm(servico)}
                      className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(servico)}
                      className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2} />
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
        message="Tem a certeza de que deseja excluir este serviço? Esta ação não pode ser desfeita."
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
