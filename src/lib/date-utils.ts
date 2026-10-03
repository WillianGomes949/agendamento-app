import { parse, format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Converte "DD/MM/YYYY" (da API) para objeto Date
export const parseBrDate = (brDate: string): Date | null => {
  if (!brDate) return null;
  const parsed = parse(brDate, 'dd/MM/yyyy', new Date());
  return isValid(parsed) ? parsed : null;
};

// Converte objeto Date para "DD/MM/YYYY" (para a API)
export const formatToBrDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy');
};

// Formata para exibição na UI
export const formatDateForDisplay = (date: Date | null): string => {
    if (!date) return 'Data inválida';
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}