import type {
  AgendaAppointment,
  AgendaOptions,
  AgendaView,
  AppointmentFormItem,
  AppointmentFormValues,
  AppointmentStatus,
  AvailabilityBusyInterval,
  FuncionarioHorario,
} from "../types/agendamento.types";

const DAY_MS = 86_400_000;

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  aguardando_confirmacao: "Aguardando confirmação",
  aguardando_pagamento: "Aguardando pagamento",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  finalizado: "Finalizado",
  no_show: "Não compareceu",
  cancelado: "Cancelado",
};

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(value: string, amount: number) {
  const date = parseDateKey(value);
  date.setDate(date.getDate() + amount);
  return dateKey(date);
}

function normalizeWeekStartsOn(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 6 ? value : 1;
}

export function startOfWeek(value: string, weekStartsOn = 1) {
  const date = parseDateKey(value);
  const daysFromStart =
    (date.getDay() - normalizeWeekStartsOn(weekStartsOn) + 7) % 7;
  date.setDate(date.getDate() - daysFromStart);
  return dateKey(date);
}

export function startOfMonthGrid(value: string, weekStartsOn = 1) {
  const date = parseDateKey(value);
  date.setDate(1);
  return startOfWeek(dateKey(date), weekStartsOn);
}

export function getVisibleDays(
  view: AgendaView,
  selectedDate: string,
  weekStartsOn = 1,
) {
  if (view === "day") return [selectedDate];
  const start =
    view === "week"
      ? startOfWeek(selectedDate, weekStartsOn)
      : startOfMonthGrid(selectedDate, weekStartsOn);
  const count = view === "week" ? 7 : 42;
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export function getAgendaRange(
  view: AgendaView,
  selectedDate: string,
  weekStartsOn = 1,
) {
  const days = getVisibleDays(view, selectedDate, weekStartsOn);
  const start = new Date(`${days[0]}T00:00:00`);
  const end = new Date(`${addDays(days.at(-1)!, 1)}T00:00:00`);
  return { startIso: start.toISOString(), endIso: end.toISOString(), days };
}

export function moveSelectedDate(
  value: string,
  view: AgendaView,
  direction: -1 | 1,
) {
  if (view === "day") return addDays(value, direction);
  if (view === "week") return addDays(value, direction * 7);
  const date = parseDateKey(value);
  date.setMonth(date.getMonth() + direction);
  return dateKey(date);
}

export function getPeriodLabel(
  view: AgendaView,
  selectedDate: string,
  days: string[],
) {
  const full = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  if (view === "day") return full.format(parseDateKey(selectedDate));
  if (view === "month")
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(parseDateKey(selectedDate));
  const short = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  });
  return `${short.format(parseDateKey(days[0]))} – ${full.format(parseDateKey(days.at(-1)!))}`;
}

export function appointmentItems(appointment: AgendaAppointment) {
  const sorted = [...appointment.itens].sort((a, b) => a.ordem - b.ordem);
  const active = sorted.filter((item) => item.status !== "cancelado");
  return active.length ? active : sorted;
}

export function appointmentEmployeeIds(appointment: AgendaAppointment) {
  return new Set(
    appointmentItems(appointment).map((item) => item.id_funcionario),
  );
}

export function appointmentsForDay(
  appointments: AgendaAppointment[],
  day: string,
) {
  return appointments.filter(
    (appointment) => dateKey(new Date(appointment.inicio)) === day,
  );
}

