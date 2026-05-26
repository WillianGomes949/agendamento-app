// src/app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

// ✅ Server Actions agora apenas revalidam cache
// O fetch real é feito pelo Client Component via gas-api.ts

export async function revalidateServicos() {
  revalidatePath("/agendamentos");
}

export async function revalidateServico(id: string) {
  revalidatePath("/agendamentos");
  revalidatePath(`/agendamentos/${id}`);
}