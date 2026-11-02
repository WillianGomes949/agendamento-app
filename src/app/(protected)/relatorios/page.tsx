// src/app/relatorios/page.tsx
"use client";
import { useState, useMemo } from "react";
import { useServicos } from "@/hooks/useServicos";
import { useTheme } from "@/hooks/useTheme";
import { motion, Variants } from "framer-motion";
import {
  BarChart3,
  Calendar,
  Users,
  Wrench,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Filter,
  ChevronDown,
  FileText,
  MapPin,
  Car,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Link from "next/link";
import { ColumnDef } from "@/lib/exportUtils";
import { Servico } from "@/lib/types";
import { ExportButtons } from "@/components/ui/ExportButtons";

const PALETTE = {
  light: ["#2563eb", "#10b981", "#f59e0b", "#6366f1", "#ef4444", "#06b6d4"],
  dark: ["#60a5fa", "#34d399", "#fbbf24", "#818cf8", "#f87171", "#22d3ee"],
};

const STATUS_META: Record<
  string,
  { label: string; light: string; dark: string }
> = {
  pendente: { label: "Pendente", light: "#f59e0b", dark: "#fbbf24" },
  "em andamento": { label: "Em andamento", light: "#6366f1", dark: "#818cf8" },
  concluido: { label: "Concluído", light: "#10b981", dark: "#34d399" },
  cancelado: { label: "Cancelado", light: "#ef4444", dark: "#f87171" },
};

const normalizeStatus = (s?: string) =>
  (s || "pendente")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ")
    .trim();

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

type PeriodoFiltro = "7dias" | "30dias" | "90dias" | "esteAno" | "todos";

export default function RelatoriosPage() {
  const { servicos, loading, error } = useServicos();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [periodo, setPeriodo] = useState<PeriodoFiltro>("30dias");
  const [filtroTecnico, setFiltroTecnico] = useState<string>("todos");

  const palette = isDark ? PALETTE.dark : PALETTE.light;
  const statusColor = (key: string, i: number) =>
    STATUS_META[key]?.[isDark ? "dark" : "light"] ??
    palette[i % palette.length];

  const customTooltipStyle = {
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.15)",
    backgroundColor: "var(--color-bg-elevated)",
    color: "var(--color-text)",
    padding: "8px 12px",
    fontWeight: 500,
    fontSize: "13px",
  };

  const axisColor = "var(--color-text-muted)";
  const gridColor = "var(--color-border)";
  const cursorColor = "var(--color-bg-muted)";
  const legendColor = "var(--color-text)";

  const servicosFiltrados = useMemo(() => {
    if (!servicos.length) return [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    let dataLimite = new Date();
    switch (periodo) {
      case "7dias":
        dataLimite.setDate(hoje.getDate() - 7);
        break;
      case "30dias":
        dataLimite.setDate(hoje.getDate() - 30);
        break;
      case "90dias":
        dataLimite.setDate(hoje.getDate() - 90);
        break;
      case "esteAno":
        dataLimite = new Date(hoje.getFullYear(), 0, 1);
        break;
      case "todos":
        return servicos;
    }
    return servicos.filter((s) => {
      if (!s.data) return false;
      const [dia, mes, ano] = s.data.split("/").map(Number);
      const dataServico = new Date(ano, mes - 1, dia);
      return dataServico >= dataLimite;
    });
  }, [servicos, periodo]);

  const servicosPorTecnico = useMemo(() => {
    if (filtroTecnico === "todos") return servicosFiltrados;
    return servicosFiltrados.filter((s) => s.tecnico === filtroTecnico);
  }, [servicosFiltrados, filtroTecnico]);

  const tecnicos = useMemo(
    () => [...new Set(servicos.map((s) => s.tecnico).filter(Boolean))],
    [servicos],
  );

  const metricas = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado",
    );
    const total = ativos.length;
    const pendentes = ativos.filter(
      (s) => s.status?.toLowerCase() === "pendente",
    ).length;
    const emAndamento = ativos.filter(
      (s) => s.status?.toLowerCase().replace(/\s+/g, "_") === "em_andamento",
    ).length;
    const concluidos = ativos.filter(
      (s) =>
        s.status
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") === "concluido",
    ).length;
    const taxaConclusao =
      total > 0 ? Math.round((concluidos / total) * 100) : 0;
    return { total, pendentes, emAndamento, concluidos, taxaConclusao };
  }, [servicosPorTecnico]);

  const dadosStatus = useMemo(() => {
    const grupos: Record<string, number> = {};
    servicosPorTecnico.forEach((s) => {
      const key = normalizeStatus(s.status);
      if (key === "deletado") return;
      grupos[key] = (grupos[key] || 0) + 1;
    });
    return Object.entries(grupos)
      .map(([key, value]) => ({
        key,
        name: STATUS_META[key]?.label ?? key,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [servicosPorTecnico]);

  const dadosPorDia = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado",
    );
    const grupos: Record<string, number> = {};
    ativos.forEach((s) => {
      if (s.data) grupos[s.data] = (grupos[s.data] || 0) + 1;
    });
    return Object.entries(grupos)
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => {
        const [d1, m1, y1] = a.data.split("/").map(Number);
        const [d2, m2, y2] = b.data.split("/").map(Number);
        return (
          new Date(y1, m1 - 1, d1).getTime() -
          new Date(y2, m2 - 1, d2).getTime()
        );
      })
      .slice(-15);
  }, [servicosPorTecnico]);

  const dadosPorTecnico = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado",
    );
    const grupos: Record<string, { total: number; concluidos: number }> = {};
    ativos.forEach((s) => {
      const tecnico = s.tecnico || "Não atribuído";
      if (!grupos[tecnico]) grupos[tecnico] = { total: 0, concluidos: 0 };
      grupos[tecnico].total++;
      if (
        s.status
          ?.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") === "concluido"
      )
        grupos[tecnico].concluidos++;
    });
    return Object.entries(grupos)
      .map(([name, dados]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "..." : name,
        total: dados.total,
        concluidos: dados.concluidos,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [servicosPorTecnico]);

  const dadosPorTipo = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado",
    );
    const grupos: Record<string, number> = {};
    ativos.forEach((s) => {
      grupos[s.tipoServico || "Não especificado"] =
        (grupos[s.tipoServico || "Não especificado"] || 0) + 1;
    });
    return Object.entries(grupos)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [servicosPorTecnico]);

  const topCidades = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado",
    );
    const grupos: Record<string, number> = {};
    ativos.forEach((s) => {
      grupos[s.endereco?.cidade || "Não informada"] =
        (grupos[s.endereco?.cidade || "Não informada"] || 0) + 1;
    });
    return Object.entries(grupos)
      .map(([cidade, quantidade]) => ({ cidade, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [servicosPorTecnico]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="mt-3 text-sm font-medium text-text-muted">
          A carregar relatórios...
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
          Não foi possível carregar os relatórios
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

  const colunasRelatorio: ColumnDef<Servico>[] = [
    { header: "ID", accessor: "id" },
    { header: "Data", accessor: "data" },
    { header: "Horário", accessor: "horario" },
    { header: "Técnico", accessor: "tecnico" },
    { header: "Cliente", accessor: (s) => s.cliente?.nome ?? "" },
    { header: "Placa", accessor: (s) => s.veiculo?.placa ?? "" },
    { header: "Cidade", accessor: (s) => s.endereco?.cidade ?? "" },
    { header: "Tipo", accessor: "tipoServico" },
    { header: "Status", accessor: "status" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header com Filtros */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm lg:flex-row lg:items-center sm:p-6"
      >
        <div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-text md:text-3xl">
            Relatórios
          </h1>
          <p className="text-sm text-text-muted md:text-[15px]">
            Análise completa dos seus serviços e métricas de desempenho.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-auto lg:flex lg:flex-wrap">
          <div className="relative flex-1 lg:flex-none w-40 gap-2">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoFiltro)}
              aria-label="Filtrar por período"
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-border bg-bg-muted/30 px-3 text-sm font-medium text-text transition-colors hover:bg-bg-muted/50 focus:border-text focus:outline-none focus:ring-2 focus:ring-text/30"
            >
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="90dias">Últimos 90 dias</option>
              <option value="esteAno">Este ano</option>
              <option value="todos">Todo o período</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
          </div>
          <div className="relative flex-1 lg:flex-none w-40 gap-2">
            <select
              value={filtroTecnico}
              onChange={(e) => setFiltroTecnico(e.target.value)}
              aria-label="Filtrar por técnico"
              className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-border bg-bg-muted/30 px-3 text-sm font-medium text-text transition-colors hover:bg-bg-muted/50 focus:border-text focus:outline-none focus:ring-2 focus:ring-text/30"
            >
              <option value="todos">Técnicos</option>
              {tecnicos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Filter
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
          </div>
          <ExportButtons
            data={servicosPorTecnico.filter(
              (s) => s.status?.toLowerCase() !== "deletado",
            )}
            columns={colunasRelatorio}
            filename={`relatorio-servicos-${new Date().toISOString().split("T")[0]}`}
            title="Relatório de Serviços"
          />
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
              {metricas.total}
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
            <div className="mt-0.5 flex items-baseline gap-2">
              <p className="text-2xl font-semibold leading-none tracking-tight text-text">
                {metricas.concluidos}
              </p>
              <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {metricas.taxaConclusao}%
              </span>
            </div>
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
              {metricas.pendentes}
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
              {metricas.emAndamento}
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Gráficos: Status + Técnico */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div variants={itemVariants}>
          <Card padding="none" className="h-full p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text">
                <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Distribuição por Status
              </h3>
            </div>
            <div className="h-72">
              {dadosStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {dadosStatus.map((d, index) => (
                        <Cell
                          key={d.key}
                          fill={statusColor(d.key, index)}
                          className="outline-none transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "13px",
                        paddingTop: "10px",
                        color: legendColor,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-lg bg-bg-muted/40 text-sm text-text-muted">
                  <BarChart3 className="mb-2 h-7 w-7 text-text-muted/50" />
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card padding="none" className="h-full p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text">
                <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Serviços por Técnico
              </h3>
            </div>
            <div className="h-72">
              {dadosPorTecnico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosPorTecnico}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      fontSize={12}
                      stroke={axisColor}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      fontSize={12}
                      stroke={axisColor}
                      width={100}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={customTooltipStyle}
                      cursor={{ fill: cursorColor }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: "13px", paddingTop: "10px" }}
                      formatter={(value) => (
                        <span style={{ color: "var(--color-text)" }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="total"
                      name="Total"
                      fill={isDark ? "#94a3b8" : "#64748b"}
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                    <Bar
                      dataKey="concluidos"
                      name="Concluídos"
                      fill={statusColor("concluido", 0)}
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-lg bg-bg-muted/40 text-sm text-text-muted">
                  <Users className="mb-2 h-7 w-7 text-text-muted/50" />
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos: Por Dia + Top Cidades */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card padding="none" className="h-full p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text">
                <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Serviços por Dia
              </h3>
            </div>
            <div className="h-72">
              {dadosPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosPorDia}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={gridColor}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="data"
                      fontSize={11}
                      stroke={axisColor}
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      fontSize={12}
                      stroke={axisColor}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={customTooltipStyle}
                      cursor={{ fill: cursorColor }}
                    />
                    <Bar
                      dataKey="quantidade"
                      name="Quantidade"
                      fill="var(--color-primary)"
                      radius={[6, 6, 0, 0]}
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-lg bg-bg-muted/40 text-sm text-text-muted">
                  <Calendar className="mb-2 h-7 w-7 text-text-muted/50" />
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card padding="none" className="h-full p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text">
                <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Top Cidades
              </h3>
            </div>
            <div className="space-y-4">
              {topCidades.length > 0 ? (
                topCidades.map((cidade, index) => (
                  <div
                    key={cidade.cidade}
                    className="group flex items-center gap-3"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                        index === 0
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : index === 1
                            ? "bg-bg-muted/50 text-text"
                            : index === 2
                              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                              : "bg-bg-muted/50 text-text-muted"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center justify-between">
                        <p className="truncate text-sm font-semibold text-text transition-colors group-hover:text-primary">
                          {cidade.cidade}
                        </p>
                        <span className="text-sm font-semibold text-text">
                          {cidade.quantidade}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-muted/50">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                          style={{
                            width: `${(cidade.quantidade / topCidades[0].quantidade) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-48 flex-col items-center justify-center rounded-lg bg-bg-muted/40 text-sm text-text-muted">
                  <MapPin className="mb-2 h-7 w-7 text-text-muted/50" />
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico: Por Tipo */}
      <motion.div variants={itemVariants}>
        <Card padding="none" className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-text">
              <Car className="h-4 w-4 text-text-muted" />
              Serviços por Tipo
            </h3>
          </div>
          <div className="h-64">
            {dadosPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosPorTipo}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    stroke={axisColor}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    fontSize={12}
                    stroke={axisColor}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    cursor={{ fill: cursorColor }}
                  />
                  <Bar
                    dataKey="value"
                    name="Quantidade"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  >
                    {dadosPorTipo.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={palette[index % palette.length]}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-lg bg-bg-muted/40 text-sm text-text-muted">
                <Car className="mb-2 h-7 w-7 text-text-muted/50" />
                Sem dados para o período selecionado
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* CTA Final */}
      <motion.div variants={itemVariants} className="flex justify-center pt-2">
        <Link href="/agendamentos" className="block w-full sm:w-auto">
          <Button
            variant="outline"
            size="lg"
            icon={Calendar}
            className="w-full sm:w-auto"
          >
            Abrir Agenda Completa
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
