// src/app/api/config/route.ts
import { NextRequest, NextResponse } from "next/server";

import { isTipoConfig, TIPO_TO_ACTION } from "@/lib/api/config.server";
import { fetchGas, gasErrorToResponse } from "@/lib/gas/client";

export const dynamic = "force-dynamic";

/** GET legado — `?tipo=tecnicos`. @deprecated prefira POST. */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") ?? "";

  if (!isTipoConfig(tipo)) {
    return NextResponse.json(
      {
        success: false,
        error: "Tipo inválido.",
        details: "Use: tecnicos, tipos, horarios, status.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await fetchGas(TIPO_TO_ACTION[tipo]);
    return NextResponse.json(result);
  } catch (err) {
    const { body, status } = gasErrorToResponse(err);
    return NextResponse.json(body, { status });
  }
}

/** POST — padrão atual. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "JSON inválido",
        details: "O corpo deve ser um objeto: { action, data? }.",
      },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof (body as { action?: unknown }).action !== "string" ||
    !(body as { action: string }).action.trim()
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Action é obrigatória",
        details: "Envie { action: string, data?: object }.",
      },
      { status: 400 },
    );
  }

  const { action, data } = body as {
    action: string;
    data?: Record<string, unknown>;
  };

  if (
    data !== undefined &&
    (typeof data !== "object" || data === null || Array.isArray(data))
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Campo 'data' inválido",
        details: "Deve ser um objeto.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await fetchGas(action.toUpperCase(), data ?? {});
    return NextResponse.json(result);
  } catch (err) {
    const { body: errBody, status } = gasErrorToResponse(err);
    return NextResponse.json(errBody, { status });
  }
}
