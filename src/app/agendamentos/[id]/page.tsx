// src/app/agendamentos/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useServicos } from "@/hooks/useServicos";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, MapPin, Car, Calendar, User, AlertCircle, Loader2, Wrench } from "lucide-react";
import { formatarContato } from "@/lib/utils";
import { StatusBadge } from "@/components/features/StatusBadge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function ServicoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);  // ✅ STRING, não Number

  const { servicos, loading, error } = useServicos();

  // ✅ Comparação segura de strings
  const servico = servicos.find((s) => String(s.id) === id);

  // ✅ Funções seguras para acessar propriedades
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-600 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500">Carregando detalhes do serviço...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Erro ao carregar</h2>
        <p className="text-gray-500 mt-2 max-w-md">{error}</p>
        <Button variant="outline" className="mt-6" onClick={() => router.push("/agendamentos")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  if (!servico) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gray-50">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Serviço não encontrado</h2>
        <p className="text-gray-500 mt-2 max-w-md">
          O agendamento solicitado pode ter sido removido ou o ID está incorreto.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => router.push("/agendamentos")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>

        <Card className="mb-6 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{getClienteNome()}</h1>
            <p className="text-gray-500 mt-1">Ordem de Serviço: {getOrdemServico()}</p>
          </div>
          <StatusBadge status={getStatus()} className="self-start" />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" /> Dados do Cliente
            </h2>
            <div className="flex items-center gap-3 text-gray-600">
              <Phone className="w-5 h-5 text-gray-400" />
              <span>{formatarContato(getClienteContato())}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-purple-500" /> Veículo & Serviço
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-500 w-16">Placa:</span>
                <span className="font-mono uppercase">{getVeiculoPlaca()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-500 w-16">Modelo:</span>
                <span>{getVeiculoModelo()}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-500 w-16">Tipo:</span>
                <span>{getTipoServico()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" /> Localização
            </h2>
            <address className="not-italic space-y-1 text-gray-600">
              <p>
                {getEnderecoRua()}{getEnderecoNumero() ? `, ${getEnderecoNumero()}` : ""}
              </p>
              <p>
                {getEnderecoBairro()} 
                {getEnderecoBairro() && getEnderecoCidade() ? " - " : ""} 
                {getEnderecoCidade()}
                {getEnderecoEstado() ? `/${getEnderecoEstado().toUpperCase()}` : ""}
              </p>
              {getEnderecoCep() && (
                <p className="text-sm text-gray-500">CEP: {getEnderecoCep()}</p>
              )}
            </address>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" /> Técnico Responsável
            </h2>
            <div className="flex items-center gap-3 text-gray-600">
              <User className="w-5 h-5 text-gray-400" />
              <span className="font-medium">{getTecnico()}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" /> Agenda
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Data</span>
                <span className="font-medium">
                  {getData()}{getDiaSemana() ? ` • ${getDiaSemana()}` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Horário</span>
                <span className="font-medium">{getHorario()}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" /> Observações
            </h2>
            {getObservacao() ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Obs: </span>
                  {getObservacao()}
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Nenhuma observação registrada.</p>
            )}
          </Card>
        </div>
      </motion.div>
    </main>
  );
}