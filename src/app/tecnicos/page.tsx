// src/app/tecnicos/page.tsx
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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
import type { TecnicoStats } from "@/lib/api/tecnicos.types";
import { invalidateConfigCache } from "@/lib/config-cache";

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

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {}
  const body = json as {
    success?: boolean;
    data?: T;
    error?: string;
    details?: string;
  } | null;
  if (!res.ok || (body && body.success === false)) {
    const msg = body?.error ?? `HTTP ${res.status}`;
    const details = body?.details ? `(${body.details})` : "";
    throw new Error(`${msg}${details}`);
  }
  return (body?.data ?? (body as unknown)) as T;
}

async function getTecnicosComStats(): Promise<TecnicoStats[]> {
  return apiFetch<TecnicoStats[]>("/api/tecnicos?stats=1");
}
async function createTecnico(input: {
  nome: string;
  cpf?: string;
  cnpj?: string;
  whatsapp?: string;
  vinculo?: string;
}): Promise<TecnicoStats> {
  return apiFetch<TecnicoStats>("/api/tecnicos", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
async function updateTecnico(
  nomeAntigo: string,
  updates: {
    nome?: string;
    ativo?: boolean;
    cpf?: string;
    cnpj?: string;
    whatsapp?: string;
    vinculo?: string;
  },
): Promise<void> {
  await apiFetch<TecnicoStats>("/api/tecnicos", {
    method: "PATCH",
    body: JSON.stringify({ nomeAntigo, ...updates }),
  });
}
async function deleteTecnico(nome: string): Promise<void> {
  await apiFetch("/api/tecnicos", {
    method: "DELETE",
    body: JSON.stringify({ nome }),
  });
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTecnico, setEditingTecnico] = useState<TecnicoStats | null>(
    null,
  );
  const [deletingTecnico, setDeletingTecnico] = useState<TecnicoStats | null>(
    null,
  );
  const [formData, setFormData] = useState<FormState>(FORM_VAZIO);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Evita race condition: respostas antigas não sobrescrevem dados novos
  const fetchSeq = useRef(0);

  const carregarTecnicos = useCallback(async () => {
    const seq = ++fetchSeq.current;
    setLoading(true);
    setError(null);
    try {
      const dados = await getTecnicosComStats();
      if (seq !== fetchSeq.current) return;
      setTecnicos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      if (seq !== fetchSeq.current) return;
      const msg =
        err instanceof Error ? err.message : "Falha ao carregar técnicos";
      setError(msg);
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTecnicos();
  }, [carregarTecnicos]);

  const tecnicosFiltrados = tecnicos.filter((t) => {
    const matchBusca = (t.nome ?? "")
      .toLowerCase()
      .includes(busca.toLowerCase());
    const matchStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "ativos" && t.ativo) ||
      (filtroStatus === "inativos" && !t.ativo);
    return matchBusca && matchStatus;
  });

  const totalAtivos = tecnicos.filter((t) => t.ativo).length;
  const totalInativos = tecnicos.filter((t) => !t.ativo).length;
  // ✅ Evita NaN se a API não retornar os campos de stats
  const totalServicos = tecnicos.reduce(
    (acc, t) => acc + (t.totalServicos ?? 0),
    0,
  );

  const handleDelete = useCallback(async () => {
    if (!deletingTecnico) return;
    const alvo = deletingTecnico;

    // Remove do state NA HORA (otimista)
    setTecnicos((prev) => prev.filter((t) => t.nome !== alvo.nome));
    setDeletingTecnico(null);

    try {
      await deleteTecnico(alvo.nome);
      invalidateConfigCache();
      toast.success("Técnico removido!");
    } catch (err) {
      // Rollback se falhar
      setTecnicos((prev) => {
        if (prev.some((t) => t.nome === alvo.nome)) return prev;
        return [...prev, alvo];
      });

      const errorMsg =
        err instanceof Error ? err.message : "Erro ao remover técnico";

      // Detecta erro específico de técnico com serviços
      if (errorMsg.includes("possui") && errorMsg.includes("serviço")) {
        toast.error(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Não é possível excluir</span>
            <span className="text-sm">
              Este técnico possui serviços vinculados. Desative-o primeiro.
            </span>
          </div>,
          {
            icon: "⚠️",
            duration: 5000,
          },
        );
      } else {
        toast.error(errorMsg);
      }
    }
  }, [deletingTecnico]);

  const handleCreate = useCallback(async () => {
    if (!formData.nome.trim()) {
      setFormError("Nome é obrigatório");
      return;
    }
    setIsSubmitting(true);
    setFormError("");

    const payload = {
      nome: formData.nome.trim(),
      cpf: formData.cpf.trim() || undefined,
      cnpj: formData.cnpj.trim() || undefined,
      whatsapp: formData.whatsapp.trim() || undefined,
      vinculo: formData.vinculo.trim() || undefined,
    };

    try {
      const criado = await createTecnico(payload);
      // ✅ Garante defaults de stats para não renderizar undefined/NaN
      const novo: TecnicoStats = {
        ...criado,
        ativo: criado.ativo ?? true,
        totalServicos: criado.totalServicos ?? 0,
        servicosConcluidos: criado.servicosConcluidos ?? 0,
        servicosPendentes: criado.servicosPendentes ?? 0,
      };
      setTecnicos((prev) => {
        if (prev.some((t) => t.nome === novo.nome)) return prev;
        return [...prev, novo];
      });
      invalidateConfigCache();
      toast.success("Técnico criado com sucesso!");
      setIsFormOpen(false);
      setFormData(FORM_VAZIO);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao criar técnico";

      if (errorMsg.includes("já existe")) {
        setFormError("Já existe um técnico com este nome");
        toast.error("Técnico já cadastrado", {
          icon: "⚠️",
        });
      } else {
        setFormError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleUpdate = useCallback(async () => {
    if (!editingTecnico || !formData.nome.trim()) {
      setFormError("Nome é obrigatório");
      return;
    }
    setIsSubmitting(true);
    setFormError("");

    const nomeAntigo = editingTecnico.nome;
    // ✅ Campos vazios viram undefined (não sobrescrevem com "" no banco)
    const updates = {
      nome: formData.nome.trim(),
      cpf: formData.cpf.trim() || undefined,
      cnpj: formData.cnpj.trim() || undefined,
      whatsapp: formData.whatsapp.trim() || undefined,
      vinculo: formData.vinculo.trim() || undefined,
    };

    try {
      await updateTecnico(nomeAntigo, updates);

      setTecnicos((prev) =>
        prev.map((t) =>
          t.nome === nomeAntigo
            ? {
                ...t,
                nome: updates.nome ?? t.nome,
                cpf: updates.cpf,
                cnpj: updates.cnpj,
                whatsapp: updates.whatsapp,
                vinculo: updates.vinculo,
              }
            : t,
        ),
      );

      invalidateConfigCache();
      toast.success("Técnico atualizado!");
      setIsFormOpen(false);
      setEditingTecnico(null);
      setFormData(FORM_VAZIO);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao atualizar técnico";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingTecnico, formData]);

  const handleToggleAtivo = useCallback(async (tecnico: TecnicoStats) => {
    const novoAtivo = !tecnico.ativo;
    setTecnicos((prev) =>
      prev.map((t) =>
        t.nome === tecnico.nome ? { ...t, ativo: novoAtivo } : t,
      ),
    );

    try {
      await updateTecnico(tecnico.nome, { ativo: novoAtivo });
      invalidateConfigCache();
      toast.success(novoAtivo ? "Técnico ativado" : "Técnico desativado");
    } catch (err) {
      setTecnicos((prev) =>
        prev.map((t) =>
          t.nome === tecnico.nome ? { ...t, ativo: tecnico.ativo } : t,
        ),
      );

      const errorMsg =
        err instanceof Error ? err.message : "Erro ao atualizar status";
      toast.error(errorMsg);
    }
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/20 dark:bg-blue-400/20 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 w-12 h-12 relative z-10 mb-4" />
        </div>
        <p className="text-text-muted font-medium animate-pulse text-lg">
          Carregando técnicos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-950/30 rounded-4xl flex items-center justify-center border border-rose-200 dark:border-rose-800 mb-6 shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 dark:text-rose-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-text tracking-tight">
          Ops! Algo deu errado.
        </h2>
        <p className="text-text-muted mt-3 max-w-md leading-relaxed text-lg">
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
            "shadow-xl rounded-2xl font-medium text-sm border border-border",
          duration: 4000,
        }}
      />

      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text mb-2">
            Técnicos
          </h1>
          <p className="text-text-muted text-sm md:text-base max-w-xl">
            Gerencie sua equipe de técnicos. Adicione, edite ou desative
            profissionais do sistema.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openCreateForm}
          className="flex items-center gap-2 w-full md:w-auto justify-center py-2.5 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" /> Novo Técnico
        </Button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Total
            </p>
            <p className="text-2xl font-extrabold text-text">
              {tecnicos.length}
            </p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Ativos
            </p>
            <p className="text-2xl font-extrabold text-text">{totalAtivos}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-bg-muted text-text-muted rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <ToggleLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Inativos
            </p>
            <p className="text-2xl font-extrabold text-text">{totalInativos}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Serviços
            </p>
            <p className="text-2xl font-extrabold text-text">{totalServicos}</p>
          </div>
        </Card>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-bg-elevated rounded-2xl border border-border shadow-sm p-5 space-y-5"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-bg-muted border border-border rounded-xl text-sm font-medium text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent focus:bg-bg-elevated transition-all shadow-sm"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text hover:bg-bg-muted rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap lg:flex-nowrap gap-3">
            <div className="flex bg-bg-muted p-1 rounded-xl border border-border">
              {(["todos", "ativos", "inativos"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFiltroStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    filtroStatus === status
                      ? "bg-bg-elevated text-text shadow-sm ring-1 ring-border"
                      : "text-text-muted hover:text-text"
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
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text bg-bg-muted px-3 py-1 rounded-full border border-border">
              <span className="font-bold text-text">
                {tecnicosFiltrados.length}
              </span>{" "}
              {tecnicosFiltrados.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {tecnicosFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20 px-4 bg-bg-elevated rounded-3xl border-2 border-dashed border-border text-center shadow-sm"
          >
            <div className="w-20 h-20 bg-bg-muted rounded-full flex items-center justify-center mb-5 border border-border shadow-inner">
              <Users className="w-10 h-10 text-text-muted" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">
              Nenhum técnico encontrado
            </h3>
            <p className="text-text-muted max-w-md mb-8 text-base">
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
                <Plus className="w-5 h-5 mr-2" /> Criar Primeiro Técnico
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
                <Card className="flex flex-col justify-between p-6 bg-bg-elevated shadow-sm hover:shadow-md border border-border rounded-2xl transition-all duration-300 relative overflow-hidden h-full">
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${tecnico.ativo ? "bg-emerald-500 dark:bg-emerald-400" : "bg-border-strong"}`}
                  />

                  <div>
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                            tecnico.ativo
                              ? "bg-linear-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 text-white"
                              : "bg-bg-muted text-text-muted"
                          }`}
                        >
                          {(tecnico.nome ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-lg text-text uppercase tracking-tight leading-tight">
                            {tecnico.nome}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${
                                tecnico.ativo
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-800/30"
                                  : "bg-bg-muted text-text-muted ring-border"
                              }`}
                            >
                              {tecnico.ativo ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <ToggleLeft className="w-3 h-3" />
                              )}
                              {tecnico.ativo ? "Ativo" : "Inativo"}
                            </span>
                            {tecnico.vinculo && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-bg-muted text-text-muted ring-1 ring-inset ring-border">
                                {tecnico.vinculo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-bg-muted border border-border rounded-xl p-4 mb-4">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                            Total
                          </p>
                          <p className="text-xl font-extrabold text-text">
                            {tecnico.totalServicos ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                            Concluídos
                          </p>
                          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            {tecnico.servicosConcluidos ?? 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                            Pendentes
                          </p>
                          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                            {tecnico.servicosPendentes ?? 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    {(tecnico.whatsapp || tecnico.cpf || tecnico.cnpj) && (
                      <div className="space-y-1.5 mb-4 text-sm text-text">
                        {tecnico.whatsapp && (
                          <p>
                            <span className="font-semibold text-text-muted">
                              WhatsApp:
                            </span>{" "}
                            {tecnico.whatsapp}
                          </p>
                        )}
                        {tecnico.cpf && (
                          <p>
                            <span className="font-semibold text-text-muted">
                              CPF:
                            </span>{" "}
                            {tecnico.cpf}
                          </p>
                        )}
                        {tecnico.cnpj && (
                          <p>
                            <span className="font-semibold text-text-muted">
                              CNPJ:
                            </span>{" "}
                            {tecnico.cnpj}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <button
                      onClick={() => handleToggleAtivo(tecnico)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        tecnico.ativo
                          ? "text-text-muted hover:bg-bg-muted"
                          : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
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
                        className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 bg-bg-elevated border border-border rounded-xl transition-colors shadow-sm"
                        title="Editar técnico"
                      >
                        <Edit3 className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setDeletingTecnico(tecnico)}
                        className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 bg-bg-elevated border border-border rounded-xl transition-colors shadow-sm"
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

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text tracking-tight">
                {editingTecnico ? "Editar Técnico" : "Novo Técnico"}
              </h2>
              <p className="text-xs font-medium text-text-muted mt-0.5">
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
          className="space-y-6"
        >
          <div className="space-y-5">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="WhatsApp"
                placeholder="(11) 99999-9999"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, whatsapp: e.target.value }))
                }
              />
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">
                  Vínculo
                </label>
                <select
                  value={formData.vinculo}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, vinculo: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 bg-bg-muted border border-border rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                >
                  <option value="">Selecione…</option>
                  <option value="clt">CLT</option>
                  <option value="pj">PJ</option>
                  <option value="terceirizado">Terceirizado</option>
                  <option value="autonomo">Autônomo</option>
                  <option value="estagio">Estágio</option>
                </select>
              </div>
            </div>
          </div>
          {/* ✅ Erro removido daqui: o formError já é exibido inline no campo Nome via prop `error` do Input */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border">
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