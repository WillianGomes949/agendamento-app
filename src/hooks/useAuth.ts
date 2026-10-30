// src/hooks/useAuth.ts
"use client";

import { useState, useEffect } from "react";

export interface Usuario {
  tecnico_nome: string;
  email: string;
  role: string;
}

export function useAuth() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        
        if (res.ok) {
          const json = await res.json();
          console.log("✅ Usuário carregado com sucesso:", json.data); // <-- Debug
          setUsuario(json.data);
        } else {
          console.warn("⚠️ Falha ao buscar usuário. Status:", res.status); // <-- Debug
        }
      } catch (error) {
        console.error("❌ Erro ao buscar dados do usuário:", error); // <-- Debug
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { usuario, loading };
}