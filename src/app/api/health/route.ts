// src/app/api/health/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const wpUrl = process.env.NEXT_PUBLIC_WP_API_URL;
  const apiKey = process.env.WP_API_KEY;

  if (!wpUrl || !apiKey) {
    console.error("[health] Config ausente:", { wpUrl: !!wpUrl, apiKey: !!apiKey });
    return NextResponse.json(
      { status: "offline", message: "Configuração ausente" },
      { status: 500 }
    );
  }

  const base = wpUrl.replace(/\/+$/, "");
  const url = `${base}/health`;

  try {
    console.log("[health] Chamando:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const texto = await response.text();
    console.log("[health] Status WP:", response.status);
    console.log("[health] Body WP:", texto.slice(0, 500));

    if (!response.ok) {
      return NextResponse.json(
        { status: "offline", wpStatus: response.status, wpBody: texto.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = JSON.parse(texto);
    if (data?.success === true && data?.data?.status === "online") {
      return NextResponse.json({ status: "online" });
    }
    return NextResponse.json({ status: "offline", reason: "payload inesperado" }, { status: 502 });
  } catch (err) {
    console.error("[health] Exceção:", err);
    return NextResponse.json(
      { status: "offline", error: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    );
  }
}