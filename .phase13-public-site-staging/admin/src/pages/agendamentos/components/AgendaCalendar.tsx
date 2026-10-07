import { CalendarDays, ChevronDown, Plus } from "lucide-react";
import { useState, type CSSProperties } from "react";
import type {
  AgendaAppointment,
  AgendaView,
  FuncionarioHorario,
} from "../types/agendamento.types";
import {
  appointmentItems,
  appointmentProfessionalSummary,
  appointmentsForDay,
  dateKey,
  formatTime,
  getDayHourSections,
  getTimeSlots,
  getSuggestedAppointmentTime,
  getWeekdayLabels,
  isAppointmentDateTimePast,
  parseDateKey,
  STATUS_LABELS,
  statusClass,
} from "../utils/agenda.utils";

type Props = {
  view: AgendaView;
  selectedDate: string;
  days: string[];
  appointments: AgendaAppointment[];
  schedules: FuncionarioHorario[];
  slotMinutes: number;
  weekStartsOn: number;
  onOpenAppointment: (appointment: AgendaAppointment) => void;
  onCreateAt: (date: string, time: string) => void;
  onSelectDay: (date: string) => void;
};
const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const dayMonth = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function EventCard({
  appointment,
  compact = false,
  showStatus = true,
  onOpen,
}: {
  appointment: AgendaAppointment;
  compact?: boolean;
  showStatus?: boolean;
  onOpen: () => void;
}) {
  const items = appointmentItems(appointment);
  const color = items[0]?.funcionario?.cor_agenda ?? "#3b82f6";
  return (
    <button
      className={`agenda-event agenda-event--${appointment.status} ${compact ? "agenda-event--compact" : ""}`}
      style={{ "--event-color": color } as CSSProperties}
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      <span className="agenda-event__time">
        {formatTime(appointment.inicio)}–{formatTime(appointment.fim)}
      </span>
      <strong>{appointment.cliente?.nome ?? "Cliente"}</strong>
      <span className="agenda-event__professional">
        {appointmentProfessionalSummary(appointment)}
      </span>
      {!compact && (
        <span className="agenda-event__service">
          {items
            .map((item) => item.servico?.nome)
            .filter(Boolean)
            .join(" + ") || "Serviço"}
        </span>
      )}
      {showStatus && (
        <span className={statusClass(appointment.status)}>
          {STATUS_LABELS[appointment.status as keyof typeof STATUS_LABELS] ??
            appointment.status}
        </span>
      )}
    </button>
  );
}

