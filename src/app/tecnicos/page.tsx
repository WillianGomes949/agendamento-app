// src/app/tecnicos/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  Briefcase,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/modals/Modal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Toaster, toast } from "react-hot-toast";
import {
  getTecnicosComStats,
  createTecnico,
  updateTecnico,
  deleteTecnico,
} from "@/app/api/tecnicos/route";

interface TecnicoStats {
  nome: string;
  ativo: boolean; 
  totalServicos: number;
  servicosConcluidos: number;
  servicosPendentes: number;
}

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
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState<TecnicoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativos" | "inativos"
  >("todos");

  // Modais
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState<TecnicoStats | null>(
    null,
  );
  const [deletingTecnico, setDeletingTecnico] = useState<TecnicoStats | null>(
    null,
  );
  const [formData, setFormData] = useState({ nome: "" });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const carregarTecnicos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dados = await getTecnicosComStats();
      setTecnicos(dados);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Falha ao carregar técnicos";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTecnicos();
  }, [carregarTecnicos]);

  const tecnicosFiltrados = tecnicos.filter((t) => {
    const matchBusca = t.nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "ativos" && t.ativo) ||
      (filtroStatus === "inativos" && !t.ativo);
    return matchBusca && matchStatus;
  });

  const totalAtivos = tecnicos.filter((t) => t.ativo).length;
  const totalInativos = tecnicos.filter((t) => !t.ativo).length;
  const totalServicos = tecnicos.reduce((acc, t) => acc + t.totalServicos, 0);

  const handleCreate = useCallback(async () => {
    if (!formData.nome.trim()) {
      setFormError("Nome é obrigatório");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await createTecnico(formData.nome.trim());
      toast.success("Técnico criado com sucesso!");
      setIsFormOpen(false);
      setFormData({ nome: "" });
      await carregarTecnicos();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar técnico";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData.nome, carregarTecnicos]);

  const handleUpdate = useCallback(async () => {
    if (!editingTecnico || !formData.nome.trim()) {
      setFormError("Nome é obrigatório");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      await updateTecnico(editingTecnico.nome, { nome: formData.nome.trim() });
      toast.success("Técnico atualizado com sucesso!");
      setIsFormOpen(false);
      setEditingTecnico(null);
      setFormData({ nome: "" });
      await carregarTecnicos();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao atualizar técnico";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingTecnico, formData.nome, carregarTecnicos]);

  const handleToggleAtivo = useCallback(
    async (tecnico: TecnicoStats) => {
      try {
        await updateTecnico(tecnico.nome, { ativo: !tecnico.ativo });
        toast.success(tecnico.ativo ? "Técnico desativado" : "Técnico ativado");
        await carregarTecnicos();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Erro ao atualizar status";
        toast.error(msg);
      }
    },
    [carregarTecnicos],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingTecnico) return;

    try {
      await deleteTecnico(deletingTecnico.nome);
      toast.success("Técnico removido com sucesso!");
      setDeletingTecnico(null);
      await carregarTecnicos();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao remover técnico";
      toast.error(msg);
    }
  }, [deletingTecnico, carregarTecnicos]);

  const openEditForm = useCallback((tecnico: TecnicoStats) => {
    setEditingTecnico(tecnico);
    setFormData({ nome: tecnico.nome });
    setIsFormOpen(true);
    setFormError("");
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingTecnico(null);
    setFormData({ nome: "" });
    setIsFormOpen(true);
    setFormError("");
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/20 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 w-12 h-12 relative z-10 mb-4" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse text-lg">
          Carregando técnicos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-rose-50 rounded-4xl flex items-center justify-center border border-rose-100 mb-6 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Ops! Algo deu errado.
        </h2>
        <p className="text-slate-500 mt-3 max-w-md leading-relaxed text-lg">
          {error}
        </p>
        <Button
          variant="outline"
          className="mt-8 px-8 py-6 text-base"
          onClick={carregarTecnicos}
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

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Técnicos
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-xl">
            Gerencie sua equipe de técnicos. Adicione, edite ou desative
            profissionais do sistema.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openCreateForm}
          className="flex items-center gap-2 w-full md:w-auto justify-center py-2.5 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Técnico
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {tecnicos.length}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ativos
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {totalAtivos}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-slate-100 text-slate-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <ToggleLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Inativos
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {totalInativos}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Serviços
            </p>
            <p className="text-2xl font-extrabold text-slate-900">
              {totalServicos}
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
              placeholder="Pesquisar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap lg:flex-nowrap gap-3">
            <div className="flex bg-slate-100/80 p-1 rounded-xl">
              {(["todos", "ativos", "inativos"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFiltroStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    filtroStatus === status
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {status === "todos"
                    ? "Todos"
                    : status === "ativos"
                      ? "Ativos"
                      : "Inativos"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              <span className="font-bold text-slate-800">
                {tecnicosFiltrados.length}
              </span>{" "}
              {tecnicosFiltrados.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Lista de Técnicos */}
      <AnimatePresence mode="wait">
        {tecnicosFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center shadow-sm"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100 shadow-inner">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Nenhum técnico encontrado
            </h3>
            <p className="text-slate-500 max-w-md mb-8 text-base">
              {busca || filtroStatus !== "todos"
                ? "Não encontramos resultados para a sua pesquisa. Tente ajustar os filtros."
                : "Você ainda não possui técnicos cadastrados. Comece adicionando um novo técnico."}
            </p>
            {busca || filtroStatus !== "todos" ? (
              <Button
                onClick={() => {
                  setBusca("");
                  setFiltroStatus("todos");
                }}
                variant="outline"
                className="px-6 py-2.5"
              >
                Limpar Filtros
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={openCreateForm}
                className="px-6 py-2.5 shadow-md"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Técnico
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {tecnicosFiltrados.map((tecnico) => (
              <motion.div key={tecnico.nome} variants={itemVariants} layout>
                <Card className="p-6 bg-white shadow-sm hover:shadow-md border border-slate-100 rounded-2xl transition-all duration-300 relative overflow-hidden">
                  {/* Indicador de status */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${
                      tecnico.ativo ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  />

                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                          tecnico.ativo
                            ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {tecnico.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-900 uppercase tracking-tight leading-tight">
                          {tecnico.nome}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${
                              tecnico.ativo
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                                : "bg-slate-50 text-slate-500 ring-slate-500/20"
                            }`}
                          >
                            {tecnico.ativo ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <ToggleLeft className="w-3 h-3" />
                            )}
                            {tecnico.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Total
                        </p>
                        <p className="text-xl font-extrabold text-slate-900">
                          {tecnico.totalServicos}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Concluídos
                        </p>
                        <p className="text-xl font-extrabold text-emerald-600">
                          {tecnico.servicosConcluidos}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Pendentes
                        </p>
                        <p className="text-xl font-extrabold text-amber-600">
                          {tecnico.servicosPendentes}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleToggleAtivo(tecnico)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        tecnico.ativo
                          ? "text-slate-600 hover:bg-slate-100"
                          : "text-emerald-600 hover:bg-emerald-50"
                      }`}
                      title={
                        tecnico.ativo ? "Desativar técnico" : "Ativar técnico"
                      }
                    >
                      {tecnico.ativo ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                      {tecnico.ativo ? "Desativar" : "Ativar"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(tecnico)}
                        className="w-10 h-10 flex items-center justify-center text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                        title="Editar técnico"
                      >
                        <Edit3 className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setDeletingTecnico(tecnico)}
                        className="w-10 h-10 flex items-center justify-center text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
                        title="Excluir técnico"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Criar/Editar */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTecnico(null);
          setFormData({ nome: "" });
          setFormError("");
        }}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {editingTecnico ? "Editar Técnico" : "Novo Técnico"}
              </h2>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                {editingTecnico
                  ? "Atualize as informações do técnico"
                  : "Adicione um novo técnico à equipe"}
              </p>
            </div>
          </div>
        }
        size="md"
        closeOnOverlayClick={!isSubmitting}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            editingTecnico ? handleUpdate() : handleCreate();
          }}
          className="space-y-6"
        >
          <div className="space-y-5">
            <div>
              <Input
                label="Nome do Técnico"
                placeholder="Ex: João Silva"
                value={formData.nome}
                onChange={(e) => {
                  setFormData({ nome: e.target.value });
                  setFormError("");
                }}
                error={formError}
                required
                autoFocus
              />
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsFormOpen(false);
                setEditingTecnico(null);
                setFormData({ nome: "" });
                setFormError("");
              }}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting
                ? "Salvando..."
                : editingTecnico
                  ? "Salvar Alterações"
                  : "Criar Técnico"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={!!deletingTecnico}
        onClose={() => setDeletingTecnico(null)}
        onConfirm={handleDelete}
        title="Excluir técnico"
        message="Tem certeza que deseja excluir este técnico? Esta ação não pode ser desfeita."
        itemName={deletingTecnico?.nome || "este técnico"}
        isLoading={false}
      />
    </motion.div>
  );
}
