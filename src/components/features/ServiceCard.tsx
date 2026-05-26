// src/components/features/ServiceCard.tsx
"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Car, MapPin, User, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import type { Servico } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  servico: Servico;
  onEdit?: (servico: Servico) => void;      // ✅ Opcional
  onDelete?: (id: number) => void;           // ✅ Opcional
  className?: string;
}

export function ServiceCard({ servico, onEdit, onDelete, className }: ServiceCardProps) {
  const hasActions = onEdit || onDelete;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative group",
        className
      )}
    >
      {/* Botões de Ação (só aparecem se as props existirem) */}
      {hasActions && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(servico); }}
              className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(servico.id); }}
              className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col gap-4 flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{servico.cliente.nome}</h3>
            <p className="text-xs text-gray-500 mt-0.5">OS: {servico.ordemServico || "N/A"}</p>
          </div>
          <StatusBadge status={servico.status} />
        </div>

        <div className="space-y-2.5 text-sm text-gray-600">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>{servico.data} • {servico.diaSemana}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{servico.horario}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Car className="w-4 h-4 text-gray-400" />
            <span className="font-mono uppercase">{servico.veiculo.placa} <span className="text-gray-400">({servico.veiculo.marcaModelo})</span></span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="line-clamp-1">{servico.endereco.cidade}/{servico.endereco.estado}</span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {servico.tecnico}</span>
          <Link href={`/agendamentos/${servico.id}`} className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors">
            Detalhes <span>→</span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}