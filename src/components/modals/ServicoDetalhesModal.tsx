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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200/60"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm shrink-0">
            <h3 className="text-lg font-bold text-slate-900">
              Detalhes do Serviço
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
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
              <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  {error ? "Erro ao carregar" : "Serviço não encontrado"}
                </h2>
                <p className="text-slate-500 max-w-md">
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
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
                      {getClienteNome()}
                    </h1>
                    <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                      OS: {getOrdemServico()}
                    </span>
                  </div>
                  <StatusBadge status={getStatus()} className="shadow-sm" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <User className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">
                        Contato
                      </h2>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="font-medium">
                        {formatarContato(getClienteContato())}
                      </span>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <Car className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">
                        Veículo & Serviço
                      </h2>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="font-medium text-slate-500">
                          Placa
                        </span>
                        <span className="font-mono font-bold uppercase bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                          {getVeiculoPlaca()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="font-medium text-slate-500">
                          Modelo
                        </span>
                        <span className="font-medium text-slate-900">
                          {getVeiculoModelo()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-500">Tipo</span>
                        <span className="font-medium text-slate-900">
                          {getTipoServico()}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">
                        Localização
                      </h2>
                    </div>
                    <address className="not-italic flex flex-col gap-1 text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <p className="font-medium text-slate-800">
                        {getEnderecoRua()}
                        {getEnderecoNumero() ? `, ${getEnderecoNumero()}` : ""}
                      </p>
                      <p>
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
                        <p className="text-xs font-medium text-slate-500 mt-1">
                          CEP: {getEnderecoCep()}
                        </p>
                      )}
                    </address>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">
                        Agenda
                      </h2>
                    </div>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between border-b border-slate-50 pb-2">
                        <span className="font-medium text-slate-500">Data</span>
                        <span className="font-semibold text-slate-900">
                          {getData()}
                          {getDiaSemana() ? ` • ${getDiaSemana()}` : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-slate-500">
                          Horário
                        </span>
                        <span className="font-semibold text-slate-900">
                          {getHorario()}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">
                        Técnico
                      </h2>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold">{getTecnico()}</span>
                    </div>
                  </Card>
                  <Card className="p-5 md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <NotepadText className="w-4 h-4" />
                      </div>
                      <h2 className="text-base font-bold text-slate-900">
                        Observações
                      </h2>
                    </div>
                    <p className="text-slate-600">{getObservacao()}</p>   
                  </Card>
                </div>
              </motion.div>
            )}
          </div>

          {hasActions && servico && (
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-2xl">
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
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white"
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
