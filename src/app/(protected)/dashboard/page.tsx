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
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { servicos, loading, error } = useServicos();
  const { usuario } = useAuth();

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
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="mt-3 text-sm font-medium text-text-muted">
          Preparando o seu dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
          <AlertCircle
            className="h-6 w-6 text-rose-600 dark:text-rose-400"
            aria-hidden
          />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-text">
          Não foi possível carregar os dados
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">
          {error}
        </p>
        <Button
          variant="outline"
          className="mt-6"
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
      className="space-y-6"
    >
      {/* Cabeçalho de Boas-vindas */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm sm:flex-row sm:items-end sm:p-6"
      >
        <div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-text md:text-3xl">
            {getSaudacao()},{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              {usuario?.tecnico_nome || "Usuário"}
            </span>
            !
          </h1>
          <p className="text-sm text-text-muted md:text-[15px]">
            Aqui está o resumo da sua operação de hoje.
          </p>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <Card
          padding="none"
          className="flex items-center gap-4 p-4 hover:shadow-md"
        >
          <div className="flex items-center justify-center rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Total
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {servicosAtivos.length}
            </p>
          </div>
        </Card>

        <Card
          padding="none"
          className="flex items-center gap-4 p-4 hover:shadow-md"
        >
          <div className="flex items-center justify-center rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Pendentes
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {totalPendentes}
            </p>
          </div>
        </Card>

        <Card
          padding="none"
          className="flex items-center gap-4 p-4 hover:shadow-md"
        >
          <div className="flex items-center justify-center rounded-lg bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-400">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Em Andamento
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {totalEmAndamento}
            </p>
          </div>
        </Card>

        <Card
          padding="none"
          className="flex items-center gap-4 p-4 hover:shadow-md"
        >
          <div className="flex items-center justify-center rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Concluídos
            </p>
            <p className="mt-0.5 text-2xl font-semibold leading-none tracking-tight text-text">
              {totalConcluidos}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Próximos Agendamentos */}
        <motion.div variants={itemVariants} className="space-y-3 xl:col-span-2">
          <div className="flex w-full flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <h2 className="text-lg font-semibold tracking-tight text-text">
              Próximos Agendamentos
            </h2>
            <Link href="/agendamentos" className="w-full md:w-auto">
              <Button
                variant="outline"
                icon={Calendar}
                className="w-full md:w-auto"
              >
                Abrir Agenda Completa
              </Button>
            </Link>
          </div>
          <Card padding="none" className="overflow-hidden">
            {proximosAgendamentos.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                  <CheckCircle
                    className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
                    aria-hidden
                  />
                </div>
                <h3 className="mb-2 text-base font-semibold tracking-tight text-text">
                  Tudo em dia!
                </h3>
                <p className="mx-auto max-w-sm text-sm text-text-muted">
                  A sua agenda está limpa no momento. Quando novos serviços
                  entrarem, aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {proximosAgendamentos.map((servico) => (
                  <Link
                    href={`/agendamentos/${servico.id}`}
                    key={servico.id}
                    className="group flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-text/50 sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="hidden items-center justify-center rounded-lg border border-border bg-bg-muted/40 p-2 text-text-muted transition-colors group-hover:text-primary sm:flex">
                        <Car className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="mb-1.5 text-sm font-semibold tracking-tight text-text transition-colors group-hover:text-primary">
                          {servico.cliente?.nome || "Cliente não informado"}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs font-medium text-text-muted">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-muted/40 px-2 py-1 text-text">
                            <Calendar className="h-3.5 w-3.5 text-text-muted" />
                            {formatarDataExibicao(servico.data)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-muted/40 px-2 py-1 text-text">
                            <Clock className="h-3.5 w-3.5 text-text-muted" />
                            {formatarHorarioExibicao(servico.horario)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-muted/40 px-2 py-1 font-mono uppercase text-text">
                            {servico.veiculo?.placa || "S/ Placa"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <StatusBadge status={servico.status || "pendente"} />
                      <div className="flex h-7 w-7 items-center justify-center rounded-md transition-colors group-hover:bg-primary/10">
                        <ArrowRight className="h-4 w-4 text-text-muted transition-colors group-hover:text-primary" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Painel Lateral */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight text-text">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {/* Status da Operação */}
            <Card padding="none" className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-tight text-text">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Status da Operação
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex justify-between text-sm font-medium">
                    <span className="text-text-muted">Taxa de Conclusão</span>
                    <span className="font-semibold text-text">
                      {taxaConclusao}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-muted/50">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-1000 ease-out dark:bg-emerald-400"
                      style={{ width: `${taxaConclusao}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-text-muted">
                    {totalConcluidos} de {servicosAtivos.length} serviços
                    finalizados
                  </p>
                </div>
              </div>
            </Card>

            {/* Relatório Mensal */}
            <Link
              href="/relatorios"
              className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 focus-visible:ring-offset-2"
            >
              <Card
                padding="none"
                className="flex flex-col justify-center gap-3 border-transparent bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-lg dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
              >
                <TrendingUp className="h-7 w-7 text-blue-400" />
                <div>
                  <h3 className="flex items-center justify-between text-base font-semibold">
                    Relatório Mensal
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-colors group-hover:text-white" />
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
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
