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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/features/StatusBadge";
import Link from "next/link";
import {
  formatarDataExibicao,
  formatarHorarioExibicao,
} from "@/lib/utils-format";
import type { Servico, FormularioServico } from "@/lib/types";
import ServicoForm from "@/components/modals/ServicoForm";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Toaster, toast } from "react-hot-toast";

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
    filters,
    setFilters,
  } = useServicos();

  const [buscaLocal, setBuscaLocal] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<Ordenacao>("data");
  const [direcao, setDirecao] = useState<Direcao>("desc");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroTecnico, setFiltroTecnico] = useState<string>("todos");
  const [filtroData, setFiltroData] = useState<string>("todas");
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [deletingServico, setDeletingServico] = useState<Servico | null>(null);
  const [visualizacao, setVisualizacao] = useState<"cards" | "lista">("lista");

  // Filtros combinados
  const servicosFiltrados = useMemo(() => {
    let resultado = [...servicos];

    // Busca textual local
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

    // Filtro status
    if (filtroStatus !== "todos") {
      resultado = resultado.filter((s) => s.status === filtroStatus);
    }

    // Filtro técnico
    if (filtroTecnico !== "todos") {
      resultado = resultado.filter((s) => s.tecnico === filtroTecnico);
    }

    // Filtro data
    if (filtroData !== "todas") {
      resultado = resultado.filter((s) => s.data === filtroData);
    }

    // Ordenação
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

  // Toggle direção
  const toggleDirecao = useCallback(() => {
    setDirecao((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  // Abrir form de edição
  const openEditForm = useCallback((servico: Servico) => {
    setEditingServico(servico);
    setIsFormOpen(true);
  }, []);

  // Abrir confirmação de delete
  const openDeleteConfirm = useCallback((servico: Servico) => {
    setDeletingServico(servico);
  }, []);

  // Criar serviço
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

  // Atualizar serviço
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

  // Deletar serviço
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

  // Limpar todos os filtros
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
          <div className="absolute inset-0 rounded-full blur-xl bg-slate-300/50 animate-pulse" />
          <Loader2 className="animate-spin text-slate-900 w-10 h-10 relative z-10 mb-4" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">
          Carregando serviços...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center border border-rose-100 mb-6 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Não foi possível carregar os serviços
        </h2>
        <p className="text-slate-500 mt-2 max-w-md leading-relaxed">{error}</p>
        <Button variant="outline" className="mt-8" onClick={() => refresh()}>
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
      className="space-y-6"
    >
      <Toaster
        position="top-right"
        toastOptions={{
          className: "shadow-lg rounded-xl font-medium text-sm",
          duration: 4000,
        }}
      />

      {/* Cabeçalho */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Serviços
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Gerencie todos os serviços de rastreamento e manutenção.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingServico(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card
          className="p-4 flex items-center gap-3 hoverable group cursor-pointer"
          onClick={() => setFiltroStatus("todos")}
        >
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
            <p className="text-xl font-extrabold text-slate-900">
              {metricas.total}
            </p>
          </div>
        </Card>

        <Card
          className="p-4 flex items-center gap-3 hoverable group cursor-pointer"
          onClick={() => setFiltroStatus("PENDENTE")}
        >
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Pendentes
            </p>
            <p className="text-xl font-extrabold text-slate-900">
              {metricas.pendentes}
            </p>
          </div>
        </Card>

        <Card
          className="p-4 flex items-center gap-3 hoverable group cursor-pointer"
          onClick={() => setFiltroStatus("EM ANDAMENTO")}
        >
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Em Andamento
            </p>
            <p className="text-xl font-extrabold text-slate-900">
              {metricas.emAndamento}
            </p>
          </div>
        </Card>

        <Card
          className="p-4 flex items-center gap-3 hoverable group cursor-pointer"
          onClick={() => setFiltroStatus("CONCLUIDO")}
        >
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">
              Concluídos
            </p>
            <p className="text-xl font-extrabold text-slate-900">
              {metricas.concluidos}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Barra de Filtros e Busca */}
      <motion.div
        variants={itemVariants}
        className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 space-y-4"
      >
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, placa, cidade, técnico ou OS..."
              value={buscaLocal}
              onChange={(e) => setBuscaLocal(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
            />
            {buscaLocal && (
              <button
                onClick={() => setBuscaLocal("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
            >
              <option value="todos">Todos os status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="EM ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDO">Concluído</option>
              <option value="CANCELADO">Cancelado</option>
            </select>

            <select
              value={filtroTecnico}
              onChange={(e) => setFiltroTecnico(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
            >
              <option value="todos">Todos os técnicos</option>
              {tecnicos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
            >
              <option value="todas">Todas as datas</option>
              {datasDisponiveis.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              onClick={toggleDirecao}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              title={direcao === "asc" ? "Crescente" : "Decrescente"}
            >
              <ArrowUpDown className="w-4 h-4" />
              <ChevronDown
                className={`w-3 h-3 transition-transform ${direcao === "asc" ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Filtros ativos e contagem */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              <span className="font-bold text-slate-800">
                {servicosFiltrados.length}
              </span>{" "}
              serviço{servicosFiltrados.length !== 1 ? "s" : ""} encontrado
              {servicosFiltrados.length !== 1 ? "s" : ""}
            </span>
            {filtrosAtivos && (
              <button
                onClick={limparFiltros}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Toggle visualização */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setVisualizacao("lista")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                visualizacao === "lista"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setVisualizacao("cards")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                visualizacao === "cards"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Cards
            </button>
          </div>
        </div>
      </motion.div>

      {/* Lista de Serviços */}
      <AnimatePresence mode="wait">
        {servicosFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Nenhum serviço encontrado
            </h3>
            <p className="text-slate-500 max-w-sm mb-6">
              {filtrosAtivos
                ? "Não encontramos resultados para os filtros aplicados. Tente ajustar sua busca."
                : "Você ainda não possui serviços cadastrados. Comece adicionando um novo serviço."}
            </p>
            {filtrosAtivos ? (
              <button
                onClick={limparFiltros}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Limpar filtros
              </button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setEditingServico(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
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
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {servicosFiltrados.map((servico) => (
              <motion.div
                key={servico.id}
                variants={itemVariants}
                layout
                className="group"
              >
                <Card className="p-5 h-full hoverable hover:shadow-md transition-all duration-300 relative overflow-hidden">
                  {/* Status indicator line */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${
                      servico.status?.toLowerCase() === "concluido"
                        ? "bg-emerald-500"
                        : servico.status?.toLowerCase() === "em andamento"
                          ? "bg-indigo-500"
                          : servico.status?.toLowerCase() === "pendente"
                            ? "bg-amber-500"
                            : "bg-slate-300"
                    }`}
                  />

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-100 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {servico.cliente?.nome || "Cliente não informado"}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono uppercase">
                          {servico.veiculo?.placa || "S/ Placa"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusBadge status={servico.status || "pendente"} />
                      <div className="relative group/menu">
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </button>
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                          <button
                            onClick={() => openEditForm(servico)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 first:rounded-t-xl"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(servico)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 last:rounded-b-xl"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">
                        {formatarDataExibicao(servico.data)}
                      </span>
                      <span className="text-slate-300">•</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">
                        {formatarHorarioExibicao(servico.horario)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">
                        {servico.tecnico || "Não atribuído"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        {servico.endereco?.cidade || "Cidade não informada"}
                      </span>
                    </div>

                    {servico.ordemServico && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-xs">
                          OS: {servico.ordemServico}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase">
                      {servico.tipoServico || "Tipo não especificado"}
                    </span>
                    <Link
                      href={`/agendamentos/${servico.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detalhes
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="lista"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">
                      Cliente / Veículo
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">
                      Data / Horário
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">
                      Técnico
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">
                      Status
                    </th>
                    <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">
                      Cidade
                    </th>
                    <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {servicosFiltrados.map((servico) => (
                    <motion.tr
                      key={servico.id}
                      variants={itemVariants}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                            <Car className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-slate-900">
                              {servico.cliente?.nome || "—"}
                            </p>
                            <p className="text-xs text-slate-500 font-mono uppercase">
                              {servico.veiculo?.placa || "S/ Placa"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-700">
                          <p className="font-medium">
                            {formatarDataExibicao(servico.data)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatarHorarioExibicao(servico.horario)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {servico.tecnico || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={servico.status || "pendente"} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {servico.endereco?.cidade || "—"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditForm(servico)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirm(servico)}
                            className="p-2 hover:bg-rose-50 rounded-lg transition-colors text-slate-500 hover:text-rose-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </motion.div>
  );
}
