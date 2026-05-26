// src/components/features/ServiceList.tsx
"use client";

import { AnimatePresence } from "framer-motion";
import type { Servico } from "@/lib/types";
import { ServiceCard } from "./ServiceCard";
import { EmptyState } from "./EmptyState";

interface ServiceListProps {
  servicos: Servico[];
  onEdit?: (servico: Servico) => void;
  onDelete?: (servico: Servico) => void;
}

export function ServiceList({ servicos, onEdit, onDelete }: ServiceListProps) {
  if (!servicos || servicos.length === 0) {
    return (
      <EmptyState 
        title="Nenhum serviço encontrado" 
        description="Tente ajustar os filtros ou verifique se há agendamentos para a data selecionada." 
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {servicos.map((servico, index) => (
          <ServiceCard
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