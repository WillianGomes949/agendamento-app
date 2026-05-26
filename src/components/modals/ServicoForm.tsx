// src/components/features/ServicoForm.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/modals/Modal";
import { Spinner } from "@/components/ui/Spinner";
import type { Servico } from "@/lib/types";
import { formularioServicoSchema, type FormularioSchema } from "@/lib/schemas";
import { useConfig } from "@/hooks/useConfig";
import { AdvancedAddressSearch } from "@/components/ui/AdvancedAddressSearch";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormularioSchema & { status?: string }) => void;
  initialData?: Servico | null;
  isLoading?: boolean;
}

const INITIAL_FORM: FormularioSchema & { status?: string } = {
  tecnico: "",
  data: "",
  horario: "",
  tipoServico: "",
  status: "PENDENTE",
  ordemServico: null,
  cliente: { nome: "", contato: "" },
  veiculo: { placa: "", marcaModelo: "" },
  endereco: {
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  },
  observacao: "",
};

// Componente para seções com título
const FormSection = ({ 
  title, 
  icon, 
  children 
}: { 
  title: string; 
  icon?: string; 
  children: React.ReactNode;
}) => (
  <div className="bg-gray-50/50 rounded-xl p-5 space-y-4 transition-all">
    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
      {icon && <span className="text-lg">{icon}</span>}
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

// Componente para helper text com tooltip visual
const HelperText = ({ text }: { text: string }) => (
  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {text}
  </p>
);

export default function ServicoForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [manualAddress, setManualAddress] = useState(false);

  const { options: configOptions, loading: configLoading } = useConfig();

  useEffect(() => {
    if (initialData) {
      setForm({
        tecnico: initialData.tecnico || "",
        data: initialData.data || "",
        horario: initialData.horario || "",
        tipoServico: initialData.tipoServico || "",
        status: initialData.status || "PENDENTE",
        ordemServico: initialData.ordemServico || null,
        cliente: {
          nome: initialData.cliente?.nome || "",
          contato: initialData.cliente?.contato || "",
        },
        veiculo: {
          placa: initialData.veiculo?.placa || "",
          marcaModelo: initialData.veiculo?.marcaModelo || "",
        },
        endereco: {
          rua: initialData.endereco?.rua || "",
          numero: initialData.endereco?.numero || "",
          bairro: initialData.endereco?.bairro || "",
          cidade: initialData.endereco?.cidade || "",
          estado: initialData.endereco?.estado || "",
          cep: initialData.endereco?.cep || "",
        },
        observacao: initialData.observacao || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
    setTouched({});
    setManualAddress(false);
  }, [initialData, isOpen]);

  const updateField = useCallback(
    (section: string, field: string, value: string) => {
      setForm((prev) => {
        if (section === "cliente" || section === "veiculo" || section === "endereco") {
          return {
            ...prev,
            [section]: {
              ...prev[section as keyof typeof prev],
              [field]: value,
            },
          };
        }
        return { ...prev, [section]: value };
      });

      const errorKey = field ? `${section}.${field}` : section;
      if (touched[errorKey]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[errorKey];
          return next;
        });
      }
    },
    [touched],
  );

  const handleBlur = (section: string, field?: string) => {
    const errorKey = field ? `${section}.${field}` : section;
    setTouched((prev) => ({ ...prev, [errorKey]: true }));
  };

  const handleCepFound = useCallback((enderecoData: {
    rua: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        rua: enderecoData.rua,
        bairro: enderecoData.bairro,
        cidade: enderecoData.cidade,
        estado: enderecoData.estado,
        cep: enderecoData.cep,
      },
    }));
    setManualAddress(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marcar todos os campos como touched
    const allFields = [
      "tecnico", "data", "horario", "tipoServico", "status",
      "cliente.nome", "cliente.contato",
      "veiculo.placa", "veiculo.marcaModelo",
      "endereco.rua", "endereco.numero", "endereco.bairro",
      "endereco.cidade", "endereco.estado", "endereco.cep"
    ];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach(field => { newTouched[field] = true; });
    setTouched(newTouched);

    const result = formularioServicoSchema.safeParse(form);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path.join(".")] = issue.message;
      });
      setErrors(newErrors);
      
      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[data-field="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    onSubmit({ ...result.data, status: form.status });
  };

  const formatToInputDate = (dateBR: string) => {
    if (!dateBR || !dateBR.includes("/")) return dateBR;
    const [dia, mes, ano] = dateBR.split("/");
    return `${ano}-${mes}-${dia}`;
  };

  const formatToBrazilianDate = (dateISO: string) => {
    if (!dateISO || !dateISO.includes("-")) return dateISO;
    const [ano, mes, dia] = dateISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const getFieldError = (field: string) => touched[field] ? errors[field] : undefined;

  // Preparar opções
  const tecnicosOptions = configLoading
    ? [{ value: "", label: "Carregando técnicos..." }]
    : configOptions.tecnicos.length > 0
      ? [{ value: "", label: "Selecione um técnico" }, ...configOptions.tecnicos]
      : [{ value: "", label: "Nenhum técnico disponível" }];
  
  const tiposOptions = configLoading
    ? [{ value: "", label: "Carregando serviços..." }]
    : configOptions.tiposServico.length > 0
      ? [{ value: "", label: "Selecione um tipo de serviço" }, ...configOptions.tiposServico]
      : [{ value: "", label: "Nenhum tipo disponível" }];
  
  const horariosOptions = configLoading
    ? [{ value: "", label: "Carregando horários..." }]
    : configOptions.horarios.length > 0
      ? [{ value: "", label: "Selecione um horário" }, ...configOptions.horarios]
      : [{ value: "", label: "Nenhum horário disponível" }];
  
  const statusOptions = configLoading
    ? [{ value: "", label: "Carregando status..." }]
    : configOptions.status.length > 0
      ? configOptions.status
      : [{ value: "PENDENTE", label: "Pendente" }];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? "Editar Serviço" : "Novo Agendamento"}
            </h2>
            <p className="text-sm text-gray-500">
              {initialData ? "Atualize as informações do serviço" : "Preencha os dados para criar um novo atendimento"}
            </p>
          </div>
        </div>
      }
      size="lg"
      closeOnOverlayClick={!isLoading}
    >
      {configLoading && (
        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
          <Spinner size="md" variant="primary" />
          <span className="ml-3 text-gray-600">Carregando opções de configuração...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção: Informações do Serviço */}
        <FormSection title="Informações do Serviço" icon="🔧">
          <div data-field="tecnico">
            <Select
              label="Técnico Responsável"
              helperText="Selecione o profissional que executará o serviço"
              placeholder="Selecione um técnico"
              value={form.tecnico}
              onChange={(e) => updateField("tecnico", "", e.target.value)}
              onBlur={() => handleBlur("tecnico")}
              options={tecnicosOptions}
              error={getFieldError("tecnico")}
              disabled={configLoading}
              required
            />
          </div>

          <div data-field="data">
            <Input
              type="date"
              label="Data do Serviço"
              helperText="Data prevista para realização"
              value={formatToInputDate(form.data)}
              onChange={(e) => updateField("data", "", formatToBrazilianDate(e.target.value))}
              onBlur={() => handleBlur("data")}
              error={getFieldError("data")}
              required
            />
          </div>

          <div data-field="horario">
            <Select
              label="Horário"
              helperText="Horário de início do atendimento"
              placeholder="Selecione um horário"
              value={form.horario}
              onChange={(e) => updateField("horario", "", e.target.value)}
              onBlur={() => handleBlur("horario")}
              options={horariosOptions}
              error={getFieldError("horario")}
              disabled={configLoading}
              required
            />
          </div>

          <div data-field="tipoServico">
            <Select
              label="Tipo de Serviço"
              helperText="Categoria do serviço a ser executado"
              placeholder="Selecione um tipo"
              value={form.tipoServico}
              onChange={(e) => updateField("tipoServico", "", e.target.value)}
              onBlur={() => handleBlur("tipoServico")}
              options={tiposOptions}
              error={getFieldError("tipoServico")}
              disabled={configLoading}
              required
            />
          </div>

          <div data-field="status">
            <Select
              label="Status do Agendamento"
              helperText="Situação atual do serviço"
              value={form.status || "PENDENTE"}
              onChange={(e) => updateField("status", "", e.target.value)}
              onBlur={() => handleBlur("status")}
              options={statusOptions}
              error={getFieldError("status")}
              disabled={configLoading}
              required
            />
          </div>

          <div data-field="ordemServico">
            <Input
              label="Ordem de Serviço"
              helperText="Número da OS interna (opcional)"
              placeholder="Ex: OS-2024-001"
              value={form.ordemServico || ""}
              onChange={(e) => updateField("ordemServico", "", e.target.value)}
              error={getFieldError("ordemServico")}
            />
          </div>
        </FormSection>

        {/* Seção: Cliente */}
        <FormSection title="Dados do Cliente" icon="👤">
          <div data-field="cliente.nome" className="md:col-span-2">
            <Input
              label="Nome Completo"
              helperText="Nome do cliente para identificação"
              placeholder="Digite o nome completo"
              value={form.cliente.nome}
              onChange={(e) => updateField("cliente", "nome", e.target.value)}
              onBlur={() => handleBlur("cliente", "nome")}
              error={getFieldError("cliente.nome")}
              required
            />
          </div>

          <div data-field="cliente.contato">
            <Input
              label="Telefone / WhatsApp"
              helperText="DDD + número (apenas números)"
              placeholder="11999999999"
              value={form.cliente.contato}
              onChange={(e) => updateField("cliente", "contato", e.target.value.replace(/\D/g, ""))}
              onBlur={() => handleBlur("cliente", "contato")}
              error={getFieldError("cliente.contato")}
              required
            />
            <HelperText text="10 ou 11 dígitos com DDD" />
          </div>
        </FormSection>

        {/* Seção: Veículo */}
        <FormSection title="Dados do Veículo" icon="🚗">
          <div data-field="veiculo.placa">
            <Input
              label="Placa"
              helperText="Sem traços ou espaços"
              placeholder="ABC1D23"
              value={form.veiculo.placa}
              onChange={(e) => updateField("veiculo", "placa", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))}
              onBlur={() => handleBlur("veiculo", "placa")}
              error={getFieldError("veiculo.placa")}
              required
            />
          </div>

          <div data-field="veiculo.marcaModelo">
            <Input
              label="Marca e Modelo"
              helperText="Ex: Honda Civic, Fiat Strada"
              placeholder="Marca / Modelo"
              value={form.veiculo.marcaModelo}
              onChange={(e) => updateField("veiculo", "marcaModelo", e.target.value)}
              onBlur={() => handleBlur("veiculo", "marcaModelo")}
              error={getFieldError("veiculo.marcaModelo")}
              required
            />
          </div>
        </FormSection>

        {/* Seção: Endereço com Busca de CEP */}
        <div className="bg-gray-50/50 rounded-xl p-5 space-y-4 transition-all">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <h3 className="font-semibold text-gray-800">Endereço de Atendimento</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setManualAddress(!manualAddress)}
              className="text-sm"
            >
              {manualAddress ? "Buscar por CEP" : "Preencher manualmente"}
            </Button>
          </div>

          {!manualAddress ? (
            <AdvancedAddressSearch
  onAddressSelect={(address) => {
    setForm((prev) => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        cep: address.cep,
        rua: address.rua,
        bairro: address.bairro,
        cidade: address.cidade,
        estado: address.estado,
      },
    }));
  }}
