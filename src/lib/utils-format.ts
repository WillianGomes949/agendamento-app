// src/lib/utils-format.ts
// Utilitários de formatação de data e hora

/**
 * Formata uma string de data do GAS (DD/MM/YYYY) para exibição
 * ou converte um objeto Date para string formatada
 */
export function formatarDataExibicao(dataInput: string | Date | null | undefined): string {
  if (!dataInput) return "Data não informada";

  // Se já é string no formato DD/MM/YYYY, retorna direto
  if (typeof dataInput === "string") {
    // Verifica se está no formato brasileiro
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataInput)) {
      return dataInput;
    }
    // Se é ISO string, converte
    try {
      const date = new Date(dataInput);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      }
    } catch {
      return String(dataInput);
    }
  }

  // Se é objeto Date
  if (dataInput instanceof Date) {
    return dataInput.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }

  return String(dataInput);
}

/**
 * Formata uma string de horário (HH:MM) para exibição
 */
export function formatarHorarioExibicao(horarioInput: string | Date | null | undefined): string {
  if (!horarioInput) return "Horário não informado";

  // Se já é string no formato HH:MM, retorna direto
  if (typeof horarioInput === "string") {
    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(horarioInput)) {
      return horarioInput;
    }
    // Se é ISO string com hora, extrai apenas HH:MM
    try {
      const date = new Date(horarioInput);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false
        });
      }
    } catch {
      return String(horarioInput);
    }
  }

  // Se é objeto Date
  if (horarioInput instanceof Date) {
    return horarioInput.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  return String(horarioInput);
}

/**
 * Combina data e horário para exibição legível
 */
export function formatarDataHoraCompleta(
  dataInput: string | Date | null | undefined,
  horarioInput: string | Date | null | undefined,
  diaSemana?: string
): string {
  const data = formatarDataExibicao(dataInput);
  const horario = formatarHorarioExibicao(horarioInput);

  let resultado = data;
  if (diaSemana) {
    resultado += ` • ${diaSemana}`;
  }
  if (horario && horario !== "Horário não informado") {
    resultado += ` às ${horario}`;
  }

  return resultado;
}

/**
 * Sanitiza dados do GAS garantindo que data e horário permaneçam como strings
 * Usado no useServicos para evitar que o JavaScript converta para Date
 */
export function sanitizarDadosGAS(servico: Record<string, unknown>): Record<string, unknown> {
  const sanitizado = { ...servico };

  // Garante que data permaneça como string
  if (servico.data && typeof servico.data !== "string") {
    sanitizado.data = formatarDataExibicao(servico.data as string | Date);
  }

  // Garante que horário permaneça como string
  if (servico.horario && typeof servico.horario !== "string") {
    sanitizado.horario = formatarHorarioExibicao(servico.horario as string | Date);
  }

  // Garante que criadoEm e atualizadoEm sejam strings ISO
  if (servico.criadoEm && servico.criadoEm instanceof Date) {
    sanitizado.criadoEm = (servico.criadoEm as Date).toISOString();
  }
  if (servico.atualizadoEm && servico.atualizadoEm instanceof Date) {
    sanitizado.atualizadoEm = (servico.atualizadoEm as Date).toISOString();
  }

  return sanitizado;
}