export function appointmentProfessionalSummary(appointment: AgendaAppointment) {
  const names = appointmentItems(appointment)
    .map((item) => item.funcionario?.nome)
    .filter((name): name is string => Boolean(name))
    .filter((name, index, list) => list.indexOf(name) === index);
  return names.length ? names.join(" → ") : "Profissional não informado";
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function getDayHourSections(
  day: string,
  schedules: FuncionarioHorario[],
) {
  const allHours = Array.from({ length: 24 }, (_, hour) => hour);
  const weekday = parseDateKey(day).getDay();
  const activeSchedules = schedules.filter(
    (schedule) => schedule.ativo && schedule.dia_semana === weekday,
  );

  if (!activeSchedules.length) {
    return {
      businessHours: [] as number[],
      overtimeHours: allHours,
      businessStart: null as string | null,
      businessEnd: null as string | null,
    };
  }

  const startMinutes = Math.min(
    ...activeSchedules.map((schedule) => timeToMinutes(schedule.hora_inicio)),
  );
  const endMinutes = Math.max(
    ...activeSchedules.map((schedule) => timeToMinutes(schedule.hora_fim)),
  );
  const startHour = Math.max(0, Math.floor(startMinutes / 60));
  const endHour = Math.min(24, Math.ceil(endMinutes / 60));

  return {
    businessHours: allHours.filter(
      (hour) => hour >= startHour && hour < endHour,
    ),
    overtimeHours: [
      ...allHours.filter((hour) => hour >= endHour),
      ...allHours.filter((hour) => hour < startHour),
    ],
    businessStart: activeSchedules
      .reduce(
        (earliest, schedule) =>
          schedule.hora_inicio < earliest ? schedule.hora_inicio : earliest,
        activeSchedules[0].hora_inicio,
      )
      .slice(0, 5),
    businessEnd: activeSchedules
      .reduce(
        (latest, schedule) =>
          schedule.hora_fim > latest ? schedule.hora_fim : latest,
        activeSchedules[0].hora_fim,
      )
      .slice(0, 5),
  };
}

export function getHalfHourSlots(hours: number[]) {
  return getTimeSlots(hours, 30);
}

export function getTimeSlots(hours: number[], stepMinutes = 30) {
  if (!hours.length) return [];
  const step = Math.min(Math.max(Math.trunc(stepMinutes), 1), 720);
  const segments: number[][] = [];

  for (const hour of hours) {
    const current = ((Math.trunc(hour) % 24) + 24) % 24;
    const segment = segments.at(-1);
    const previous = segment?.at(-1);
    if (!segment || previous === undefined || current !== (previous + 1) % 24) {
      segments.push([current]);
    } else {
      segment.push(current);
    }
  }

  return segments.flatMap((segment) => {
    const startMinutes = segment[0] * 60;
    const durationMinutes = segment.length * 60;
    const slots: string[] = [];
    for (let offset = 0; offset < durationMinutes; offset += step) {
      const minutesInDay = (startMinutes + offset) % (24 * 60);
      const hour = Math.floor(minutesInDay / 60);
      const minute = minutesInDay % 60;
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      );
    }
    return slots;
  });
}

export function getWeekdayLabels(weekStartsOn = 1) {
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const start = normalizeWeekStartsOn(weekStartsOn);
  return Array.from({ length: 7 }, (_, index) => labels[(start + index) % 7]);
}

type AvailableStartTimesInput = {
  date: string;
  items: AppointmentFormItem[];
  schedules: FuncionarioHorario[];
  busyIntervals: AvailabilityBusyInterval[];
  appointmentId?: number;
  now?: Date;
  stepMinutes?: number;
};

function overlaps(start: Date, end: Date, busyStart: string, busyEnd: string) {
  return (
    start.getTime() < new Date(busyEnd).getTime() &&
    end.getTime() > new Date(busyStart).getTime()
  );
}

function isWithinEmployeeSchedule(
  employeeId: number,
  start: Date,
  end: Date,
  date: string,
  schedules: FuncionarioHorario[],
) {
  if (dateKey(start) !== date || dateKey(end) !== date) return false;
  const employeeSchedules = schedules.filter(
    (schedule) => schedule.ativo && schedule.id_funcionario === employeeId,
  );
  if (!employeeSchedules.length) return true;
  const weekday = parseDateKey(date).getDay();
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();

  return employeeSchedules.some((schedule) => {
    if (schedule.dia_semana !== weekday) return false;
    if (
      startMinutes < timeToMinutes(schedule.hora_inicio) ||
      endMinutes > timeToMinutes(schedule.hora_fim)
    )
      return false;
    if (!schedule.intervalo_inicio || !schedule.intervalo_fim) return true;
    return !(
      startMinutes < timeToMinutes(schedule.intervalo_fim) &&
      endMinutes > timeToMinutes(schedule.intervalo_inicio)
    );
  });
}

