// src/app/api/auth/me/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // No Next.js 15, cookies() deve ser aguardado com await
    const cookieStore = await cookies();
    const session = cookieStore.get("auth_session");

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Parseia os dados do cookie
    const usuario = JSON.parse(session.value);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        tecnico_nome: usuario.tecnico_nome,
        email: usuario.email,
        role: usuario.role
      } 
    });
  } catch (error) {
    console.error("Erro ao ler sessão no servidor:", error);
    return NextResponse.json({ error: "Erro ao ler sessão" }, { status: 500 });
  }
}