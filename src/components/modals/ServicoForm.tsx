"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/modals/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { formularioServicoSchema, type FormularioSchema } from "@/lib/schemas";
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
const maskPhone = (value: string) => {
  const v = value.replace(/\D/g, "");
  if (v.length <= 10)
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  return v
    .replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
    .replace(/-$/, "")
    .slice(0, 15);
};

const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d{1,3})/, "$1-$2")
    .slice(0, 9);
};

const maskPlaca = (value: string) => {
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
  fields: string[];
}

const STEPS: Step[] = [
  {
    id: "servico",
    title: "Serviço",
    subtitle: "Dados do atendimento",
    icon: <ToolCase className="w-4 h-4" />,
    fields: [
      "tecnico",
      "data",
      "horario",
      "tipoServico",
      "status",
      "ordemServico",
    ],
  },
  {
    id: "cliente",
    title: "Cliente",
    subtitle: "Dados e Veículo",
    icon: <Users className="w-4 h-4" />,
    fields: [
      "cliente.nome",
      "cliente.contato",
      "veiculo.placa",
      "veiculo.marcaModelo",
    ],
  },
  {
    id: "localizacao",
    title: "Local",
    subtitle: "Onde será feito",
    icon: <Pin className="w-4 h-4" />,
    fields: [
      "endereco.cep",
      "endereco.rua",
      "endereco.numero",
      "endereco.bairro",
      "endereco.cidade",
      "endereco.estado",
    ],
  },
  {
    id: "revisao",
    title: "Revisão",
    subtitle: "Confirmação",
    icon: <CheckCircle2 className="w-4 h-4" />,
    fields: [],
  },
];

// Remove máscaras antes de validar/enviar
const unmaskForm = (form: typeof INITIAL_FORM) => ({
  ...form,
  cliente: {
    ...form.cliente,
    contato: form.cliente.contato.replace(/\D/g, ""),
  },
  endereco: { ...form.endereco, cep: form.endereco.cep.replace(/\D/g, "") },
});

