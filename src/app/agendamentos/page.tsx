// src/app/agendamentos/page.tsx
"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useServicos } from "@/hooks/useServicos";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Plus,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Car,
  User,
  Wrench,
  CheckCircle,
  X,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/features/StatusBadge";
import ServicoForm from "@/components/modals/ServicoForm";
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { FloatingActionButton } from "@/components/features/FloatingActionButton";
import { Toaster, toast } from "react-hot-toast";
import type { Servico, FormularioServico } from "@/lib/types";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useErrorModal } from "@/hooks/useErrorModal";
import { ErrorModal } from "@/components/modals/ErrorModal";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const normalizeStatus = (s?: string) =>
  (s || "pendente")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, " ")
    .trim();

const STATUS_CLASS: Record<string, string> = {
  pendente: "ev-pendente",
  "em andamento": "ev-andamento",
  concluido: "ev-concluido",
  cancelado: "ev-cancelado",
};

const parseBrDate = (brDate: string): Date | null => {
  if (!brDate || !/^\d{2}\/\d{2}\/\d{4}$/.test(brDate)) return null;
  const [day, month, year] = brDate.split("/").map(Number);
  return new Date(year, month - 1, day);
};

const parseHorario = (horario: string) => {
  const [h, m] = (horario || "00:00").split(":").map(Number);
  return { hours: h || 0, minutes: m || 0 };
};

