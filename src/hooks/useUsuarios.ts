import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Usuario, UsuarioForm, UsuarioStats } from "@/lib/api/usuarios.types";

async function fetchUsuarios(withStats = false): Promise<UsuarioStats[]> {
  const url = `/api/usuarios${withStats ? "?stats=1" : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro ao buscar usuários" }));
    throw new Error(err.error || err.details || "Erro ao buscar usuários");
  }
  const json = await res.json();
  return json.data ?? [];
}

async function createUsuarioApi(payload: UsuarioForm): Promise<Usuario> {
  const res = await fetch("/api/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro ao criar usuário" }));
    throw new Error(err.error || err.details || "Erro ao criar usuário");
  }
  const json = await res.json();
  return json.data;
}

async function updateUsuarioApi(
  payload: { emailAntigo: string } & Partial<UsuarioForm>,
): Promise<Usuario> {
  const res = await fetch("/api/usuarios", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro ao atualizar usuário" }));
    throw new Error(err.error || err.details || "Erro ao atualizar usuário");
  }
  const json = await res.json();
  return json.data;
}

async function deleteUsuarioApi(email: string): Promise<void> {
  const res = await fetch("/api/usuarios", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro ao excluir usuário" }));
    throw new Error(err.error || err.details || "Erro ao excluir usuário");
  }
}

export function useUsuarios() {
  const queryClient = useQueryClient();

  const {
    data: usuarios = [],
    isLoading: loading,
    error: errorRaw,
  } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      try {
        return await fetchUsuarios(true);
      } catch {
        return await fetchUsuarios(false); // Fallback gracioso
      }
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const error = errorRaw instanceof Error ? errorRaw.message : null;

  const createMutation = useMutation({
    mutationFn: createUsuarioApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const updateMutation = useMutation({
    mutationFn: updateUsuarioApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuarioApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });

  const create = async (payload: UsuarioForm) => {
    const previous = queryClient.getQueryData<UsuarioStats[]>(["usuarios"]);
    queryClient.setQueryData(["usuarios"], (old: UsuarioStats[] = []) => [
      ...old,
      { ...payload, id: Date.now(), ativo: true } as UsuarioStats,
    ]);
    try {
      return await createMutation.mutateAsync(payload);
    } catch (err) {
      queryClient.setQueryData(["usuarios"], previous);
      throw err;
    }
  };

  const update = async (payload: { emailAntigo: string } & Partial<UsuarioForm>) => {
    const previous = queryClient.getQueryData<UsuarioStats[]>(["usuarios"]);
    queryClient.setQueryData(["usuarios"], (old: UsuarioStats[] = []) =>
      old.map((u) =>
        u.email === payload.emailAntigo ? { ...u, ...payload } : u,
      ),
    );
    try {
      return await updateMutation.mutateAsync(payload);
    } catch (err) {
      queryClient.setQueryData(["usuarios"], previous);
      throw err;
    }
  };

  const remove = async (email: string) => {
    const previous = queryClient.getQueryData<UsuarioStats[]>(["usuarios"]);
    queryClient.setQueryData(["usuarios"], (old: UsuarioStats[] = []) =>
      old.filter((u) => u.email !== email),
    );
    try {
      return await deleteMutation.mutateAsync(email);
    } catch (err) {
      queryClient.setQueryData(["usuarios"], previous);
      throw err;
    }
  };

  return {
    usuarios,
    loading,
    error,
    create,
    update,
    remove,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}