// src/hooks/useConfig.ts
"use client";

import { useQuery } from "@tanstack/react-query";

interface ConfigOptions {
  tecnicos: { value: string; label: string }[];
  tiposServico: { value: string; label: string }[];
  horarios: { value: string; label: string }[];
  status: { value: string; label: string }[];
}

interface UseConfigReturn {
  options: ConfigOptions;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const API_BASE = "/api/config";

function extrairStringConfig(item: unknown): string {
  if (item === null || item === undefined) return "";
  if (typeof item === "string") return item.trim();
  if (typeof item === "number" || typeof item === "boolean")
    return String(item);
  if (typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const valor =
      obj.nome ??
      obj.name ??
      obj.label ??
      obj.value ??
      obj.horario ??
      obj.id ??
      "";
    return String(valor).trim();
  }
  return String(item).trim();
}

function sanitizarHorario(valor: unknown): string {
  if (!valor) return "";
  if (typeof valor === "string") {
    const trimmed = valor.trim();
    if (/^([01]?\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
      const [h, m] = trimmed.split(":");
      return `${h.padStart(2, "0")}:${m}`;
    }
    const match = trimmed.match(/(\d{1,2}):(\d{2})/);
    if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
    return trimmed;
  }
  return String(valor);
}

async function fetchConfig(tipo: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}?tipo=${tipo}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const result = await response.json();
  if (!result.success) throw new Error(result.error ?? "Erro ao carregar");

  const dados: unknown[] = Array.isArray(result.data) ? result.data : [];

  if (tipo === "horarios") {
    return dados
      .map(extrairStringConfig)
      .map(sanitizarHorario)
      .filter((h) => h !== "" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(h));
  }

  return dados.map(extrairStringConfig).filter((s) => s !== "");
}

const FALLBACK: ConfigOptions = {
  tecnicos: [
    { value: "JACKSON", label: "Jackson" },
    { value: "MARCOS", label: "Marcos" },
    { value: "ROBERTO", label: "Roberto" },
  ],
  tiposServico: [
    { value: "INSTALAÇÃO", label: "Instalação" },
    { value: "MANUTENÇÃO", label: "Manutenção" },
  ],
  horarios: [
    { value: "08:00", label: "08:00" },
    { value: "09:00", label: "09:00" },
  ],
  status: [
    { value: "PENDENTE", label: "PENDENTE" },
    { value: "EM ANDAMENTO", label: "EM ANDAMENTO" },
    { value: "CONCLUIDO", label: "CONCLUIDO" },
    { value: "CANCELADO", label: "CANCELADO" },
    { value: "DELETADO", label: "DELETADO" },
  ],
};

export function useConfig(): UseConfigReturn {
  const tecnicos = useQuery({
    queryKey: ["config", "tecnicos"],
    queryFn: () => fetchConfig("tecnicos"),
    staleTime: 5 * 60 * 1000,
  });

  const status = useQuery({
    queryKey: ["config", "status"],
    queryFn: () => fetchConfig("status"),
    staleTime: 30 * 60 * 1000,
  });

  const tipos = useQuery({
    queryKey: ["config", "tipos"],
    queryFn: () => fetchConfig("tipos"),
    staleTime: 30 * 60 * 1000,
  });

  const horarios = useQuery({
    queryKey: ["config", "horarios"],
    queryFn: () => fetchConfig("horarios"),
    staleTime: 30 * 60 * 1000,
  });

  const queries = [tecnicos, status, tipos, horarios];
  const loading = queries.some((q) => q.isLoading);
  const errorQuery = queries.find((q) => q.error);
  const error = errorQuery ? (errorQuery.error as Error).message : null;

  const options: ConfigOptions = {
    tecnicos: (tecnicos.data ?? []).map((t) => ({ value: t, label: t })),
    status: (status.data ?? []).map((s) => ({ value: s, label: s })),
    tiposServico: (tipos.data ?? []).map((t) => ({ value: t, label: t })),
    horarios: (horarios.data ?? []).map((h) => ({ value: h, label: h })),
  };

  const hasAnyData =
    options.tecnicos.length > 0 ||
    options.status.length > 0 ||
    options.tiposServico.length > 0 ||
    options.horarios.length > 0;

  const finalOptions = hasAnyData ? options : FALLBACK;

  return {
    options: finalOptions,
    loading,
    error,
    refresh: () => {
      queries.forEach((q) => q.refetch());
    },
  };
}
