// app/api/config/route.ts
// Route Handler para configurações (técnicos, tipos, horários)

import { NextRequest, NextResponse } from "next/server";

const GAS_URL = process.env.GAS_URL || "";
const API_KEY = process.env.GAS_API_KEY || "";

async function fetchGas(action: string) {
  if (!GAS_URL) throw new Error("GAS_URL não configurada");

  const url = new URL(GAS_URL);
  if (API_KEY) url.searchParams.set("key", API_KEY);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data: {} }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }
  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("tipo");

    let action: string;
    switch (tipo) {
      case 'status': action = 'GET_STATUS'; break;
      case "tecnicos": action = "GET_TECNICOS"; break;
      case "tipos": action = "GET_TIPOS"; break;
      case "horarios": action = "GET_HORARIOS"; break;
      default:
        return NextResponse.json(
          { success: false, error: "Tipo inválido. Use: tecnicos, tipos, horarios" },
          { status: 400 }
        );
    }

    const result = await fetchGas(action);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[API Config] Erro:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}