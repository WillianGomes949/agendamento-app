// src/app/page.tsx
"use client";
import { useServicos } from "@/hooks/useServicos";
import { motion, Variants } from "framer-motion";
import {
  Calendar,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Activity,
  Car,
  AlertCircle,
  Loader2,
  Wrench,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/features/StatusBadge";
import Link from "next/link";
import {
  formatarDataExibicao,
  formatarHorarioExibicao,
} from "@/lib/utils-format";

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
  const servicosAtivos = servicos.filter(
    (s) => s.status?.toLowerCase() !== "deletado",
  );
  const totalPendentes = servicosAtivos.filter(
    (s) => s.status?.toLowerCase() === "pendente",
  ).length;
  const totalEmAndamento = servicosAtivos.filter(
    (s) => s.status?.toLowerCase().replace(/\s+/g, "_") === "em_andamento",
  ).length;
  const totalConcluidos = servicosAtivos.filter(
    (s) =>
      s.status
        ?.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") === "concluido",
  ).length;
  const taxaConclusao =
    servicosAtivos.length > 0
      ? Math.round((totalConcluidos / servicosAtivos.length) * 100)
      : 0;

  // Pegar apenas os próximos 5 agendamentos que não estão finalizados
  const proximosAgendamentos = servicosAtivos
    .filter((s) => {
      const statusNormalizado =
        s.status
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") || "";
      return !["concluido", "cancelado"].includes(statusNormalizado);
    })
    .sort((a, b) => {
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
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-slate-300/50 dark:bg-slate-700/50 animate-pulse" />
          <Loader2 className="animate-spin text-text w-10 h-10 relative z-10 mb-4" />
        </div>
        <p className="text-text-muted font-medium animate-pulse">
          Preparando o seu dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-3xl flex items-center justify-center border border-rose-200 dark:border-rose-900 mb-6 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 dark:text-rose-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-text tracking-tight">
          Não foi possível carregar os dados
        </h2>
        <p className="text-text-muted mt-2 max-w-md leading-relaxed">{error}</p>
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => window.location.reload()}
        >
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
      {/* Cabeçalho de Boas-vindas com CTA Principal */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-bg-elevated p-6 rounded-2xl shadow-sm border border-border"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text mb-2">
            {getSaudacao()}, Willian!
          </h1>
          <p className="text-text-muted text-sm md:text-base">
            Aqui está o resumo da sua operação de hoje.
          </p>
        </div>
      </motion.div>

      {/* Cartões de KPI (Métricas Principais) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow group cursor-default">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/50 transition-all duration-300">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-muted uppercase tracking-wider">
              Total
            </p>
            <h3 className="text-2xl font-extrabold text-text mt-0.5">
              {servicosAtivos.length}
            </h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow group cursor-default">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 group-hover:bg-amber-100 dark:group-hover:bg-amber-950/50 transition-all duration-300">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-muted uppercase tracking-wider">
              Pendentes
            </p>
            <h3 className="text-2xl font-extrabold text-text mt-0.5">
              {totalPendentes}
            </h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow group cursor-default">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-950/50 transition-all duration-300">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-muted uppercase tracking-wider">
              Em Andamento
            </p>
            <h3 className="text-2xl font-extrabold text-text mt-0.5">
              {totalEmAndamento}
            </h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow group cursor-default">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50 transition-all duration-300">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-muted uppercase tracking-wider">
              Concluídos
            </p>
            <h3 className="text-2xl font-extrabold text-text mt-0.5">
              {totalConcluidos}
            </h3>
          </div>
        </Card>
      </motion.div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Próximos Agendamentos (Ocupa 2 colunas) */}
        <motion.div variants={itemVariants} className="xl:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between w-full">
            <h2 className="text-xl font-bold text-text">
              Próximos Agendamentos
            </h2>
            <Link
              href="/agendamentos"
              className="w-full md:w-auto focus:outline-none"
            >
              <Button
                variant="outline"
                className="w-full bg-bg-elevated hover:bg-bg-muted text-text"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Abrir Agenda Completa
              </Button>
            </Link>
          </div>
          <Card
            padding="none"
            className="overflow-hidden border border-border shadow-sm"
          >
            {proximosAgendamentos.length === 0 ? (
              <div className="p-12 text-center bg-bg-elevated">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-200 dark:border-emerald-900">
                  <CheckCircle className="w-10 h-10 text-emerald-400 dark:text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">
                  Tudo em dia!
                </h3>
                <p className="text-sm text-text-muted max-w-sm mx-auto">
                  A sua agenda está limpa no momento. Quando novos serviços
                  entrarem, aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border bg-bg-elevated">
                {proximosAgendamentos.map((servico) => (
                  <Link
                    href={`/agendamentos/${servico.id}`}
                    key={servico.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-bg-muted transition-all gap-4 group focus:outline-none focus:bg-bg-muted border-l-4 border-transparent hover:border-blue-500 dark:hover:border-blue-400"
                  >
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:flex p-3 bg-bg-muted text-text-muted rounded-xl group-hover:bg-bg-elevated group-hover:shadow-sm border border-border group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all">
                        <Car className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text text-base mb-1.5 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {servico.cliente?.nome || "Cliente não informado"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-text-muted">
                          <span className="flex items-center gap-1.5 bg-bg-muted dark:bg-bg px-2 py-1 rounded-md text-text">
                            <Calendar className="w-3.5 h-3.5 text-text-muted" />
                            {formatarDataExibicao(servico.data)}
                          </span>
                          <span className="flex items-center gap-1.5 bg-bg-muted dark:bg-bg px-2 py-1 rounded-md text-text">
                            <Clock className="w-3.5 h-3.5 text-text-muted" />
                            {formatarHorarioExibicao(servico.horario)}
                          </span>
                          <span className="flex items-center gap-1.5 font-mono uppercase bg-bg-muted dark:bg-bg px-2 py-1 rounded-md text-text">
                            {servico.veiculo?.placa || "S/ Placa"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                      <StatusBadge status={servico.status || "pendente"} />
                      <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
                        <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Painel Lateral Rápido (Ocupa 1 coluna) */}
        <motion.div variants={itemVariants} className="space-y-5">
          <h2 className="text-xl font-bold text-text">Acesso Rápido</h2>
          <div className="grid grid-cols-1 gap-5">
            <Card className="p-6 border border-border shadow-sm">
              <h3 className="font-bold text-text flex items-center gap-2 mb-5">
                <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />{" "}
                Status da Operação
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-text-muted">Taxa de Conclusão</span>
                    <span className="text-text">{taxaConclusao}%</span>
                  </div>
                  <div className="w-full bg-bg-muted dark:bg-bg rounded-full h-3 overflow-hidden shadow-inner relative">
                    <div
                      className="bg-emerald-500 dark:bg-emerald-400 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                      style={{ width: `${taxaConclusao}%` }}
                    >
                      {/* Efeito de brilho na barra de progresso */}
                      <div
                        className="absolute top-0 left-0 right-0 bottom-0 bg-bg-elevated/20"
                        style={{
                          transform: "skewX(-20deg)",
                          width: "20px",
                          animation: "progress-shine 2s infinite",
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-2 font-medium">
                    {totalConcluidos} de {servicosAtivos.length} serviços
                    finalizados
                  </p>
                </div>
              </div>
            </Card>

            {/* Link envolve o Card inteiro para melhorar UX (área de clique expandida) */}
            <Link
              href="/relatorios"
              className="block focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 rounded-2xl group transition-transform hover:-translate-y-1"
            >
              <Card className="p-6 flex flex-col justify-center gap-3 border-transparent bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-white shadow-lg overflow-hidden relative">
                {/* Elemento decorativo de fundo */}
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-bg-elevated/5 rounded-full blur-2xl group-hover:bg-blue-400/20 transition-colors duration-500" />
                <TrendingUp className="w-8 h-8 text-blue-400 mb-1" />
                <div>
                  <h3 className="text-lg font-bold flex items-center justify-between">
                    Relatório Mensal
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Visualize o desempenho e as métricas deste mês.
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
