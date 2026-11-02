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
import { Button } from "@/components/ui/Button";

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="animate-pulse text-sm font-medium text-text-muted">
          Carregando detalhes do serviço...
        </p>
      </div>
    );
  }

  if (error || !servico) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-bg-elevated p-8 text-center shadow-lg">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
            <AlertCircle
              className="h-6 w-6 text-rose-600 dark:text-rose-400"
              aria-hidden
            />
          </div>
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-text">
            {error ? "Erro ao carregar" : "Serviço não encontrado"}
          </h2>
          <p className="mb-6 text-sm text-text-muted">
            {error ||
              "O agendamento solicitado pode ter sido removido ou o ID está incorreto."}
          </p>
          <Button
            onClick={() => router.push("/agendamentos")}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-svh bg-bg p-4 selection:bg-primary/20 selection:text-text md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-text md:text-3xl">
              {getClienteNome()}
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-md border border-border bg-bg-muted/40 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-text">
                OS: {getOrdemServico()}
              </span>
            </div>
          </div>
          <div className="mt-1 md:mt-0">
            <StatusBadge status={getStatus()} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Card: Cliente */}
          <Card padding="none" className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight text-text">
                Cliente
              </h2>
            </div>
            <div className="flex items-center gap-3 text-text">
              <Phone className="h-4 w-4 shrink-0 text-text-muted" />
              <span className="text-sm font-medium">
                {formatarContato(getClienteContato())}
              </span>
            </div>
          </Card>

          {/* Card: Veículo */}
          <Card padding="none" className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
                <Car className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight text-text">
                Veículo
              </h2>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-medium text-text-muted">Placa</span>
                <span className="rounded-md border border-border bg-bg px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-widest text-text">
                  {getVeiculoPlaca()}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-medium text-text-muted">Modelo</span>
                <span className="text-right font-medium text-text">
                  {getVeiculoModelo()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-muted">Serviço</span>
                <span className="text-right font-medium text-text">
                  {getTipoServico()}
                </span>
              </div>
            </div>
          </Card>

          {/* Card: Agenda */}
          <Card padding="none" className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <Calendar className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight text-text">
                Agenda
              </h2>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-medium text-text-muted">Data</span>
                <span className="font-semibold text-text">
                  {getData()}
                  {getDiaSemana() ? ` • ${getDiaSemana()}` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-text-muted">Horário</span>
                <span className="font-semibold text-text">{getHorario()}</span>
              </div>
            </div>
          </Card>

          {/* Card: Localização */}
          <Card padding="none" className="p-5 md:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight text-text">
                Localização
              </h2>
            </div>
            <address className="flex flex-col gap-1.5 rounded-lg border border-border bg-bg-muted/40 p-4 not-italic text-text">
              <p className="text-base font-medium text-text">
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
                <p className="mt-1 text-sm font-medium text-text-muted">
                  CEP: {getEnderecoCep()}
                </p>
              )}
            </address>
          </Card>

          {/* Card: Responsável */}
          <Card padding="none" className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-orange-500/10 p-2 text-orange-600 dark:text-orange-400">
                <Wrench className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight text-text">
                Responsável
              </h2>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-bg-muted/40 p-3 text-text">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-bg-elevated">
                <User className="h-4 w-4 text-text-muted" />
              </div>
              <span className="text-sm font-semibold">{getTecnico()}</span>
            </div>
          </Card>

          {/* Card: Observações */}
          <Card padding="none" className="p-5 md:col-span-2 lg:col-span-3">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight text-text">
                Observações
              </h2>
            </div>
            {getObservacao() ? (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-amber-900 dark:text-amber-200">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {getObservacao()}
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg border border-border bg-bg-muted/40 p-4">
                <p className="text-sm font-medium text-text-muted">
                  Nenhuma observação registrada para este agendamento.
                </p>
              </div>
            )}
          </Card>
        </div>
        <div className="flex mt-3  items-end justify-end">
          <Button
            onClick={() => router.back()}
            aria-label="Voltar"
            className="flex items-center gap-2 min-h-11"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Voltar
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
