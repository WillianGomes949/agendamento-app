// src/hooks/useConfig.ts
"use client";

import { useState, useEffect, useCallback } from "react";

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
const CACHE_KEY = "@TrackApp:config";
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 horas

// Variável global para impedir requisições simultâneas
let globalConfigPromise: Promise<ConfigOptions> | null = null;

function sanitizarHorario(valor: unknown): string {
  if (!valor) return "";
  if (typeof valor === "string") {
    const trimmed = valor.trim();
    if (/^([01]?\d|2[0-3]):([0-5]\d)$/.test(trimmed)) {
      const [h, m] = trimmed.split(":");
      return `${h.padStart(2, "0")}:${m}`;
    }
    const match = trimmed.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const horas = match[1].padStart(2, "0");
      const minutos = match[2];
      return `${horas}:${minutos}`;
    }
    return trimmed;
  }
  if (valor instanceof Date) {
    return valor.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  if (typeof valor === "number") {
    const date = new Date(valor);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return String(valor);
}

async function fetchConfig(tipo: string): Promise<string[]> {
  const response = await fetch(`${API_BASE}?tipo=${tipo}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const result = await response.json();
  if (!result.success)
    throw new Error(result.error || "Erro ao carregar configuração");

  const dados = (result.data || []) as unknown[];
  if (tipo === "horarios") {
    return dados
      .map(sanitizarHorario)
      .filter((h) => h !== "" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(h));
  }
  return dados.map(String).filter((s) => s.trim() !== "");
}

async function fetchAllConfigs(): Promise<ConfigOptions> {
  const [tecnicos, tipos, horarios, status] = await Promise.all([
    fetchConfig("tecnicos"),
    fetchConfig("tipos"),
    fetchConfig("horarios"),
    fetchConfig("status"),
  ]);

  return {
    tecnicos: tecnicos.map((t) => ({ value: t, label: t })),
    tiposServico: tipos.map((t) => ({ value: t, label: t })),
    horarios: horarios.map((h) => ({ value: h, label: h })),
    status: status.map((s) => ({ value: s, label: s })),
  };
}

export function useConfig(): UseConfigReturn {
  const [options, setOptions] = useState<ConfigOptions>({
    tecnicos: [],
    tiposServico: [],
    horarios: [],
    status: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Tenta ler do LocalStorage
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setOptions(data);
            setLoading(false);
            return;
          }
        }
      }

      // 2. Deduplicação: Usa a promise global se já estiver a decorrer
      if (!globalConfigPromise || forceRefresh) {
        globalConfigPromise = fetchAllConfigs();
      }

      const newOptions = await globalConfigPromise;

      // 3. Guarda no LocalStorage
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data: newOptions,
          timestamp: Date.now(),
        }),
      );

      setOptions(newOptions);
    } catch (err) {
      console.error("[useConfig] Erro:", err);
      setError(
        err instanceof Error ? err.message : "Falha ao carregar configurações",
      );
      // Fallback
      setOptions({
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
      });
    } finally {
      globalConfigPromise = null;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { options, loading, error, refresh: () => load(true) };
}