/>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Preenchendo endereço manualmente
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-field="endereco.cep" className="md:col-span-2">
              <Input
                label="CEP"
                helperText="Apenas números"
                placeholder="00000000"
                value={form.endereco.cep}
                onChange={(e) => updateField("endereco", "cep", e.target.value.replace(/\D/g, "").slice(0, 8))}
                onBlur={() => handleBlur("endereco", "cep")}
                error={getFieldError("endereco.cep")}
                required
                disabled={!manualAddress}
              />
            </div>

            <div data-field="endereco.rua" className="md:col-span-2">
              <Input
                label="Logradouro"
                placeholder="Rua, Avenida, Alameda..."
                value={form.endereco.rua}
                onChange={(e) => updateField("endereco", "rua", e.target.value)}
                onBlur={() => handleBlur("endereco", "rua")}
                error={getFieldError("endereco.rua")}
                required
                disabled={!manualAddress && form.endereco.cep.length === 8}
              />
            </div>

            <div data-field="endereco.numero">
              <Input
                label="Número"
                placeholder="123 ou S/N"
                value={form.endereco.numero}
                onChange={(e) => updateField("endereco", "numero", e.target.value)}
                onBlur={() => handleBlur("endereco", "numero")}
                error={getFieldError("endereco.numero")}
                required
              />
            </div>

            <div data-field="endereco.bairro">
              <Input
                label="Bairro"
                placeholder="Centro, Jardins..."
                value={form.endereco.bairro}
                onChange={(e) => updateField("endereco", "bairro", e.target.value)}
                onBlur={() => handleBlur("endereco", "bairro")}
                error={getFieldError("endereco.bairro")}
                required
                disabled={!manualAddress && form.endereco.cep.length === 8}
              />
            </div>

            <div data-field="endereco.cidade">
              <Input
                label="Cidade"
                placeholder="São Paulo"
                value={form.endereco.cidade}
                onChange={(e) => updateField("endereco", "cidade", e.target.value)}
                onBlur={() => handleBlur("endereco", "cidade")}
                error={getFieldError("endereco.cidade")}
                required
                disabled={!manualAddress && form.endereco.cep.length === 8}
              />
            </div>

            <div data-field="endereco.estado">
              <Input
                label="UF"
                placeholder="SP"
                maxLength={2}
                value={form.endereco.estado}
                onChange={(e) => updateField("endereco", "estado", e.target.value.toUpperCase().slice(0, 2))}
                onBlur={() => handleBlur("endereco", "estado")}
                error={getFieldError("endereco.estado")}
                required
                disabled={!manualAddress && form.endereco.cep.length === 8}
              />
            </div>
          </div>
        </div>

        {/* Seção: Observações */}
        <div className="bg-gray-50/50 rounded-xl p-5">
          <div className="flex items-center gap-2 pb-3">
            <span className="text-lg">📝</span>
            <h3 className="font-semibold text-gray-800">Informações Adicionais</h3>
          </div>
          <div>
            <textarea
              className={`w-full p-3 border rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.observacao ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Digite observações relevantes sobre o serviço..."
              value={form.observacao || ""}
              onChange={(e) => updateField("observacao", "", e.target.value)}
              rows={4}
            />
            <HelperText text="Informações adicionais que possam auxiliar no atendimento (opcional)" />
          </div>
        </div>

        {/* Ações do Formulário */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={configLoading}
            className="px-6"
          >
            {isLoading ? "Salvando..." : initialData ? "Salvar Alterações" : "Criar Serviço"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}