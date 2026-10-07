import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock3,
  Plus,
  Scissors,
  Trash2,
  UserRound,
} from "lucide-react";
import { useId, useMemo, useState, type FormEvent } from "react";
import {
  ErrorState,
  FormActions,
  LoadingState,
  Modal,
  SelectField,
  TextAreaField,
  TextField,
} from "../../../components_shared";
import { useDayAvailability } from "../hooks/useAppointments";
import {
  hasAppointmentFormErrors,
  validateAppointmentForm,
  type AppointmentFormErrors,
} from "../schemas/agendamento.validation";
import type {
  AgendaAppointment,
  AgendaOptions,
  AppointmentFormItem,
  AppointmentFormValues,
  AppointmentWriteInput,
} from "../types/agendamento.types";
import {
  appointmentToFormValues,
  buildAppointmentPayload,
  employeeCanPerformService,
  formatCurrency,
  getAgendaRange,
  getAvailableStartTimes,
  getEmptyAppointmentFormValues,
  getEmptyAppointmentItem,
  getMinimumAppointmentDate,
  getServiceDefaults,
} from "../utils/agenda.utils";

type Props = {
  companyId: number;
  appointment?: AgendaAppointment;
  options: AgendaOptions;
  initialDate: string;
  preferredTime?: string;
  slotDurationMinutes: number;
  canMultiService: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: AppointmentWriteInput) => Promise<void>;
};

type WizardStep = 0 | 1 | 2;

const WIZARD_STEPS = [
  { label: "Cliente", icon: UserRound },
  { label: "Serviços", icon: Scissors },
  { label: "Data e horário", icon: CalendarDays },
] as const;

