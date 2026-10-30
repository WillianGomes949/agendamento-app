// src/app/api/usuarios/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  getUsuarios,
  getUsuariosComStats,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from "@/lib/api/usuarios.server";
import {
  normalizarUsuario,
  normalizarListaUsuarios,
} from "@/lib/api/usuarios.types";
import { apiErrorToResponse } from "@/lib/Api-agendamento/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const stats = request.nextUrl.searchParams.get("stats") === "1";
    const data = stats
      ? ((await getUsuariosComStats()).data ?? [])
      : ((await getUsuarios()).data ?? []);
    return NextResponse.json({
      success: true,
      data: stats ? data : normalizarListaUsuarios(data),
    });
  } catch (error) {
    const { status, body } = apiErrorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createUsuario(body);
    revalidateTag("usuarios", "max");
    return NextResponse.json(
      {
        success: true,
        data: normalizarUsuario(result.data),
      },
      { status: 201 },
    );
  } catch (error) {
    const { status, body } = apiErrorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateUsuario(body);
    revalidateTag("usuarios", "max");
    return NextResponse.json({
      success: true,
      data: normalizarUsuario(result.data),
    });
  } catch (error) {
    const { status, body } = apiErrorToResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    await deleteUsuario(body);
    revalidateTag("usuarios", "max");
    return NextResponse.json({
      success: true,
      data: { message: "Usuário removido" },
    });
  } catch (error) {
    const { status, body } = apiErrorToResponse(error);
    return NextResponse.json(body, { status });
  }
}