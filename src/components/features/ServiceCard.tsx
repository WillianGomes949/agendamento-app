"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Car,
  MapPin,
  User,
  Edit2,
  Trash2,
} from "lucide-react";
import type { Servico } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import {
  formatarDataExibicao,
  formatarHorarioExibicao,
} from "@/lib/utils-format";
import { cn } from "@/lib/utils";
import ServicoDetalhesModal from "@/components/modals/ServicoDetalhesModal"; // ⚠️ Ajuste o caminho se necessário

interface ServiceCardProps {
  servico: Servico;
  onEdit?: (servico: Servico) => void;
  onDelete?: (servico: Servico) => void;
  className?: string;
}

export function ServiceCard({
  servico,
  onEdit,
  onDelete,
  className,
}: ServiceCardProps) {
  const hasActions = !!(onEdit || onDelete);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Dados formatados
  const clienteNome =
    servico.cliente?.nome?.toUpperCase() || "Cliente não informado";
  const veiculoPlaca = servico.veiculo?.placa || "N/A";
  const veiculoModelo = servico.veiculo?.marcaModelo || "N/A";
  const enderecoCidade = servico.endereco?.cidade || "";
  const enderecoEstado = servico.endereco?.estado || "";
  const tecnico = servico.tecnico || "N/A";
  const ordemServico = servico.ordemServico || "N/A";
  const status = servico.status || "pendente";

  const dataFormatada = formatarDataExibicao(servico.data);
  const horarioFormatado = formatarHorarioExibicao(servico.horario);
  const diaSemana = servico.diaSemana || "";

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={cn(
          "bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative group cursor-pointer",
          className,
        )}
        // Acessibilidade básica para cliques via teclado
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        <div className="relative flex-1">
          {/* ✅ Área clicável do card */}
          <div
            className="p-5 flex flex-col gap-4 flex-1"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 line-clamp-1">
                  {clienteNome}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  OS: {ordemServico}
                </p>
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex items-center gap-2.5">
                <Calendar
                  className="w-4 h-4 text-gray-400 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {dataFormatada}
                  {diaSemana ? ` • ${diaSemana}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock
                  className="w-4 h-4 text-gray-400 shrink-0"
                  aria-hidden="true"
                />
                <span>{horarioFormatado}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Car
                  className="w-4 h-4 text-gray-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="font-mono uppercase">
                  {veiculoPlaca}{" "}
                  {veiculoModelo && (
                    <span className="text-gray-400">({veiculoModelo})</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin
                  className="w-4 h-4 text-gray-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="line-clamp-1">
                  {enderecoCidade}
                  {enderecoEstado ? `/${enderecoEstado.toUpperCase()}` : ""}
                </span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" aria-hidden="true" /> {tecnico}
              </span>
            </div>
          </div>

          {/* ✅ Botões de Ação (fora da área clicável principal) */}
          {hasActions && (
            <div
              className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => e.stopPropagation()} // Impede abertura do modal ao clicar nos botões
            >
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(servico);
                  }}
                  className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Editar serviço"
                  aria-label={`Editar serviço de ${clienteNome}`}
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(servico);
                  }}
                  className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                  title="Excluir serviço"
                  aria-label={`Excluir serviço de ${clienteNome}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* 🔽 Modal renderizado junto ao card */}
      <ServicoDetalhesModal
        id={String(servico.id)}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={onEdit} // ✅ Passa a função de editar
        onDelete={onDelete} // ✅ Passa a função de deletar
      />
    </>
  );
}
