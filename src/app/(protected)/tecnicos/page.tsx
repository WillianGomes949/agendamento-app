// src/app/tecnicos/page.tsx
"use client";

import { useState, useCallback, useMemo } from "react";
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
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/modals/Modal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Toaster, toast } from "react-hot-toast";
import type { TecnicoStats } from "@/lib/api/tecnicos.types";
import { useTecnicos } from "@/hooks/useTecnicos";
import { useQueryClient } from "@tanstack/react-query";

type FormState = {
  nome: string;
  cpf: string;
  cnpj: string;
  whatsapp: string;
  vinculo: string;
};

const FORM_VAZIO: FormState = {
  nome: "",
  cpf: "",
  cnpj: "",
  whatsapp: "",
  vinculo: "",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function TecnicosPage() {
  const queryClient = useQueryClient();

  // ✅ Dados vindos do TanStack Query (substitui useState + fetch manual)
  const {
    tecnicos,
    loading,
    error,
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTecnicos();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativos" | "inativos"
  >("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState<TecnicoStats | null>(
    null,
  );
  const [deletingTecnico, setDeletingTecnico] = useState<TecnicoStats | null>(
    null,
  );
  const [formData, setFormData] = useState<FormState>(FORM_VAZIO);
  const [formError, setFormError] = useState("");

  // ✅ isSubmitting agora vem diretamente do hook (otimistic + mutation state)
  const isSubmitting = isCreating || isUpdating;

  // Filtros client-side
  const tecnicosFiltrados = useMemo(() => {
    return tecnicos.filter((t) => {
      const matchBusca = (t.nome ?? "")
        .toLowerCase()
        .includes(busca.toLowerCase());
      const matchStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && t.ativo) ||
        (filtroStatus === "inativos" && !t.ativo);
      return matchBusca && matchStatus;
    });
  }, [tecnicos, busca, filtroStatus]);

  const totalAtivos = tecnicos.filter((t) => t.ativo).length;
  const totalInativos = tecnicos.filter((t) => !t.ativo).length;
  const totalServicos = tecnicos.reduce(
    (acc, t) => acc + (t.totalServicos ?? 0),
    0,
  );

  // ✅ DELETE — com rollback automático via Query Client
  const handleDelete = useCallback(async () => {
    if (!deletingTecnico) return;
    try {
      await remove(deletingTecnico.nome);
      // Invalida também o cache de configurações (lista de técnicos em selects)
      queryClient.invalidateQueries({ queryKey: ["config", "tecnicos"] });
      toast.success("Técnico removido!");
      setDeletingTecnico(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao remover técnico";

      if (errorMsg.includes("possui") && errorMsg.includes("serviço")) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Não é possível excluir</span>
            <span className="text-sm">
              Este técnico possui serviços vinculados. Desative-o primeiro.
            </span>
          </div>,
          { icon: "⚠", duration: 5000 },
        );
      } else {
        toast.error(errorMsg);
      }
    }
  }, [deletingTecnico, remove, queryClient]);

  // ✅ CREATE
  const handleCreate = useCallback(async () => {
    if (!formData.nome.trim()) {
      setFormError("Nome é obrigatório");
      return;
    }
    setFormError("");

    const payload = {
      nome: formData.nome.trim(),
      ...(formData.cpf.trim() && { cpf: formData.cpf.trim() }),
      ...(formData.cnpj.trim() && { cnpj: formData.cnpj.trim() }),
      ...(formData.whatsapp.trim() && { whatsapp: formData.whatsapp.trim() }),
      ...(formData.vinculo.trim() && { vinculo: formData.vinculo.trim() }),
    };

    try {
      await create(payload);
      queryClient.invalidateQueries({ queryKey: ["config", "tecnicos"] });
      toast.success("Técnico criado com sucesso!");
      setIsFormOpen(false);
      setFormData(FORM_VAZIO);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao criar técnico";

      if (errorMsg.includes("já existe")) {
        setFormError("Já existe um técnico com este nome");
        toast.error("Técnico já cadastrado", { icon: "⚠" });
      } else {
        setFormError(errorMsg);
        toast.error(errorMsg);
      }
    }
  }, [formData, create, queryClient]);

  // ✅ UPDATE (inclui renomeação com propagação)
  const handleUpdate = useCallback(async () => {
    if (!editingTecnico || !formData.nome.trim()) {
      setFormError("Nome é obrigatório");
      return;
    }
    setFormError("");

    const updates: Record<string, unknown> = {
      nomeAntigo: editingTecnico.nome,
      nome: formData.nome.trim(),
      ...(formData.cpf.trim() && { cpf: formData.cpf.trim() }),
      ...(formData.cnpj.trim() && { cnpj: formData.cnpj.trim() }),
      ...(formData.whatsapp.trim() && { whatsapp: formData.whatsapp.trim() }),
      ...(formData.vinculo.trim() && { vinculo: formData.vinculo.trim() }),
    };

    try {
      await update(updates as { nomeAntigo: string } & Record<string, unknown>);
      queryClient.invalidateQueries({ queryKey: ["config", "tecnicos"] });
      toast.success("Técnico atualizado!");
      setIsFormOpen(false);
      setEditingTecnico(null);
      setFormData(FORM_VAZIO);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao atualizar técnico";
      setFormError(msg);
      toast.error(msg);
    }
  }, [editingTecnico, formData, update, queryClient]);

  // ✅ TOGGLE ATIVO (com optimistic update via hook)
  const handleToggleAtivo = useCallback(
    async (tecnico: TecnicoStats) => {
      const novoAtivo = !tecnico.ativo;
      try {
        await update({
          nomeAntigo: tecnico.nome,
          ativo: novoAtivo,
        });
        queryClient.invalidateQueries({ queryKey: ["config", "tecnicos"] });
        toast.success(novoAtivo ? "Técnico ativado" : "Técnico desativado");
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Erro ao atualizar status";
        toast.error(errorMsg);
      }
    },
    [update, queryClient],
  );

  const openEditForm = useCallback((tecnico: TecnicoStats) => {
    setEditingTecnico(tecnico);
    setFormData({
      nome: tecnico.nome,
      cpf: tecnico.cpf ?? "",
      cnpj: tecnico.cnpj ?? "",
      whatsapp: tecnico.whatsapp ?? "",
      vinculo: tecnico.vinculo ?? "",
    });
    setIsFormOpen(true);
    setFormError("");
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingTecnico(null);
    setFormData(FORM_VAZIO);
    setIsFormOpen(true);
    setFormError("");
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingTecnico(null);
    setFormData(FORM_VAZIO);
    setFormError("");
  }, []);

  // ============================ LOADING ============================
  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="mt-3 text-sm font-medium text-text-muted">
          Carregando técnicos...
        </p>
      </div>
    );
  }

  // ============================ ERRO ============================
  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
          <AlertCircle
            className="h-6 w-6 text-rose-600 dark:text-rose-400"
            aria-hidden
          />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-text">
          Ops! Algo deu errado.
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">
          {error}
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => window.location.reload()}
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // ============================ UI ============================
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

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm sm:flex-row sm:p-6"
      >
        <div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-text md:text-3xl">
            Técnicos
          </h1>
          <p className="max-w-xl text-sm text-text-muted md:text-[15px]">
            Gerencie sua equipe de técnicos. Adicione, edite ou desative
            profissionais do sistema.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={openCreateForm}
          className="w-full sm:w-auto"
        >
          Novo Técnico
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4"
      >
        <Card
          padding="none"
          className="flex items-center gap-4 p-4 hover:shadow-md"
        >
          <div className="flex items-center justify-center rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Total
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {tecnicos.length}
            </p>
          </div>
        </Card>

        <Card
          padding="none"
          className="flex items-center gap-4 p-4 hover:shadow-md"
        >
          <div className="flex items-center justify-center rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Ativos
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {totalAtivos}
            </p>
          </div>
        </Card>

        <Card
          padding="none"
          className="flex items-center gap-4 p-4 hover:shadow-md"
        >
          <div className="flex items-center justify-center rounded-lg bg-bg-muted/50 p-2.5 text-text-muted">
            <ToggleLeft className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Inativos
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {totalInativos}
            </p>
          </div>
        </Card>

        <Card
          padding="none"
          className="flex items-center gap-4 p-4 hover:shadow-md"
        >
          <div className="flex items-center justify-center rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Serviços
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {totalServicos}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Filtros */}
      <motion.div
        variants={itemVariants}
        className="space-y-4 rounded-2xl border border-border bg-bg-elevated p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="group relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-text"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Pesquisar técnicos"
              className="h-10 w-full rounded-lg border border-border bg-bg-muted/30 pl-9 pr-9 text-sm font-medium text-text transition-colors placeholder:text-text-muted/50 focus:border-text focus:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-text/30"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                aria-label="Limpar pesquisa"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="inline-flex gap-0.5 rounded-lg border border-border bg-bg-muted/40 p-0.5">
            {(["todos", "ativos", "inativos"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
                  filtroStatus === status
                    ? "bg-bg text-text shadow-sm ring-1 ring-border/60"
                    : "text-text-muted hover:bg-bg-elevated/60 hover:text-text"
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

        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="inline-flex items-center rounded-md border border-border bg-bg-muted/40 px-3 py-1.5 text-xs font-medium text-text-muted">
            <span className="font-semibold text-text">
              {tecnicosFiltrados.length}
            </span>
            <span className="mx-1">·</span>
            {tecnicosFiltrados.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>
      </motion.div>

      {/* Lista de Técnicos */}
      <AnimatePresence mode="wait">
        {tecnicosFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-elevated px-4 py-16 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-bg-muted/50">
              <Users className="h-7 w-7 text-text-muted/60" aria-hidden />
            </div>
            <h3 className="mb-2 text-base font-semibold tracking-tight text-text">
              Nenhum técnico encontrado
            </h3>
            <p className="mb-6 max-w-md text-sm text-text-muted">
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
                size="sm"
              >
                Limpar Filtros
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={Plus}
                onClick={openCreateForm}
                size="sm"
              >
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
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 sm:gap-5"
          >
            {tecnicosFiltrados.map((tecnico) => (
              <motion.div key={tecnico.nome} variants={itemVariants} layout>
                <Card
                  padding="none"
                  className="relative flex h-full flex-col justify-between overflow-hidden p-5 hover:shadow-md"
                >
                  {/* Barra de Status */}
                  <div
                    className={`absolute left-0 top-0 h-1 w-full ${
                      tecnico.ativo
                        ? "bg-emerald-500 dark:bg-emerald-400"
                        : "bg-border-strong"
                    }`}
                  />

                  <div className="mt-1">
                    {/* Header do Card */}
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-base font-bold ring-1 ring-inset ring-white/15 ${
                            tecnico.ativo
                              ? "bg-linear-to-br from-blue-600 to-indigo-700 text-white"
                              : "bg-bg-muted text-text-muted ring-border"
                          }`}
                        >
                          {(tecnico.nome ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold tracking-tight text-text">
                            {tecnico.nome}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                                tecnico.ativo
                                  ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
                                  : "bg-bg-muted/50 text-text-muted ring-border"
                              }`}
                            >
                              {tecnico.ativo ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <ToggleLeft className="h-3 w-3" />
                              )}
                              {tecnico.ativo ? "Ativo" : "Inativo"}
                            </span>
                            {tecnico.vinculo && (
                              <span className="inline-flex items-center rounded-md bg-bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted ring-1 ring-inset ring-border">
                                {tecnico.vinculo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-4 rounded-lg border border-border bg-bg-muted/40 p-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            Total
                          </p>
                          <p className="text-lg font-semibold tracking-tight text-text">
                            {tecnico.totalServicos ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            Concluídos
                          </p>
                          <p className="text-lg font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                            {tecnico.servicosConcluidos ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                            Pendentes
                          </p>
                          <p className="text-lg font-semibold tracking-tight text-amber-600 dark:text-amber-400">
                            {tecnico.servicosPendentes ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dados extras */}
                    {(tecnico.whatsapp || tecnico.cpf || tecnico.cnpj) && (
                      <div className="mb-4 space-y-1.5 text-sm text-text">
                        {tecnico.whatsapp && (
                          <p>
                            <span className="font-medium text-text-muted">
                              WhatsApp:
                            </span>{" "}
                            {tecnico.whatsapp}
                          </p>
                        )}
                        {tecnico.cpf && (
                          <p>
                            <span className="font-medium text-text-muted">
                              CPF:
                            </span>{" "}
                            {tecnico.cpf}
                          </p>
                        )}
                        {tecnico.cnpj && (
                          <p>
                            <span className="font-medium text-text-muted">
                              CNPJ:
                            </span>{" "}
                            {tecnico.cnpj}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <button
                      onClick={() => handleToggleAtivo(tecnico)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
                        tecnico.ativo
                          ? "text-text-muted hover:bg-bg-hover"
                          : "text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                      }`}
                      title={
                        tecnico.ativo ? "Desativar técnico" : "Ativar técnico"
                      }
                    >
                      {tecnico.ativo ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                      {tecnico.ativo ? "Desativar" : "Ativar"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(tecnico)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:bg-bg-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                        title="Editar técnico"
                        aria-label="Editar técnico"
                      >
                        <Edit3 className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setDeletingTecnico(tecnico)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:hover:text-rose-400"
                        title="Excluir técnico"
                        aria-label="Excluir técnico"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Formulário */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent ring-1 ring-inset ring-white/15">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-text">
                {editingTecnico ? "Editar Técnico" : "Novo Técnico"}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-text-muted">
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
            if (editingTecnico) {
              handleUpdate();
            } else {
              handleCreate();
            }
          }}
          className="space-y-5"
        >
          <Input
            label="Nome do Técnico"
            placeholder="Ex: João Silva"
            value={formData.nome}
            onChange={(e) => {
              setFormData((f) => ({ ...f, nome: e.target.value }));
              setFormError("");
            }}
            error={formError}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="CPF"
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) =>
                setFormData((f) => ({ ...f, cpf: e.target.value }))
              }
            />
            <Input
              label="CNPJ"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) =>
                setFormData((f) => ({ ...f, cnpj: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="WhatsApp"
              placeholder="(11) 99999-9999"
              value={formData.whatsapp}
              onChange={(e) =>
                setFormData((f) => ({ ...f, whatsapp: e.target.value }))
              }
            />
            <Select
              label="Vínculo"
              value={formData.vinculo}
              onChange={(e) =>
                setFormData((f) => ({ ...f, vinculo: e.target.value }))
              }
              options={[
                { value: "", label: "Selecione..." },
                { value: "clt", label: "CLT" },
                { value: "pj", label: "PJ" },
                { value: "terceirizado", label: "Terceirizado" },
                { value: "autonomo", label: "Autônomo" },
                { value: "estagio", label: "Estágio" },
              ]}
            />
          </div>

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
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
        isLoading={isDeleting}
      />
    </motion.div>
  );
}
