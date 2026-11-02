// src/components/features/ServicoForm.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/modals/Modal";
import { Spinner } from "@/components/ui/Spinner";
import {
  formularioServicoSchema,
  STEP_SCHEMAS,
  type FormularioSchema,
} from "@/lib/schemas";
import { useConfig } from "@/hooks/useConfig";
import { AdvancedAddressSearch } from "@/components/ui/AdvancedAddressSearch";
import {
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  NotepadText,
  Pin,
  ToolCase,
  User,
  Users,
  Pencil,
  Search,
  AlertCircle,
} from "lucide-react";
import type { FormularioServico, Servico } from "@/lib/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormularioServico) => void | Promise<void>;
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

// ─── Utilitários de Máscaras ───────────────────────────────────────────────
const maskPhone = (value: string = "") => {
  const v = value.replace(/\D/g, "");
  if (v.length <= 10)
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return v
    .replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
    .replace(/-$/, "")
    .slice(0, 15);
};

const maskCEP = (value: string = "") => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d{1,3})/, "$1-$2")
    .slice(0, 9);
};

const maskPlaca = (value: string = "") => {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
};

// ─── Definição das fases ───────────────────────────────────────────────────
type StepId = "servico" | "cliente" | "localizacao" | "revisao";

interface Step {
  id: StepId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: "servico",
    title: "Serviço",
    subtitle: "Técnico e horário",
    icon: <ToolCase className="w-4 h-4" />,
  },
  {
    id: "cliente",
    title: "Cliente",
    subtitle: "Contato e veículo",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "localizacao",
    title: "Local",
    subtitle: "Endereço do atendimento",
    icon: <Pin className="w-4 h-4" />,
  },
  {
    id: "revisao",
    title: "Revisão",
    subtitle: "Confirmação dos dados",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
];

