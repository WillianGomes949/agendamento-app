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
} from "lucide-react";
import { formatarContato } from "@/lib/utils";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Servico } from "@/lib/types";

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

  const getClienteNome = () =>
    servico?.cliente?.nome || "Cliente não informado";
  const getClienteContato = () => servico?.cliente?.contato || "";
  const getOrdemServico = () => servico?.ordemServico || "N/A";
  const getVeiculoPlaca = () => servico?.veiculo?.placa || "N/A";
  const getVeiculoModelo = () => servico?.veiculo?.marcaModelo || "N/A";
  const getTipoServico = () => servico?.tipoServico || "N/A";
  const getEnderecoRua = () => servico?.endereco?.rua || "";
  const getEnderecoNumero = () => servico?.endereco?.numero || "";
  const getEnderecoBairro = () => servico?.endereco?.bairro || "";
  const getEnderecoCidade = () => servico?.endereco?.cidade || "";
  const getEnderecoEstado = () => servico?.endereco?.estado || "";
  const getEnderecoCep = () => servico?.endereco?.cep || "";
  const getData = () => servico?.data || "Data não informada";
  const getDiaSemana = () => servico?.diaSemana || "";
  const getHorario = () => {
    const h = servico?.horario;
    if (!h) return "Horário não informado";
    const m = h.match(/(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : h;
  };
  const getObservacao = () => servico?.observacao || "";
  const getStatus = () => servico?.status || "pendente";
  const getTecnico = () => servico?.tecnico || "Não informado";

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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-bg-elevated rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-bg-elevated/80 backdrop-blur-sm shrink-0">
            <h3 className="text-lg font-bold text-text">Detalhes do Serviço</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner
                  size="lg"
                  variant="primary"
                  showLabel
                  label="Carregando detalhes..."
                />
              </div>
            )}
            {!loading && (error || !servico) && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-bg-muted rounded-2xl border border-border">
                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
                </div>
                <h2 className="text-xl font-bold text-text mb-2">
                  {error ? "Erro ao carregar" : "Serviço não encontrado"}
                </h2>
                <p className="text-text-muted max-w-md">
                  {error ||
                    "O agendamento solicitado foi removido ou o ID está incorreto."}
                </p>
                <Button variant="outline" className="mt-6" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            )}
            {!loading && !error && servico && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text mb-2">
                      {getClienteNome()}
                    </h1>
                    <span className="bg-bg-muted text-text px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-border">
                      OS: {getOrdemServico()}
                    </span>
                  </div>
                  <StatusBadge status={getStatus()} className="shadow-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <User className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-text">Contato</h2>
                    </div>
                    <div className="flex items-center gap-3 text-text">
                      <Phone className="w-4 h-4 text-text-muted" />
                      <span className="font-medium">
                        {formatarContato(getClienteContato())}
                      </span>
                    </div>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-lg">
                        <Car className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-text">
                        Veículo & Serviço
                      </h2>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="font-medium text-text-muted">
                          Placa
                        </span>
                        <span className="font-mono font-bold uppercase bg-bg-muted px-1.5 py-0.5 rounded text-text border border-border">
                          {getVeiculoPlaca()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="font-medium text-text-muted">
                          Modelo
                        </span>
                        <span className="font-medium text-text">
                          {getVeiculoModelo()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-text-muted">
                          Tipo
                        </span>
                        <span className="font-medium text-text">
                          {getTipoServico()}
                        </span>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-5 md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-text">
                        Localização
                      </h2>
                    </div>
                    <address className="not-italic flex flex-col gap-1 text-text bg-bg-muted p-3 rounded-xl border border-border">
                      <p className="font-medium text-text">
                        {getEnderecoRua()}
                        {getEnderecoNumero() ? `, ${getEnderecoNumero()}` : ""}
                      </p>
                      <p className="text-text-muted">
                        {getEnderecoBairro()}
                        {getEnderecoBairro() && getEnderecoCidade()
                          ? " - "
                          : ""}
                        {getEnderecoCidade()}
                        {getEnderecoEstado()
                          ? ` / ${getEnderecoEstado().toUpperCase()}`
                          : ""}
                      </p>
                      {getEnderecoCep() && (
                        <p className="text-xs font-medium text-text-muted mt-1">
                          CEP: {getEnderecoCep()}
                        </p>
                      )}
                    </address>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-text">Agenda</h2>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="font-medium text-text-muted">
                          Data
                        </span>
                        <span className="font-semibold text-text">
                          {getData()}
                          {getDiaSemana() ? ` • ${getDiaSemana()}` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-text-muted">
                          Horário
                        </span>
                        <span className="font-semibold text-text">
                          {getHorario()}
                        </span>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-lg">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-text">Técnico</h2>
                    </div>
                    <div className="flex items-center gap-3 text-text bg-bg-muted p-3 rounded-xl border border-border">
                      <User className="w-4 h-4 text-text-muted" />
                      <span className="font-semibold">{getTecnico()}</span>
                    </div>
                  </Card>
                  <Card className="p-5 md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-lg">
                        <NotepadText className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-text">
                        Observações
                      </h2>
                    </div>
                    <p className="text-text-muted">{getObservacao()}</p>
                  </Card>
                </div>
              </motion.div>
            )}
          </div>
          {hasActions && servico && (
            <div className="px-5 sm:px-6 py-4 border-t border-border bg-bg-muted shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-2xl">
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
                  <Trash2 className="w-4 h-4" /> Excluir
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
                  <Pencil className="w-4 h-4" /> Editar
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
