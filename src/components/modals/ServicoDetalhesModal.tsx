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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-bg-elevated rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-border/50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* --- CABEÇALHO --- */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-border/50 bg-bg-muted/30 backdrop-blur-sm shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-text truncate">
                  {cliente.nome}
                </h2>
                {servico?.ordemServico && (
                  <span className="shrink-0 inline-flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20">
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
            <div className="flex items-center gap-3 shrink-0">
              {servico && <StatusBadge status={servico.status} />}
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-bg-muted transition-colors text-text-muted hover:text-text"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* --- CONTEÚDO --- */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
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
              <div className="flex flex-col items-center justify-center py-16 text-center bg-rose-500/5 rounded-2xl border border-rose-500/20">
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">
                  {error ? "Erro ao carregar" : "Serviço não encontrado"}
                </h3>
                <p className="text-text-muted max-w-md text-sm mb-6">
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
                className="space-y-6"
              >
                {/* Grid Principal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Card: Cliente e Contato */}
                  <div className="bg-bg-muted/40 rounded-2xl border border-border/50 p-5 space-y-4">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                        <User className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                        Cliente & Contato
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-text">
                        <Phone className="w-4 h-4 text-text-muted shrink-0" />
                        <span className="font-medium">
                          {formatarContato(cliente.contato) || "Não informado"}
                        </span>
                      </div>
                      {contatoLimpo && (
                        <Link
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold text-sm transition-all hover:bg-emerald-500/20 hover:scale-[1.02]"
                        >
                          <MessageCircle size={16} />
                          Conversar no WhatsApp
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Card: Veículo */}
                  <div className="bg-bg-muted/40 rounded-2xl border border-border/50 p-5 space-y-4">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                        <Car className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                        Veículo
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-3 border-b border-border/50">
                        <span className="text-sm text-text-muted">Placa</span>
                        <span className="font-mono font-bold uppercase bg-bg-elevated px-2 py-1 rounded text-text border border-border/50 text-sm">
                          {veiculo.placa}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-muted">Modelo</span>
                        <span className="font-medium text-text text-sm text-right">
                          {veiculo.marcaModelo}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card: Localização (Full width no mobile, span 2 no desktop se quiser, mas aqui deixamos 1) */}
                  <div className="md:col-span-2 bg-bg-muted/40 rounded-2xl border border-border/50 p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                        Localização do Serviço
                      </h3>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-bg-elevated p-4 rounded-xl border border-border/50">
                      <address className="not-italic space-y-1 flex-1">
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
                          <p className="text-xs font-medium text-text-muted pt-1">
                            CEP:{" "}
                            {endereco.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}
                          </p>
                        )}
                      </address>

                      <div className="flex gap-2 shrink-0">
                        <Link
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-muted border border-border/50 transition-all hover:bg-primary/10 hover:border-primary/30 hover:text-primary group"
                          title="Abrir no Google Maps"
                        >
                          <Map
                            size={18}
                            className="text-text-muted group-hover:text-primary transition-colors"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Card: Detalhes Operacionais */}
                  <div className="md:col-span-2 bg-bg-muted/40 rounded-2xl border border-border/50 p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                        Detalhes Operacionais
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-bg-elevated p-3 rounded-xl border border-border/50">
                        <span className="text-xs text-text-muted block mb-1">
                          Técnico Responsável
                        </span>
                        <div className="flex items-center gap-2 text-text font-semibold">
                          <User size={14} className="text-text-muted" />
                          {servico.tecnico || "Não atribuído"}
                        </div>
                      </div>
                      <div className="bg-bg-elevated p-3 rounded-xl border border-border/50">
                        <span className="text-xs text-text-muted block mb-1">
                          Tipo de Serviço
                        </span>
                        <div className="flex items-center gap-2 text-text font-semibold">
                          <Wrench size={14} className="text-text-muted" />
                          {servico.tipoServico || "Não especificado"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Observações (Condicional) */}
                  {servico.observacao && (
                    <div className="md:col-span-2 bg-amber-500/5 rounded-2xl border border-amber-500/20 p-5">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
                          <NotepadText className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                          Observações
                        </h3>
                      </div>
                      <p className="text-sm text-text/90 leading-relaxed whitespace-pre-wrap">
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
            <div className="px-6 py-4 border-t border-border/50 bg-bg-muted/30 shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-3xl">
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
                  onClick={() => {
                    onDelete(servico);
                    onClose();
                  }}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </Button>
              )}
              {onEdit && (
                <Button
                  onClick={() => {
                    onEdit(servico);
                    onClose();
                  }}
                  className="w-full sm:w-auto"
                >
                  <Pencil className="w-4 h-4 mr-2" /> Editar
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
