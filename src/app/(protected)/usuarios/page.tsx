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
import { Modal } from "@/components/modals/Modal";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { Toaster, toast } from "react-hot-toast";
import type { UsuarioStats } from "@/lib/api/usuarios.types";
import { formatarData } from "@/lib/api/usuarios.types";
import { useUsuarios } from "@/hooks/useUsuarios";
import { useQueryClient } from "@tanstack/react-query";

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
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function UsuariosPage() {
  const queryClient = useQueryClient();
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
      const matchRole =
        filtroRole === "todas" || u.role === filtroRole;
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl bg-blue-500/20 dark:bg-blue-400/20 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 w-12 h-12 relative z-10 mb-4" />
        </div>
        <p className="text-text-muted font-medium animate-pulse text-lg">
          Carregando usuários...
        </p>
      </div>
    );
  }

  // ERRO
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

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text mb-2">
            Usuários & Acessos
          </h1>
          <p className="text-text-muted text-sm md:text-base max-w-xl">
            Gerencie os usuários do sistema, seus papéis e credenciais de acesso.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openCreateForm}
          className="flex items-center gap-2 w-full md:w-auto justify-center py-2.5 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" /> Novo Usuário
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Total
            </p>
            <p className="text-2xl font-extrabold text-text">
              {usuarios.length}
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
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Masters
            </p>
            <p className="text-2xl font-extrabold text-text">{totalMasters}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Técnicos
            </p>
            <p className="text-2xl font-extrabold text-text">{totalTecnicos}</p>
          </div>
        </Card>
      </motion.div>

      {/* Filtros */}
      <motion.div
        variants={itemVariants}
        className="bg-bg-elevated rounded-2xl border border-border shadow-sm p-5 space-y-5"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou email..."
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
            <div className="flex bg-bg-muted p-1 rounded-xl border border-border">
              {(["todas", "master", "tecnico"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setFiltroRole(role)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    filtroRole === role
                      ? "bg-bg-elevated text-text shadow-sm ring-1 ring-border"
                      : "text-text-muted hover:text-text"
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
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text bg-bg-muted px-3 py-1 rounded-full border border-border">
              <span className="font-bold text-text">
                {usuariosFiltrados.length}
              </span>{" "}
              {usuariosFiltrados.length === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Lista de Usuários */}
      <AnimatePresence mode="wait">
        {usuariosFiltrados.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-20 px-4 bg-bg-elevated rounded-3xl border-2 border-dashed border-border text-center shadow-sm"
          >
            <div className="w-20 h-20 bg-bg-muted rounded-full flex items-center justify-center mb-5 border border-border shadow-inner">
              <Shield className="w-10 h-10 text-text-muted" />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">
              Nenhum usuário encontrado
            </h3>
            <p className="text-text-muted max-w-md mb-8 text-base">
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
                <Plus className="w-5 h-5 mr-2" /> Criar Primeiro Usuário
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
            {usuariosFiltrados.map((usuario) => (
              <motion.div key={usuario.email} variants={itemVariants} layout>
                <Card className="flex flex-col justify-between p-6 bg-bg-elevated shadow-sm hover:shadow-md border border-border rounded-2xl transition-all duration-300 relative overflow-hidden h-full">
                  <div
                    className={`absolute top-0 left-0 w-full h-1 ${
                      usuario.ativo
                        ? "bg-emerald-500 dark:bg-emerald-400"
                        : "bg-border-strong"
                    }`}
                  />
                  <div>
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                            usuario.role === "master"
                              ? "bg-linear-to-br from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500 text-white"
                              : usuario.ativo
                                ? "bg-linear-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 text-white"
                                : "bg-bg-muted text-text-muted"
                          }`}
                        >
                          {usuario.role === "master" ? (
                            <Crown className="w-6 h-6" />
                          ) : (
                            (usuario.tecnico_nome ?? "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-lg text-text uppercase tracking-tight leading-tight">
                            {usuario.tecnico_nome}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${
                                usuario.ativo
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-800/30"
                                  : "bg-bg-muted text-text-muted ring-border"
                              }`}
                            >
                              {usuario.ativo ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <ToggleLeft className="w-3 h-3" />
                              )}
                              {usuario.ativo ? "Ativo" : "Inativo"}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ring-1 ring-inset ${
                                usuario.role === "master"
                                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-800/30"
                                  : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-800/30"
                              }`}
                            >
                              {usuario.role === "master" ? (
                                <Crown className="w-3 h-3" />
                              ) : (
                                <User className="w-3 h-3" />
                              )}
                              {usuario.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="bg-bg-muted border border-border rounded-xl p-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-text-muted" />
                        <span className="text-text font-medium break-all">
                          {usuario.email}
                        </span>
                      </div>
                    </div>

                    {/* Último Login */}
                    <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
                      <Clock className="w-4 h-4" />
                      <span>
                        Último login:{" "}
                        <span className="font-medium text-text">
                          {formatarData(usuario.ultimo_login)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <button
                      onClick={() => handleToggleAtivo(usuario)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                        usuario.ativo
                          ? "text-text-muted hover:bg-bg-muted"
                          : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                      }`}
                      title={
                        usuario.ativo ? "Desativar usuário" : "Ativar usuário"
                      }
                    >
                      {usuario.ativo ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                      {usuario.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(usuario)}
                        className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 bg-bg-elevated border border-border rounded-xl transition-colors shadow-sm"
                        title="Editar usuário"
                      >
                        <Edit3 className="w-4 h-4" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setDeletingUsuario(usuario)}
                        className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 bg-bg-elevated border border-border rounded-xl transition-colors shadow-sm"
                        title="Excluir usuário"
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

      {/* Modal de Formulário */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text tracking-tight">
                {editingUsuario ? "Editar Usuário" : "Novo Usuário"}
              </h2>
              <p className="text-xs font-medium text-text-muted mt-0.5">
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
          className="space-y-6"
        >
          <div className="space-y-5">
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
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Senha {editingUsuario && "(deixe vazio para manter)"}
              </label>
              <div className="relative">
                <input
                  type={showSenha ? "text" : "password"}
                  placeholder={editingUsuario ? "••••••••" : "Mínimo 6 caracteres"}
                  value={formData.senha}
                  onChange={(e) => {
                    setFormData((f) => ({ ...f, senha: e.target.value }));
                    setFormError("");
                  }}
                  className="w-full px-3 py-2.5 bg-bg-muted border border-border rounded-xl text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-muted hover:text-text transition-colors"
                >
                  {showSenha ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Perfil de Acesso
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    role: e.target.value as "tecnico" | "master",
                  }))
                }
                className="w-full px-3 py-2.5 bg-bg-muted border border-border rounded-xl text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
              >
                <option value="tecnico">Técnico</option>
                <option value="master">Master (Administrador)</option>
              </select>
            </div>
            <div className="flex items-center gap-3 p-4 bg-bg-muted rounded-xl border border-border">
              <button
                type="button"
                onClick={() =>
                  setFormData((f) => ({ ...f, ativo: !f.ativo }))
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  formData.ativo
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                    : "text-text-muted bg-bg-elevated"
                }`}
              >
                {formData.ativo ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
                {formData.ativo ? "Ativo" : "Inativo"}
              </button>
              <span className="text-sm text-text-muted">
                {formData.ativo
                  ? "Usuário poderá fazer login"
                  : "Usuário não poderá fazer login"}
              </span>
            </div>
          </div>
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