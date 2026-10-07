// src/app/api/tecnicos/route.ts
// Route Handler HTTP para CRUD de técnicos.

import { NextRequest, NextResponse } from "next/server";

import {
  createTecnico,
  deleteTecnico,
  getTecnicos,
  getTecnicosComStats,
  updateTecnico,
} from "@/lib/api/tecnicos.server";
import { gasErrorToResponse } from "@/lib/gas/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function respondError(err: unknown) {
  const { body, status } = gasErrorToResponse(err);
  return NextResponse.json(body, { status });
}

// GET — lista técnicos. `?stats=1` inclui estatísticas.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const comStats = searchParams.get("stats") === "1";
  try {
    const data = comStats ? await getTecnicosComStats() : await getTecnicos();
    return NextResponse.json(
      { success: true, data },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    return respondError(err);
  }
}
// POST — cria técnico. Body: { nome: string }.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  if (!nome) {
    return NextResponse.json(
      { success: false, error: "Campo 'nome' é obrigatório" },
      { status: 400 },
    );
  }

  try {
    const data = await createTecnico({
      nome,
      cpf: typeof body.cpf === "string" ? body.cpf : undefined,
      cnpj: typeof body.cnpj === "string" ? body.cnpj : undefined,
      whatsapp: typeof body.whatsapp === "string" ? body.whatsapp : undefined,
      vinculo: typeof body.vinculo === "string" ? body.vinculo : undefined,
    });
    console.log("POST /api/tecnicos retornou:", data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return respondError(err);
  }
}

// PATCH — atualiza técnico. Body: { nomeAntigo, nome?, ativo? }.
export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const nomeAntigo =
    typeof body.nomeAntigo === "string" ? body.nomeAntigo.trim() : "";
  if (!nomeAntigo) {
    return NextResponse.json(
      { success: false, error: "Campo 'nomeAntigo' é obrigatório" },
      { status: 400 },
    );
  }

  const updates: Record<string, string | boolean> = {};
  if (typeof body.nome === "string") updates.nome = body.nome.trim();
  if (typeof body.ativo === "boolean") updates.ativo = body.ativo;
  if (typeof body.cpf === "string") updates.cpf = body.cpf;
  if (typeof body.cnpj === "string") updates.cnpj = body.cnpj;
  if (typeof body.whatsapp === "string") updates.whatsapp = body.whatsapp;
  if (typeof body.vinculo === "string") updates.vinculo = body.vinculo;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: "Nenhum campo para atualizar" },
      { status: 400 },
    );
  }

  try {
    const data = await updateTecnico(nomeAntigo, updates);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return respondError(err);
  }
}

// DELETE — remove técnico. Body: { nome: string }.
export async function DELETE(request: NextRequest) {
  let body: { nome?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido" },
      { status: 400 },
    );
  }

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  if (!nome) {
    return NextResponse.json(
      { success: false, error: "Campo 'nome' é obrigatório" },
      { status: 400 },
    );
  }

  try {
    await deleteTecnico(nome);
    return NextResponse.json({ success: true });
  } catch (err) {
    return respondError(err);
  }
}