export function getAvailableStartTimes({
  date,
  items,
  schedules,
  busyIntervals,
  appointmentId,
  now = new Date(),
  stepMinutes = 15,
}: AvailableStartTimesInput) {
  if (
    !date ||
    !items.length ||
    items.some(
      (item) =>
        !item.serviceId || !item.employeeId || item.durationMinutes <= 0,
    )
  )
    return [];
  const available: string[] = [];
  const weekday = parseDateKey(date).getDay();
  const firstEmployeeId = Number(items[0].employeeId);
  const firstEmployeeStarts = schedules
    .filter(
      (schedule) =>
        schedule.ativo &&
        schedule.id_funcionario === firstEmployeeId &&
        schedule.dia_semana === weekday,
    )
    .map((schedule) => timeToMinutes(schedule.hora_inicio));
  const firstCandidateMinutes = firstEmployeeStarts.length
    ? Math.min(...firstEmployeeStarts)
    : 0;

  for (
    let candidateMinutes = firstCandidateMinutes;
    candidateMinutes < 24 * 60;
    candidateMinutes += stepMinutes
  ) {
    const hours = Math.floor(candidateMinutes / 60);
    const minutes = candidateMinutes % 60;
    const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    const candidateStart = new Date(`${date}T${time}:00`);
    if (candidateStart <= now) continue;
    let cursor = candidateStart;
    let valid = true;

    for (const item of items) {
      const employeeId = Number(item.employeeId);
      const itemStart = new Date(cursor);
      const itemEnd = new Date(
        itemStart.getTime() +
          (item.durationMinutes + item.intervalMinutes) * 60_000,
      );
      const withinSchedule = isWithinEmployeeSchedule(
        employeeId,
        itemStart,
        itemEnd,
        date,
        schedules,
      );
      const isBusy = busyIntervals.some((interval) => {
        if (
          appointmentId !== undefined &&
          interval.source === "appointment" &&
          interval.appointmentId === appointmentId
        )
          return false;
        if (interval.employeeId !== null && interval.employeeId !== employeeId)
          return false;
        return overlaps(itemStart, itemEnd, interval.start, interval.end);
      });
      if (!withinSchedule || isBusy) {
        valid = false;
        break;
      }
      cursor = itemEnd;
    }

    if (valid) available.push(time);
  }

  return available;
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function nextBookableSlot(now: Date, intervalMinutes = 5) {
  const intervalMs = intervalMinutes * 60_000;
  return new Date((Math.floor(now.getTime() / intervalMs) + 1) * intervalMs);
}

export function isAppointmentDateTimePast(
  date: string,
  time: string,
  now = new Date(),
) {
  if (!date || !time) return true;
  const candidate = new Date(`${date}T${time}:00`);
  return (
    Number.isNaN(candidate.getTime()) || candidate.getTime() <= now.getTime()
  );
}

export function getMinimumAppointmentDate(now = new Date()) {
  return dateKey(nextBookableSlot(now));
}

export function getMinimumAppointmentTime(date: string, now = new Date()) {
  const slot = nextBookableSlot(now);
  if (dateKey(slot) !== date) return undefined;
  return `${String(slot.getHours()).padStart(2, "0")}:${String(slot.getMinutes()).padStart(2, "0")}`;
}

export function getSuggestedAppointmentTime(date: string, now = new Date()) {
  return getMinimumAppointmentTime(date, now) ?? "09:00";
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function totalAppointment(appointment: AgendaAppointment) {
  return appointmentItems(appointment).reduce(
    (total, item) => total + Number(item.preco),
    0,
  );
}

export function getEmptyAppointmentItem(): AppointmentFormItem {
  return {
    serviceId: "",
    employeeId: "",
    durationMinutes: 30,
    intervalMinutes: 0,
    price: 0,
    notes: "",
  };
}

export function getEmptyAppointmentFormValues(
  date: string,
  time = "09:00",
): AppointmentFormValues {
  return {
    clientId: "",
    date,
    time,
    notes: "",
    items: [getEmptyAppointmentItem()],
  };
}

export function appointmentToFormValues(
  appointment: AgendaAppointment,
  options: AgendaOptions,
): AppointmentFormValues {
  const start = new Date(appointment.inicio);
  const firstItemStart =
    appointmentItems(appointment)[0]?.inicio ?? appointment.inicio;
  return {
    clientId: String(appointment.id_cliente),
    date: dateKey(start),
    time: `${String(new Date(firstItemStart).getHours()).padStart(2, "0")}:${String(new Date(firstItemStart).getMinutes()).padStart(2, "0")}`,
    notes: appointment.observacoes ?? "",
    items: appointmentItems(appointment).map((item) => {
      const service = options.services.find(
        (entry) => entry.id === item.id_servico,
      );
      return {
        id: item.id,
        serviceId: String(item.id_servico),
        employeeId: String(item.id_funcionario),
        durationMinutes: item.duracao_minutos,
        intervalMinutes: service?.intervalo_minutos ?? 0,
        price: Number(item.preco),
        notes: item.observacoes ?? "",
      };
    }),
  };
}

export function employeeCanPerformService(
  options: AgendaOptions,
  employeeId: number,
  serviceId: number,
) {
  const employeeRows = options.assignments.filter(
    (item) => item.id_funcionario === employeeId,
  );
  if (!employeeRows.length) return true;
  return employeeRows.some(
    (item) => item.id_servico === serviceId && item.ativo,
  );
}

export function getServiceDefaults(
  options: AgendaOptions,
  employeeId: number,
  serviceId: number,
) {
  const service = options.services.find((item) => item.id === serviceId);
  const assignment = options.assignments.find(
    (item) =>
      item.id_funcionario === employeeId &&
      item.id_servico === serviceId &&
      item.ativo,
  );
  return {
    durationMinutes:
      assignment?.duracao_personalizada ?? service?.duracao_minutos ?? 30,
    intervalMinutes: service?.intervalo_minutos ?? 0,
    price: Number(assignment?.valor_personalizado ?? service?.preco ?? 0),
  };
}

export function buildAppointmentPayload(
  values: AppointmentFormValues,
  options: AgendaOptions,
) {
  let cursor = new Date(`${values.date}T${values.time}:00`);
  const services = values.items.map((item, index) => {
    const start = new Date(cursor);
    const end = new Date(
      start.getTime() + (item.durationMinutes + item.intervalMinutes) * 60_000,
    );
    cursor = end;
    return {
      id: item.id ?? null,
      id_servico: Number(item.serviceId),
      id_funcionario: Number(item.employeeId),
      inicio: start.toISOString(),
      fim: end.toISOString(),
      duracao_minutos: item.durationMinutes,
      preco: item.price,
      ordem: index + 1,
      observacoes: item.notes,
    };
  });
  let signalValue = 0;
  values.items.forEach((item) => {
    const service = options.services.find(
      (entry) => entry.id === Number(item.serviceId),
    );
    if (!service?.exige_sinal || !service.sinal_valor) return;
    signalValue +=
      service.sinal_tipo === "percentual"
        ? (item.price * Number(service.sinal_valor)) / 100
        : Number(service.sinal_valor);
  });
  return {
    services,
    signalStatus: signalValue > 0 ? "pendente" : "nao_exigido",
    signalValue: signalValue > 0 ? Math.round(signalValue * 100) / 100 : null,
  };
}

export function allowedStatusActions(status: AppointmentStatus) {
  return {
    confirm:
      status === "aguardando_confirmacao" || status === "aguardando_pagamento",
    start: status === "confirmado",
    finish: status === "em_atendimento",
    noShow:
      status === "aguardando_confirmacao" ||
      status === "aguardando_pagamento" ||
      status === "confirmado",
    cancel: !["finalizado", "no_show", "cancelado"].includes(status),
    edit: [
      "aguardando_confirmacao",
      "aguardando_pagamento",
      "confirmado",
    ].includes(status),
  };
}

export function statusClass(status: string) {
  return `agenda-status agenda-status--${status}`;
}
export const ONE_DAY_MS = DAY_MS;