function DayCalendar({
  day,
  appointments,
  schedules,
  slotMinutes,
  onOpenAppointment,
  onCreateAt,
}: Pick<
  Props,
  "appointments" | "schedules" | "onOpenAppointment" | "onCreateAt"
> & {
  day: string;
  slotMinutes: number;
}) {
  const events = appointmentsForDay(appointments, day);
  const hourSections = getDayHourSections(day, schedules);
  const businessSlots = getTimeSlots(hourSections.businessHours, slotMinutes);
  const overtimeSlots = getTimeSlots(hourSections.overtimeHours, slotMinutes);
  const [showOvertime, setShowOvertime] = useState(false);

  function renderTimeSlot(time: string, overtime = false) {
    const [slotHour, slotMinute] = time.split(":").map(Number);
    const slotStart = slotHour * 60 + slotMinute;
    const slotEnd = slotStart + slotMinutes;
    const slotEvents = events.filter((appointment) => {
      const start = new Date(appointment.inicio);
      const appointmentMinutes = start.getHours() * 60 + start.getMinutes();

      return appointmentMinutes >= slotStart && appointmentMinutes < slotEnd;
    });
    const isPast = isAppointmentDateTimePast(day, time);

    return (
      <div
        className="agenda-hour-row"
        data-overtime={overtime || undefined}
        key={time}
      >
        <button
          className="agenda-hour-row__time"
          type="button"
          onClick={() => onCreateAt(day, time)}
          disabled={isPast}
          title={
            isPast
              ? "Este horário já passou"
              : `Agendar às ${time}${overtime ? " como hora extra" : ""}`
          }
        >
          {time}
          <Plus size={13} />
        </button>
        <div className="agenda-hour-row__events">
          {slotEvents.map((appointment) => (
            <EventCard
              appointment={appointment}
              key={appointment.id}
              onOpen={() => onOpenAppointment(appointment)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="agenda-day-view">
      {hourSections.businessHours.length > 0 && (
        <section className="agenda-hours-section">
          <header className="agenda-hours-section__header">
            <div>
              <strong>Expediente</strong>
              <span>Horários regulares da empresa</span>
            </div>
            <span>
              {hourSections.businessStart}–{hourSections.businessEnd}
            </span>
          </header>
          {businessSlots.map((time) => renderTimeSlot(time))}
        </section>
      )}
      <section className="agenda-hours-section agenda-hours-section--overtime">
        <button
          className="agenda-overtime-toggle"
          type="button"
          aria-expanded={showOvertime}
          onClick={() => setShowOvertime((current) => !current)}
        >
          <div>
            <strong>
              {hourSections.businessHours.length
                ? "Fora do expediente"
                : "Expediente não configurado"}
            </strong>
            <span>
              {showOvertime
                ? "Ocultar horários opcionais"
                : "Mostrar horários para encaixes e hora extra"}
            </span>
          </div>
          <span>
            {overtimeSlots.length} intervalos
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </button>
        {showOvertime &&
          overtimeSlots.map((time) => renderTimeSlot(time, true))}
      </section>
      {!events.length && (
        <div className="agenda-day-empty">
          <CalendarDays size={28} />
          <strong>Agenda livre neste dia</strong>
          <p>Clique em um horário para criar o primeiro atendimento.</p>
        </div>
      )}
    </div>
  );
}

function WeekCalendar(props: Props) {
  return (
    <div className="agenda-week-view">
      {props.days.map((day) => {
        const events = appointmentsForDay(props.appointments, day);
        const isToday = day === dateKey(new Date());
        const suggestedTime = getSuggestedAppointmentTime(day);
        const canCreate = !isAppointmentDateTimePast(day, suggestedTime);
        return (
          <section
            className="agenda-week-day"
            data-today={isToday || undefined}
            data-past={!canCreate || undefined}
            key={day}
            onClick={() => canCreate && props.onCreateAt(day, suggestedTime)}
          >
            <button
              className="agenda-week-day__header"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                props.onSelectDay(day);
              }}
            >
              <span>{weekday.format(parseDateKey(day))}</span>
              <strong>{dayMonth.format(parseDateKey(day))}</strong>
            </button>
            <div className="agenda-week-day__events">
              {events.map((appointment) => (
                <EventCard
                  appointment={appointment}
                  compact
                  showStatus
                  key={appointment.id}
                  onOpen={() => props.onOpenAppointment(appointment)}
                />
              ))}
              {!events.length && (
                <span className="agenda-week-day__empty">Livre</span>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function MonthCalendar(props: Props) {
  const selectedMonth = parseDateKey(props.selectedDate).getMonth();
  return (
    <div className="agenda-month-view">
      <div className="agenda-month-weekdays">
        {getWeekdayLabels(props.weekStartsOn).map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <div className="agenda-month-grid">
        {props.days.map((day) => {
          const events = appointmentsForDay(props.appointments, day);
          const outside = parseDateKey(day).getMonth() !== selectedMonth;
          const suggestedTime = getSuggestedAppointmentTime(day);
          const canCreate = !isAppointmentDateTimePast(day, suggestedTime);
          return (
            <section
              className="agenda-month-day"
              data-outside={outside || undefined}
              data-today={day === dateKey(new Date()) || undefined}
              data-past={!canCreate || undefined}
              key={day}
              onClick={() => canCreate && props.onCreateAt(day, suggestedTime)}
            >
              <button
                type="button"
                className="agenda-month-day__number"
                onClick={(event) => {
                  event.stopPropagation();
                  props.onSelectDay(day);
                }}
              >
                {parseDateKey(day).getDate()}
              </button>
              <div>
                {events.slice(0, 3).map((appointment) => (
                  <EventCard
                    appointment={appointment}
                    compact
                    showStatus={false}
                    key={appointment.id}
                    onOpen={() => props.onOpenAppointment(appointment)}
                  />
                ))}
                {events.length > 3 && (
                  <button
                    className="agenda-month-day__more"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      props.onSelectDay(day);
                    }}
                  >
                    +{events.length - 3} outros
                  </button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export function AgendaCalendar(props: Props) {
  if (props.view === "day")
    return (
      <DayCalendar
        key={props.selectedDate}
        day={props.selectedDate}
        appointments={props.appointments}
        schedules={props.schedules}
        slotMinutes={props.slotMinutes}
        onOpenAppointment={props.onOpenAppointment}
        onCreateAt={props.onCreateAt}
      />
    );
  if (props.view === "week") return <WeekCalendar {...props} />;
  return <MonthCalendar {...props} />;
}
