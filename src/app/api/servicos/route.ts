// src/app/api/servicos/route.ts
import { NextRequest, NextResponse } from "next/server";

import {
  atualizarServico,
  criarServico,
  excluirServico,
  listarServicos,
} from "@/lib/api/servicos.server";
import type { ServicoFiltros } from "@/lib/api/servicos.types";
import { apiErrorToResponse } from "@/lib/Api-agendamento/client";

export const dynamic = "force-dynamic";

function respondError(err: unknown) {
  const { body, status } = apiErrorToResponse(err);
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filtros: ServicoFiltros = {};

  searchParams.forEach((value, key) => {
    if (!value) return;
    if (key === "page" || key === "pageSize") {
      const n = Number(value);
      if (Number.isFinite(n)) filtros[key] = n;
      return;
    }
    if (key === "sortOrder" && (value === "asc" || value === "desc")) {
      filtros.sortOrder = value;
      return;
    }
    (filtros as Record<string, unknown>)[key] = value;
  });

  try {
    const result = await listarServicos(filtros);
    return NextResponse.json(result);
  } catch (err) {
    return respondError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await criarServico(body);
    const status =
      result._httpStatus && result._httpStatus < 400 ? result._httpStatus : 201;
    return NextResponse.json(result, { status });
  } catch (err) {
    return respondError(err);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await atualizarServico(body);
    return NextResponse.json(result);
  } catch (err) {
    return respondError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await excluirServico(body);
    return NextResponse.json(result);
  } catch (err) {
    return respondError(err);
  }
}
