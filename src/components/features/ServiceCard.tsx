// src/components/features/ServiceCard.tsx
import { motion, Variants } from "framer-motion";
import {
  Car,
  Calendar,
  Clock,
  User,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  formatarDataExibicao,
  formatarHorarioExibicao,
} from "@/lib/utils-format";
import type { Servico } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ServicoCardProps {
  servico: Servico;
  variants?: Variants;
  onEdit: (servico: Servico) => void;
  onDelete: (servico: Servico) => void;
  onViewDetails: (id: string) => void;
}

// Função utilitária para pegar o dia da semana
const getDiaSemana = (dataStr?: string) => {
  if (!dataStr) return "";
  const [d, m, y] = dataStr.split("/");
  if (!d || !m || !y) return "";
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const dias = [
    "DOMINGO",
    "SEGUNDA",
    "TERÇA",
    "QUARTA",
    "QUINTA",
    "SEXTA",
    "SÁBADO",
  ];
  return dias[date.getDay()];
};

export function ServicoCard({
  servico,
  variants,
  onEdit,
  onDelete,
  onViewDetails,
}: ServicoCardProps) {
  // Cores personalizadas baseadas no status para a barra superior e o badge
  const getStatusStyle = (status?: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "concluido":
        return {
          bar: "bg-emerald-500",
          badge:
            "text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "em andamento":
        return {
          bar: "bg-blue-500",
          badge:
            "text-blue-700 dark:text-blue-400 ring-blue-600/20 dark:ring-blue-500/20 bg-blue-50 dark:bg-blue-500/10",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "cancelado":
        return {
          bar: "bg-rose-500",
          badge:
            "text-rose-700 dark:text-rose-400 ring-rose-600/20 dark:ring-rose-500/20 bg-rose-50 dark:bg-rose-500/10",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "pendente":
      default:
        return {
          bar: "bg-orange-400",
          badge:
            "text-orange-700 dark:text-orange-400 ring-orange-600/20 dark:ring-orange-500/20 bg-orange-50 dark:bg-orange-500/10",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
    }
  };

  const style = getStatusStyle(servico.status);
  const serviceId = String(servico.id);
  const diaSemana = getDiaSemana(servico.data);

  return (
    <motion.div
      variants={variants}
      layout
      className="group h-full cursor-pointer"
      onClick={() => onViewDetails(serviceId)}
    >
      <Card className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-sm transition-shadow duration-200 hover:shadow-md">
        {/* Barra superior de Status */}
        <div className={cn("absolute left-0 top-0 h-1 w-full", style.bar)} />

        <div className="mt-1 flex h-full flex-col p-5">
          {/* HEADER: Cliente, OS e Badge */}
          <div className="mb-4 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold uppercase tracking-tight leading-tight text-text">
                {servico.cliente?.nome || "CLIENTE NÃO INFORMADO"}
              </h3>
              <div className="mt-1 text-[13px] text-text-muted">
                <span className="font-medium text-text-muted/70">OS:</span>{" "}
                {servico.ordemServico || "N/A"}
              </div>
            </div>
            {/* Badge */}
            <div
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset",
                style.badge,
              )}
            >
              {style.icon}
              {servico.status || "PENDENTE"}
            </div>
          </div>

          {/* BODY: Dados */}
          <div className="flex grow flex-col gap-3 rounded-xl border border-border bg-bg-muted/40 p-4">
            {/* Data */}
            <div className="flex items-center gap-3 text-sm font-medium text-text">
              <Calendar className="h-4 w-4 shrink-0 text-text-muted" />
              <span>
                {formatarDataExibicao(servico.data)}{" "}
                {diaSemana && (
                  <span className="text-text-muted">• {diaSemana}</span>
                )}
              </span>
            </div>
            {/* Horário */}
            <div className="flex items-center gap-3 text-sm font-medium text-text">
              <Clock className="h-4 w-4 shrink-0 text-text-muted" />
              <span>{formatarHorarioExibicao(servico.horario)}</span>
            </div>
            {/* Veículo (Placa e Modelo) */}
            <div className="flex items-center gap-3 text-sm font-medium text-text">
              <Car className="h-4 w-4 shrink-0 text-text-muted" />
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-border bg-bg px-2 py-0.5 font-mono text-xs uppercase tracking-wider text-text">
                  {servico.veiculo?.placa || "S/ PLACA"}
                </span>
                <span className="truncate text-text-muted">
                  {(servico.veiculo as any)?.modelo || "Veículo"}
                </span>
              </div>
            </div>
            {/* Localização */}
            <div className="flex items-center gap-3 text-sm font-medium text-text">
              <MapPin className="h-4 w-4 shrink-0 text-text-muted" />
              <span className="truncate" title={servico.endereco?.cidade}>
                {servico.endereco?.cidade
                  ? `${servico.endereco.cidade} / ${(servico.endereco as any)?.estado || "CE"}`
                  : "Local não informado"}
              </span>
            </div>
          </div>

          {/* FOOTER: Técnico e Botões */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            {/* Técnico */}
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted">
                <User className="h-4 w-4 text-text-muted" />
              </div>
              <span className="truncate text-[13px] font-medium uppercase text-text">
                {servico.tecnico || "NÃO ATRIBUÍDO"}
              </span>
            </div>
            {/* Botões de Ação */}
            <div
              className="flex shrink-0 items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onEdit(servico)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                title="Editar"
                aria-label="Editar serviço"
              >
                <Pencil className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                onClick={() => onDelete(servico)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 dark:hover:text-rose-400"
                title="Excluir"
                aria-label="Excluir serviço"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
