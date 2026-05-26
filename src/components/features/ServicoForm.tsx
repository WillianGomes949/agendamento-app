// src/components/features/ServicoForm.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Servico } from "@/lib/types";
import { formularioServicoSchema, type FormularioSchema } from "@/lib/schemas";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormularioSchema) => void;
  initialData?: Servico | null;
}

const INITIAL_FORM: FormularioSchema = {
  tecnico: "JACKSON",
  data: "",
  horario: "",
  tipoServico: "",
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

export default function ServicoForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: Props) {
  const [form, setForm] = useState<FormularioSchema>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        tecnico: initialData.tecnico,
        data: initialData.data,
        horario: initialData.horario,
        tipoServico: initialData.tipoServico,
        cliente: initialData.cliente,
        veiculo: initialData.veiculo,
        endereco: initialData.endereco,
        observacao: initialData.observacao || "",
      });
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
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
      // Limpa erro do campo ao editar
      const errorKey =
        section === form.observacao || typeof prev?.[section] === "string"
          ? section
          : `${section}.${field}`;
      setErrors((prev) => {
        const n = { ...prev };
        delete n[errorKey];
        return n;
      });
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = formularioServicoSchema.safeParse(form);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        newErrors[issue.path.join(".")] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    await onSubmit(result.data);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.form
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "Editar Serviço" : "Novo Agendamento"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Data"
            placeholder="DD/MM/YYYY"
            value={form.data}
            onChange={(e) => updateField("data", "", e.target.value)}
            error={errors.data}
          />
          <Input
            label="Horário"
            placeholder="HH:MM"
            value={form.horario}
            onChange={(e) => updateField("horario", "", e.target.value)}
            error={errors.horario}
          />
          <Input
            label="Tipo de Serviço"
            value={form.tipoServico}
            onChange={(e) => updateField("tipoServico", "", e.target.value)}
            error={errors.tipoServico}
          />

          <Input
            label="Nome do Cliente"
            value={form.cliente.nome}
            onChange={(e) => updateField("cliente", "nome", e.target.value)}
            error={errors["cliente.nome"]}
          />
          <Input
            label="Contato (apenas números)"
            value={form.cliente.contato}
            onChange={(e) =>
              updateField(
                "cliente",
                "contato",
                e.target.value.replace(/\D/g, ""),
              )
            }
            error={errors["cliente.contato"]}
          />

          <Input
            label="Placa do Veículo"
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
            error={errors["veiculo.placa"]}
          />
          <Input
            label="Marca / Modelo"
            value={form.veiculo.marcaModelo}
            onChange={(e) =>
              updateField("veiculo", "marcaModelo", e.target.value)
            }
            error={errors["veiculo.marcaModelo"]}
          />

          <Input
            label="Rua"
            value={form.endereco.rua}
            onChange={(e) => updateField("endereco", "rua", e.target.value)}
            error={errors["endereco.rua"]}
          />
          <Input
            label="Número"
            value={form.endereco.numero}
            onChange={(e) => updateField("endereco", "numero", e.target.value)}
            error={errors["endereco.numero"]}
          />
          <Input
            label="Bairro"
            value={form.endereco.bairro}
            onChange={(e) => updateField("endereco", "bairro", e.target.value)}
            error={errors["endereco.bairro"]}
          />
          <Input
            label="Cidade"
            value={form.endereco.cidade}
            onChange={(e) => updateField("endereco", "cidade", e.target.value)}
            error={errors["endereco.cidade"]}
          />
          <Input
            label="Estado (UF)"
            value={form.endereco.estado}
            onChange={(e) =>
              updateField(
                "endereco",
                "estado",
                e.target.value.toUpperCase().slice(0, 2),
              )
            }
            error={errors["endereco.estado"]}
          />
          <Input
            label="CEP"
            value={form.endereco.cep}
            onChange={(e) =>
              updateField(
                "endereco",
                "cep",
                e.target.value.replace(/\D/g, "").slice(0, 8),
              )
            }
            error={errors["endereco.cep"]}
          />

          <div className="md:col-span-2">
            <textarea
              className={`w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${errors.observacao ? "border-red-300" : "border-gray-300"}`}
              placeholder="Observações (opcional)"
              value={form.observacao || ""}
              onChange={(e) => updateField("observacao", "", e.target.value)}
              rows={2}
            />
            {errors.observacao && (
              <p className="mt-1 text-xs text-red-600">{errors.observacao}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialData ? "Salvar Alterações" : "Criar Serviço"}
          </Button>
        </div>
      </motion.form>
    </motion.div>
  );
}
