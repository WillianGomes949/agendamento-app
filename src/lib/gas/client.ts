// src/lib/gas/client.ts
// Cliente HTTP único para o Google Apps Script.
// ⚠️ Este módulo é SERVER-ONLY — nunca importe em Client Components.
// Para consumir do cliente, use fetch("/api/...").

import "server-only";

import { GasApiError, GasConfigError, GasTransportError } from "./errors";
import type { GasRequestPayload, GasResponse } from "./types";

const GAS_URL = process.env.GAS_URL ?? "";
const API_KEY = process.env.GAS_API_KEY ?? "";

export async function fetchGas<T = unknown>(
  action: string,
  data: Record<string, unknown> = {},
): Promise<GasResponse<T>> {
  if (!GAS_URL) {
    throw new GasConfigError("GAS_URL não configurada no ambiente.");
  }

  const url = new URL(GAS_URL);
  if (API_KEY) url.searchParams.set("key", API_KEY);

  const payload: GasRequestPayload = { action, data };

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (cause) {
    throw new GasTransportError(
      "Falha de rede ao contatar o Apps Script.",
      cause,
    );
  }

  const raw = await response.text();

  if (!response.ok) {
    throw new GasTransportError(
      `HTTP ${response.status} do Apps Script: ${raw.substring(0, 200)}`,
    );
  }

  let parsed: GasResponse<T>;
  try {
    parsed = JSON.parse(raw) as GasResponse<T>;
  } catch (cause) {
    throw new GasTransportError(
      `Resposta não-JSON do Apps Script: ${raw.substring(0, 200)}`,
      cause,
    );
  }

  const logicalStatus = parsed._httpStatus ?? 200;
  if (logicalStatus >= 400 || parsed.success === false) {
    throw new GasApiError(
      parsed.error ?? "Erro desconhecido do servidor",
      logicalStatus,
      { details: parsed.details, requestId: parsed.requestId },
    );
  }

  return parsed;
}

export function gasErrorToResponse(err: unknown): {
  body: Record<string, unknown>;
  status: number;
} {
  if (err instanceof GasApiError) {
    return {
      status: err.status,
      body: {
        success: false,
        error: err.message,
        details: err.details,
        requestId: err.requestId,
      },
    };
  }

  if (err instanceof GasTransportError) {
    return {
      status: 502,
      body: { success: false, error: err.message },
    };
  }

  if (err instanceof GasConfigError) {
    return {
      status: 500,
      body: { success: false, error: err.message },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      error: err instanceof Error ? err.message : "Erro interno",
    },
  };
}
