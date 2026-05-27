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
import { Car, Notebook, NotepadText, Pin, ToolCase, User } from "lucide-react";

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

const FormSection = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 sm:p-6 space-y-5 transition-all">
    <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-slate-200/50 flex items-center justify-center text-slate-600">
          {icon}
        </div>
      )}
      <h3 className="font-bold text-slate-900 text-base">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
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
      const extrairHorario = (h?: string) => {
        if (!h) return "";
        const m = h.match(/(\d{2}):(\d{2})/);
        return m ? `${m[1]}:${m[2]}` : h;
      };
      setForm({
        tecnico: initialData.tecnico || "",
        data: initialData.data || "",
        horario: extrairHorario(initialData.horario),
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
        if (
          section === "cliente" ||
          section === "veiculo" ||
          section === "endereco"
        ) {
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
      if (touched[errorKey])
        setErrors((prev) => {
          const next = { ...prev };
          delete next[errorKey];
          return next;
        });
    },
    [touched],
  );

  const handleBlur = (section: string, field?: string) => {
    setTouched((prev) => ({
      ...prev,
      [field ? `${section}.${field}` : section]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allFields = [
      "tecnico",
      "data",
      "horario",
      "tipoServico",
      "status",
      "cliente.nome",
      "cliente.contato",
      "veiculo.placa",
      "veiculo.marcaModelo",
      "endereco.rua",
      "endereco.numero",
      "endereco.bairro",
      "endereco.cidade",
      "endereco.estado",
      "endereco.cep",
    ];
    const newTouched: Record<string, boolean> = {};
    allFields.forEach((f) => {
      newTouched[f] = true;
    });
    setTouched(newTouched);

    const result = formularioServicoSchema.safeParse(form);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path.join(".")] = issue.message;
      });
      setErrors(newErrors);
      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField)
        document
          .querySelector(`[data-field="${firstErrorField}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const getFieldError = (field: string) =>
    touched[field] ? errors[field] : undefined;

  const tecnicosOptions = configLoading
    ? [{ value: "", label: "Carregando..." }]
    : configOptions.tecnicos.length > 0
      ? [{ value: "", label: "Selecione..." }, ...configOptions.tecnicos]
      : [{ value: "", label: "Nenhum técnico" }];
  const tiposOptions = configLoading
    ? [{ value: "", label: "Carregando..." }]
    : configOptions.tiposServico.length > 0
      ? [{ value: "", label: "Selecione..." }, ...configOptions.tiposServico]
      : [{ value: "", label: "Nenhum tipo" }];
  const horariosOptions = configLoading
    ? [{ value: "", label: "Carregando..." }]
    : configOptions.horarios.length > 0
      ? [{ value: "", label: "Selecione..." }, ...configOptions.horarios]
      : [{ value: "", label: "Nenhum horário" }];
  const statusOptions = configLoading
    ? [{ value: "", label: "Carregando..." }]
    : configOptions.status.length > 0
      ? configOptions.status
      : [{ value: "PENDENTE", label: "Pendente" }];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
            <NotepadText className="w-4 h-4 text-slate-50"/>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {initialData ? "Editar Serviço" : "Novo Agendamento"}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {initialData
                ? "Atualize as informações do OS"
                : "Preencha os dados do novo atendimento"}
            </p>
          </div>
        </div>
      }
      size="lg"
      closeOnOverlayClick={!isLoading}
    >
      {configLoading && (
        <div className="flex items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
          <Spinner size="md" variant="slate" />
          <span className="ml-3 text-sm font-medium text-slate-600">
            Carregando configurações...
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection
          title="Informações Gerais"
          icon={<span className="text-lg leading-none"><ToolCase className="w-4 h-4"/></span>}
        >
          <div data-field="tecnico">
            <Select
              label="Técnico Responsável"
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
              value={formatToInputDate(form.data)}
              onChange={(e) =>
                updateField("data", "", formatToBrazilianDate(e.target.value))
              }
              onBlur={() => handleBlur("data")}
              error={getFieldError("data")}
              required
            />
          </div>
          <div data-field="horario">
            <Select
              label="Horário Previsto"
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
              label="Status Atual"
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
              label="Ordem de Serviço (OS)"
              placeholder="Ex: OS-2024-001"
              value={form.ordemServico || ""}
              onChange={(e) => updateField("ordemServico", "", e.target.value)}
              error={getFieldError("ordemServico")}
            />
          </div>
        </FormSection>

        <FormSection
          title="Dados do Cliente"
          icon={<span className="text-lg leading-none"><User className="w-4 h-4"/></span>}
        >
          <div data-field="cliente.nome" className="md:col-span-2">
            <Input
              label="Nome Completo"
              placeholder="Digite o nome do cliente"
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
              placeholder="(00) 00000-0000"
              value={form.cliente.contato}
              onChange={(e) =>
                updateField(
                  "cliente",
                  "contato",
                  e.target.value.replace(/\D/g, ""),
                )
              }
              onBlur={() => handleBlur("cliente", "contato")}
              error={getFieldError("cliente.contato")}
              required
              helperText="Apenas números com DDD"
            />
          </div>
        </FormSection>

        <FormSection
          title="Veículo"
          icon={<span className="text-lg leading-none"><Car className="w-4 h-4"/></span>}
        >
          <div data-field="veiculo.placa">
            <Input
              label="Placa"
              placeholder="ABC1D23"
              value={form.veiculo.placa}
              onChange={(e) =>
                updateField(
                  "veiculo",
                  "placa",
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 7),
                )
              }
              onBlur={() => handleBlur("veiculo", "placa")}
              error={getFieldError("veiculo.placa")}
              required
            />
          </div>
          <div data-field="veiculo.marcaModelo">
            <Input
              label="Marca / Modelo"
              placeholder="Ex: Honda Civic"
              value={form.veiculo.marcaModelo}
              onChange={(e) =>
                updateField("veiculo", "marcaModelo", e.target.value)
              }
              onBlur={() => handleBlur("veiculo", "marcaModelo")}
              error={getFieldError("veiculo.marcaModelo")}
              required
            />
          </div>
        </FormSection>

        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 sm:p-6 space-y-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200/50 flex items-center justify-center text-slate-600">
                <span className="text-lg leading-none"><Pin className="w-4 h-4"/></span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Localização
              </h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setManualAddress(!manualAddress)}
              className="text-sm font-semibold self-start sm:self-auto"
            >
              {manualAddress
                ? "Buscar por CEP automático"
                : "Digitar endereço manual"}
            </Button>
          </div>

          {!manualAddress ? (
            <AdvancedAddressSearch
              onAddressSelect={(a) => {
                setForm((p) => ({
                  ...p,
                  endereco: {
                    ...p.endereco,
                    cep: a.cep,
                    rua: a.rua,
                    bairro: a.bairro,
                    cidade: a.cidade,
                    estado: a.estado,
                  },
                }));
              }}
            />
          ) : (
            <p className="text-sm font-medium text-slate-500">
              Modo de preenchimento manual ativado.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div data-field="endereco.cep" className="md:col-span-2">
              <Input
                label="CEP"
                placeholder="00000000"
                value={form.endereco.cep}
                onChange={(e) =>
                  updateField(
                    "endereco",
                    "cep",
                    e.target.value.replace(/\D/g, "").slice(0, 8),
                  )
                }
                onBlur={() => handleBlur("endereco", "cep")}
                error={getFieldError("endereco.cep")}
                required
                disabled={!manualAddress}
              />
            </div>
            <div data-field="endereco.rua" className="md:col-span-2">
              <Input
                label="Logradouro"
                placeholder="Ex: Av. Paulista"
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
                onChange={(e) =>
                  updateField("endereco", "numero", e.target.value)
                }
                onBlur={() => handleBlur("endereco", "numero")}
                error={getFieldError("endereco.numero")}
                required
              />
            </div>
            <div data-field="endereco.bairro">
              <Input
                label="Bairro"
                placeholder="Centro"
                value={form.endereco.bairro}
                onChange={(e) =>
                  updateField("endereco", "bairro", e.target.value)
                }
                onBlur={() => handleBlur("endereco", "bairro")}
                error={getFieldError("endereco.bairro")}
                required
                disabled={!manualAddress && form.endereco.cep.length === 8}
              />
            </div>
            <div data-field="endereco.cidade">
              <Input
                label="Cidade"
                placeholder="Fortaleza"
                value={form.endereco.cidade}
                onChange={(e) =>
                  updateField("endereco", "cidade", e.target.value)
                }
                onBlur={() => handleBlur("endereco", "cidade")}
                error={getFieldError("endereco.cidade")}
                required
                disabled={!manualAddress && form.endereco.cep.length === 8}
              />
            </div>
            <div data-field="endereco.estado">
              <Input
                label="UF"
                placeholder="CE"
                maxLength={2}
                value={form.endereco.estado}
                onChange={(e) =>
                  updateField(
                    "endereco",
                    "estado",
                    e.target.value.toUpperCase().slice(0, 2),
                  )
                }
                onBlur={() => handleBlur("endereco", "estado")}
                error={getFieldError("endereco.estado")}
                required
                disabled={!manualAddress && form.endereco.cep.length === 8}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
            <div className="w-8 h-8 rounded-lg bg-slate-200/50 flex items-center justify-center text-slate-600">
              <span className="text-lg leading-none"><Notebook className="w-4 h-4"/></span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">Observações</h3>
          </div>
          <textarea
            className={`w-full p-4 rounded-xl text-sm outline-none transition-all focus:ring-4 focus:ring-slate-100 focus:border-slate-900 resize-none shadow-sm ${
              errors.observacao
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-white"
            }`}
            placeholder="Detalhes adicionais, referências de endereço ou instruções específicas..."
            value={form.observacao || ""}
            onChange={(e) => updateField("observacao", "", e.target.value)}
            rows={4}
          />
        </div>

        {/* Footers em modais no Mobile devem empilhar os botões */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={configLoading}
            className="w-full sm:w-auto"
          >
            {isLoading
              ? "Salvando..."
              : initialData
                ? "Salvar Alterações"
                : "Criar Serviço"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
