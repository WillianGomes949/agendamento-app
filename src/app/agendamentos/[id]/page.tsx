// src/app/agendamentos/[id]/page.tsx
"use client";
import { useParams, useRouter } from "next/navigation";
import { useServicos } from "@/hooks/useServicos";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Car,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  Wrench,
  FileText,
} from "lucide-react";
import { formatarContato } from "@/lib/utils";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Card } from "@/components/ui/Card";

export default function ServicoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { servicos, loading, error } = useServicos();
  const servico = servicos.find((s) => String(s.id) === id);

  const getClienteNome = () =>
    servico?.cliente?.nome || "Cliente não informado";
  const getClienteContato = () => servico?.cliente?.contato || "";
  const getOrdemServico = () => servico?.ordemServico || "N/A";
  const getVeiculoPlaca = () => servico?.veiculo?.placa || "N/A";
  const getVeiculoModelo = () => servico?.veiculo?.marcaModelo || "N/A";
  const getTipoServico = () => servico?.tipoServico || "N/A";
  const getEnderecoRua = () => servico?.endereco?.rua || "";
  const getEnderecoNumero = () => servico?.endereco?.numero || "";
  const getEnderecoBairro = () => servico?.endereco?.bairro || "";
  const getEnderecoCidade = () => servico?.endereco?.cidade || "";
  const getEnderecoEstado = () => servico?.endereco?.estado || "";
  const getEnderecoCep = () => servico?.endereco?.cep || "";
  const getData = () => servico?.data || "Data não informada";
  const getDiaSemana = () => servico?.diaSemana || "";
  const getHorario = () => servico?.horario || "Horário não informado";
  const getObservacao = () => servico?.observacao || "";
  const getStatus = () => servico?.status || "pendente";
  const getTecnico = () => servico?.tecnico || "Não informado";

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 dark:bg-blue-400/20 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 w-10 h-10 relative z-10" />
        </div>
        <p className="text-text-muted font-medium animate-pulse">
          Carregando detalhes do serviço...
        </p>
      </div>
    );
  }

  if (error || !servico) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-elevated p-8 rounded-3xl shadow-sm border border-border text-center">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">
            {error ? "Erro ao carregar" : "Serviço não encontrado"}
          </h2>
          <p className="text-text-muted mb-8">
            {error ||
              "O agendamento solicitado pode ter sido removido ou o ID está incorreto."}
          </p>
          <button
            onClick={() => router.push("/agendamentos")}
            className="w-full py-3 px-4 bg-accent text-accent-foreground font-semibold rounded-xl hover:bg-accent/90 transition-colors focus:ring-2 focus:ring-accent focus:ring-offset-2"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg font-sans selection:bg-accent/20 selection:text-text p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-5xl mx-auto"
      >
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text transition-colors mb-8 focus:outline-none"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Voltar
        </button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text mb-2">
              {getClienteNome()}
            </h1>
            <div className="flex items-center gap-3">
              <span className="bg-bg-muted text-text px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border border-border">
                OS: {getOrdemServico()}
              </span>
            </div>
          </div>
          <div className="mt-2 md:mt-0">
            <StatusBadge status={getStatus()} className="shadow-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text">Cliente</h2>
            </div>
            <div className="flex items-center gap-3 text-text">
              <Phone className="w-4 h-4 text-text-muted" />
              <span className="font-medium">
                {formatarContato(getClienteContato())}
              </span>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <Car className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text">Veículo</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="font-medium text-text-muted">Placa</span>
                <span className="font-mono font-bold bg-bg-muted px-2 py-0.5 rounded text-text uppercase tracking-widest border border-border">
                  {getVeiculoPlaca()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="font-medium text-text-muted">Modelo</span>
                <span className="font-medium text-text text-right">
                  {getVeiculoModelo()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-text-muted">Serviço</span>
                <span className="font-medium text-text text-right">
                  {getTipoServico()}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text">Agenda</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="font-medium text-text-muted">Data</span>
                <span className="font-semibold text-text">
                  {getData()}
                  {getDiaSemana() ? ` • ${getDiaSemana()}` : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-text-muted">Horário</span>
                <span className="font-semibold text-text">{getHorario()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text">Localização</h2>
            </div>
            <address className="not-italic flex flex-col gap-1.5 text-text bg-bg-muted p-4 rounded-xl border border-border">
              <p className="font-medium text-text text-base">
                {getEnderecoRua()}
                {getEnderecoNumero() ? `, ${getEnderecoNumero()}` : ""}
              </p>
              <p className="text-text-muted">
                {getEnderecoBairro()}
                {getEnderecoBairro() && getEnderecoCidade() ? " - " : ""}
                {getEnderecoCidade()}
                {getEnderecoEstado()
                  ? ` / ${getEnderecoEstado().toUpperCase()}`
                  : ""}
              </p>
              {getEnderecoCep() && (
                <p className="text-sm font-medium text-text-muted mt-1">
                  CEP: {getEnderecoCep()}
                </p>
              )}
            </address>
          </Card>

          <Card className="p-6 rounded-2xl border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-xl">
                <Wrench className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text">Responsável</h2>
            </div>
            <div className="flex items-center gap-3 text-text bg-bg-muted p-4 rounded-xl border border-border">
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center border border-border">
                <User className="w-4 h-4 text-text-muted" />
              </div>
              <span className="font-semibold">{getTecnico()}</span>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-border shadow-sm md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-text">Observações</h2>
            </div>
            {getObservacao() ? (
              <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 rounded-xl p-4 text-amber-900 dark:text-amber-200">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {getObservacao()}
                </p>
              </div>
            ) : (
              <div className="bg-bg-muted border border-border rounded-xl p-4 flex items-center justify-center">
                <p className="text-text-muted text-sm font-medium">
                  Nenhuma observação registrada para este agendamento.
                </p>
              </div>
            )}
          </Card>
        </div>
      </motion.div>
    </main>
  );
}
