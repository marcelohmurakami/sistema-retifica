import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorState, LoadingState, Modal } from "../../../components_shared";
import { FEATURES } from "../../../features/access/access.constants";
import { useAccess } from "../../../features/access/hooks/useAccess";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useCompanyAppearance } from "../../../features/admin/hooks/useAdmin";
import { getAppearance } from "../../../features/admin/utils/admin.utils";
import { AgendaCalendar } from "../components/AgendaCalendar";
import { AppointmentDetailsModal } from "../components/AppointmentDetailsModal";
import { AppointmentFormModal } from "../components/AppointmentFormModal";
import {
  useAgendaOptions,
  useAppointments,
  useSaveAppointment,
  useUpdateAppointmentStatus,
} from "../hooks/useAppointments";
import type {
  AgendaAppointment,
  AgendaView,
  AppointmentStatus,
  AppointmentWriteInput,
} from "../types/agendamento.types";
import {
  appointmentEmployeeIds,
  dateKey,
  getAgendaRange,
  getPeriodLabel,
  getSuggestedAppointmentTime,
  isAppointmentDateTimePast,
  moveSelectedDate,
  STATUS_LABELS,
} from "../utils/agenda.utils";
import "../agendamentos.css";

type FormState = {
  appointment?: AgendaAppointment;
  date: string;
  time: string;
} | null;
type StatusFilter = "todos" | AppointmentStatus;

