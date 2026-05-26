// src/components/features/ServicoForm.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Servico } from "@/lib/types";
import { formularioServicoSchema, type FormularioSchema } from "@/lib/schemas";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormularioSchema) => void;
  initialData?: Servico | null;
  isLoading?: boolean;
}

const INITIAL_FORM: FormularioSchema = {
  tecnico: "",
  data: "",
  horario: "",
  tipoServico: "",
  ordemServico: null,
  cliente: { nome: "", contato: "" },
  veiculo: { placa: "", marcaModelo: "" },
  endereco: { rua: "", numero: "", bairro: "", cidade: "", estado: "", cep: "" },
  observacao: ""
};

const TECNICOS_OPTIONS = [
  { value: "JACKSON", label: "Jackson" },
  { value: "MARCOS", label: "Marcos" },
  { value: "ROBERTO", label: "Roberto" },
];

const TIPO_SERVICO_OPTIONS = [
  { value: "INSTALAÇÃO", label: "Instalação" },
  { value: "MANUTENÇÃO", label: "Manutenção" },
  { value: "SUBSTITUIÇÃO DE CHIP", label: "Substituição de Chip" },
  { value: "RETIRADA", label: "Retirada" },
];

const HORARIOS_OPTIONS = [
  { value: "08:00", label: "08:00" },
  { value: "09:00", label: "09:00" },
  { value: "10:00", label: "10:00" },
  { value: "11:00", label: "11:00" },
  { value: "13:00", label: "13:00" },
  { value: "14:00", label: "14:00" },
  { value: "15:00", label: "15:00" },
  { value: "16:00", label: "16:00" },
  { value: "17:00", label: "17:00" },
];

export default function ServicoForm({ isOpen, onClose, onSubmit, initialData, isLoading = false }: Props) {
  const [form, setForm] = useState<FormularioSchema>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form quando abre/fecha ou muda initialData
  useEffect(() => {
    if (initialData) {
      setForm({
        tecnico: initialData.tecnico || "",
        data: initialData.data || "",
        horario: initialData.horario || "",
        tipoServico: initialData.tipoServico || "",
        ordemServico: initialData.ordemServico || null,
        cliente: {
          nome: initialData.cliente?.nome || "",
          contato: initialData.cliente?.contato || ""
        },
        veiculo: {
          placa: initialData.veiculo?.placa || "",
          marcaModelo: initialData.veiculo?.marcaModelo || ""
        },
        endereco: {
          rua: initialData.endereco?.rua || "",
          numero: initialData.endereco?.numero || "",
          bairro: initialData.endereco?.bairro || "",
          cidade: initialData.endereco?.cidade || "",
          estado: initialData.endereco?.estado || "",
          cep: initialData.endereco?.cep || ""
        },
        observacao: initialData.observacao || ""
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
  }, [initialData, isOpen]);

  // ✅ CORRIGIDO: updateField sem dependência de form (evita loop)
  const updateField = useCallback((section: string, field: string, value: string) => {
    setForm(prev => {
      if (section === "cliente" || section === "veiculo" || section === "endereco") {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
      return { ...prev, [section]: value };
    });

    // Limpa erro do campo
    setErrors(prev => {
      const errorKey = field ? `${section}.${field}` : section;
      if (prev[errorKey]) {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      }
      return prev;
    });
  }, []); // ✅ Sem dependências — prev é passado pelo React

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = formularioServicoSchema.safeParse(form);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        newErrors[issue.path.join('.')] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    onSubmit(result.data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Editar Serviço" : "Novo Agendamento"}
      size="lg"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Informações do Serviço */}
          <Select
            label="Técnico"
            value={form.tecnico}
            onChange={(e) => updateField("tecnico", "", e.target.value)}
            options={TECNICOS_OPTIONS}
            error={errors.tecnico}
            required
          />

          <Input
            label="Data"
            placeholder="DD/MM/YYYY"
            value={form.data}
            onChange={e => updateField("data", "", e.target.value)}
            error={errors.data}
            required
          />

          <Select
            label="Horário"
            value={form.horario}
            onChange={(e) => updateField("horario", "", e.target.value)}
            options={HORARIOS_OPTIONS}
            error={errors.horario}
            required
          />

          <Select
            label="Tipo de Serviço"
            value={form.tipoServico}
            onChange={(e) => updateField("tipoServico", "", e.target.value)}
            options={TIPO_SERVICO_OPTIONS}
            error={errors.tipoServico}
            required
          />

          {/* Ordem de Serviço */}
          <Input
            label="Ordem de Serviço (opcional)"
            placeholder="Nº da OS"
            value={form.ordemServico || ""}
            onChange={e => updateField("ordemServico", "", e.target.value)}
            error={errors.ordemServico}
            className="md:col-span-2"
          />

          {/* Dados do Cliente */}
          <Input
            label="Nome do Cliente"
            value={form.cliente.nome}
            onChange={e => updateField("cliente", "nome", e.target.value)}
            error={errors["cliente.nome"]}
            required
          />

          <Input
            label="Contato (apenas números)"
            value={form.cliente.contato}
            onChange={e => updateField("cliente", "contato", e.target.value.replace(/\D/g, ""))}
            error={errors["cliente.contato"]}
            helperText="DDD + número com 10 ou 11 dígitos"
            required
          />

          {/* Dados do Veículo */}
          <Input
            label="Placa do Veículo"
            value={form.veiculo.placa}
            onChange={e => updateField("veiculo", "placa", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))}
            error={errors["veiculo.placa"]}
            helperText="Formato: ABC1D23 ou ABC1234"
            required
          />

          <Input
            label="Marca / Modelo"
            value={form.veiculo.marcaModelo}
            onChange={e => updateField("veiculo", "marcaModelo", e.target.value)}
            error={errors["veiculo.marcaModelo"]}
            required
          />

          {/* Endereço */}
          <Input
            label="Rua"
            value={form.endereco.rua}
            onChange={e => updateField("endereco", "rua", e.target.value)}
            error={errors["endereco.rua"]}
            required
          />

          <Input
            label="Número"
            value={form.endereco.numero}
            onChange={e => updateField("endereco", "numero", e.target.value)}
            error={errors["endereco.numero"]}
            required
          />

          <Input
            label="Bairro"
            value={form.endereco.bairro}
            onChange={e => updateField("endereco", "bairro", e.target.value)}
            error={errors["endereco.bairro"]}
            required
          />

          <Input
            label="Cidade"
            value={form.endereco.cidade}
            onChange={e => updateField("endereco", "cidade", e.target.value)}
            error={errors["endereco.cidade"]}
            required
          />

          <Input
            label="Estado (UF)"
            value={form.endereco.estado}
            onChange={e => updateField("endereco", "estado", e.target.value.toUpperCase().slice(0, 2))}
            error={errors["endereco.estado"]}
            required
          />

          <Input
            label="CEP"
            value={form.endereco.cep}
            onChange={e => updateField("endereco", "cep", e.target.value.replace(/\D/g, "").slice(0, 8))}
            error={errors["endereco.cep"]}
            helperText="Apenas números, 8 dígitos"
            required
          />

          {/* Observações */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observações
            </label>
            <textarea
              className={`w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${errors.observacao ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Observações (opcional)"
              value={form.observacao || ""}
              onChange={e => updateField("observacao", "", e.target.value)}
              rows={3}
            />
            {errors.observacao && <p className="mt-1 text-xs text-red-600">{errors.observacao}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            {initialData ? "Salvar Alterações" : "Criar Serviço"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}