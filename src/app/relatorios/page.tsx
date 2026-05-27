// src/app/relatorios/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useServicos } from "@/hooks/useServicos";
import { motion, Variants } from "framer-motion";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Users,
  Wrench,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Download,
  Filter,
  ChevronDown,
  FileText,
  MapPin,
  Car,
  ArrowUpRight,
  ArrowDownRight,
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
  LineChart,
  Line,
  Legend,
} from "recharts";
import Link from "next/link";

// Cores para os gráficos
const COLORS = {
  primary: "#0f172a",
  secondary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  slate: "#64748b",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
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

type PeriodoFiltro = "7dias" | "30dias" | "90dias" | "esteAno" | "todos";

export default function RelatoriosPage() {
  const { servicos, loading, error } = useServicos();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("30dias");
  const [filtroTecnico, setFiltroTecnico] = useState<string>("todos");

  // Filtrar serviços por período
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

  // Filtrar por técnico
  const servicosPorTecnico = useMemo(() => {
    if (filtroTecnico === "todos") return servicosFiltrados;
    return servicosFiltrados.filter((s) => s.tecnico === filtroTecnico);
  }, [servicosFiltrados, filtroTecnico]);

  // Lista única de técnicos
  const tecnicos = useMemo(() => {
    return [...new Set(servicos.map((s) => s.tecnico).filter(Boolean))];
  }, [servicos]);

  // === MÉTRICAS ===
  const metricas = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado"
    );

    const total = ativos.length;
    const pendentes = ativos.filter(
      (s) => s.status?.toLowerCase() === "pendente"
    ).length;
    const emAndamento = ativos.filter((s) => {
      const status = s.status?.toLowerCase().replace(/\s+/g, "_");
      return status === "em_andamento";
    }).length;
    const concluidos = ativos.filter((s) => {
      const status = s.status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return status === "concluido";
    }).length;
    const cancelados = ativos.filter((s) => {
      const status = s.status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return status === "cancelado";
    }).length;

    // Taxa de conclusão
    const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    // Tempo médio (dias entre criação e conclusão - simulado)
    const servicosConcluidos = ativos.filter((s) => {
      const status = s.status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return status === "concluido";
    });

    return {
      total,
      pendentes,
      emAndamento,
      concluidos,
      cancelados,
      taxaConclusao,
      servicosConcluidos: servicosConcluidos.length,
    };
  }, [servicosPorTecnico]);

  // === DADOS PARA GRÁFICO DE STATUS (Pie) ===
  const dadosStatus = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado"
    );

    const grupos: Record<string, number> = {};
    ativos.forEach((s) => {
      const status = s.status || "Pendente";
      grupos[status] = (grupos[status] || 0) + 1;
    });

    return Object.entries(grupos)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [servicosPorTecnico]);

  // === DADOS PARA GRÁFICO DE SERVIÇOS POR DIA (Bar) ===
  const dadosPorDia = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado"
    );

    const grupos: Record<string, number> = {};
    ativos.forEach((s) => {
      if (!s.data) return;
      grupos[s.data] = (grupos[s.data] || 0) + 1;
    });

    return Object.entries(grupos)
      .map(([data, quantidade]) => ({ data, quantidade }))
      .sort((a, b) => {
        const [d1, m1, y1] = a.data.split("/").map(Number);
        const [d2, m2, y2] = b.data.split("/").map(Number);
        return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
      })
      .slice(-15); // Últimos 15 dias com dados
  }, [servicosPorTecnico]);

  // === DADOS PARA GRÁFICO POR TÉCNICO (Bar) ===
  const dadosPorTecnico = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado"
    );

    const grupos: Record<string, { total: number; concluidos: number }> = {};
    ativos.forEach((s) => {
      const tecnico = s.tecnico || "Não atribuído";
      if (!grupos[tecnico]) grupos[tecnico] = { total: 0, concluidos: 0 };
      grupos[tecnico].total++;

      const status = s.status?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (status === "concluido") grupos[tecnico].concluidos++;
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

  // === DADOS PARA GRÁFICO DE TIPOS DE SERVIÇO ===
  const dadosPorTipo = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado"
    );

    const grupos: Record<string, number> = {};
    ativos.forEach((s) => {
      const tipo = s.tipoServico || "Não especificado";
      grupos[tipo] = (grupos[tipo] || 0) + 1;
    });

    return Object.entries(grupos)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [servicosPorTecnico]);

  // === TOP CIDADES ===
  const topCidades = useMemo(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado"
    );

    const grupos: Record<string, number> = {};
    ativos.forEach((s) => {
      const cidade = s.endereco?.cidade || "Não informada";
      grupos[cidade] = (grupos[cidade] || 0) + 1;
    });

    return Object.entries(grupos)
      .map(([cidade, quantidade]) => ({ cidade, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [servicosPorTecnico]);

  // === EXPORTAR CSV ===
  const exportarCSV = useCallback(() => {
    const ativos = servicosPorTecnico.filter(
      (s) => s.status?.toLowerCase() !== "deletado"
    );

    const headers = [
      "ID",
      "Data",
      "Técnico",
      "Cliente",
      "Placa",
      "Cidade",
      "Status",
      "Tipo de Serviço",
    ];

    const rows = ativos.map((s) => [
      s.id,
      s.data,
      s.tecnico,
      s.cliente?.nome,
      s.veiculo?.placa,
      s.endereco?.cidade,
      s.status,
      s.tipoServico,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell || ""}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-servicos-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [servicosPorTecnico]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-slate-300/50 animate-pulse" />
          <Loader2 className="animate-spin text-slate-900 w-10 h-10 relative z-10 mb-4" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">
          Carregando relatórios...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center border border-rose-100 mb-6 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Não foi possível carregar os relatórios
        </h2>
        <p className="text-slate-500 mt-2 max-w-md leading-relaxed">{error}</p>
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
      {/* Cabeçalho */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Relatórios
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Análise completa dos seus serviços e métricas de desempenho.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de Período */}
          <div className="relative">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoFiltro)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="90dias">Últimos 90 dias</option>
              <option value="esteAno">Este ano</option>
              <option value="todos">Todo o período</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Filtro de Técnico */}
          <div className="relative">
            <select
              value={filtroTecnico}
              onChange={(e) => setFiltroTecnico(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value="todos">Todos os técnicos</option>
              {tecnicos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Exportar */}
          <Button
            variant="outline"
            onClick={exportarCSV}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>
      </motion.div>

      {/* KPIs Principais */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total de Serviços
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {metricas.total}
            </h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Concluídos
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {metricas.concluidos}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              {metricas.taxaConclusao}% de taxa
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pendentes
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {metricas.pendentes}
            </h3>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 hoverable group">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Em Andamento
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {metricas.emAndamento}
            </h3>
          </div>
        </Card>
      </motion.div>

      {/* Gráficos - Linha 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status (Pie) */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-400" />
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
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dadosStatus.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Gráfico por Técnico (Bar) */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" />
                Serviços por Técnico
              </h3>
            </div>
            <div className="h-72">
              {dadosPorTecnico.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosPorTecnico} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" fontSize={12} stroke="#94a3b8" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      fontSize={12}
                      stroke="#64748b"
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="total"
                      name="Total"
                      fill={COLORS.primary}
                      radius={[0, 6, 6, 0]}
                    />
                    <Bar
                      dataKey="concluidos"
                      name="Concluídos"
                      fill={COLORS.success}
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Gráficos - Linha 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Serviços por Dia (Line) */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                Serviços por Dia
              </h3>
            </div>
            <div className="h-72">
              {dadosPorDia.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosPorDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="data"
                      fontSize={11}
                      stroke="#94a3b8"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis fontSize={12} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="quantidade"
                      name="Quantidade"
                      fill={COLORS.secondary}
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Top Cidades */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" />
                Top Cidades
              </h3>
            </div>
            <div className="space-y-4">
              {topCidades.length > 0 ? (
                topCidades.map((cidade, index) => (
                  <div key={cidade.cidade} className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? "bg-amber-100 text-amber-700"
                          : index === 1
                          ? "bg-slate-200 text-slate-600"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {cidade.cidade}
                      </p>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-slate-400 h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              (cidade.quantidade / topCidades[0].quantidade) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {cidade.quantidade}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 text-sm py-8">
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico de Tipos de Serviço */}
      <motion.div variants={itemVariants}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-slate-400" />
              Serviços por Tipo
            </h3>
          </div>
          <div className="h-64">
            {dadosPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosPorTipo}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    fontSize={12}
                    stroke="#94a3b8"
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis fontSize={12} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Quantidade"
                    fill={COLORS.primary}
                    radius={[6, 6, 0, 0]}
                  >
                    {dadosPorTipo.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Sem dados para o período selecionado
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Link para Agenda */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <Link href="/agendamentos" className="w-full sm:w-auto">
          <Button variant="primary" className="w-full sm:w-auto">
            <Calendar className="w-4 h-4 mr-2" />
            Ver Agenda Completa
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}