// src/app/agendamentos/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useServicos } from "@/hooks/useServicos";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, MapPin, Car, Calendar, User, AlertCircle, Loader2, Wrench, FileText } from "lucide-react";
import { formatarContato } from "@/lib/utils";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Card } from "@/components/ui/Card";

export default function ServicoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const { servicos, loading, error } = useServicos();

  const servico = servicos.find((s) => String(s.id) === id);

  const getClienteNome = () => servico?.cliente?.nome || "Cliente não informado";
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

  // Estado de Loading alinhado com a listagem
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 w-10 h-10 relative z-10" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Carregando detalhes do serviço...</p>
      </div>
    );
  }

  // Estado de Erro/Não Encontrado Modernizado
  if (error || !servico) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200/60 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {error ? "Erro ao carregar" : "Serviço não encontrado"}
          </h2>
          <p className="text-slate-500 mb-8">
            {error || "O agendamento solicitado pode ter sido removido ou o ID está incorreto."}
          </p>
          <button 
            onClick={() => router.push("/agendamentos")}
            className="w-full py-3 px-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-5xl mx-auto"
      >
        {/* Botão de Voltar com Micro-interação */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-8 focus:outline-none"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> 
          Voltar
        </button>

        {/* Cabeçalho do Serviço */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
              {getClienteNome()}
            </h1>
            <div className="flex items-center gap-3">
              <span className="bg-slate-200/70 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                OS: {getOrdemServico()}
              </span>
            </div>
          </div>
          <div className="mt-2 md:mt-0">
            <StatusBadge status={getStatus()} className="shadow-sm" />
          </div>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card: Cliente */}
          <Card className="p-6 rounded-2xl border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Cliente</h2>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{formatarContato(getClienteContato())}</span>
            </div>
          </Card>

          {/* Card: Veículo */}
          <Card className="p-6 rounded-2xl border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Car className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Veículo</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-500">Placa</span>
                <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700 uppercase tracking-widest">
                  {getVeiculoPlaca()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-500">Modelo</span>
                <span className="font-medium text-slate-900 text-right">{getVeiculoModelo()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-500">Serviço</span>
                <span className="font-medium text-slate-900 text-right">{getTipoServico()}</span>
              </div>
            </div>
          </Card>

          {/* Card: Agenda */}
          <Card className="p-6 rounded-2xl border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Agenda</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="font-medium text-slate-500">Data</span>
                <span className="font-semibold text-slate-900">
                  {getData()}{getDiaSemana() ? ` • ${getDiaSemana()}` : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-500">Horário</span>
                <span className="font-semibold text-slate-900">{getHorario()}</span>
              </div>
            </div>
          </Card>

          {/* Card: Localização (Ocupa 2 colunas em telas maiores) */}
          <Card className="p-6 rounded-2xl border-slate-200/60 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Localização</h2>
            </div>
            <address className="not-italic flex flex-col gap-1.5 text-slate-600 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <p className="font-medium text-slate-800 text-base">
                {getEnderecoRua()}{getEnderecoNumero() ? `, ${getEnderecoNumero()}` : ""}
              </p>
              <p>
                {getEnderecoBairro()} 
                {getEnderecoBairro() && getEnderecoCidade() ? " - " : ""} 
                {getEnderecoCidade()}
                {getEnderecoEstado() ? ` / ${getEnderecoEstado().toUpperCase()}` : ""}
              </p>
              {getEnderecoCep() && (
                <p className="text-sm font-medium text-slate-500 mt-1">CEP: {getEnderecoCep()}</p>
              )}
            </address>
          </Card>

          {/* Card: Técnico */}
          <Card className="p-6 rounded-2xl border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                <Wrench className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Responsável</h2>
            </div>
            <div className="flex items-center gap-3 text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <span className="font-semibold">{getTecnico()}</span>
            </div>
          </Card>

          {/* Card: Observações (Largura total dependendo do grid) */}
          <Card className="p-6 rounded-2xl border-slate-200/60 shadow-sm md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Observações</h2>
            </div>
            {getObservacao() ? (
              <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 text-amber-900">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {getObservacao()}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-center">
                <p className="text-slate-400 text-sm font-medium">Nenhuma observação registrada para este agendamento.</p>
              </div>
            )}
          </Card>
          
        </div>
      </motion.div>
    </main>
  );
}