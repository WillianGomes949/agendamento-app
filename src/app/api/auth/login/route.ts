import { NextRequest, NextResponse } from "next/server";
import { fetchApi } from "@/lib/Api-agendamento/client";
import { API_ACTIONS } from "@/lib/Api-agendamento/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, senha } = body;

    if (!email || !senha) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
    }

    const result = await fetchApi(API_ACTIONS.LOGIN, { email, senha });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Credenciais inválidas" }, 
        { status: result._httpStatus || 401 }
      );
    }

    const response = NextResponse.json({ 
      success: true, 
      data: result.data 
    });
    
    // Define cookie HTTP-only seguro (dura 7 dias)
    response.cookies.set("auth_session", JSON.stringify(result.data), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Login API Error]", error);
    return NextResponse.json({ error: "Erro interno ao fazer login" }, { status: 500 });
  }
}