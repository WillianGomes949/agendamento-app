// src/components/features/ServiceList.tsx
"use client";

import { AnimatePresence } from "framer-motion";
import type { Servico } from "@/lib/types";
import { EmptyState } from "./EmptyState";
import { ServicoCard } from "./ServiceCard";

interface ServiceListProps {
  servicos: Servico[];
  onEdit: (servico: Servico) => void;   // remova o ?
  onDelete: (servico: Servico) => void; // remova o ?
}

export function ServiceList({ servicos, onEdit, onDelete }: ServiceListProps) {
  if (!servicos || servicos.length === 0) {
    return (
      <EmptyState 
        title="Nenhum serviço encontrado" 
        description="Tente ajustar os filtros ou verifique se há agendamentos para as datas selecionadas." 
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
      <AnimatePresence mode="popLayout">
        {servicos.map((servico, index) => (
          <ServicoCard
            key={servico?.id || `fallback-${index}`}
            servico={servico}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}