"use client";
import "./calendar-custom.css";
import { useState, useMemo, useCallback } from "react";
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
import { Calendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";

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

const STATUS_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  pendente: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
  "em andamento": { bg: "#e0e7ff", border: "#6366f1", text: "#3730a3" },
  concluido: { bg: "#d1fae5", border: "#10b981", text: "#065f46" },
  cancelado: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
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
    setFilters,
  } = useServicos();

  const [view, setView] = useState<ViewType>("month");
  const [date, setDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [deletingServico, setDeletingServico] = useState<Servico | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Servico | null>(null);

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

  const eventStyleGetter = useCallback((event: any) => {
    const status = (event.resource?.status || "pendente").toLowerCase();
    const colors = STATUS_COLORS[status] || STATUS_COLORS.pendente;
    return {
      style: {
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        color: colors.text,
        borderRadius: "6px",
        padding: "4px 8px",
        fontSize: "12px",
        fontWeight: 600,
        border: "none",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        overflow: "hidden",
        whiteSpace: "nowrap",
      },
    };
  }, []);

  const EventComponent = useCallback(
    ({ event }: { event: any }) => (
      <div className="flex items-center gap-1.5 overflow-hidden">
        <span className="truncate flex-1">{event.title}</span>
        <span className="text-[10px] opacity-80 font-mono bg-white/30 px-1 rounded">
          {event.resource?.horario || "S/H"}
        </span>
      </div>
    ),
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
      result.success
        ? toast.success("Serviço criado com sucesso!")
        : toast.error(result.error || "Erro ao criar");
      setIsFormOpen(false);
    },
    [create],
  );
  const handleUpdate = useCallback(
    async (id: string, data: Partial<Servico>) => {
      const result = await update(id, data);
      result.success
        ? toast.success("Serviço atualizado!")
        : toast.error(result.error || "Erro ao atualizar");
      setEditingServico(null);
      setIsFormOpen(false);
    },
    [update],
  );
  const handleDelete = useCallback(async () => {
    if (!deletingServico) return;
    const result = await remove(deletingServico.id);
    result.success
      ? toast.success("Serviço removido!")
      : toast.error(result.error || "Erro ao remover");
    setDeletingServico(null);
    setSelectedEvent(null);
  }, [remove, deletingServico]);

  const openEditForm = useCallback((servico: Servico) => {
    setEditingServico(servico);
    setIsFormOpen(true);
    setSelectedEvent(null);
  }, []);

  if (loading && servicos.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-blue-600 w-12 h-12 mb-4" />
        <p className="text-slate-500 font-medium">Carregando sua agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-100/50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Ops! Algo deu errado
        </h2>
        <p className="text-slate-500 mt-2 text-sm max-w-xs">{error}</p>
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
            "shadow-xl rounded-2xl font-medium text-sm border border-slate-100",
          duration: 3000,
        }}
      />

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-0"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Agenda
          </h1>
          <p className="text-slate-500 text-sm mt-1">
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
            color: "blue",
            bg: "bg-blue-50",
            text: "text-blue-600",
            border: "border-blue-100",
          },
          {
            icon: CheckCircle,
            label: "Hoje",
            value: metricas.hoje,
            color: "emerald",
            bg: "bg-emerald-50",
            text: "text-emerald-600",
            border: "border-emerald-100",
          },
          {
            icon: Clock,
            label: "Pendentes",
            value: metricas.pendentes,
            color: "amber",
            bg: "bg-amber-50",
            text: "text-amber-600",
            border: "border-amber-100",
          },
          {
            icon: Wrench,
            label: "Concluídos",
            value: metricas.concluidos,
            color: "indigo",
            bg: "bg-indigo-50",
            text: "text-indigo-600",
            border: "border-indigo-100",
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
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                {kpi.label}
              </p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-none">
                {kpi.value}
              </p>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Calendário Area */}
      <motion.div variants={itemVariants} className="px-4 sm:px-0">
        <Card className="p-0 overflow-hidden shadow-sm border border-slate-200/60 bg-white">
          {/* Toolbar Customizada Unificada (Resolve a sobreposição e melhora o responsivo) */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
            {/* Navegação de Meses/Dias */}
            <div className="flex items-center justify-between w-full lg:w-auto gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
                }
                className="min-h-11 min-w-11 rounded-xl bg-white"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </Button>

              <div className="flex flex-col items-center min-w-35">
                <h2 className="text-lg font-bold text-slate-900 capitalize leading-tight">
                  {calendarTitle}
                </h2>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
                }
                className="min-h-11 min-w-11 rounded-xl bg-white"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </Button>
            </div>

            {/* Ações e Seletor de View */}
            <div className="flex flex-col md:flex-row items-end gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 lg:pb-0">
              <Button
                variant="outline"
                onClick={() => setDate(new Date())}
                className="min-h-10 bg-white whitespace-nowrap shrink-0"
              >
                Ir para Hoje
              </Button>

              <div className="flex bg-slate-100/80 p-1 rounded-xl shrink-0">
                {views.map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                      view === v
                        ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50"
                        : "text-slate-500 hover:text-slate-900"
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

      {/* Bottom Sheet Modal (Mobile) / Side ou Central Card (Desktop) */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            {/* Backdrop escurecido no mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:static md:z-auto md:mt-6"
            >
              <Card className="rounded-t-3xl md:rounded-2xl p-5 md:p-6 max-h-[85vh] overflow-y-auto bg-white shadow-2xl md:shadow-lg border-t border-slate-100 md:border">
                {/* Drag Handle (Apenas Mobile) */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />

                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                      <Car className="w-6 h-6 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {selectedEvent.cliente?.nome || "Cliente não informado"}
                      </h3>
                      <p className="text-sm text-slate-500 font-mono font-medium tracking-wide bg-slate-100 inline-block px-2 py-0.5 rounded-md mt-1">
                        {selectedEvent.veiculo?.placa || "S/ PLACA"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="p-2 hover:bg-slate-100 rounded-full active:scale-90 transition-transform bg-slate-50"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                    <StatusBadge status={selectedEvent.status || "pendente"} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3 text-slate-600">
                    <CalendarIcon className="w-5 h-5 text-blue-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        Data & Hora
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedEvent.data} às {selectedEvent.horario}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <User className="w-5 h-5 text-emerald-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        Técnico
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedEvent.tecnico || "Não atribuído"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-5 h-5 text-rose-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        Local
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedEvent.endereco?.cidade || "Não informada"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Wrench className="w-5 h-5 text-amber-500" />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase">
                        Serviço
                      </span>
                      <span className="font-semibold text-sm">
                        {selectedEvent.tipoServico || "Não especificado"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedEvent.observacao && (
                  <div className="mb-6 p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl text-sm text-slate-700">
                    <span className="font-bold text-amber-800 block mb-1">
                      Observações:
                    </span>
                    {selectedEvent.observacao}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => openEditForm(selectedEvent)}
                    className="flex-1 flex items-center justify-center gap-2 min-h-12 bg-white hover:bg-slate-50"
                  >
                    <Wrench className="w-4 h-4" /> Editar Serviço
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeletingServico(selectedEvent);
                      setSelectedEvent(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 min-h-12 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Registro
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
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
    </motion.div>
  );
}