// ─── Componente Principal ──────────────────────────────────────────────────
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

  // Reset só quando muda o registro ou abre/fecha o modal
  // (evita voltar à etapa 1 se o pai re-renderizar com novo objeto)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id, isOpen]);

  useEffect(() => {
    if (form.horario && horariosOcupados.has(form.horario)) {
      setForm((prev) => ({ ...prev, horario: "" }));
    }
  }, [horariosOcupados, form.horario]);

  // Handlers
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

  const validateCurrentStep = (): boolean => {
    const step = STEPS[currentStep];
    if (step.fields.length === 0) return true;

    const newTouched = step.fields.reduce(
      (acc, f) => ({ ...acc, [f]: true }),
      {},
    );
    setTouched((prev) => ({ ...prev, ...newTouched }));

    const result = formularioServicoSchema.safeParse(unmaskForm(form));
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      const stepErrors: Record<string, string> = {};

      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        newErrors[path] = issue.message;
        if (step.fields.includes(path)) stepErrors[path] = issue.message;
      });
      setErrors(newErrors);

      if (Object.keys(stepErrors).length > 0) {
        const firstErrorField = Object.keys(stepErrors)[0];
        document
          .querySelector(`[data-field="${firstErrorField}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
      }
    } else {
      setErrors({});
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep())
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const goToStep = (index: number) => setCurrentStep(index);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Só envia na etapa de revisão; Enter nas etapas anteriores apenas avança
    if (currentStep < STEPS.length - 1) {
      nextStep();
      return;
    }
    if (isLoading) return;

    const result = formularioServicoSchema.safeParse(unmaskForm(form));
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path.join(".")] = issue.message;
      });
      setErrors(newErrors);
      // marca como touched, senão o erro não aparece na etapa de destino
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(Object.keys(newErrors).map((k) => [k, true])),
      }));

      const firstErrorField = Object.keys(newErrors)[0];
      const stepIndex = STEPS.findIndex((s) =>
        s.fields.includes(firstErrorField),
      );
      if (stepIndex >= 0) setCurrentStep(stepIndex);
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

  // Options Handlers
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
              ? `${h.label} (Ocupado)`
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
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center shadow-inner border border-accent/20">
            <NotepadText className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-text tracking-tight">
              {initialData ? "Editar Ordem de Serviço" : "Novo Agendamento"}
            </h2>
            <p className="text-sm font-medium text-text-muted mt-0.5">
              {initialData
                ? "Atualize os dados do atendimento"
                : "Preencha os dados em etapas"}
            </p>
          </div>
        </div>
      }
      size="lg"
      closeOnOverlayClick={!isLoading}
    >
      {configLoading && (
        <div className="flex items-center justify-center p-4 bg-bg-muted rounded-xl border border-border mb-6 animate-pulse">
          <Spinner size="md" variant="slate" />
          <span className="ml-3 text-sm font-medium text-text-muted">
            Sincronizando opções...
          </span>
        </div>
      )}

      {/* Indicador de Progresso */}
      <div className="relative mb-8 mt-2 px-2">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 rounded-full z-0"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full z-0 transition-all duration-500 ease-in-out"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        ></div>

        <div className="relative z-10 flex justify-between">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isClickable = index <= currentStep || !!initialData;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => isClickable && goToStep(index)}
                disabled={!isClickable}
                className="flex flex-col items-center gap-2 group outline-none"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 shadow-sm ${
                    isActive
                      ? "bg-primary border-primary text-primary-foreground scale-110"
                      : isCompleted
                        ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                        : "bg-bg-elevated border-border text-text-muted cursor-not-allowed"
                  }`}
                >
                  {isCompleted && !isActive ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:block transition-colors ${isActive ? "text-primary" : isCompleted ? "text-text" : "text-text-muted"}`}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Container de Animação das Etapas */}
        <div
          key={currentStep}
          className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out fill-mode-forwards"
        >
          {/* Cabeçalho da etapa */}
          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bg-muted border border-border text-primary flex items-center justify-center shadow-sm">
              {STEPS[currentStep].icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-text">
                {STEPS[currentStep].title}
              </h3>
              <p className="text-xs text-text-muted">
                {STEPS[currentStep].subtitle}
              </p>
            </div>
          </div>

          {/* ═══════════════ ETAPA 1: SERVIÇO ═══════════════ */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  label="Ordem de Serviço (OS)"
                  placeholder="Ex: OS-2024-001"
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
            </div>
          )}

          {/* ═══════════════ ETAPA 2: CLIENTE & VEÍCULO ═══════════════ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-bg-elevated border border-border rounded-2xl p-5 shadow-sm transition-all hover:border-primary/30">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border/50">
                  <User className="w-5 h-5 text-blue-500" />
                  <h4 className="font-bold text-text">Dados do Cliente</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      label="WhatsApp / Celular"
                      placeholder="(00) 00000-0000"
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

              <div className="bg-bg-elevated border border-border rounded-2xl p-5 shadow-sm transition-all hover:border-primary/30">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border/50">
                  <Car className="w-5 h-5 text-purple-500" />
                  <h4 className="font-bold text-text">
                    Identificação do Veículo
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div data-field="veiculo.placa">
                    <Input
                      label="Placa"
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
                      label="Marca / Modelo"
                      placeholder="Ex: Honda Civic 2022"
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
            <div className="bg-bg-elevated border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-rose-500" />
                  <h4 className="font-bold text-text">
                    Endereço de Atendimento
                  </h4>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualAddress(!manualAddress)}
                  className="text-xs h-8 rounded-lg"
                >
                  {manualAddress ? (
                    <Search className="w-3 h-3 mr-2" />
                  ) : (
                    <Pencil className="w-3 h-3 mr-2" />
                  )}
                  {manualAddress
                    ? "Usar Busca Automática"
                    : "Preencher Manualmente"}
                </Button>
              </div>

              {!manualAddress ? (
                <div className="mb-5">
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
                <p className="text-sm font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg mb-5 border border-amber-200 dark:border-amber-900/50">
                  Modo de preenchimento manual ativado. Certifique-se de
                  preencher corretamente.
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
                    label="Logradouro"
                    placeholder="Nome da rua, avenida..."
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
                    placeholder="123 / SN"
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
                    placeholder="Centro"
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
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resumo: Serviço */}
                <div className="bg-bg-muted border border-border rounded-xl p-4 relative group">
                  <button
                    type="button"
                    onClick={() => goToStep(0)}
                    className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="Editar Serviço"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                    <ToolCase className="w-3.5 h-3.5" /> Serviço
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-border/50 pb-1">
                      <dt className="text-text-muted">Técnico</dt>
                      <dd className="font-semibold text-text">
                        {form.tecnico}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-1">
                      <dt className="text-text-muted">Agendamento</dt>
                      <dd className="font-semibold text-text">
                        {form.data} às {form.horario}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-1">
                      <dt className="text-text-muted">Tipo</dt>
                      <dd className="font-semibold text-text">
                        {form.tipoServico}
                      </dd>
                    </div>
                    {form.ordemServico && (
                      <div className="flex justify-between">
                        <dt className="text-text-muted">OS</dt>
                        <dd className="font-semibold text-text">
                          {form.ordemServico}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Resumo: Cliente e Veículo */}
                <div className="bg-bg-muted border border-border rounded-xl p-4 relative group">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="Editar Cliente"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Cliente & Veículo
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-border/50 pb-1">
                      <dt className="text-text-muted">Nome</dt>
                      <dd className="font-semibold text-text truncate max-w-37.5">
                        {form.cliente.nome}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-1">
                      <dt className="text-text-muted">Contato</dt>
                      <dd className="font-semibold text-text">
                        {form.cliente.contato}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-1">
                      <dt className="text-text-muted">Placa</dt>
                      <dd className="font-mono font-bold text-text uppercase">
                        {form.veiculo.placa}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">Modelo</dt>
                      <dd className="font-semibold text-text">
                        {form.veiculo.marcaModelo}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Resumo: Localização */}
                <div className="bg-bg-muted border border-border rounded-xl p-4 relative group md:col-span-2">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="Editar Local"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Localização
                  </h4>
                  <p className="text-sm font-semibold text-text">
                    {form.endereco.rua}, {form.endereco.numero}
                  </p>
                  <p className="text-sm text-text-muted">
                    {form.endereco.bairro} - {form.endereco.cidade}/
                    {form.endereco.estado}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    CEP: {form.endereco.cep}
                  </p>
                </div>
              </div>

              {/* Observações */}
              <div className="bg-bg-elevated border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
                  <NotepadText className="w-3.5 h-3.5" /> Observações (Opcional)
                </h4>
                <textarea
                  className="w-full p-3 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-bg-muted text-text border border-border"
                  placeholder="Detalhes adicionais, pontos de referência..."
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

        {/* ═══════════════ NAVEGAÇÃO / FOOTER ═══════════════ */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t border-border mt-8">
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
            {/* `key` distinto força o React a criar botões diferentes,
                evitando que o clique em "Próximo" vire um submit */}
            {!isLastStep ? (
              <Button
                key="btn-next"
                type="button"
                variant="primary"
                onClick={nextStep}
                disabled={configLoading}
                className="w-full sm:w-auto px-8"
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
                className="w-full sm:w-auto px-8 shadow-md hover:shadow-lg transition-all"
              >
                {isLoading
                  ? "Salvando..."
                  : initialData
                    ? "Salvar Alterações"
                    : "Confirmar Agendamento"}
                {!isLoading && <CheckCircle2 className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
