// src/components/modals/ServicoDetalhesModal.tsx
"use client";

import { useEffect } from "react";
import { useServicos } from "@/hooks/useServicos";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  MapPin,
  Car,
  Calendar,
  User,
  AlertCircle,
  Wrench,
  Pencil,
  Trash2,
  NotepadText,
  Map,
  MessageCircle,
  Hash,
  Clock,
} from "lucide-react";
import { formatarContato } from "@/lib/utils";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Servico } from "@/lib/types";
import Link from "next/link";

interface ServicoDetalhesModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (servico: Servico) => void;
  onDelete?: (servico: Servico) => void;
}

export default function ServicoDetalhesModal({
  id,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: ServicoDetalhesModalProps) {
  const { servicos, loading, error } = useServicos();
  const servico = servicos.find((s) => String(s.id) === id);

  // Acesso seguro e limpo aos dados
  const cliente = servico?.cliente || {
    nome: "Cliente não informado",
    contato: "",
  };
  const veiculo = servico?.veiculo || { placa: "N/A", marcaModelo: "N/A" };
  const endereco = servico?.endereco || {
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  };

  const horarioFormatado = servico?.horario?.match(/(\d{2}):(\d{2})/)
    ? `${servico.horario.match(/(\d{2}):(\d{2})/)![1]}:${servico.horario.match(/(\d{2}):(\d{2})/)![2]}`
    : servico?.horario || "Horário não informado";

  const termoBusca = `${endereco.rua}, ${endereco.numero} - ${endereco.cidade}, ${endereco.cep}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(termoBusca)}`;

  // Limpa o número para o link do WhatsApp (remove tudo que não é dígito)
  const contatoLimpo = (cliente.contato || "").replace(/\D/g, "");
  const whatsappUrl = contatoLimpo
    ? `https://wa.me/55${contatoLimpo}?text=${encodeURIComponent(`Olá! Gostaria de falar sobre o serviço agendado: ${servico?.tipoServico || "N/A"}`)}`
    : "#";

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasActions = !!(onEdit || onDelete);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* --- CABEÇALHO --- */}
          <div className="flex shrink-0 items-start justify-between border-b border-border bg-bg-muted/30 px-6 py-4 backdrop-blur-sm">
            <div className="min-w-0 flex-1 pr-4">
              <div className="mb-2 flex items-center gap-3">
                <h2 className="truncate text-xl font-semibold tracking-tight text-text">
                  {cliente.nome}
                </h2>
                {servico?.ordemServico && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20">
                    <Hash size={12} />
                    OS {servico.ordemServico}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Calendar size={14} />
                <span>{servico?.data || "Data não informada"}</span>
                {servico?.diaSemana && <span>• {servico.diaSemana}</span>}
                <span className="mx-1">•</span>
                <Clock size={14} />
                <span>{horarioFormatado}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {servico && <StatusBadge status={servico.status} />}
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* --- CONTEÚDO --- */}
          <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Spinner
                  size="lg"
                  variant="primary"
                  showLabel
                  label="Carregando detalhes..."
                />
              </div>
            )}

            {!loading && (error || !servico) && (
              <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
                  <AlertCircle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="mb-2 text-base font-semibold tracking-tight text-text">
                  {error ? "Erro ao carregar" : "Serviço não encontrado"}
                </h3>
                <p className="mb-6 max-w-md text-sm text-text-muted">
                  {error ||
                    "O agendamento solicitado foi removido ou o ID está incorreto."}
                </p>
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            )}

            {!loading && !error && servico && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-5"
              >
                {/* Grid Principal */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Card: Cliente e Contato */}
                  <div className="space-y-4 rounded-xl border border-border bg-bg-muted/40 p-4">
                    <div className="mb-1 flex items-center gap-2.5">
                      <div className="flex items-center justify-center rounded-md bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
                        <User className="h-4 w-4" />
                      </div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                        Cliente & Contato
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-text">
                        <Phone className="h-4 w-4 shrink-0 text-text-muted" />
                        <span className="text-sm font-medium">
                          {formatarContato(cliente.contato) || "Não informado"}
                        </span>
                      </div>
                      {contatoLimpo && (
                        <Link
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
                        >
                          <MessageCircle size={16} />
                          Conversar no WhatsApp
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Card: Veículo */}
                  <div className="space-y-4 rounded-xl border border-border bg-bg-muted/40 p-4">
                    <div className="mb-1 flex items-center gap-2.5">
                      <div className="flex items-center justify-center rounded-md bg-purple-500/10 p-1.5 text-purple-600 dark:text-purple-400">
                        <Car className="h-4 w-4" />
                      </div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                        Veículo
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-3">
                        <span className="text-sm text-text-muted">Placa</span>
                        <span className="rounded-md border border-border bg-bg px-2 py-1 font-mono text-sm font-bold uppercase text-text">
                          {veiculo.placa}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">Modelo</span>
                        <span className="text-right text-sm font-medium text-text">
                          {veiculo.marcaModelo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card: Localização */}
                  <div className="rounded-xl border border-border bg-bg-muted/40 p-4 md:col-span-2">
                    <div className="mb-4 flex items-center gap-2.5">
                      <div className="flex items-center justify-center rounded-md bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                        Localização do Serviço
                      </h3>
                    </div>

                    <div className="flex flex-col justify-between gap-4 rounded-lg border border-border bg-bg p-4 sm:flex-row sm:items-start">
                      <address className="flex-1 space-y-1 not-italic">
                        <p className="font-semibold text-text">
                          {endereco.rua}
                          {endereco.numero ? `, ${endereco.numero}` : ""}
                        </p>
                        <p className="text-sm text-text-muted">
                          {endereco.bairro}
                          {endereco.bairro && endereco.cidade ? " - " : ""}
                          {endereco.cidade}
                          {endereco.estado
                            ? `/${endereco.estado.toUpperCase()}`
                            : ""}
                        </p>
                        {endereco.cep && (
                          <p className="pt-1 text-xs font-medium text-text-muted">
                            CEP:{" "}
                            {endereco.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
                          </p>
                        )}
                      </address>

                      <div className="flex shrink-0 gap-2">
                        <Link
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-muted transition-colors hover:border-primary/30 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                          title="Abrir no Google Maps"
                        >
                          <Map
                            size={18}
                            className="text-text-muted transition-colors group-hover:text-primary"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Card: Detalhes Operacionais */}
                  <div className="rounded-xl border border-border bg-bg-muted/40 p-4 md:col-span-2">
                    <div className="mb-4 flex items-center gap-2.5">
                      <div className="flex items-center justify-center rounded-md bg-orange-500/10 p-1.5 text-orange-600 dark:text-orange-400">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                        Detalhes Operacionais
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border bg-bg p-3">
                        <span className="mb-1 block text-xs text-text-muted">
                          Técnico Responsável
                        </span>
                        <div className="flex items-center gap-2 font-semibold text-text">
                          <User size={14} className="text-text-muted" />
                          <span className="text-sm">
                            {servico.tecnico || "Não atribuído"}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-bg p-3">
                        <span className="mb-1 block text-xs text-text-muted">
                          Tipo de Serviço
                        </span>
                        <div className="flex items-center gap-2 font-semibold text-text">
                          <Wrench size={14} className="text-text-muted" />
                          <span className="text-sm">
                            {servico.tipoServico || "Não especificado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Observações (Condicional) */}
                  {servico.observacao && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 md:col-span-2">
                      <div className="mb-3 flex items-center gap-2.5">
                        <div className="flex items-center justify-center rounded-md bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
                          <NotepadText className="h-4 w-4" />
                        </div>
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          Observações
                        </h3>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-text/90">
                        {servico.observacao}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* --- RODAPÉ COM AÇÕES --- */}
          {hasActions && servico && (
            <div className="flex flex-col-reverse justify-end gap-3 border-t border-border bg-bg-muted/30 px-6 py-4 shrink-0 sm:flex-row">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Fechar
              </Button>
              {onDelete && (
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={() => {
                    onDelete(servico);
                    onClose();
                  }}
                  className="w-full sm:w-auto"
                >
                  Excluir
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="primary"
                  icon={Pencil}
                  onClick={() => {
                    onEdit(servico);
                    onClose();
                  }}
                  className="w-full sm:w-auto"
                >
                  Editar
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
