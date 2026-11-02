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
import { DeleteConfirmModal } from "@/components/modals/DeleteConfirmModal";
import { FloatingActionButton } from "@/components/features/FloatingActionButton";
import { Toaster, toast } from "react-hot-toast";
import type { Servico, FormularioServico, FiltrosServicos } from "@/lib/types";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { addDays } from "date-fns/addDays";
import { addWeeks } from "date-fns/addWeeks";
import { addMonths } from "date-fns/addMonths";
import { endOfWeek } from "date-fns/endOfWeek";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useErrorModal } from "@/hooks/useErrorModal";
import { ErrorModal } from "@/components/modals/ErrorModal";
import { FilterBar } from "@/components/features/FilterBar";
import ServicoForm from "@/components/modals/ServicoForm";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const views = ["month", "week", "day", "agenda"] as const;
type ViewType = (typeof views)[number];
const viewLabels: Record<ViewType, string> = {
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Lista",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
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

  // Estado unificado dos Filtros
  const [filters, setFilters] = useState<FiltrosServicos>({});

  const handleFilterChange = useCallback(
    (newFilters: Partial<FiltrosServicos>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Listas Dinâmicas para os Dropdowns da FilterBar
  const datasUnicas = useMemo(() => {
    const set = new Set<string>();
    servicos.forEach((s) => {
      if (s.data && s.status?.toLowerCase() !== "deletado") set.add(s.data);
    });
    return Array.from(set).sort((a, b) => {
      const [da, ma, ya] = a.split("/").map(Number);
      const [db, mb, yb] = b.split("/").map(Number);
      return (
        new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime()
      );
    });
  }, [servicos]);

  const tecnicosUnicos = useMemo(() => {
    const set = new Set<string>();
    servicos.forEach((s) => {
      if (s.tecnico && s.status?.toLowerCase() !== "deletado")
        set.add(s.tecnico);
    });
    return Array.from(set).sort();
  }, [servicos]);

  const cidadesUnicas = useMemo(() => {
    const set = new Set<string>();
    servicos.forEach((s) => {
      const cidade = s.endereco?.cidade?.trim();
      if (cidade && s.status?.toLowerCase() !== "deletado") set.add(cidade);
    });
    return Array.from(set).sort();
  }, [servicos]);

  // Serviços Filtrados
  const servicosFiltrados = useMemo(() => {
    return servicos.filter((s) => {
      if (s.status?.toLowerCase() === "deletado") return false;

      // Busca textual abrangente
      if (filters.busca) {
        const q = filters.busca.toLowerCase().trim();
        const match =
          s.cliente?.nome?.toLowerCase().includes(q) ||
          s.veiculo?.placa?.toLowerCase().includes(q) ||
          s.endereco?.cidade?.toLowerCase().includes(q) ||
          s.tecnico?.toLowerCase().includes(q) ||
          (s.ordemServico || "").toLowerCase().includes(q) ||
          (s.tipoServico || "").toLowerCase().includes(q) ||
          s.id?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Data específica
      if (filters.data && s.data !== filters.data) return false;

      // Status
      if (
        filters.status &&
        normalizeStatus(s.status) !== normalizeStatus(filters.status)
      )
        return false;

      // Técnico
      if (filters.tecnico && s.tecnico !== filters.tecnico) return false;

      // Cidade
      if (
        filters.cidade &&
        s.endereco?.cidade?.trim().toLowerCase() !==
          filters.cidade.trim().toLowerCase()
      )
        return false;

      // Intervalo de datas
      if (filters.dataInicio || filters.dataFim) {
        if (!s.data) return false;
        const [d, m, y] = s.data.split("/").map(Number);
        const servicoTime = new Date(y, m - 1, d).getTime();

        if (filters.dataInicio) {
          const [di, mi, yi] = filters.dataInicio.split("/").map(Number);
          const inicio = new Date(yi, mi - 1, di).getTime();
          if (servicoTime < inicio) return false;
        }
        if (filters.dataFim) {
          const [df, mf, yf] = filters.dataFim.split("/").map(Number);
          const fim = new Date(yf, mf - 1, df).getTime();
          if (servicoTime > fim) return false;
        }
      }

      return true;
    });
  }, [servicos, filters]);

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
    return servicosFiltrados
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
  }, [servicosFiltrados]);

  const metricas = useMemo(() => {
    const ativos = servicosFiltrados;
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
  }, [servicosFiltrados]);

  const EventComponent = useCallback(
    ({ event }: { event: any }) => {
      const tecnico: string = event.resource?.tecnico || "";
      const inicial = tecnico.trim().charAt(0).toUpperCase() || "?";
      const horario: string = event.resource?.horario || "S/H";

      if (view === "week" || view === "day") {
        return (
          <div className="flex h-full min-w-0 flex-col gap-0.5">
            <span className="text-[11px] font-mono leading-none opacity-80">
              {horario}
            </span>
            <span className="ev-title truncate font-semibold leading-tight">
              {event.title}
            </span>
            {tecnico && (
              <span className="truncate text-[11px] leading-tight opacity-75">
                {tecnico}
              </span>
            )}
          </div>
        );
      }

      if (view === "agenda") {
        return (
          <span className="ev-agenda">
            <span className="ev-title">{event.title}</span>
            {tecnico && (
              <span className="text-xs font-medium opacity-75">
                · {tecnico}
              </span>
            )}
          </span>
        );
      }

      return (
        <div
          className="flex items-center gap-1.5 overflow-hidden"
          title={`${horario} · ${event.title}${tecnico ? ` · ${tecnico}` : ""}`}
        >
          <span className="hidden h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black/10 text-[9px] font-bold dark:bg-white/15 sm:flex">
            {inicial}
          </span>
          <span className="shrink-0 font-mono text-[10px] opacity-80">
            {horario}
          </span>
          <span className="ev-title flex-1 truncate">{event.title}</span>
        </div>
      );
    },
    [view],
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

  const calendarTitle = useMemo(() => {
    if (view === "day")
      return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
    if (view === "week") {
      const ini = startOfWeek(date, { locale: ptBR });
      const fim = endOfWeek(date, { locale: ptBR });
      return ini.getMonth() === fim.getMonth()
        ? `${format(ini, "dd", { locale: ptBR })} – ${format(fim, "dd 'de' MMMM", { locale: ptBR })}`
        : `${format(ini, "dd MMM", { locale: ptBR })} – ${format(fim, "dd MMM", { locale: ptBR })}`;
    }
    return format(date, "MMMM yyyy", { locale: ptBR });
  }, [date, view]);

  const handleStep = useCallback(
    (dir: 1 | -1) => {
      setDate((d) => {
        if (view === "day") return addDays(d, dir);
        if (view === "week") return addWeeks(d, dir);
        return addMonths(d, dir);
      });
    },
    [view],
  );

  const handleCreate = useCallback(
    async (data: FormularioServico) => {
      const result = await create(data);
      if (result.success) {
        toast.success("Serviço criado com sucesso!");
        setIsFormOpen(false);
      } else {
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
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <p className="mt-3 text-sm font-medium text-text-muted">
          Carregando sua agenda...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10">
          <AlertCircle
            className="h-6 w-6 text-rose-600 dark:text-rose-400"
            aria-hidden
          />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-text">
          Ops! Algo deu errado
        </h2>
        <p className="mt-2 max-w-xs text-sm text-text-muted">{error}</p>
        <Button variant="outline" onClick={refresh} className="mt-6">
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-7xl space-y-6 pb-28 md:pb-8"
    >
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "!rounded-lg !bg-bg-elevated !text-text !border !border-border !shadow-lg backdrop-blur-md",
          duration: 3000,
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error: { iconTheme: { primary: "#e11d48", secondary: "#fff" } },
        }}
      />

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-bg-elevated p-5 shadow-sm sm:flex-row sm:p-6"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text md:text-3xl">
            Agenda
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Planeje e gerencie seus atendimentos em tempo real.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setEditingServico(null);
            setIsFormOpen(true);
          }}
          className="hidden sm:inline-flex"
        >
          Novo Serviço
        </Button>
      </motion.div>

      {/* KPIs */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 gap-3 px-4 sm:gap-4 sm:px-0 lg:grid-cols-4"
      >
        {[
          {
            icon: CalendarIcon,
            label: "Total Filtrado",
            value: metricas.total,
            bg: "bg-blue-500/10",
            text: "text-blue-600 dark:text-blue-400",
            border: "border-blue-500/20",
          },
          {
            icon: CheckCircle,
            label: "Hoje",
            value: metricas.hoje,
            bg: "bg-emerald-500/10",
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-500/20",
          },
          {
            icon: Clock,
            label: "Pendentes",
            value: metricas.pendentes,
            bg: "bg-amber-500/10",
            text: "text-amber-600 dark:text-amber-400",
            border: "border-amber-500/20",
          },
          {
            icon: Wrench,
            label: "Concluídos",
            value: metricas.concluidos,
            bg: "bg-indigo-500/10",
            text: "text-indigo-600 dark:text-indigo-400",
            border: "border-indigo-500/20",
          },
        ].map((kpi, i) => (
          <Card
            key={i}
            padding="none"
            className={`flex items-center gap-4 p-4 hover:shadow-md ${kpi.border}`}
          >
            <div
              className={`flex items-center justify-center rounded-lg p-2.5 ${kpi.bg} ${kpi.text}`}
            >
              <kpi.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {kpi.label}
              </p>
              <p className="text-xl font-semibold leading-none tracking-tight text-text sm:text-2xl">
                {kpi.value}
              </p>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* FILTERBAR */}
      <motion.div variants={itemVariants} className="px-4 sm:px-0">
        <FilterBar
          filters={filters}
          onChange={handleFilterChange}
          datas={datasUnicas}
          tecnicos={tecnicosUnicos}
          cidades={cidadesUnicas}
          totalResults={servicosFiltrados.length}
          onClear={handleClearFilters}
          isLoading={loading}
        />
      </motion.div>

      {/* Calendário */}
      <motion.div variants={itemVariants} className="px-4 sm:px-0">
        <Card padding="none" className="overflow-hidden">
          {/* Toolbar Customizada */}
          <div className="flex flex-col items-center justify-between gap-4 border-b border-border bg-bg-muted/40 p-4 lg:flex-row">
            {/* Navegação */}
            <div className="flex w-full items-center justify-between gap-2 lg:w-auto">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                aria-label="Período anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex min-w-40 flex-col items-center sm:min-w-52">
                <h2 className="text-center text-base font-semibold capitalize leading-tight tracking-tight text-text sm:text-lg">
                  {calendarTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleStep(1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                aria-label="Próximo período"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Ações e Seletor de Visão */}
            <div className="flex w-full items-center gap-2 lg:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDate(new Date())}
                className="shrink-0"
              >
                Ir para Hoje
              </Button>
              <div className="inline-flex flex-1 gap-0.5 rounded-lg border border-border bg-bg-muted/40 p-0.5 lg:flex-none">
                {views.map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    aria-pressed={view === v}
                    className={`flex-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50 lg:flex-none ${
                      view === v
                        ? "bg-bg text-text shadow-sm ring-1 ring-border/60"
                        : "text-text-muted hover:bg-bg-elevated/60 hover:text-text"
                    }`}
                  >
                    {viewLabels[v]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Calendário RBC */}
          <div className="rbc-custom h-[65vh] min-h-130 sm:h-[72vh]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              culture="pt-BR"
              view={view}
              onView={(newView) => setView(newView as ViewType)}
              min={new Date(1970, 0, 1, 6, 0)}
              max={new Date(1970, 0, 1, 21, 0)}
              scrollToTime={new Date(1970, 0, 1, 7, 30)}
              step={30}
              timeslots={2}
              showMultiDayTimes={false}
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
            />
          </div>
        </Card>
      </motion.div>

      {/* Modal Detalhes Rápidos */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-lg"
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-bg-elevated/85 px-5 py-4 backdrop-blur-md sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold leading-tight tracking-tight text-text sm:text-lg">
                      {selectedEvent.cliente?.nome || "Cliente não informado"}
                    </h3>
                    <p className="font-mono text-xs font-medium text-text-muted">
                      {selectedEvent.veiculo?.placa || "S/ PLACA"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-hover hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text/50"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
                <div className="flex justify-end">
                  <StatusBadge status={selectedEvent.status || "pendente"} />
                </div>
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-border bg-bg-muted/40 p-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 text-text">
                    <CalendarIcon className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase text-text-muted">
                        Data & Hora
                      </span>
                      <span className="text-sm font-semibold">
                        {selectedEvent.data} às {selectedEvent.horario}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-text">
                    <User className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase text-text-muted">
                        Técnico
                      </span>
                      <span className="text-sm font-semibold">
                        {selectedEvent.tecnico || "Não atribuído"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-text">
                    <MapPin className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase text-text-muted">
                        Cidade
                      </span>
                      <span className="text-sm font-semibold">
                        {selectedEvent.endereco?.cidade || "Não informada"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-text">
                    <Wrench className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold uppercase text-text-muted">
                        Tipo de Serviço
                      </span>
                      <span className="text-sm font-semibold">
                        {selectedEvent.tipoServico || "Não especificado"}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedEvent.observacao && (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-text">
                    <span className="mb-1 block font-bold">Observações:</span>
                    {selectedEvent.observacao}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex shrink-0 flex-col-reverse justify-end gap-3 border-t border-border bg-bg-muted/40 px-5 py-4 sm:flex-row sm:px-6">
                <Button
                  variant="outline"
                  icon={Trash2}
                  onClick={() => {
                    setDeletingServico(selectedEvent);
                    setSelectedEvent(null);
                  }}
                  className="w-full border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:border-rose-500/30 focus-visible:ring-rose-500/50 dark:text-rose-400 sm:w-auto"
                >
                  Excluir
                </Button>
                <Button
                  variant="primary"
                  icon={Wrench}
                  onClick={() => openEditForm(selectedEvent)}
                  className="w-full sm:w-auto"
                >
                  Editar Serviço
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Mobile */}
      <div className="fixed bottom-6 right-6 z-30 sm:hidden">
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
