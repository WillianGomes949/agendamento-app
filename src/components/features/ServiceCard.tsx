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
  const dias = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
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
          badge: "text-emerald-700 border-emerald-200 bg-emerald-50",
          icon: <Clock className="w-3.5 h-3.5" />
        };
      case "em andamento":
        return { 
          bar: "bg-blue-500", 
          badge: "text-blue-700 border-blue-200 bg-blue-50",
          icon: <Clock className="w-3.5 h-3.5" />
        };
      case "cancelado":
        return { 
          bar: "bg-rose-500", 
          badge: "text-rose-700 border-rose-200 bg-rose-50",
          icon: <Clock className="w-3.5 h-3.5" />
        };
      case "pendente":
      default:
        return { 
          bar: "bg-orange-400", 
          badge: "text-orange-700 border-orange-200 bg-orange-50",
          icon: <Clock className="w-3.5 h-3.5" /> 
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
      <Card className="flex flex-col h-full bg-white shadow-sm hover:shadow-md border border-slate-100 rounded-2xl transition-all duration-300 relative overflow-hidden">
        
        {/* Barra superior de Status */}
        <div className={cn("absolute top-0 left-0 w-full h-1", style.bar)} />

        <div className="p-5 flex flex-col h-full mt-1">
          {/* HEADER: Cliente, OS e Badge */}
          <div className="flex items-start justify-between mb-4 gap-2">
            <div>
              <h3 className="font-extrabold text-[17px] text-slate-900 uppercase tracking-tight leading-tight">
                {servico.cliente?.nome || "CLIENTE NÃO INFORMADO"}
              </h3>
              <div className="text-[14px] text-slate-500 mt-1">
                <span className="font-semibold text-slate-400">OS:</span> {servico.ordemServico || "N/A"}
              </div>
            </div>
            
            {/* Badge Estilizado conforme a imagem */}
            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs uppercase tracking-wide whitespace-nowrap", style.badge)}>
              {style.icon}
              {servico.status || "PENDENTE"}
            </div>
          </div>

          {/* BODY: Retângulo Cinza com os Dados */}
          <div className="bg-slate-100/50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3.5 grow">
            
            {/* Data */}
            <div className="flex items-center gap-3 text-[15px] text-slate-700 font-medium">
              <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
              <span>
                {formatarDataExibicao(servico.data)} {diaSemana && <span className="text-slate-500">• {diaSemana}</span>}
              </span>
            </div>

            {/* Horário */}
            <div className="flex items-center gap-3 text-[15px] text-slate-700 font-medium">
              <Clock className="w-5 h-5 text-slate-400 shrink-0" />
              <span>{formatarHorarioExibicao(servico.horario)}</span>
            </div>

            {/* Veículo (Placa e Modelo) */}
            <div className="flex items-center gap-3 text-[15px] text-slate-700 font-medium">
              <Car className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded text-sm font-mono uppercase tracking-wider">
                  {servico.veiculo?.placa || "S/ PLACA"}
                </span>
                {/* Caso tenha modelo salvo, exibe, senão omite ou exibe texto genérico */}
                <span className="text-slate-600 truncate">
                  {(servico.veiculo as any)?.modelo || "Veículo"}
                </span>
              </div>
            </div>

            {/* Localização */}
            <div className="flex items-center gap-3 text-[15px] text-slate-700 font-medium">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <span className="truncate" title={servico.endereco?.cidade}>
                {servico.endereco?.cidade ? `${servico.endereco.cidade} / ${(servico.endereco as any)?.estado || 'CE'}` : "Local não informado"}
              </span>
            </div>

          </div>

          {/* FOOTER: Técnico e Botões */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            
            {/* Técnico */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <span className="text-[14px] font-medium text-slate-700 uppercase">
                {servico.tecnico || "NÃO ATRIBUÍDO"}
              </span>
            </div>

            {/* Botões de Ação */}
            <div 
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()} // Impede que o clique no botão abra o modal
            >
              <button
                onClick={() => onEdit(servico)}
                className="w-10 h-10 flex items-center justify-center text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                title="Editar"
              >
                <Pencil className="w-4 h-4" strokeWidth={2} />
              </button>
              <button
                onClick={() => onDelete(servico)}
                className="w-10 h-10 flex items-center justify-center text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

          </div>
        </div>
      </Card>
    </motion.div>
  );
}