import { NextRequest, NextResponse } from "next/server";
import { getHorariosOcupados } from "@/lib/api/servicos.server";
import { apiErrorToResponse } from "@/lib/Api-agendamento/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tecnico = searchParams.get("tecnico") ?? "";
  const data = searchParams.get("data") ?? "";
  const excludeId = searchParams.get("excludeId") ?? undefined;

  if (!tecnico || !data) {
    return NextResponse.json(
      { success: false, error: "tecnico e data são obrigatórios" },
      { status: 400 },
    );
  }

  try {
    const ocupados = await getHorariosOcupados({ tecnico, data, excludeId });
    return NextResponse.json({ success: true, data: ocupados });
  } catch (err) {
    const { body, status } = apiErrorToResponse(err);
    return NextResponse.json(body, { status });
  }
}