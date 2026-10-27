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
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary shrink-0">
            <NotepadText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text tracking-tight">
              {initialData ? "Editar Ordem de Serviço" : "Novo Agendamento"}
            </h2>
            <p className="text-xs font-medium text-text-muted mt-0.5">
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
        <div className="flex items-center justify-center p-3.5 bg-bg-muted/60 rounded-xl border border-border mb-6 animate-pulse">
          <Spinner size="sm" variant="slate" />
          <span className="ml-2.5 text-xs font-medium text-text-muted">
            Sincronizando configurações...
          </span>
        </div>
      )}

      {/* Stepper de Progresso Visual */}
      <div className="relative mb-8 mt-1 px-1">
        <div
          className="absolute top-4 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0 mx-6"
          aria-hidden="true"
        />
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 mx-6 transition-all duration-300 ease-in-out"
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
                className={`flex flex-col items-center gap-1.5 group outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg p-1 transition-all ${
                  !isClickable
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-200 shadow-sm ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground scale-110 ring-4 ring-primary/15"
                      : isCompleted
                        ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-bg-elevated border-border text-text-muted group-hover:border-primary/50"
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-[11px] font-semibold hidden sm:block transition-colors ${
                    isActive
                      ? "text-primary font-bold"
                      : isCompleted
                        ? "text-text font-medium"
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

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Conteúdo da Etapa */}
        <div
          key={currentStep}
          className="animate-in fade-in slide-in-from-right-3 duration-200 ease-out"
        >
          {/* Cabeçalho da Etapa Atual */}
          <div className="mb-5 flex items-center gap-3 pb-3 border-b border-border/60">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold">
              {STEPS[currentStep].icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-text">
                Etapa {currentStep + 1}: {STEPS[currentStep].title}
              </h3>
              <p className="text-xs text-text-muted">
                {STEPS[currentStep].subtitle}
              </p>
            </div>
          </div>

          {/* ═══════════════ ETAPA 1: SERVIÇO ═══════════════ */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="md:col-span-2 flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
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
            <div className="space-y-5">
              {/* Card Cliente */}
              <div className="bg-bg-elevated border border-border rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <User className="w-4 h-4" />
                  <h4>Dados do Cliente</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="bg-bg-elevated border border-border rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Car className="w-4 h-4" />
                  <h4>Identificação do Veículo</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="bg-bg-elevated border border-border rounded-xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <MapPin className="w-4 h-4" />
                  <h4>Endereço de Atendimento</h4>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setManualAddress(!manualAddress)}
                  className="text-xs h-8 text-text-muted hover:text-text"
                >
                  {manualAddress ? (
                    <Search className="w-3.5 h-3.5 mr-1.5" />
                  ) : (
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
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
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Preenchimento manual ativo. Digite os dados do endereço
                  abaixo.
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resumo: Serviço */}
                <div className="bg-bg-muted/50 border border-border rounded-xl p-4 relative">
                  <button
                    type="button"
                    onClick={() => goToStep(0)}
                    className="absolute top-3 right-3 p-1 text-text-muted hover:text-primary transition-colors"
                    title="Editar Atendimento"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-text-muted flex items-center gap-1.5 mb-2.5">
                    <ToolCase className="w-3.5 h-3.5 text-primary" /> Serviço
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
                <div className="bg-bg-muted/50 border border-border rounded-xl p-4 relative">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="absolute top-3 right-3 p-1 text-text-muted hover:text-primary transition-colors"
                    title="Editar Cliente"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-text-muted flex items-center gap-1.5 mb-2.5">
                    <Users className="w-3.5 h-3.5 text-primary" /> Cliente &
                    Veículo
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Nome:</span>
                      <span className="font-semibold text-text truncate max-w-37.5">
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
                      <span className="font-mono font-bold text-text uppercase">
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
                <div className="bg-bg-muted/50 border border-border rounded-xl p-4 relative md:col-span-2">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="absolute top-3 right-3 p-1 text-text-muted hover:text-primary transition-colors"
                    title="Editar Local"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-text-muted flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Endereço
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
              <div className="bg-bg-elevated border border-border rounded-xl p-4 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <NotepadText className="w-3.5 h-3.5 text-primary" />{" "}
                  Observações Gerais (Opcional)
                </label>
                <textarea
                  className="w-full p-3 rounded-lg text-xs outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-bg-muted text-text border border-border"
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
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-5 border-t border-border mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={currentStep === 0 ? onClose : prevStep}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {currentStep === 0 ? (
              "Cancelar"
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </>
            )}
          </Button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {!isLastStep ? (
              <Button
                key="btn-next"
                type="button"
                variant="primary"
                onClick={nextStep}
                disabled={configLoading}
                className="w-full sm:w-auto px-7"
              >
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                key="btn-submit"
                type="submit"
                variant="primary"
                isLoading={isLoading}
                disabled={configLoading}
                className="w-full sm:w-auto px-7 shadow-sm"
              >
                {isLoading
                  ? "Salvando..."
                  : initialData
                    ? "Salvar Alterações"
                    : "Confirmar Agendamento"}
                {!isLoading && <CheckCircle2 className="w-4 h-4 ml-1.5" />}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
