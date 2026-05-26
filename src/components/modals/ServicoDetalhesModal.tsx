"use client";

import { useEffect } from "react";
import { useServicos } from "@/hooks/useServicos";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, MapPin, Car, Calendar, User, AlertCircle, Loader2, Wrench, Pencil, Trash2 } from "lucide-react";
import { formatarContato } from "@/lib/utils";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Servico } from "@/lib/types";

interface ServicoDetalhesModalProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (servico: Servico) => void;
  onDelete?: (servico: Servico) => void;
}

export default function ServicoDetalhesModal({ id, isOpen, onClose, onEdit, onDelete }: ServicoDetalhesModalProps) {
  const { servicos, loading, error } = useServicos();
  const servico = servicos.find((s) => String(s.id) === id);

  // ✅ Funções seguras para acessar propriedades
  const getClienteNome = () => servico?.cliente?.nome || "Cliente não informado";
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
  const getHorario = () => servico?.horario || "Horário não informado";
  const getObservacao = () => servico?.observacao || "";
  const getStatus = () => servico?.status || "pendente";
  const getTecnico = () => servico?.tecnico || "Não informado";

  // 🔒 Bloqueia scroll do fundo e permite fechar com ESC
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Detalhes do Serviço</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Fechar modal">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Conteúdo Scrollável */}
          <div className="p-6 overflow-y-auto flex-1">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600 w-8 h-8 mb-3" />
                <p className="text-gray-500">Carregando detalhes do serviço...</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <h2 className="text-xl font-bold text-gray-800">Erro ao carregar</h2>
                <p className="text-gray-500 mt-2 max-w-md">{error}</p>
                <Button variant="outline" className="mt-6" onClick={onClose}>Fechar</Button>
              </div>
            )}

            {!loading && !error && !servico && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
                <h2 className="text-xl font-bold text-gray-800">Serviço não encontrado</h2>
                <p className="text-gray-500 mt-2 max-w-md">O agendamento solicitado pode ter sido removido ou o ID está incorreto.</p>
                <Button variant="outline" className="mt-6" onClick={onClose}>Fechar</Button>
              </div>
            )}

            {!loading && !error && servico && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.3 }}>
                <Card className="mb-6 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{getClienteNome()}</h1>
                    <p className="text-gray-500 mt-1">Ordem de Serviço: {getOrdemServico()}</p>
                  </div>
                  <StatusBadge status={getStatus()} className="self-start" />
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-500" /> Dados do Cliente
                    </h2>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span>{formatarContato(getClienteContato())}</span>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Car className="w-5 h-5 text-purple-500" /> Veículo & Serviço
                    </h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-500 w-16">Placa:</span>
                        <span className="font-mono uppercase">{getVeiculoPlaca()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-500 w-16">Modelo:</span>
                        <span>{getVeiculoModelo()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-500 w-16">Tipo:</span>
                        <span>{getTipoServico()}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 md:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-500" /> Localização
                    </h2>
                    <address className="not-italic space-y-1 text-gray-600">
                      <p>{getEnderecoRua()}{getEnderecoNumero() ? `, ${getEnderecoNumero()}` : ""}</p>
                      <p>{getEnderecoBairro()}{getEnderecoBairro() && getEnderecoCidade() ? " - " : ""}{getEnderecoCidade()}{getEnderecoEstado() ? `/${getEnderecoEstado().toUpperCase()}` : ""}</p>
                      {getEnderecoCep() && <p className="text-sm text-gray-500">CEP: {getEnderecoCep()}</p>}
                    </address>
                  </Card>

                  <Card className="p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-orange-500" /> Técnico Responsável
                    </h2>
                    <div className="flex items-center gap-3 text-gray-600">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-medium">{getTecnico()}</span>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-500" /> Agenda
                    </h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Data</span>
                        <span className="font-medium">{getData()}{getDiaSemana() ? ` • ${getDiaSemana()}` : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Horário</span>
                        <span className="font-medium">{getHorario()}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-5 md:col-span-2">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-500" /> Observações
                    </h2>
                    {getObservacao() ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800"><span className="font-semibold">Obs: </span>{getObservacao()}</p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm italic">Nenhuma observação registrada.</p>
                    )}
                  </Card>
                </div>
              </motion.div>
            )}
          </div>

          {/* 🔽 Rodapé com Botões de Ação */}
          {hasActions && servico && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancelar
              </Button>
              {onEdit && (
                <Button
                  onClick={() => { onEdit(servico); onClose(); }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Pencil className="w-4 h-4" /> Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  onClick={() => { onDelete(servico); onClose(); }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4" /> Excluir
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}