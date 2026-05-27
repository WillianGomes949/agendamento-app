// src/components/features/ServiceCard.tsx
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
import ServicoDetalhesModal from "@/components/modals/ServicoDetalhesModal";

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
        whileHover={{
          y: -4,
          boxShadow: "0 12px 24px -8px rgba(15, 23, 42, 0.08)",
          transition: { duration: 0.2 },
        }}
        className={cn(
          "bg-white rounded-2xl border border-slate-200/60 shadow-sm transition-all flex flex-col overflow-hidden relative group cursor-pointer",
          className,
        )}
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
          {/* Status indicator line */}
          <div
            className={`absolute top-0 left-0 w-full h-1 ${
              servico.status?.toLowerCase() === "concluido"
                ? "bg-emerald-500"
                : servico.status?.toLowerCase() === "em andamento"
                  ? "bg-indigo-500"
                  : servico.status?.toLowerCase() === "pendente"
                    ? "bg-amber-500"
                    : servico.status?.toLowerCase() === "cancelado"
                      ? "bg-rose-500"
                      : servico.status?.toLowerCase() === "deletado"
                        ? "bg-red-600"
                        : "bg-slate-300"
            }`}
          />
          <div
            className="p-5 sm:p-6 flex flex-col gap-5 flex-1"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="min-w-0">
                <h3 className="font-extrabold text-slate-900 line-clamp-1 tracking-tight text-lg">
                  {clienteNome}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  OS: <span className="text-slate-600">{ordemServico}</span>
                </p>
              </div>
              <StatusBadge status={status} className="shrink-0" />
            </div>

            <div className="space-y-3 text-sm text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">
                  {dataFormatada}
                  {diaSemana ? ` • ${diaSemana}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-medium">{horarioFormatado}</span>
              </div>
              <div className="flex items-center gap-3">
                <Car className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono font-bold uppercase bg-slate-200/60 px-2 py-0.5 rounded text-slate-700 text-xs">
                  {veiculoPlaca}
                </span>
                {veiculoModelo !== "N/A" && (
                  <span className="text-slate-500 font-medium truncate">
                    {" "}
                    {veiculoModelo}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="line-clamp-1 font-medium">
                  {enderecoCidade}
                  {enderecoEstado ? ` / ${enderecoEstado.toUpperCase()}` : ""}
                </span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="font-semibold text-slate-700">{tecnico}</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação visíveis no mobile, revelados no hover em desktop */}
          {hasActions && (
            <div
              className="absolute bottom-4 right-4 flex gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit(servico);
                  }}
                  className="p-2.5 bg-white/95 backdrop-blur border border-slate-200/60 rounded-xl shadow-sm hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors"
                  aria-label={`Editar serviço`}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete(servico);
                  }}
                  className="p-2.5 bg-white/95 backdrop-blur border border-slate-200/60 rounded-xl shadow-sm hover:bg-slate-50 text-slate-600 hover:text-rose-600 transition-colors"
                  aria-label={`Excluir serviço`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <ServicoDetalhesModal
        id={String(servico.id)}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </>
  );
}
