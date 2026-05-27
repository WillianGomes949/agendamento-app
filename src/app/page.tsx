// src/app/page.tsx
"use client";

import { useServicos } from "@/hooks/useServicos";
import { motion, Variants } from "framer-motion";
import { 
  Calendar, Clock, CheckCircle, TrendingUp, 
  ArrowRight, Activity, Car, AlertCircle, Loader2, Wrench, FileText
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/features/StatusBadge";
import Link from "next/link";
import { formatarDataExibicao, formatarHorarioExibicao } from "@/lib/utils-format";

export default function DashboardPage() {
  const { servicos, loading, error } = useServicos();

  // Saudação dinâmica baseada na hora local
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Cálculos de Métricas
  const servicosAtivos = servicos.filter(s => s.status?.toLowerCase() !== "deletado");
  
  const totalPendentes = servicosAtivos.filter(s => s.status?.toLowerCase() === "pendente").length;
  const totalEmAndamento = servicosAtivos.filter(s => s.status?.toLowerCase().replace(/\s+/g, "_") === "em_andamento").length;
  const totalConcluidos = servicosAtivos.filter(s => s.status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === "concluido").length;
  
  // Pegar apenas os próximos 5 agendamentos que não estão finalizados
  const proximosAgendamentos = servicosAtivos
    .filter(s => {
      const statusNormalizado = s.status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
      return !['concluido', 'cancelado'].includes(statusNormalizado);
    })
    .sort((a, b) => {
      // Ordenação simples (idealmente seria por Date object)
      const dataA = a.data + " " + a.horario;
      const dataB = b.data + " " + b.horario;
      return dataA > dataB ? 1 : -1;
    })
    .slice(0, 5);

  // Variantes de animação do Framer Motion
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-slate-300/50 animate-pulse" />
          <Loader2 className="animate-spin text-slate-900 w-10 h-10 relative z-10 mb-4" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">A preparar o seu dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center border border-rose-100 mb-6 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Não foi possível carregar os dados</h2>
        <p className="text-slate-500 mt-2 max-w-md leading-relaxed">{error}</p>
        <Button variant="outline" className="mt-8" onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Cabeçalho de Boas-vindas */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            {getSaudacao()}, Willian!
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Aqui está o resumo da sua operação de hoje.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/agendamentos" className="w-full sm:w-auto focus:outline-none">
            <Button variant="outline" className="w-full bg-white">
              <Calendar className="w-4 h-4 mr-2" />
              Ver Agenda
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Cartões de KPI (Métricas Principais) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total de Serviços</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{servicosAtivos.length}</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pendentes</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalPendentes}</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Em Andamento</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalEmAndamento}</h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Concluídos</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{totalConcluidos}</h3>
          </div>
        </Card>
      </motion.div>

      {/* Conteúdo Principal (Layout dividido em Desktop) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Próximos Agendamentos (Ocupa 2 colunas) */}
        <motion.div variants={itemVariants} className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Próximos Agendamentos</h2>
            <Link href="/agendamentos" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group transition-colors focus:outline-none">
              Ver todos <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <Card padding="none" className="overflow-hidden">
            {proximosAgendamentos.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/50">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200/60">
                  <CheckCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Tudo em dia!</h3>
                <p className="text-sm text-slate-500">Não há serviços pendentes no momento.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {proximosAgendamentos.map((servico) => (
                  <Link 
                    href={`/agendamentos/${servico.id}`} 
                    key={servico.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition-colors gap-4 group focus:outline-none focus:bg-slate-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:flex p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-200 transition-all">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base mb-1">
                          {servico.cliente?.nome || "Cliente não informado"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatarDataExibicao(servico.data)} às {formatarHorarioExibicao(servico.horario)}
                          </span>
                          <span className="hidden sm:inline text-slate-300">•</span>
                          <span className="flex items-center gap-1.5 font-mono uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {servico.veiculo?.placa || "S/ Placa"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                      <StatusBadge status={servico.status || "pendente"} />
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Painel Lateral Rápido (Ocupa 1 coluna) */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Acesso Rápido</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <Card hoverable className="p-5 flex flex-col justify-center gap-2 group cursor-pointer border-transparent bg-linear-to-br from-slate-900 to-slate-800 text-white">
              <TrendingUp className="w-8 h-8 text-blue-400 mb-2 group-hover:-translate-y-1 transition-transform duration-300" />
              <h3 className="text-lg font-bold">Relatório Mensal</h3>
              <p className="text-slate-400 text-sm">Visualize o desempenho e as métricas financeiras deste mês.</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                Gerar Relatório <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-slate-400" /> Status da Operação
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1.5">
                    <span className="text-slate-600">Taxa de Conclusão</span>
                    <span className="text-slate-900">
                      {servicosAtivos.length > 0 ? Math.round((totalConcluidos / servicosAtivos.length) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${servicosAtivos.length > 0 ? (totalConcluidos / servicosAtivos.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}