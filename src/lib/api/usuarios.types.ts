// src/lib/api/usuarios.types.ts
export type RoleUsuario = "tecnico" | "master";

export interface Usuario {
  id?: number;
  tecnico_nome: string;
  email: string;
  senha_hash?: string; // só no backend
  role: RoleUsuario;
  ativo: boolean;
  ultimo_login?: string;
  criado_em?: string;
}

export interface UsuarioForm {
  tecnico_nome: string;
  email: string;
  senha?: string;
  role: RoleUsuario;
  ativo: boolean;
}

export interface UsuarioStats extends Usuario {
  totalServicos?: number;
  servicosConcluidos?: number;
  servicosPendentes?: number;
}

export function normalizarUsuario(item: unknown): Usuario | null {
  if (!item || typeof item !== "object") return null;
  const obj = item as Record<string, unknown>;
  const tecnico_nome = String(obj.tecnico_nome ?? "").trim();
  const email = String(obj.email ?? "").trim();
  if (!tecnico_nome || !email) return null;

  const ativoRaw = obj.ativo;
  const ativo =
    ativoRaw === undefined ||
    ativoRaw === true ||
    ativoRaw === 1 ||
    ["true", "sim", "yes", "1", "x"].includes(String(ativoRaw).toLowerCase());

  const roleRaw = String(obj.role ?? "tecnico").toLowerCase();
  const role: RoleUsuario = roleRaw === "master" ? "master" : "tecnico";

  const usuario: Usuario = {
    tecnico_nome,
    email,
    role,
    ativo,
  };

  if (obj.id !== undefined) usuario.id = Number(obj.id);
  if (obj.ultimo_login !== undefined) usuario.ultimo_login = String(obj.ultimo_login);
  if (obj.criado_em !== undefined) usuario.criado_em = String(obj.criado_em);

  return usuario;
}

export function normalizarListaUsuarios(items: unknown[]): Usuario[] {
  return items.map(normalizarUsuario).filter((u): u is Usuario => u !== null);
}

export function formatarData(data?: string): string {
  if (!data) return "Nunca";
  try {
    const d = new Date(data);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Data inválida";
  }
}