export default function AgendamentosPage() {
  const {
    servicos,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isDeleting,
  } = useServicos();

  const [view, setView] = useState<ViewType>("month");
  const [date, setDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [deletingServico, setDeletingServico] = useState<Servico | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Servico | null>(null);
  const { errorModal, showError, closeModal } = useErrorModal();

  const eventStyleGetter = useCallback(
    (event: any) => ({
      className:
        STATUS_CLASS[normalizeStatus(event.resource?.status)] ?? "ev-pendente",
    }),
    [],
  );

  useEffect(() => {
    if (!selectedEvent) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedEvent(null);
    };

    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [selectedEvent]);

  const events = useMemo(() => {
    return servicos
      .filter((s) => s.status?.toLowerCase() !== "deletado")
      .map((servico) => {
        const dateObj = parseBrDate(servico.data);
        if (!dateObj) return null;
        const { hours, minutes } = parseHorario(servico.horario);
        const start = new Date(dateObj);
        start.setHours(hours, minutes, 0, 0);
        const end = new Date(start);
        end.setHours(hours + 1, minutes, 0, 0);
        return {
          id: servico.id,
          title: servico.cliente?.nome || "Sem cliente",
          start,
          end,
          resource: servico,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      title: string;
      start: Date;
      end: Date;
      resource: Servico;
    }>;
  }, [servicos]);

  const metricas = useMemo(() => {
    const ativos = servicos.filter(
      (s) => s.status?.toLowerCase() !== "deletado",
    );
    const hoje = new Date();
    return {
      total: ativos.length,
      hoje: ativos.filter((s) => {
        const [d, m, y] = (s.data || "").split("/").map(Number);
        return (
          d === hoje.getDate() &&
          m === hoje.getMonth() + 1 &&
          y === hoje.getFullYear()
        );
      }).length,
      pendentes: ativos.filter((s) => s.status?.toLowerCase() === "pendente")
        .length,
      concluidos: ativos.filter(
        (s) =>
          s.status
            ?.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") === "concluido",
      ).length,
    };
  }, [servicos]);

  const EventComponent = useCallback(
  ({ event }: { event: any }) => {
    const tecnico: string = event.resource?.tecnico || "";
    const inicial = tecnico.trim().charAt(0).toUpperCase() || "?";

    return (
      <div className="flex items-center gap-1.5 overflow-hidden">
        <span
          title={tecnico || "Sem técnico"}
          className="shrink-0 w-4 h-4 rounded-full bg-black/15 dark:bg-white/15 text-[9px] font-bold flex items-center justify-center"
        >
          {inicial}
        </span>
        <span className="truncate flex-1">{event.title}</span>
        <span className="text-[10px] opacity-80 font-mono bg-black/10 dark:bg-white/10 px-1 rounded">
          {event.resource?.horario || "S/H"}
        </span>
      </div>
    );
  },
  [],
);

  const handleSelectEvent = useCallback(
    (event: any) => setSelectedEvent(event.resource as Servico),
    [],
  );

  const handleSelectSlot = useCallback(
    (slotInfo: any) => {
      setDate(slotInfo.start);
      if (view === "month") setView("day");
    },
    [view],
  );

  const handleNavigate = useCallback((newDate: Date) => setDate(newDate), []);

  const calendarTitle = useMemo(
    () => format(date, "MMMM yyyy", { locale: ptBR }),
    [date],
  );

  const handleCreate = useCallback(
    async (data: FormularioServico) => {
      const result = await create(data);
      if (result.success) {
        toast.success("Serviço criado com sucesso!");
        setIsFormOpen(false);
      } else {
        // Mostra o modal estilizado em vez do toast
        showError(result.error || "Erro ao criar serviço");
      }
    },
    [create, showError],
  );

  const handleUpdate = useCallback(
    async (id: string, data: Partial<Servico>) => {
      const result = await update(id, data);
      if (result.success) {
        toast.success("Serviço atualizado!");
        setEditingServico(null);
        setIsFormOpen(false);
      } else {
        showError(result.error || "Erro ao atualizar");
      }
    },
    [update, showError],
  );

  const handleDelete = useCallback(async () => {
    if (!deletingServico) return;
    const result = await remove(deletingServico.id);
    if (result.success) {
      toast.success("Serviço removido!");
      setDeletingServico(null);
    } else {
      showError(result.error || "Erro ao remover");
    }
  }, [remove, deletingServico, showError]);
  const openEditForm = useCallback((servico: Servico) => {
    setEditingServico(servico);
    setIsFormOpen(true);
    setSelectedEvent(null);
  }, []);

  if (loading && servicos.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 w-12 h-12 mb-4" />
        <p className="text-text-muted font-medium">Carregando sua agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400" />
        </div>
        <h2 className="text-xl font-bold text-text">Ops! Algo deu errado</h2>
        <p className="text-text-muted mt-2 text-sm max-w-xs">{error}</p>
        <Button variant="outline" className="mt-6 min-h-11" onClick={refresh}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const views = ["month", "week", "day", "agenda"] as const;
  type ViewType = (typeof views)[number];

  const viewLabels: Record<ViewType, string> = {
    month: "Mês",
    week: "Semana",
    day: "Dia",
    agenda: "Lista",
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-28 md:pb-8 max-w-7xl mx-auto"
    >
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            "shadow-xl rounded-2xl font-medium text-sm border border-border",
          duration: 3000,
        }}
      />

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Agenda
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Planeje e gerencie seus serviços.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingServico(null);
            setIsFormOpen(true);
          }}
          className="hidden sm:flex items-center gap-2 min-h-11"
        >
          <Plus className="w-5 h-5" /> Novo Serviço
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 px-4 sm:px-0"
      >
        {[
          {
            icon: CalendarIcon,
            label: "Total",
            value: metricas.total,
            bg: "bg-blue-50 dark:bg-blue-950/30",
            text: "text-blue-600 dark:text-blue-400",
            border: "border-blue-100 dark:border-blue-900/50",
          },
          {
            icon: CheckCircle,
            label: "Hoje",
            value: metricas.hoje,
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-100 dark:border-emerald-900/50",
          },
          {
            icon: Clock,
            label: "Pendentes",
            value: metricas.pendentes,
            bg: "bg-amber-50 dark:bg-amber-950/30",
            text: "text-amber-600 dark:text-amber-400",
            border: "border-amber-100 dark:border-amber-900/50",
          },
          {
            icon: Wrench,
            label: "Concluídos",
            value: metricas.concluidos,
            bg: "bg-indigo-50 dark:bg-indigo-950/30",
            text: "text-indigo-600 dark:text-indigo-400",
            border: "border-indigo-100 dark:border-indigo-900/50",
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            className={`p-4 flex items-center gap-4 hoverable group active:scale-[0.98] transition-transform border ${kpi.border} shadow-sm hover:shadow-md`}
          >
            <div
              className={`p-3 ${kpi.bg} ${kpi.text} rounded-xl group-hover:scale-110 transition-transform duration-300`}
            >
              <kpi.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-0.5">
                {kpi.label}
              </p>
              <p className="text-xl sm:text-2xl font-black text-text leading-none">
                {kpi.value}
              </p>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Calendário Area */}
      <motion.div variants={itemVariants} className="px-4 sm:px-0">
        <Card className="p-0 overflow-hidden shadow-sm border border-border bg-bg-elevated">
          {/* Toolbar Customizada */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 border-b border-border bg-bg-muted/50">
            {/* Navegação de Meses/Dias */}
            <div className="flex items-center justify-between w-full lg:w-auto gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
                }
                className="min-h-11 min-w-11 rounded-xl bg-bg-elevated"
              >
                <ChevronLeft className="w-5 h-5 text-text-muted" />
              </Button>
              <div className="flex flex-col items-center min-w-35">
                <h2 className="text-lg font-bold text-text capitalize leading-tight">
                  {calendarTitle}
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
                }
                className="min-h-11 min-w-11 rounded-xl bg-bg-elevated"
              >
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </Button>
            </div>

            {/* Ações e Seletor de View */}
            <div className="flex flex-col md:flex-row items-end gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0">
              <Button
                variant="outline"
                onClick={() => setDate(new Date())}
                className="min-h-10 bg-bg-elevated whitespace-nowrap shrink-0"
              >
                Ir para Hoje
              </Button>
              <div className="flex bg-bg-muted p-1 rounded-xl shrink-0 border border-border">
                {views.map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                      view === v
                        ? "bg-bg-elevated text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-border"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    {viewLabels[v]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Container do RBC */}
          <div className="rbc-custom h-[60vh] sm:h-[70vh]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={(newView) => setView(newView as ViewType)}
              date={date}
              onNavigate={handleNavigate}
              eventPropGetter={eventStyleGetter}
              components={{ event: EventComponent }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              popup
              messages={{
                today: "Hoje",
                previous: "Anterior",
                next: "Próximo",
                month: "Mês",
                week: "Semana",
                day: "Dia",
                agenda: "Agenda",
                date: "Data",
                time: "Hora",
                event: "Evento",
                noEventsInRange: "Nenhum serviço neste período",
                showMore: (total: number) => `+${total} serviços`,
              }}
              formats={{
                monthHeaderFormat: (d) =>
                  format(d, "MMMM yyyy", { locale: ptBR }),
                weekdayFormat: (d) => format(d, "EEE", { locale: ptBR }),
                dayFormat: (d) => format(d, "dd", { locale: ptBR }),
                dayHeaderFormat: (d) =>
                  format(d, "EEEE, dd 'de' MMMM", { locale: ptBR }),
                agendaDateFormat: (d) =>
                  format(d, "dd/MM/yyyy", { locale: ptBR }),
                agendaTimeFormat: (d) => format(d, "HH:mm", { locale: ptBR }),
                agendaTimeRangeFormat: ({ start, end }) =>
                  `${format(start, "HH:mm", { locale: ptBR })} - ${format(end, "HH:mm", { locale: ptBR })}`,
              }}
            />
          </div>
        </Card>
      </motion.div>

      {/* Modal (Mobile + Desktop) */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedEvent(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-bg-elevated rounded-2xl border border-border shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border bg-bg-elevated/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-bg-muted border border-border rounded-xl">
                    <Car className="w-5 h-5 text-text-muted" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-text leading-tight">
                      {selectedEvent.cliente?.nome || "Cliente não informado"}
                    </h3>
                    <p className="text-xs sm:text-sm text-text-muted font-mono font-medium tracking-wide">
                      {selectedEvent.veiculo?.placa || "S/ PLACA"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 rounded-xl hover:bg-bg-muted transition-colors text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-accent"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
                <div className="flex justify-end">
                  <StatusBadge status={selectedEvent.status || "pendente"} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg-muted p-4 rounded-2xl border border-border">
                  <div className="flex items-center gap-3 text-text">
                    <CalendarIcon className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-text-muted uppercase">
                        Data & Hora
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedEvent.data} às {selectedEvent.horario}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-text">
                    <User className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-text-muted uppercase">
                        Técnico
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedEvent.tecnico || "Não atribuído"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-text">
                    <MapPin className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-text-muted uppercase">
                        Local
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedEvent.endereco?.cidade || "Não informada"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-text">
                    <Wrench className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-text-muted uppercase">
                        Serviço
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedEvent.tipoServico || "Não especificado"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedEvent.observacao && (
                  <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 rounded-2xl text-sm text-amber-900 dark:text-amber-200">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                      Observações:
                    </span>
                    {selectedEvent.observacao}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 sm:px-6 py-4 border-t border-border bg-bg-muted shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeletingServico(selectedEvent);
                    setSelectedEvent(null);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-700 dark:hover:text-rose-300"
                >
                  <Trash2 className="w-4 h-4" /> Excluir Registro
                </Button>
                <Button
                  onClick={() => openEditForm(selectedEvent)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" /> Editar Serviço
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB (Apenas Mobile) */}
      <div className="sm:hidden fixed bottom-6 right-6 z-30">
        <FloatingActionButton
          onClick={() => {
            setEditingServico(null);
            setIsFormOpen(true);
          }}
        />
      </div>

      <ServicoForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingServico(null);
        }}
        onSubmit={
          editingServico
            ? (data) => handleUpdate(editingServico.id, data)
            : handleCreate
        }
        initialData={editingServico}
        isLoading={isCreating || isUpdating}
      />

      <DeleteConfirmModal
        isOpen={!!deletingServico}
        onClose={() => setDeletingServico(null)}
        onConfirm={handleDelete}
        title="Excluir serviço"
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        itemName={deletingServico?.cliente?.nome || "este serviço"}
        isLoading={isDeleting}
      />
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={closeModal}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
        httpStatus={errorModal.httpStatus}
      />
    </motion.div>
  );
}
