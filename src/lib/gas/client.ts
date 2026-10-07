// src/lib/gas/client.ts
// ⚠️ Este módulo é SERVER-ONLY (nunca será enviado ao navegador)
import "server-only";

import { GasApiError, GasConfigError, GasTransportError } from "./errors";
import type { GasRequestPayload, GasResponse } from "./types";

const WP_API_URL = process.env.NEXT_PUBLIC_WP_API_URL;
const WP_API_KEY = process.env.WP_API_KEY;

export async function fetchGas<T = unknown>(
  action: string,
  data: Record<string, unknown> = {}
): Promise<GasResponse<T>> {
  // 1. Verificação de segurança
  if (!WP_API_URL || !WP_API_KEY) {
    console.error("❌ ERRO CRÍTICO: NEXT_PUBLIC_WP_API_URL ou WP_API_KEY não estão definidas no .env.local");
    throw new GasConfigError("Configuração do servidor incompleta. Verifique o .env.local e reinicie o servidor.");
  }

  // 2. Injeta a chave secreta diretamente no payload (100% seguro no servidor)
  const payload: GasRequestPayload = { action, data, apiKey: WP_API_KEY };

  let response: Response;
  try {
    // 3. Chama o WordPress DIRETAMENTE do servidor Next.js
    response = await fetch(`${WP_API_URL}/executar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (cause) {
    console.error("❌ Erro de rede ao conectar com WordPress:", cause);
    throw new GasTransportError("Falha de rede ao contatar o servidor de agendamentos.", cause);
  }

  const raw = await response.text();

  if (!response.ok) {
    console.error(`❌ Erro HTTP ${response.status} do WordPress:`, raw.substring(0, 300));
    throw new GasTransportError(`HTTP ${response.status} do servidor: ${raw.substring(0, 200)}`);
  }

  let parsed: GasResponse<T>;
  try {
    parsed = JSON.parse(raw) as GasResponse<T>;
  } catch (cause) {
    console.error("❌ Resposta não-JSON do WordPress:", raw.substring(0, 300));
    throw new GasTransportError(`Resposta não-JSON do servidor: ${raw.substring(0, 200)}`, cause);
  }

  const logicalStatus = parsed._httpStatus ?? 200;
  if (logicalStatus >= 400 || parsed.success === false) {
    throw new GasApiError(
      parsed.error ?? "Erro desconhecido do servidor",
      logicalStatus,
      { details: parsed.details, requestId: parsed.requestId }
    );
  }

  return parsed;
}

export function gasErrorToResponse(err: unknown): { body: Record<string, unknown>; status: number } {
  if (err instanceof GasApiError) {
    return { status: err.status, body: { success: false, error: err.message, details: err.details, requestId: err.requestId } };
  }
  if (err instanceof GasTransportError) {
    return { status: 502, body: { success: false, error: err.message } };
  }
  if (err instanceof GasConfigError) {
    return { status: 500, body: { success: false, error: err.message } };
  }
  return { status: 500, body: { success: false, error: err instanceof Error ? err.message : "Erro interno" } };
}