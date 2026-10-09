import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getTecnicosComStatsCached,
  createTecnico,
  updateTecnico,
  deleteTecnico,
  getTecnicos,
} from "@/lib/api/tecnicos.server";
import { normalizarTecnico, normalizarListaTecnicos } from "@/lib/api/tecnicos.types";
import { apiErrorToResponse } from "@/lib/Api-agendamento/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const stats = request.nextUrl.searchParams.get("stats") === "1";
    const data = stats
      ? await getTecnicosComStatsCached()
      : (await getTecnicos()).data ?? [];

    return NextResponse.json({
      success: true,
      data: stats ? data : normalizarListaTecnicos(data),
    });
  } catch (error) {
    const { status, body } = apiErrorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createTecnico(body);
    // ✅ CORRIGIDO: removido o segundo argumento " " (profile inexistente),
    // que fazia a invalidação NUNCA atingir o cache com a tag "tecnicos"
    revalidateTag("tecnicos");
    return NextResponse.json({
      success: true,
      data: normalizarTecnico(result.data),
    }, { status: 201 });
  } catch (error) {
    const { status, body } = apiErrorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateTecnico(body);
    revalidateTag("tecnicos");
    return NextResponse.json({
      success: true,
      data: normalizarTecnico(result.data),
    });
  } catch (error) {
    const { status, body } = apiErrorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    await deleteTecnico(body);
    revalidateTag("tecnicos");
    return NextResponse.json({ success: true, data: { message: "Técnico removido" } });
  } catch (error) {
    const { status, body } = apiErrorToResponse(error);
    return NextResponse.json(body, { status });
  }
}