// app/api/servicos/route.ts
// Route Handler — Proxy para Google Apps Script
// ✅ CORRETO: Faz fetch para API externa no Edge/Node runtime

import { NextRequest, NextResponse } from "next/server";

const GAS_URL = process.env.GAS_URL || "";
const API_KEY = process.env.GAS_API_KEY || "";

// Helper para fazer requisições ao GAS
async function fetchGas(action: string, data?: Record<string, unknown>) {
  if (!GAS_URL) {
    throw new Error("GAS_URL não configurada");
  }

  const url = new URL(GAS_URL);
  if (API_KEY) {
    url.searchParams.set("key", API_KEY);
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, data }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Erro desconhecido");
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
  }

  return response.json();
}

// GET — Listar serviços
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: Record<string, unknown> = {};

    // Converte query params para filtros
    searchParams.forEach((value, key) => {
      if (value) filters[key] = value;
    });

    const result = await fetchGas("GET", filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[API] Erro GET:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

// POST — Criar serviço
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await fetchGas("CREATE", body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("[API] Erro POST:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

// PATCH — Atualizar serviço
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await fetchGas("UPDATE", body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[API] Erro PATCH:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}

// DELETE — Remover serviço
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await fetchGas("DELETE", body);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[API] Erro DELETE:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro interno" },
      { status: 500 }
    );
  }
}