// Remove máscaras antes de validar/enviar
const unmaskForm = (form: typeof INITIAL_FORM) => ({
  ...form,
  cliente: {
    ...form.cliente,
    contato: (form.cliente?.contato || "").replace(/\D/g, ""),
  },
  endereco: {
    ...form.endereco,
    cep: (form.endereco?.cep || "").replace(/\D/g, ""),
  },
});

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
  const [currentStep, setCurrentStep] = useState(0);

  const { options: configOptions, loading: configLoading } = useConfig();
  const [horariosOcupados, setHorariosOcupados] = useState<Set<string>>(
    new Set(),
  );

  // Busca de horários ocupados
  useEffect(() => {
    if (!form.tecnico || !form.data || form.data.length !== 10) {
      setHorariosOcupados(new Set());
      return;
    }
    let cancelled = false;
    const fetchOcupados = async () => {
      try {
        const url = new URL(
          "/api/servicos/horarios-ocupados",
          window.location.origin,
        );
        url.searchParams.set("tecnico", form.tecnico);
        url.searchParams.set("data", form.data);
        if (initialData?.id)
          url.searchParams.set("excludeId", String(initialData.id));

        const res = await fetch(url.toString(), { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && json.success)
          setHorariosOcupados(new Set<string>(json.data ?? []));
      } catch (err) {
        console.error("Erro ao buscar horários ocupados:", err);
      }
    };
    fetchOcupados();
    return () => {
      cancelled = true;
    };
  }, [form.tecnico, form.data, initialData?.id]);

  // Reset/População dos campos quando abre o modal ou muda o registro
  useEffect(() => {
    if (isOpen) {
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
            contato: maskPhone(initialData.cliente?.contato || ""),
          },
          veiculo: {
            placa: maskPlaca(initialData.veiculo?.placa || ""),
            marcaModelo: initialData.veiculo?.marcaModelo || "",
          },
          endereco: {
            rua: initialData.endereco?.rua || "",
            numero: initialData.endereco?.numero || "",
            bairro: initialData.endereco?.bairro || "",
            cidade: initialData.endereco?.cidade || "",
            estado: initialData.endereco?.estado || "",
            cep: maskCEP(initialData.endereco?.cep || ""),
          },
          observacao: initialData.observacao || "",
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setErrors({});
      setTouched({});
      setManualAddress(false);
      setCurrentStep(0);
    }
  }, [initialData, isOpen]);

  // Limpa horário se ficar ocupado após troca de data/técnico
  useEffect(() => {
    if (form.horario && horariosOcupados.has(form.horario)) {
      setForm((prev) => ({ ...prev, horario: "" }));
    }
  }, [horariosOcupados, form.horario]);

  // Atualização genérica de campos
  const updateField = useCallback(
    (section: string, field: string, value: string) => {
      setForm((prev) => {
        if (["cliente", "veiculo", "endereco"].includes(section)) {
          return {
            ...prev,
            [section]: {
              ...(prev[section as keyof typeof prev] as Record<string, string>),
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
    setTouched((prev) => ({
      ...prev,
      [field ? `${section}.${field}` : section]: true,
    }));
  };

  // Validação Isolada da Etapa Atual
  const validateCurrentStep = (): boolean => {
    if (currentStep >= STEPS.length - 1) return true;

    const unmasked = unmaskForm(form);
    const schemaForStep = STEP_SCHEMAS[currentStep];
    const result = schemaForStep.safeParse(unmasked);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      const newTouched: Record<string, boolean> = {};

      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        newErrors[path] = issue.message;
        newTouched[path] = true;
      });

      setErrors((prev) => ({ ...prev, ...newErrors }));
      setTouched((prev) => ({ ...prev, ...newTouched }));

      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField) {
        document
          .querySelector(`[data-field="${firstErrorField}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const goToStep = (index: number) => {
    if (index < currentStep || initialData || validateCurrentStep()) {
      setCurrentStep(index);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep < STEPS.length - 1) {
      nextStep();
      return;
    }
    if (isLoading) return;

    const unmasked = unmaskForm(form);
    const result = formularioServicoSchema.safeParse(unmasked);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      const newTouched: Record<string, boolean> = {};

      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        newErrors[path] = issue.message;
        newTouched[path] = true;
      });

      setErrors(newErrors);
      setTouched(newTouched);

      // Redireciona para a primeira etapa com erro
      const firstErrorField = Object.keys(newErrors)[0];
      if (firstErrorField) {
        if (
          firstErrorField.startsWith("tecnico") ||
          firstErrorField.startsWith("data") ||
          firstErrorField.startsWith("horario") ||
          firstErrorField.startsWith("tipoServico")
        ) {
          setCurrentStep(0);
        } else if (
          firstErrorField.startsWith("cliente") ||
          firstErrorField.startsWith("veiculo")
        ) {
          setCurrentStep(1);
        } else if (firstErrorField.startsWith("endereco")) {
          setCurrentStep(2);
        }
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

  const getFieldError = (field: string) =>
    touched[field] ? errors[field] : undefined;

  // Opções dos Selects
  const getOptions = (arr: any[], defaultLabel: string) =>
    configLoading
      ? [{ value: "", label: "Carregando..." }]
      : arr.length > 0
        ? [{ value: "", label: "Selecione..." }, ...arr]
        : [{ value: "", label: defaultLabel }];

  const tecnicosOptions = getOptions(configOptions.tecnicos, "Nenhum técnico");
  const tiposOptions = getOptions(configOptions.tiposServico, "Nenhum tipo");
  const statusOptions = configLoading
    ? [{ value: "", label: "Carregando..." }]
    : configOptions.status.length > 0
      ? configOptions.status
      : [{ value: "PENDENTE", label: "Pendente" }];

  const horariosOptions = configLoading
    ? [{ value: "", label: "Carregando...", disabled: false }]
    : configOptions.horarios.length > 0
      ? [
          { value: "", label: "Selecione...", disabled: false },
          ...configOptions.horarios.map((h) => ({
            ...h,
            label: horariosOcupados.has(h.value)
              ? `${h.label} (Indisponível)`
              : h.label,
            disabled: horariosOcupados.has(h.value),
          })),
        ]
      : [{ value: "", label: "Nenhum horário", disabled: false }];

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <NotepadText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-text">
              {initialData ? "Editar Ordem de Serviço" : "Novo Agendamento"}
            </h2>
            <p className="mt-0.5 text-xs font-medium text-text-muted">
              {initialData
                ? "Atualize as informações do atendimento"
                : "Preencha os dados em 4 etapas simples"}
            </p>
          </div>
        </div>
      }
      size="lg"
      closeOnOverlayClick={false}
    >
      {configLoading && (
        <div className="mb-5 flex animate-pulse items-center justify-center rounded-lg border border-border bg-bg-muted/60 p-3.5">
          <Spinner size="sm" variant="slate" />
          <span className="ml-2.5 text-xs font-medium text-text-muted">
            Sincronizando configurações...
          </span>
        </div>
      )}

      {/* Stepper de Progresso Visual */}
      <div className="relative mb-7 mt-1 px-1">
        <div
          className="absolute left-0 right-0 top-4 z-0 mx-6 h-0.5 -translate-y-1/2 bg-border"
          aria-hidden="true"
        />
        <div
          className="absolute left-0 top-4 z-0 h-0.5 -translate-y-1/2 bg-primary mx-6 transition-all duration-300 ease-in-out"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 88}%` }}
          aria-hidden="true"
        />

        <div
          className="relative z-10 flex justify-between"
          role="tablist"
          aria-label="Etapas do formulário"
        >
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isClickable = index <= currentStep || !!initialData;

            return (
              <button
                key={step.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className={`group flex flex-col items-center gap-1.5 rounded-lg p-1 outline-none transition-all focus-visible:ring-2 focus-visible:ring-text/50 focus-visible:ring-offset-2 ${
                  !isClickable
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "scale-110 border-primary bg-primary text-white ring-2 ring-primary/20"
                      : isCompleted
                        ? "border-primary bg-primary text-white hover:bg-primary/90"
                        : "border-border bg-bg-elevated text-text-muted group-hover:border-primary/50"
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`hidden text-[11px] transition-colors sm:block ${
                    isActive
                      ? "font-semibold text-primary"
                      : isCompleted
                        ? "font-medium text-text"
                        : "text-text-muted"
                  }`}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Conteúdo da Etapa */}
        <div
          key={currentStep}
          className="animate-in fade-in slide-in-from-right-3 duration-200 ease-out"
        >
          {/* Cabeçalho da Etapa Atual */}
          <div className="mb-4 flex items-center gap-3 border-b border-border pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary">
              {STEPS[currentStep].icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-text">
                Etapa {currentStep + 1}: {STEPS[currentStep].title}
              </h3>
              <p className="text-xs text-text-muted">
                {STEPS[currentStep].subtitle}
              </p>
            </div>
          </div>

          {/* ═══════════════ ETAPA 1: SERVIÇO ═══════════════ */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  label="Data do Atendimento"
                  value={formatToInputDate(form.data)}
                  onChange={(e) =>
                    updateField(
                      "data",
                      "",
                      formatToBrazilianDate(e.target.value),
                    )
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
                  onChange={(e) =>
                    updateField("tipoServico", "", e.target.value)
                  }
                  onBlur={() => handleBlur("tipoServico")}
                  options={tiposOptions}
                  error={getFieldError("tipoServico")}
                  disabled={configLoading}
                  required
                />
              </div>

              <div data-field="ordemServico">
                <Input
                  label="Número da OS (Opcional)"
                  placeholder="Ex: OS-2026-001"
                  value={form.ordemServico || ""}
                  onChange={(e) =>
                    updateField("ordemServico", "", e.target.value)
                  }
                  onBlur={() => handleBlur("ordemServico")}
                  error={getFieldError("ordemServico")}
                />
              </div>

              <div data-field="status">
                <Select
                  label="Status do Serviço"
                  value={form.status || "PENDENTE"}
                  onChange={(e) => updateField("status", "", e.target.value)}
                  onBlur={() => handleBlur("status")}
                  options={statusOptions}
                  error={getFieldError("status")}
                  disabled={configLoading}
                  required
                />
              </div>

              {/* Informação sobre ocupação de agenda */}
              {form.tecnico && form.data && horariosOcupados.size > 0 && (
                <div className="flex items-start gap-2.5 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 md:col-span-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <span className="font-semibold">
                      Horários indisponíveis:
                    </span>{" "}
                    O técnico selecionado já possui{" "}
                    <strong>{horariosOcupados.size}</strong> agendamento(s) para{" "}
                    {form.data} ({Array.from(horariosOcupados).join(", ")}).
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════ ETAPA 2: CLIENTE & VEÍCULO ═══════════════ */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Card Cliente */}
              <div className="space-y-4 rounded-lg border border-border bg-bg-elevated p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <User className="h-4 w-4" />
                  <h4>Dados do Cliente</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div data-field="cliente.nome">
                    <Input
                      label="Nome Completo"
                      placeholder="Ex: João da Silva"
                      value={form.cliente.nome}
                      onChange={(e) =>
                        updateField("cliente", "nome", e.target.value)
                      }
                      onBlur={() => handleBlur("cliente", "nome")}
                      error={getFieldError("cliente.nome")}
                      required
                    />
                  </div>
                  <div data-field="cliente.contato">
                    <Input
                      label="WhatsApp / Telefone"
                      placeholder="(85) 98888-8888"
                      value={form.cliente.contato}
                      onChange={(e) =>
                        updateField(
                          "cliente",
                          "contato",
                          maskPhone(e.target.value),
                        )
                      }
                      onBlur={() => handleBlur("cliente", "contato")}
                      error={getFieldError("cliente.contato")}
                      required
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>

              {/* Card Veículo */}
              <div className="space-y-4 rounded-lg border border-border bg-bg-elevated p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Car className="h-4 w-4" />
                  <h4>Identificação do Veículo</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div data-field="veiculo.placa">
                    <Input
                      label="Placa do Veículo"
                      placeholder="ABC1D23"
                      value={form.veiculo.placa}
                      onChange={(e) =>
                        updateField(
                          "veiculo",
                          "placa",
                          maskPlaca(e.target.value),
                        )
                      }
                      onBlur={() => handleBlur("veiculo", "placa")}
                      error={getFieldError("veiculo.placa")}
                      required
                      maxLength={7}
                    />
                  </div>
                  <div data-field="veiculo.marcaModelo">
                    <Input
                      label="Marca e Modelo"
                      placeholder="Ex: Honda Civic 2.0"
                      value={form.veiculo.marcaModelo}
                      onChange={(e) =>
                        updateField("veiculo", "marcaModelo", e.target.value)
                      }
                      onBlur={() => handleBlur("veiculo", "marcaModelo")}
                      error={getFieldError("veiculo.marcaModelo")}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ ETAPA 3: LOCALIZAÇÃO ═══════════════ */}
          {currentStep === 2 && (
            <div className="space-y-4 rounded-lg border border-border bg-bg-elevated p-4">
              <div className="flex flex-col justify-between gap-2 border-b border-border pb-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <MapPin className="h-4 w-4" />
                  <h4>Endereço de Atendimento</h4>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setManualAddress(!manualAddress)}
                  className="h-8 text-xs text-text-muted hover:text-text"
                >
                  {manualAddress ? (
                    <Search className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {manualAddress
                    ? "Usar Busca Automática por CEP"
                    : "Preencher Manualmente"}
                </Button>
              </div>

              {!manualAddress ? (
                <div className="mb-4">
                  <AdvancedAddressSearch
                    onAddressSelect={(a) => {
                      setForm((p) => ({
                        ...p,
                        endereco: {
                          ...p.endereco,
                          cep: maskCEP(a.cep),
                          rua: a.rua,
                          bairro: a.bairro,
                          cidade: a.cidade,
                          estado: a.estado,
                        },
                      }));
                    }}
                  />
                </div>
              ) : (
                <p className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Preenchimento manual ativo. Digite os dados do endereço
                  abaixo.
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div data-field="endereco.cep" className="md:col-span-4">
                  <Input
                    label="CEP"
                    placeholder="00000-000"
                    value={form.endereco.cep}
                    onChange={(e) =>
                      updateField("endereco", "cep", maskCEP(e.target.value))
                    }
                    onBlur={() => handleBlur("endereco", "cep")}
                    error={getFieldError("endereco.cep")}
                    required
                    disabled={!manualAddress}
                    maxLength={9}
                  />
                </div>
                <div data-field="endereco.rua" className="md:col-span-8">
                  <Input
                    label="Rua / Logradouro"
                    placeholder="Nome da rua ou avenida"
                    value={form.endereco.rua}
                    onChange={(e) =>
                      updateField("endereco", "rua", e.target.value)
                    }
                    onBlur={() => handleBlur("endereco", "rua")}
                    error={getFieldError("endereco.rua")}
                    required
                    disabled={!manualAddress && !!form.endereco.rua}
                  />
                </div>
                <div data-field="endereco.numero" className="md:col-span-4">
                  <Input
                    label="Número"
                    placeholder="123 ou SN"
                    value={form.endereco.numero}
                    onChange={(e) =>
                      updateField("endereco", "numero", e.target.value)
                    }
                    onBlur={() => handleBlur("endereco", "numero")}
                    error={getFieldError("endereco.numero")}
                    required
                  />
                </div>
                <div data-field="endereco.bairro" className="md:col-span-8">
                  <Input
                    label="Bairro"
                    placeholder="Nome do bairro"
                    value={form.endereco.bairro}
                    onChange={(e) =>
                      updateField("endereco", "bairro", e.target.value)
                    }
                    onBlur={() => handleBlur("endereco", "bairro")}
                    error={getFieldError("endereco.bairro")}
                    required
                    disabled={!manualAddress && !!form.endereco.bairro}
                  />
                </div>
                <div data-field="endereco.cidade" className="md:col-span-8">
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
                    disabled={!manualAddress && !!form.endereco.cidade}
                  />
                </div>
                <div data-field="endereco.estado" className="md:col-span-4">
                  <Input
                    label="UF"
                    placeholder="CE"
                    maxLength={2}
                    value={form.endereco.estado}
                    onChange={(e) =>
                      updateField(
                        "endereco",
                        "estado",
                        e.target.value.toUpperCase(),
                      )
                    }
                    onBlur={() => handleBlur("endereco", "estado")}
                    error={getFieldError("endereco.estado")}
                    required
                    disabled={!manualAddress && !!form.endereco.estado}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ ETAPA 4: REVISÃO ═══════════════ */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Resumo: Serviço */}
                <div className="relative rounded-lg border border-border bg-bg-muted/40 p-4">
                  <button
                    type="button"
                    onClick={() => goToStep(0)}
                    className="absolute right-3 top-3 p-1 text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 rounded"
                    title="Editar Atendimento"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <span className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <ToolCase className="h-3.5 w-3.5 text-primary" /> Serviço
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Técnico:</span>
                      <span className="font-semibold text-text">
                        {form.tecnico}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Agendamento:</span>
                      <span className="font-semibold text-text">
                        {form.data} às {form.horario}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Tipo:</span>
                      <span className="font-semibold text-text">
                        {form.tipoServico}
                      </span>
                    </div>
                    {form.ordemServico && (
                      <div className="flex justify-between">
                        <span className="text-text-muted">OS:</span>
                        <span className="font-mono font-medium text-text">
                          {form.ordemServico}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo: Cliente & Veículo */}
                <div className="relative rounded-lg border border-border bg-bg-muted/40 p-4">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="absolute right-3 top-3 p-1 text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 rounded"
                    title="Editar Cliente"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <span className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <Users className="h-3.5 w-3.5 text-primary" /> Cliente &
                    Veículo
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Nome:</span>
                      <span className="max-w-37.5 truncate font-semibold text-text">
                        {form.cliente.nome}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Contato:</span>
                      <span className="font-semibold text-text">
                        {form.cliente.contato}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Placa:</span>
                      <span className="font-mono font-bold uppercase text-text">
                        {form.veiculo.placa}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Modelo:</span>
                      <span className="font-semibold text-text">
                        {form.veiculo.marcaModelo}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumo: Localização */}
                <div className="relative rounded-lg border border-border bg-bg-muted/40 p-4 md:col-span-2">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="absolute right-3 top-3 p-1 text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 rounded"
                    title="Editar Local"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <span className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Endereço
                  </span>
                  <p className="text-xs font-semibold text-text">
                    {form.endereco.rua}, {form.endereco.numero}
                  </p>
                  <p className="text-xs text-text-muted">
                    {form.endereco.bairro} - {form.endereco.cidade}/
                    {form.endereco.estado} (CEP: {form.endereco.cep})
                  </p>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2 rounded-lg border border-border bg-bg-elevated p-4">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                  <NotepadText className="h-3.5 w-3.5 text-primary" />{" "}
                  Observações Gerais (Opcional)
                </label>
                <textarea
                  className="w-full resize-none rounded-md border border-border bg-bg-muted/30 p-3 text-xs text-text outline-none transition-colors placeholder:text-text-muted/50 focus:border-text focus:outline-none focus:ring-2 focus:ring-text/30"
                  placeholder="Instruções adicionais, pontos de referência..."
                  value={form.observacao || ""}
                  onChange={(e) =>
                    updateField("observacao", "", e.target.value)
                  }
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════ FOOTER / BOTÕES ═══════════════ */}
        <div className="mt-5 flex flex-col-reverse justify-between gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={currentStep === 0 ? onClose : prevStep}
            disabled={isLoading}
            icon={currentStep === 0 ? undefined : ChevronLeft}
            className="w-full sm:w-auto"
          >
            {currentStep === 0 ? "Cancelar" : "Anterior"}
          </Button>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {!isLastStep ? (
              <Button
                key="btn-next"
                type="button"
                variant="primary"
                onClick={nextStep}
                disabled={configLoading}
                className="w-full px-6 sm:w-auto"
              >
                Próximo <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                key="btn-submit"
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={configLoading}
                icon={isLoading ? undefined : CheckCircle2}
                className="w-full px-6 sm:w-auto"
              >
                {isLoading
                  ? "Salvando..."
                  : initialData
                    ? "Salvar Alterações"
                    : "Confirmar Agendamento"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
