import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { fetchGas } from "@/lib/gas/client";
import { GAS_ACTIONS } from "@/lib/gas/types";
import {
  normalizarListaTecnicos,
  normalizarTecnico,
  type Tecnico,
  type TecnicoStats,
} from "./tecnicos.types";

export const getTecnicosComStats = unstable_cache(
  async (): Promise<TecnicoStats[]> => {
    const result = await fetchGas<TecnicoStats[]>("GET_TECNICOS_COM_STATS");
    return result.data ?? [];
  },
  ["tecnicos-com-stats"],
  { revalidate: 30, tags: ["tecnicos"] },
);

export async function getTecnicos(): Promise<Tecnico[]> {
  return normalizarListaTecnicos(
    (await getTecnicosComStats()).map((t) => ({
      nome: t.nome,
      ativo: t.ativo,
    })),
  );
}

export async function createTecnico(input: {
  nome: string;
  cpf?: string;
  cnpj?: string;
  whatsapp?: string;
  vinculo?: string;
}): Promise<Tecnico> {
  const result = await fetchGas<Tecnico>(GAS_ACTIONS.CREATE_TECNICO, input);
  revalidateTag("tecnicos", "max");
  const tecnico = normalizarTecnico(result.data);
  if (!tecnico) throw new Error("Resposta inválida ao criar técnico.");
  return tecnico;
}

export async function updateTecnico(
  nomeAntigo: string,
  updates: Partial<Omit<Tecnico, "nome">> & { nome?: string },
): Promise<Tecnico> {
  const result = await fetchGas<Tecnico>(GAS_ACTIONS.UPDATE_TECNICO, {
    nomeAntigo,
    ...updates,
  });
  revalidateTag("tecnicos", "max");
  const tecnico = normalizarTecnico(result.data);
  if (!tecnico) throw new Error("Resposta inválida ao atualizar técnico.");
  return tecnico;
}

export async function deleteTecnico(nome: string): Promise<void> {
  await fetchGas(GAS_ACTIONS.DELETE_TECNICO, { nome });
  revalidateTag("tecnicos", "max");
}
