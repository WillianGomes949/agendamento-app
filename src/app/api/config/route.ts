// src/app/api/config/route.ts
// Route Handler para configurações (técnicos, tipos, horários)
// Suporta GET (legado) e POST (novo padrão)

import { NextRequest, NextResponse } from "next/server";

const GAS_URL = process.env.GAS_URL || "";
const API_KEY = process.env.GAS_API_KEY || "";

async function fetchGas(action: string, data: Record<string, unknown> = {}) {
  if (!GAS_URL) throw new Error("GAS_URL não configurada");

  const url = new URL(GAS_URL);
  if (API_KEY) url.searchParams.set("key", API_KEY);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  return response.json();
}

/**
 * GET legado — mantém compatibilidade com chamadas via ?tipo=tecnicos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");

    let action: string;
    switch (tipo) {
      case "status":
        action = "GET_STATUS";
        break;
      case "tecnicos":
        action = "GET_TECNICOS";
        break;
      case "tipos":
        action = "GET_TIPOS";
        break;
      case "horarios":
        action = "GET_HORARIOS";
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: "Tipo inválido. Use: tecnicos, tipos, horarios, status",
          },
          { status: 400 },
        );
    }

    const result = await fetchGas(action);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[API Config GET] Erro:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno",
      },
      { status: 500 },
    );
  }
}

/**
 * POST — novo padrão usado por /api/tecnicos/route.ts
 * Recebe { action, data } e encaminha para o Apps Script.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Action é obrigatória",
          details: "Envie { action: string, data?: object }",
        },
        { status: 400 },
      );
    }

    const result = await fetchGas(action.toUpperCase(), data || {});
    return NextResponse.json(result);
  } catch (err) {
    console.error("[API Config POST] Erro:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno",
        details: "Falha ao processar requisição",
      },
      { status: 500 },
    );
  }
}
