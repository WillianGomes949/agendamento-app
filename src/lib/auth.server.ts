// src/lib/auth.server.ts
import { cookies } from "next/headers";

export interface Usuario {
  tecnico_nome: string;
  email: string;
  role: string;
}

export async function getUsuarioLogado(): Promise<Usuario | null> {
  try {
    // ✅ No Next.js 15, cookies() deve ser aguardado com await
    const cookieStore = await cookies();
    const session = cookieStore.get("auth_session");
    
    if (session) {
      return JSON.parse(session.value) as Usuario;
    }
  } catch (error) {
    console.error("Erro ao ler cookie de sessão no servidor:", error);
  }
  return null;
}