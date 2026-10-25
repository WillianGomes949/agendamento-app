// src/hooks/useTecnicos.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TecnicoStats } from "@/lib/api/tecnicos.types";

const API_BASE = "/api/tecnicos";

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const json = (await res.json()) as {
    success?: boolean;
    data?: T;
    error?: string;
    details?: string;
  };
  if (!res.ok || json.success === false) {
    throw new Error(
      `${json.error ?? `HTTP ${res.status}`}${
        json.details ? ` (${json.details})` : ""
      }`,
    );
  }
  return (json.data ?? (json as unknown)) as T;
}

export function useTecnicos() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<TecnicoStats[]>({
    queryKey: ["tecnicos"],
    queryFn: () => apiFetch<TecnicoStats[]>(`${API_BASE}?stats=1`),
    staleTime: 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch<TecnicoStats>(API_BASE, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tecnicos"] });
      queryClient.invalidateQueries({ queryKey: ["config", "tecnicos"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      nomeAntigo,
      ...updates
    }: { nomeAntigo: string } & Record<string, unknown>) =>
      apiFetch<void>(API_BASE, {
        method: "PATCH",
        body: JSON.stringify({ nomeAntigo, ...updates }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tecnicos"] });
      queryClient.invalidateQueries({ queryKey: ["config", "tecnicos"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (nome: string) =>
      apiFetch<void>(API_BASE, {
        method: "DELETE",
        body: JSON.stringify({ nome }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tecnicos"] });
      queryClient.invalidateQueries({ queryKey: ["config", "tecnicos"] });
    },
  });

  return {
    tecnicos: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refresh: () => refetch(),
    create: (p: Record<string, unknown>) => createMutation.mutateAsync(p),
    update: (p: { nomeAntigo: string } & Record<string, unknown>) =>
      updateMutation.mutateAsync(p),
    remove: (nome: string) => deleteMutation.mutateAsync(nome),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
