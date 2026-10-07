// src/app/api/health/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const wpUrl = process.env.NEXT_PUBLIC_WP_API_URL;
  const apiKey = process.env.WP_API_KEY;

  if (!wpUrl || !apiKey) {
    return NextResponse.json({ status: "offline", message: "Configuração ausente" }, { status: 500 });
  }

  try {
    const response = await fetch(`${wpUrl}/health?key=${apiKey}`, {
      method: "GET",
      cache: "no-store",
    });
    
    if (response.ok) {
      return NextResponse.json({ status: "online" });
    }
    return NextResponse.json({ status: "offline" }, { status: 502 });
  } catch {
    return NextResponse.json({ status: "offline" }, { status: 502 });
  }
}