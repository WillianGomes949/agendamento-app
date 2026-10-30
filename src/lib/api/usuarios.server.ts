// src/lib/api/usuarios.server.ts
import "server-only";
import { fetchApi } from "@/lib/Api-agendamento/client";
import { API_ACTIONS } from "@/lib/Api-agendamento/types";
import type { ApiResponse } from "@/lib/Api-agendamento/types";

export async function getUsuarios(): Promise<ApiResponse<unknown[]>> {
  return fetchApi<unknown[]>(API_ACTIONS.GET_USUARIOS);
}

export async function getUsuariosComStats(): Promise<ApiResponse<unknown[]>> {
  return fetchApi<unknown[]>(API_ACTIONS.GET_USUARIOS_COM_STATS);
}

export async function createUsuario<T = unknown>(
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(API_ACTIONS.CREATE_USUARIO, payload);
}

export async function updateUsuario<T = unknown>(
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(API_ACTIONS.UPDATE_USUARIO, payload);
}

export async function deleteUsuario<T = unknown>(
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return fetchApi<T>(API_ACTIONS.DELETE_USUARIO, payload);
}