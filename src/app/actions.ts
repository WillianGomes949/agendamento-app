// src/app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import {
  getServicos,
  createServico,
  updateServico,
  deleteServico,
} from "@/lib/gas-api";
import type { Servico, FormularioServico } from "@/lib/types";

export async function fetchServicos(): Promise<Servico[]> {
  const res = await getServicos();
  return Array.isArray(res) ? res : res?.data || [];
}

export async function criarServico(data: FormularioServico): Promise<void> {
  await createServico({
    ...data,
    status: "pendente",
  });
  revalidatePath("/agendamentos");
}

export async function atualizarServico(
  id: number,
  data: Partial<Servico>,
): Promise<void> {
  await updateServico({ id, ...data });
  revalidatePath("/agendamentos");
  revalidatePath(`/agendamentos/${id}`);
}

export async function removerServico(id: number): Promise<void> {
  await deleteServico(id);
  revalidatePath("/agendamentos");
}
