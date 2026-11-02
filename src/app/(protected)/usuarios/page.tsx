// src/app/usuarios/page.tsx
"use client";
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Shield,
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
  Crown,
  User,
  Mail,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/modals/Modal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Toaster, toast } from "react-hot-toast";
import type { UsuarioStats } from "@/lib/api/usuarios.types";
import { formatarData } from "@/lib/api/usuarios.types";
import { useUsuarios } from "@/hooks/useUsuarios";

type FormState = {
  tecnico_nome: string;
  email: string;
  senha: string;
  role: "tecnico" | "master";
  ativo: boolean;
};

const FORM_VAZIO: FormState = {
  tecnico_nome: "",
  email: "",
  senha: "",
  role: "tecnico",
  ativo: true,
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

export default function UsuariosPage() {
  const {
    usuarios,
    loading,
    error,
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isDeleting,
  } = useUsuarios();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativos" | "inativos"
  >("todos");
  const [filtroRole, setFiltroRole] = useState<"todas" | "tecnico" | "master">(
    "todas",
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioStats | null>(
    null,
  );
  const [deletingUsuario, setDeletingUsuario] = useState<UsuarioStats | null>(
    null,
  );
  const [formData, setFormData] = useState<FormState>(FORM_VAZIO);
  const [formError, setFormError] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  const isSubmitting = isCreating || isUpdating;

  // Filtros client-side
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchBusca =
        (u.tecnico_nome ?? "").toLowerCase().includes(busca.toLowerCase()) ||
        (u.email ?? "").toLowerCase().includes(busca.toLowerCase());
      const matchStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && u.ativo) ||
        (filtroStatus === "inativos" && !u.ativo);
      const matchRole = filtroRole === "todas" || u.role === filtroRole;
      return matchBusca && matchStatus && matchRole;
    });
  }, [usuarios, busca, filtroStatus, filtroRole]);

  const totalAtivos = usuarios.filter((u) => u.ativo).length;
  const totalInativos = usuarios.filter((u) => !u.ativo).length;
  const totalMasters = usuarios.filter((u) => u.role === "master").length;
  const totalTecnicos = usuarios.filter((u) => u.role === "tecnico").length;

  // DELETE
  const handleDelete = useCallback(async () => {
    if (!deletingUsuario) return;
    try {
      await remove(deletingUsuario.email);
      toast.success("Usuário removido!");
      setDeletingUsuario(null);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao remover usuário";
      toast.error(errorMsg);
    }
  }, [deletingUsuario, remove]);

  // CREATE
  const handleCreate = useCallback(async () => {
    if (!formData.tecnico_nome.trim()) {
      setFormError("Nome do técnico é obrigatório");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Email é obrigatório");
      return;
    }
    if (!formData.senha.trim()) {
      setFormError("Senha é obrigatória");
      return;
    }
    if (formData.senha.length < 6) {
      setFormError("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setFormError("");
    const payload = {
      tecnico_nome: formData.tecnico_nome.trim(),
      email: formData.email.trim(),
      senha: formData.senha,
      role: formData.role,
      ativo: formData.ativo,
    };
    try {
      await create(payload);
      toast.success("Usuário criado com sucesso!");
      setIsFormOpen(false);
      setFormData(FORM_VAZIO);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Erro ao criar usuário";
      if (errorMsg.toLowerCase().includes("email")) {
        setFormError("Já existe um usuário com este email");
        toast.error("Email já cadastrado", { icon: "⚠" });
      } else {
        setFormError(errorMsg);
        toast.error(errorMsg);
      }
    }
  }, [formData, create]);

  // UPDATE
  const handleUpdate = useCallback(async () => {
    if (!editingUsuario || !formData.tecnico_nome.trim()) {
      setFormError("Nome do técnico é obrigatório");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Email é obrigatório");
      return;
    }
    if (formData.senha && formData.senha.length < 6) {
      setFormError("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    setFormError("");
    const updates: Record<string, unknown> = {
      emailAntigo: editingUsuario.email,
      tecnico_nome: formData.tecnico_nome.trim(),
      email: formData.email.trim(),
      role: formData.role,
      ativo: formData.ativo,
    };
    if (formData.senha.trim()) {
      updates.senha = formData.senha;
    }
    try {
      await update(updates as { emailAntigo: string } & Partial<FormState>);
      toast.success("Usuário atualizado!");
      setIsFormOpen(false);
      setEditingUsuario(null);
      setFormData(FORM_VAZIO);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao atualizar usuário";
      setFormError(msg);
      toast.error(msg);
    }
  }, [editingUsuario, formData, update]);

  // TOGGLE ATIVO
  const handleToggleAtivo = useCallback(
    async (usuario: UsuarioStats) => {
      const novoAtivo = !usuario.ativo;
      try {
        await update({
          emailAntigo: usuario.email,
          ativo: novoAtivo,
        });
        toast.success(novoAtivo ? "Usuário ativado" : "Usuário desativado");
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Erro ao atualizar status";
        toast.error(errorMsg);
      }
    },
    [update],
  );

  const openEditForm = useCallback((usuario: UsuarioStats) => {
    setEditingUsuario(usuario);
    setFormData({
      tecnico_nome: usuario.tecnico_nome,
      email: usuario.email,
      senha: "",
      role: usuario.role,
      ativo: usuario.ativo,
    });
    setIsFormOpen(true);
    setFormError("");
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingUsuario(null);
    setFormData(FORM_VAZIO);
    setIsFormOpen(true);
    setFormError("");
  }, []);

  const closeForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingUsuario(null);
    setFormData(FORM_VAZIO);
    setFormError("");
    setShowSenha(false);
  }, []);

  // LOADING
  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="mt-3 text-sm font-medium text-text-muted">
          Carregando usuários...
        </p>
      </div>
    );
  }


  // ERRO
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

  // UI
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
            Usuários & Acessos
          </h1>
          <p className="max-w-xl text-sm text-text-muted md:text-[15px]">
            Gerencie os usuários do sistema, seus papéis e credenciais de
            acesso.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={openCreateForm}
          className="w-full sm:w-auto"
        >
          Novo Usuário
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
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Total
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {usuarios.length}
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
          <div className="flex items-center justify-center rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Masters
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {totalMasters}
            </p>
          </div>
        </Card>
        <Card
          padding="none"
          className="flex items-center gap-4 p-4 hover:shadow-md"
        >
          <div className="flex items-center justify-center rounded-lg bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Técnicos
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {totalTecnicos}
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
              placeholder="Pesquisar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Pesquisar usuários"
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
          <div className="flex flex-wrap gap-2 lg:flex-nowrap">
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
            <div className="inline-flex gap-0.5 rounded-lg border border-border bg-bg-muted/40 p-0.5">
              {(["todas", "master", "tecnico"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFiltroRole(role)}
                  className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
                    filtroRole === role
                      ? "bg-bg text-text shadow-sm ring-1 ring-border/60"
                      : "text-text-muted hover:bg-bg-elevated/60 hover:text-text"
                  }`}
                >
                  {role === "todas"
                    ? "Todos"
                    : role === "master"
                      ? "Masters"
                      : "Técnicos"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span className="inline-flex items-center rounded-md border border-border bg-bg-muted/40 px-3 py-1.5 text-xs font-medium text-text-muted">
            <span className="font-semibold text-text">
              {usuariosFiltrados.length}
            </span>
            <span className="mx-1">·</span>
            {usuariosFiltrados.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>
      </motion.div>

      {/* Lista de Usuários */}
      <AnimatePresence mode="wait">
        {usuariosFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-elevated px-4 py-16 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-bg-muted/50">
              <Shield className="h-7 w-7 text-text-muted/60" aria-hidden />
            </div>
            <h3 className="mb-2 text-base font-semibold tracking-tight text-text">
              Nenhum usuário encontrado
            </h3>
            <p className="mb-6 max-w-md text-sm text-text-muted">
              {busca || filtroStatus !== "todos" || filtroRole !== "todas"
                ? "Não encontramos resultados para a sua pesquisa. Tente ajustar os filtros."
                : "Você ainda não possui usuários cadastrados. Comece adicionando um novo usuário."}
            </p>
            {busca || filtroStatus !== "todos" || filtroRole !== "todas" ? (
              <Button
                onClick={() => {
                  setBusca("");
                  setFiltroStatus("todos");
                  setFiltroRole("todas");
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
                Criar Primeiro Usuário
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
            {usuariosFiltrados.map((usuario) => (
              <motion.div key={usuario.email} variants={itemVariants} layout>
                <Card
                  padding="none"
                  className="relative flex h-full flex-col justify-between overflow-hidden p-5 hover:shadow-md"
                >
                  {/* Barra de Status */}
                  <div
                    className={`absolute left-0 top-0 h-1 w-full ${
                      usuario.ativo
                        ? "bg-emerald-500 dark:bg-emerald-400"
                        : "bg-border-strong"
                    }`}
                  />

                  <div className="mt-1">
                    {/* Header do Card */}
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-base font-semibold ring-1 ring-inset ring-white/15 ${
                            usuario.role === "master"
                              ? "bg-linear-to-br from-amber-500 to-orange-600 text-white"
                              : usuario.ativo
                                ? "bg-linear-to-br from-blue-600 to-indigo-700 text-white"
                                : "bg-bg-muted text-text-muted ring-border"
                          }`}
                        >
                          {usuario.role === "master" ? (
                            <Crown className="h-5 w-5" />
                          ) : (
                            (usuario.tecnico_nome ?? "?")
                              .charAt(0)
                              .toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold tracking-tight text-text">
                            {usuario.tecnico_nome}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                                usuario.ativo
                                  ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
                                  : "bg-bg-muted/50 text-text-muted ring-border"
                              }`}
                            >
                              {usuario.ativo ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <ToggleLeft className="h-3 w-3" />
                              )}
                              {usuario.ativo ? "Ativo" : "Inativo"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${
                                usuario.role === "master"
                                  ? "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400"
                                  : "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400"
                              }`}
                            >
                              {usuario.role === "master" ? (
                                <Crown className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              {usuario.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="mb-4 rounded-lg border border-border bg-bg-muted/40 p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 shrink-0 text-text-muted" />
                        <span className="break-all font-medium text-text">
                          {usuario.email}
                        </span>
                      </div>
                    </div>

                    {/* Último Login */}
                    <div className="mb-4 flex items-center gap-2 text-sm text-text-muted">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>
                        Último login:{" "}
                        <span className="font-medium text-text">
                          {formatarData(usuario.ultimo_login)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <button
                      onClick={() => handleToggleAtivo(usuario)}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
                        usuario.ativo
                          ? "text-text-muted hover:bg-bg-hover"
                          : "text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                      }`}
                      title={
                        usuario.ativo ? "Desativar usuário" : "Ativar usuário"
                      }
                    >
                      {usuario.ativo ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                      {usuario.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(usuario)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:bg-bg-hover hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                        title="Editar usuário"
                        aria-label="Editar usuário"
                      >
                        <Edit3 className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setDeletingUsuario(usuario)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:hover:text-rose-400"
                        title="Excluir usuário"
                        aria-label="Excluir usuário"
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
              <Shield className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-text">
                {editingUsuario ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-text-muted">
                {editingUsuario
                  ? "Atualize as informações do usuário"
                  : "Adicione um novo usuário ao sistema"}
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
            if (editingUsuario) {
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
            value={formData.tecnico_nome}
            onChange={(e) => {
              setFormData((f) => ({ ...f, tecnico_nome: e.target.value }));
              setFormError("");
            }}
            error={formError}
            required
            autoFocus
          />
          <Input
            label="Email"
            type="email"
            placeholder="joao@empresa.com"
            value={formData.email}
            onChange={(e) => {
              setFormData((f) => ({ ...f, email: e.target.value }));
              setFormError("");
            }}
            required
          />

          {/* Senha com toggle show/hide */}
          <div className="w-full">
            <label
              htmlFor="senha"
              className="mb-1.5 block text-[13px] font-medium tracking-tight text-text"
            >
              Senha {editingUsuario && "(deixe vazio para manter)"}
            </label>
            <div className="relative">
              <Input
                id="senha"
                type={showSenha ? "text" : "password"}
                placeholder={
                  editingUsuario ? "••••••••" : "Mínimo 6 caracteres"
                }
                value={formData.senha}
                onChange={(e) => {
                  setFormData((f) => ({ ...f, senha: e.target.value }));
                  setFormError("");
                }}
                className="pr-9"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                tabIndex={-1}
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? (
                  <EyeOff className="h-4 w-4" aria-hidden />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          <Select
            label="Perfil de Acesso"
            value={formData.role}
            onChange={(e) =>
              setFormData((f) => ({
                ...f,
                role: e.target.value as "tecnico" | "master",
              }))
            }
            options={[
              { value: "tecnico", label: "Técnico" },
              { value: "master", label: "Master (Administrador)" },
            ]}
          />

          {/* Toggle Ativo */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-bg-muted/40 p-3">
            <button
              type="button"
              onClick={() => setFormData((f) => ({ ...f, ativo: !f.ativo }))}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 ${
                formData.ativo
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-bg-elevated text-text-muted"
              }`}
            >
              {formData.ativo ? (
                <ToggleRight className="h-5 w-5" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
              {formData.ativo ? "Ativo" : "Inativo"}
            </button>
            <span className="text-sm text-text-muted">
              {formData.ativo
                ? "Usuário poderá fazer login"
                : "Usuário não poderá fazer login"}
            </span>
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
                : editingUsuario
                  ? "Salvar Alterações"
                  : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={!!deletingUsuario}
        onClose={() => setDeletingUsuario(null)}
        onConfirm={handleDelete}
        title="Excluir usuário"
        message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
        itemName={deletingUsuario?.tecnico_nome || "este usuário"}
        isLoading={isDeleting}
      />
    </motion.div>
  );
}