function formatTime(date: Date) {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAppointmentEndTime(
  date: string,
  time: string,
  items: AppointmentFormItem[],
) {
  const totalMinutes = items.reduce(
    (total, item) => total + item.durationMinutes + item.intervalMinutes,
    0,
  );
  return formatTime(
    new Date(new Date(`${date}T${time}:00`).getTime() + totalMinutes * 60_000),
  );
}

export function AppointmentFormModal({
  companyId,
  appointment,
  options,
  initialDate,
  preferredTime,
  slotDurationMinutes,
  canMultiService,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const formId = useId();
  const [step, setStep] = useState<WizardStep>(0);
  const [values, setValues] = useState<AppointmentFormValues>(() =>
    appointment
      ? appointmentToFormValues(appointment, options)
      : getEmptyAppointmentFormValues(initialDate, ""),
  );
  const [errors, setErrors] = useState<AppointmentFormErrors>({});
  const minimumDate = getMinimumAppointmentDate();
  const activeClients = options.clients.filter(
    (client) => client.ativo || client.id === appointment?.id_cliente,
  );
  const selectedClient = activeClients.find(
    (client) => client.id === Number(values.clientId),
  );
  const selectedDateRange = useMemo(
    () => getAgendaRange("day", values.date || initialDate),
    [initialDate, values.date],
  );
  const availabilityReady =
    Boolean(values.date) &&
    values.items.length > 0 &&
    values.items.every(
      (item) => item.serviceId && item.employeeId && item.durationMinutes > 0,
    );
  const availabilityQuery = useDayAvailability(
    {
      companyId,
      startIso: selectedDateRange.startIso,
      endIso: selectedDateRange.endIso,
    },
    step === 2 && availabilityReady,
  );
  const availableTimes = useMemo(
    () =>
      availabilityReady
        ? getAvailableStartTimes({
            date: values.date,
            items: values.items,
            schedules: options.schedules,
            busyIntervals: availabilityQuery.data ?? [],
            appointmentId: appointment?.id,
            stepMinutes: slotDurationMinutes,
          })
        : [],
    [
      appointment?.id,
      availabilityQuery.data,
      availabilityReady,
      options.schedules,
      slotDurationMinutes,
      values.date,
      values.items,
    ],
  );
  const preview = useMemo(() => {
    if (!values.date || !values.time) return [];
    let cursor = new Date(`${values.date}T${values.time}:00`);
    return values.items.map((item) => {
      const start = new Date(cursor);
      const end = new Date(
        start.getTime() +
          (item.durationMinutes + item.intervalMinutes) * 60_000,
      );
      cursor = end;
      return { start, end };
    });
  }, [values.date, values.items, values.time]);

  function updateValue<K extends keyof AppointmentFormValues>(
    field: K,
    value: AppointmentFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
  }

  function updateItem(index: number, changes: Partial<AppointmentFormItem>) {
    setValues((current) => ({
      ...current,
      time: "",
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    }));
    setErrors({});
  }

  function selectDate(date: string) {
    setValues((current) => ({ ...current, date, time: "" }));
    setErrors({});
  }

  function selectService(index: number, serviceId: string) {
    const current = values.items[index];
    const employeeId = Number(current.employeeId);
    const employeeStillValid =
      employeeId > 0 &&
      employeeCanPerformService(options, employeeId, Number(serviceId));
    const nextEmployeeId = employeeStillValid ? current.employeeId : "";
    const defaults = nextEmployeeId
      ? getServiceDefaults(options, Number(nextEmployeeId), Number(serviceId))
      : getServiceDefaults(options, 0, Number(serviceId));
    updateItem(index, {
      serviceId,
      employeeId: nextEmployeeId,
      ...defaults,
    });
  }

  function selectEmployee(index: number, employeeId: string) {
    const item = values.items[index];
    const defaults = item.serviceId
      ? getServiceDefaults(options, Number(employeeId), Number(item.serviceId))
      : {};
    updateItem(index, { employeeId, ...defaults });
  }

  function addItem() {
    setValues((current) => ({
      ...current,
      time: "",
      items: [...current.items, getEmptyAppointmentItem()],
    }));
  }

  function removeItem(index: number) {
    setValues((current) => ({
      ...current,
      time: "",
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function goToNextStep() {
    if (step === 0) {
      if (!values.clientId) {
        setErrors({ clientId: "Selecione o cliente." });
        return;
      }
      setErrors({});
      setStep(1);
      return;
    }
    if (step === 1) {
      const validation = validateAppointmentForm(values, options);
      if (validation.items) {
        setErrors({ items: validation.items });
        return;
      }
      setErrors({});
      setStep(2);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 2) {
      goToNextStep();
      return;
    }
    const validation = validateAppointmentForm(values, options);
    if (
      !validation.dateTime &&
      (!values.time || !availableTimes.includes(values.time))
    ) {
      validation.dateTime = "Selecione um dos horários disponíveis.";
    }
    setErrors(validation);
    if (hasAppointmentFormErrors(validation)) return;
    const payload = buildAppointmentPayload(values, options);
    const keepPaidSignal = appointment?.sinal_status === "pago";
    try {
      await onSubmit({
        appointmentId: appointment?.id,
        companyId,
        clientId: Number(values.clientId),
        notes: values.notes,
        signalStatus: keepPaidSignal ? "pago" : payload.signalStatus,
        signalValue: keepPaidSignal
          ? appointment.sinal_valor
          : payload.signalValue,
        services: payload.services,
      });
    } catch {
      return;
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={appointment ? "Editar e reagendar" : "Novo agendamento"}
      description="Escolha o cliente, monte o atendimento e encontre um horário livre."
      size="xl"
      isDismissible={!isSubmitting}
      footer={
        <FormActions>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          {step > 0 && (
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => setStep((step - 1) as WizardStep)}
              disabled={isSubmitting}
            >
              <ArrowLeft size={17} /> Voltar
            </button>
          )}
          {step < 2 ? (
            <button
              className="btn btn--primary"
              type="button"
              onClick={goToNextStep}
            >
              Continuar <ArrowRight size={17} />
            </button>
          ) : (
            <button
              className="btn btn--primary"
              type="submit"
              form={formId}
              disabled={
                isSubmitting || availabilityQuery.isPending || !values.time
              }
            >
              {isSubmitting ? (
                <span className="btn-spinner" />
              ) : (
                <CalendarPlus size={17} />
              )}
              {isSubmitting
                ? "Salvando..."
                : appointment
                  ? "Salvar alterações"
                  : "Criar agendamento"}
            </button>
          )}
        </FormActions>
      }
    >
      <form
        id={formId}
        className="appointment-wizard"
        onSubmit={(event) => void submit(event)}
        noValidate
      >
        <nav
          className="appointment-wizard__steps"
          aria-label="Etapas do agendamento"
        >
          {WIZARD_STEPS.map(({ label, icon: Icon }, index) => {
            const isCompleted = index < step;
            const isCurrent = index === step;
            return (
              <button
                type="button"
                className={isCurrent ? "is-current" : ""}
                data-completed={isCompleted || undefined}
                aria-current={isCurrent ? "step" : undefined}
                disabled={index > step}
                onClick={() => index < step && setStep(index as WizardStep)}
                key={label}
              >
                <span>
                  {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                </span>
                <strong>{label}</strong>
              </button>
            );
          })}
        </nav>

        <section className="appointment-wizard__content">
          {step === 0 && (
            <div className="appointment-step appointment-step--client">
              <div className="appointment-form__heading">
                <div>
                  <span className="appointment-step__eyebrow">Etapa 1 de 3</span>
                  <h3>Quem será atendido?</h3>
                  <p>Selecione primeiro o cliente deste agendamento.</p>
                </div>
              </div>
              <SelectField
                label="Cliente"
                value={values.clientId}
                onChange={(event) =>
                  updateValue("clientId", event.target.value)
                }
                error={errors.clientId}
                placeholder="Selecione o cliente"
                options={activeClients.map((client) => ({
                  value: String(client.id),
                  label: client.nome,
                }))}
                required
              />
              {selectedClient && (
                <article className="appointment-client-preview">
                  <span>
                    {selectedClient.nome
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                  <div>
                    <strong>{selectedClient.nome}</strong>
                    <small>
                      {selectedClient.telefone_principal ||
                        selectedClient.email ||
                        "Sem contato informado"}
                    </small>
                  </div>
                </article>
              )}
              <TextAreaField
                label="Observações gerais"
                value={values.notes}
                onChange={(event) => updateValue("notes", event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Preferências, cuidados ou informações importantes"
              />
            </div>
          )}

          {step === 1 && (
            <div className="appointment-step appointment-step--services">
              <div className="appointment-form__heading">
                <div>
                  <span className="appointment-step__eyebrow">Etapa 2 de 3</span>
                  <h3>Quais serviços serão realizados?</h3>
                  <p>
                    {canMultiService
                      ? "Adicione os serviços na ordem em que serão executados."
                      : "O plano atual permite um serviço por agendamento."}
                  </p>
                </div>
                {canMultiService && (
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={addItem}
                  >
                    <Plus size={16} /> Adicionar serviço
                  </button>
                )}
              </div>
              {errors.items && (
                <p
                  className="field__error appointment-form__items-error"
                  role="alert"
                >
                  {errors.items}
                </p>
              )}
              <div className="appointment-items">
                {values.items.map((item, index) => {
                  const availableEmployees = options.employees.filter(
                    (employee) =>
                      employee.ativo &&
                      (!item.serviceId ||
                        employeeCanPerformService(
                          options,
                          employee.id,
                          Number(item.serviceId),
                        )),
                  );
                  const availableServices = options.services.filter(
                    (service) =>
                      service.ativo &&
                      (!item.employeeId ||
                        employeeCanPerformService(
                          options,
                          Number(item.employeeId),
                          service.id,
                        )),
                  );
                  return (
                    <article
                      className="appointment-item"
                      key={item.id ?? `new-${index}`}
                    >
                      <header>
                        <div>
                          <span>Serviço {index + 1}</span>
                          <strong>
                            {item.durationMinutes + item.intervalMinutes} min
                          </strong>
                        </div>
                        {canMultiService && values.items.length > 1 && (
                          <button
                            className="btn btn--icon btn--ghost"
                            type="button"
                            title="Remover serviço"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </header>
                      <div className="appointment-item__selectors">
                        <SelectField
                          label="Serviço"
                          value={item.serviceId}
                          onChange={(event) =>
                            selectService(index, event.target.value)
                          }
                          placeholder="Selecione"
                          options={availableServices.map((service) => ({
                            value: String(service.id),
                            label: service.nome,
                          }))}
                          required
                        />
                        <SelectField
                          label="Profissional"
                          value={item.employeeId}
                          onChange={(event) =>
                            selectEmployee(index, event.target.value)
                          }
                          placeholder="Selecione"
                          options={availableEmployees.map((employee) => ({
                            value: String(employee.id),
                            label: employee.nome,
                          }))}
                          required
                        />
                      </div>
                      <div className="appointment-item__details">
                        <TextField
                          label="Duração (min)"
                          type="number"
                          min={1}
                          max={1440}
                          value={item.durationMinutes}
                          onChange={(event) =>
                            updateItem(index, {
                              durationMinutes: Number(event.target.value),
                            })
                          }
                        />
                        <TextField
                          label="Intervalo (min)"
                          type="number"
                          min={0}
                          max={240}
                          value={item.intervalMinutes}
                          onChange={(event) =>
                            updateItem(index, {
                              intervalMinutes: Number(event.target.value),
                            })
                          }
                        />
                        <TextField
                          label="Preço"
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.price}
                          onChange={(event) =>
                            updateItem(index, {
                              price: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                      {item.serviceId && (
                        <small className="appointment-item__subtotal">
                          Subtotal: {formatCurrency(item.price)}
                        </small>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="appointment-step appointment-step--schedule">
              <div className="appointment-form__heading">
                <div>
                  <span className="appointment-step__eyebrow">Etapa 3 de 3</span>
                  <h3>Quando será o atendimento?</h3>
                  <p>
                    Selecione o dia para consultar os horários realmente livres.
                  </p>
                </div>
              </div>
              <div className="appointment-schedule-summary">
                {values.items.map((item, index) => {
                  const service = options.services.find(
                    (entry) => entry.id === Number(item.serviceId),
                  );
                  const employee = options.employees.find(
                    (entry) => entry.id === Number(item.employeeId),
                  );
                  return (
                    <article key={item.id ?? `summary-${index}`}>
                      <span>{index + 1}</span>
                      <div>
                        <strong>{service?.nome ?? "Serviço"}</strong>
                        <small>
                          {employee?.nome ?? "Profissional"} ·{" "}
                          {item.durationMinutes + item.intervalMinutes} min
                        </small>
                      </div>
                    </article>
                  );
                })}
              </div>
              <TextField
                label="Data"
                type="date"
                min={minimumDate}
                value={values.date}
                onChange={(event) => selectDate(event.target.value)}
                error={errors.dateTime}
                required
              />
              <div className="appointment-availability">
                <div className="appointment-availability__heading">
                  <div>
                    <strong>Horários disponíveis</strong>
                    <span>Intervalos iniciais de {slotDurationMinutes} minutos</span>
                  </div>
                  <Clock3 size={18} aria-hidden="true" />
                </div>
                {!availabilityReady ? (
                  <p className="appointment-availability__message">
                    Volte e selecione todos os serviços e profissionais.
                  </p>
                ) : availabilityQuery.isPending ? (
                  <LoadingState label="Consultando horários livres..." compact />
                ) : availabilityQuery.error ? (
                  <ErrorState
                    error={availabilityQuery.error}
                    onRetry={() => void availabilityQuery.refetch()}
                    isRetrying={availabilityQuery.isFetching}
                    compact
                  />
                ) : availableTimes.length ? (
                  <div className="appointment-time-grid">
                    {availableTimes.map((time) => (
                      <button
                        type="button"
                        className={values.time === time ? "is-selected" : ""}
                        data-suggested={
                          time === preferredTime && values.time !== time
                            ? true
                            : undefined
                        }
                        aria-pressed={values.time === time}
                        onClick={() => updateValue("time", time)}
                        key={time}
                      >
                        <strong>{time}</strong>
                        <span>
                          até{" "}
                          {getAppointmentEndTime(values.date, time, values.items)}
                        </span>
                        {time === preferredTime && <small>Sugerido</small>}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="appointment-availability__empty">
                    <Clock3 size={24} />
                    <strong>Nenhum horário livre neste dia</strong>
                    <span>Escolha outra data para continuar.</span>
                  </div>
                )}
                {errors.dateTime && values.date && (
                  <p className="field__error" role="alert">
                    {errors.dateTime}
                  </p>
                )}
              </div>
              {values.time && preview.length > 0 && (
                <div className="appointment-selected-time">
                  <Check size={18} />
                  <div>
                    <strong>Horário selecionado</strong>
                    <span>
                      {values.time}–{formatTime(preview.at(-1)!.end)} ·{" "}
                      {selectedClient?.nome}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </form>
    </Modal>
  );
}