export function Agendamentos() {
  const { empresaAtual } = useAuth();
  const { cargo, possuiPermissaoPlano } = useAccess();
  const companyId = empresaAtual?.id ?? 0;
  const appearanceQuery = useCompanyAppearance(companyId);
  const companyPreferences = getAppearance(appearanceQuery.data);
  const canManage =
    cargo === "dono" || cargo === "gerente" || cargo === "recepcionista";
  const canCreate =
    canManage && possuiPermissaoPlano(FEATURES.MANUAL_SCHEDULING);
  const canMultiService = possuiPermissaoPlano(
    FEATURES.MULTI_SERVICE_SCHEDULING,
  );
  const canFilterEmployee = possuiPermissaoPlano(
    FEATURES.SCHEDULE_BY_PROFESSIONAL,
  );
  const canReschedule = possuiPermissaoPlano(FEATURES.RESCHEDULING);
  const canControlStatus = possuiPermissaoPlano(FEATURES.SERVICE_STATUS);
  const [view, setView] = useState<AgendaView>("day");
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<
    number[] | null
  >(null);
  const [employeeFilterOpen, setEmployeeFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const employeeFilterRef = useRef<HTMLDivElement>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AgendaAppointment | null>(null);
  const [formState, setFormState] = useState<FormState>(null);
  const range = useMemo(
    () =>
      getAgendaRange(
        view,
        selectedDate,
        companyPreferences.semana_inicia,
      ),
    [companyPreferences.semana_inicia, selectedDate, view],
  );
  const appointmentsQuery = useAppointments({
    companyId,
    startIso: range.startIso,
    endIso: range.endIso,
  });
  const optionsQuery = useAgendaOptions(companyId);
  const saveMutation = useSaveAppointment(companyId);
  const statusMutation = useUpdateAppointmentStatus(companyId);
  const activeEmployees = useMemo(
    () =>
      (optionsQuery.data?.employees ?? []).filter(
        (employee) => employee.ativo,
      ),
    [optionsQuery.data?.employees],
  );
  const activeEmployeeIds = useMemo(
    () => activeEmployees.map((employee) => employee.id),
    [activeEmployees],
  );
  const selectedEmployeeIdSet = useMemo(
    () =>
      new Set(
        (selectedEmployeeIds ?? activeEmployeeIds).filter((employeeId) =>
          activeEmployeeIds.includes(employeeId),
        ),
      ),
    [activeEmployeeIds, selectedEmployeeIds],
  );

  useEffect(() => {
    if (!employeeFilterOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (
        employeeFilterRef.current &&
        !employeeFilterRef.current.contains(event.target as Node)
      ) {
        setEmployeeFilterOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setEmployeeFilterOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [employeeFilterOpen]);

  const appointments = useMemo(
    () =>
      (appointmentsQuery.data ?? []).filter((appointment) => {
        const matchesEmployee =
          !canFilterEmployee ||
          selectedEmployeeIds === null ||
          [...appointmentEmployeeIds(appointment)].some((employeeId) =>
            selectedEmployeeIdSet.has(employeeId),
          );
        const matchesStatus =
          statusFilter === "todos" || appointment.status === statusFilter;
        return matchesEmployee && matchesStatus;
      }),
    [
      appointmentsQuery.data,
      canFilterEmployee,
      selectedEmployeeIds,
      selectedEmployeeIdSet,
      statusFilter,
    ],
  );
  const visibleSchedules = useMemo(
    () =>
      !canFilterEmployee || selectedEmployeeIds === null
        ? (optionsQuery.data?.schedules ?? [])
        : (optionsQuery.data?.schedules ?? []).filter((schedule) =>
            selectedEmployeeIdSet.has(schedule.id_funcionario),
          ),
    [
      canFilterEmployee,
      optionsQuery.data?.schedules,
      selectedEmployeeIds,
      selectedEmployeeIdSet,
    ],
  );
  const employeeFilterLabel = useMemo(() => {
    if (!activeEmployees.length) return "Sem profissionais";
    if (selectedEmployeeIds === null) return "Todos";
    if (!selectedEmployeeIdSet.size) return "Nenhum";
    if (selectedEmployeeIdSet.size === 1) {
      return (
        activeEmployees.find((employee) =>
          selectedEmployeeIdSet.has(employee.id),
        )?.nome ?? "1 selecionado"
      );
    }
    return `${selectedEmployeeIdSet.size} selecionados`;
  }, [activeEmployees, selectedEmployeeIds, selectedEmployeeIdSet]);
  const periodLabel = getPeriodLabel(view, selectedDate, range.days);
  const confirmedCount = appointments.filter(
    (item) => item.status === "confirmado",
  ).length;
  const inServiceCount = appointments.filter(
    (item) => item.status === "em_atendimento",
  ).length;

  function openCreate(date = selectedDate, time?: string) {
    if (!canCreate) return;
    const selectedTime = time ?? getSuggestedAppointmentTime(date);
    if (isAppointmentDateTimePast(date, selectedTime)) {
      toast.error("Não é permitido agendar em um dia ou horário passado.");
      return;
    }
    setFormState({ date, time: selectedTime });
  }
  function selectDay(date: string) {
    setSelectedDate(date);
    setView("day");
  }
  async function save(input: AppointmentWriteInput) {
    await saveMutation.mutateAsync(input);
    setFormState(null);
  }
  async function updateStatus(
    status: AppointmentStatus,
    cancellationReason?: string,
  ) {
    if (!selectedAppointment) return;
    await statusMutation.mutateAsync({
      appointmentId: selectedAppointment.id,
      status,
      cancellationReason,
    });
  }
  function editSelected() {
    if (!selectedAppointment) return;
    setFormState({
      appointment: selectedAppointment,
      date: dateKey(new Date(selectedAppointment.inicio)),
      time: "",
    });
    setSelectedAppointment(null);
  }
  function toggleEmployee(employeeId: number) {
    setSelectedEmployeeIds((current) => {
      const next = new Set(current ?? activeEmployeeIds);
      if (next.has(employeeId)) next.delete(employeeId);
      else next.add(employeeId);
      if (
        activeEmployeeIds.length > 0 &&
        activeEmployeeIds.every((activeId) => next.has(activeId))
      ) {
        return null;
      }
      return [...next];
    });
  }
  function toggleAllEmployees() {
    const allSelected =
      selectedEmployeeIds === null ||
      activeEmployeeIds.every((employeeId) =>
        selectedEmployeeIdSet.has(employeeId),
      );
    setSelectedEmployeeIds(allSelected ? [] : null);
  }

  return (
    <div className="page agenda-page">
      <header className="page-header agenda-page-header">
        <div className="page-header__content">
          <span className="page-eyebrow">Operação</span>
          <h1>Agenda</h1>
          <p>
            Visualize horários, organize a equipe e acompanhe cada atendimento.
          </p>
        </div>
        <div className="page-actions">
          {!canManage && (
            <span className="agenda-read-only">
              <ShieldCheck size={16} /> Somente leitura
            </span>
          )}
          {canCreate && (
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => openCreate()}
            >
              <Plus size={18} /> Novo agendamento
            </button>
          )}
        </div>
      </header>
      <section className="agenda-toolbar card">
        <div className="agenda-toolbar__navigation">
          <button
            className="btn btn--icon btn--ghost"
            type="button"
            onClick={() =>
              setSelectedDate(moveSelectedDate(selectedDate, view, -1))
            }
            aria-label="Período anterior"
          >
            <ChevronLeft size={19} />
          </button>
          <label className="agenda-date-picker">
            <CalendarDays size={17} aria-hidden="true" />
            <span className="sr-only">Selecionar um dia</span>
            <input
              type="date"
              value={selectedDate}
              aria-label="Selecionar um dia"
              onChange={(event) => {
                if (event.target.value) setSelectedDate(event.target.value);
              }}
            />
          </label>
          <button
            className="btn btn--icon btn--ghost"
            type="button"
            onClick={() =>
              setSelectedDate(moveSelectedDate(selectedDate, view, 1))
            }
            aria-label="Próximo período"
          >
            <ChevronRight size={19} />
          </button>
          <strong className="agenda-toolbar__period">{periodLabel}</strong>
        </div>
        <div
          className="agenda-view-switch"
          aria-label="Visualização do calendário"
        >
          {(
            [
              ["day", "Dia"],
              ["week", "Semana"],
              ["month", "Mês"],
            ] as [AgendaView, string][]
          ).map(([value, label]) => (
            <button
              type="button"
              className={view === value ? "is-active" : ""}
              aria-pressed={view === value}
              onClick={() => setView(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="agenda-toolbar__filters">
          {canFilterEmployee && (
            <div
              className="agenda-employee-filter"
              ref={employeeFilterRef}
            >
              <span className="agenda-filter-label">Profissionais</span>
              <button
                className="agenda-employee-filter__trigger"
                type="button"
                aria-haspopup="true"
                aria-expanded={employeeFilterOpen}
                onClick={() => setEmployeeFilterOpen((open) => !open)}
              >
                <span>{employeeFilterLabel}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              {employeeFilterOpen && (
                <div
                  className="agenda-employee-filter__menu"
                  role="group"
                  aria-label="Filtrar profissionais da agenda"
                >
                  <label className="agenda-employee-option agenda-employee-option--all">
                    <input
                      type="checkbox"
                      checked={
                        activeEmployeeIds.length > 0 &&
                        (selectedEmployeeIds === null ||
                          activeEmployeeIds.every((employeeId) =>
                            selectedEmployeeIdSet.has(employeeId),
                          ))
                      }
                      disabled={!activeEmployeeIds.length}
                      onChange={toggleAllEmployees}
                    />
                    <span>Todos os profissionais</span>
                  </label>
                  <div className="agenda-employee-filter__options">
                    {activeEmployees.map((employee) => (
                      <label
                        className="agenda-employee-option"
                        key={employee.id}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIdSet.has(employee.id)}
                          onChange={() => toggleEmployee(employee.id)}
                        />
                        <span
                          className="agenda-employee-option__color"
                          style={{
                            backgroundColor:
                              employee.cor_agenda ?? "var(--primary)",
                          }}
                          aria-hidden="true"
                        />
                        <span>{employee.nome}</span>
                      </label>
                    ))}
                  </div>
                  {!activeEmployees.length && (
                    <span className="agenda-employee-filter__empty">
                      Nenhum profissional ativo.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="todos">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn btn--icon btn--ghost"
            type="button"
            onClick={() => void appointmentsQuery.refetch()}
            title="Atualizar agenda"
            disabled={appointmentsQuery.isFetching}
          >
            <RefreshCw
              className={appointmentsQuery.isFetching ? "is-spinning" : ""}
              size={17}
            />
          </button>
        </div>
      </section>
      <section className="agenda-period-summary" aria-label="Resumo do período">
        <span>
          <strong>{appointments.length}</strong> no período
        </span>
        <span>
          <strong>{confirmedCount}</strong> confirmados
        </span>
        <span>
          <strong>{inServiceCount}</strong> em atendimento
        </span>
        <span className="agenda-plan-mode">
          <CalendarDays size={15} />{" "}
          {canMultiService ? "Agenda completa" : "Agenda simples"}
        </span>
      </section>
      <section
        className="agenda-calendar card"
        aria-busy={appointmentsQuery.isFetching}
      >
        {appointmentsQuery.isPending ? (
          <LoadingState label="Carregando agenda..." />
        ) : appointmentsQuery.error ? (
          <ErrorState
            error={appointmentsQuery.error}
            onRetry={() => void appointmentsQuery.refetch()}
            isRetrying={appointmentsQuery.isFetching}
          />
        ) : (
          <AgendaCalendar
            view={view}
            selectedDate={selectedDate}
            days={range.days}
            appointments={appointments}
            schedules={visibleSchedules}
            slotMinutes={companyPreferences.duracao_slot_minutos}
            weekStartsOn={companyPreferences.semana_inicia}
            onOpenAppointment={setSelectedAppointment}
            onCreateAt={openCreate}
            onSelectDay={selectDay}
          />
        )}
      </section>
      {formState && optionsQuery.data && (
        <AppointmentFormModal
          key={
            formState.appointment?.id ?? `${formState.date}-${formState.time}`
          }
          companyId={companyId}
          appointment={formState.appointment}
          options={optionsQuery.data}
          initialDate={formState.date}
          preferredTime={formState.time}
          slotDurationMinutes={companyPreferences.duracao_slot_minutos}
          canMultiService={canMultiService}
          isSubmitting={saveMutation.isPending}
          onClose={() => setFormState(null)}
          onSubmit={save}
        />
      )}
      {formState && optionsQuery.isPending && (
        <Modal
          open
          onClose={() => setFormState(null)}
          title="Novo agendamento"
          size="sm"
        >
          <LoadingState label="Preparando o agendamento..." compact />
        </Modal>
      )}
      {formState && optionsQuery.error && (
        <Modal
          open
          onClose={() => setFormState(null)}
          title="Não foi possível abrir o agendamento"
          size="sm"
        >
          <ErrorState
            error={optionsQuery.error}
            onRetry={() => void optionsQuery.refetch()}
            isRetrying={optionsQuery.isFetching}
            compact
          />
        </Modal>
      )}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          canManage={canManage}
          canReschedule={canReschedule}
          canControlStatus={canControlStatus}
          isUpdating={statusMutation.isPending}
          onClose={() => setSelectedAppointment(null)}
          onEdit={editSelected}
          onUpdateStatus={updateStatus}
        />
      )}
    </div>
  );
}
