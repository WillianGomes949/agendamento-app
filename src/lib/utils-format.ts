// src/lib/utils-format.ts
// Utilitários de formatação de data e hora

/**
 * Formata uma string de data do GAS (DD/MM/YYYY) para exibição
 * ou converte um objeto Date para string formatada
 */
export function formatarDataExibicao(dataInput: string | Date | null | undefined): string {
  if (!dataInput) return "Data não informada";

  let date: Date;

  if (typeof dataInput === "string") {
    // Já está no formato DD/MM/YYYY?
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataInput)) {
      return dataInput;
    }
    // Tenta converter de ISO ou outro formato
    date = new Date(dataInput);
  } else {
    date = dataInput;
  }

  if (isNaN(date.getTime())) {
    return String(dataInput);
  }

  // ✅ SEMPRE retorna DD/MM/YYYY com zeros
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formata uma string de horário (HH:MM) para exibição
 */
export function formatarHorarioExibicao(horario: string | Date | null | undefined): string {
  if (!horario) return "Horário não informado";

  // Se é Date, extrai horas e minutos
  if (horario instanceof Date) {
    const hours = String(horario.getHours()).padStart(2, "0");
    const minutes = String(horario.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // Se é string, procura padrão HH:MM
  const match = String(horario).match(/(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }

  return String(horario);
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

  // Data: garante string DD/MM/YYYY
  if (servico.data) {
    sanitizado.data = formatarDataExibicao(servico.data as string | Date);
  }

  // Horário: garante string HH:MM
  if (servico.horario) {
    sanitizado.horario = formatarHorarioExibicao(servico.horario as string | Date);
  }

  // ISO strings para timestamps
  if (servico.criadoEm instanceof Date) {
    sanitizado.criadoEm = servico.criadoEm.toISOString();
  }
  if (servico.atualizadoEm instanceof Date) {
    sanitizado.atualizadoEm = servico.atualizadoEm.toISOString();
  }

  return sanitizado;
}