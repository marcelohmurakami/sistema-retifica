import {
  Ban,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Pencil,
  Play,
  Send,
  SquareCheckBig,
  UserX,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Modal, TextAreaField } from "../../../components_shared";
import type {
  AgendaAppointment,
  AppointmentStatus,
} from "../types/agendamento.types";
import {
  allowedStatusActions,
  appointmentItems,
  formatCurrency,
  formatTime,
  STATUS_LABELS,
  statusClass,
  totalAppointment,
} from "../utils/agenda.utils";

type Props = {
  appointment: AgendaAppointment;
  canManage: boolean;
  canReschedule: boolean;
  canControlStatus: boolean;
  isUpdating: boolean;
  isResending: boolean;
  onClose: () => void;
  onEdit: () => void;
  onUpdateStatus: (
    status: AppointmentStatus,
    cancellationReason?: string,
  ) => Promise<void>;
  onResendConfirmation: () => Promise<void>;
};

export function AppointmentDetailsModal({
  appointment,
  canManage,
  canReschedule,
  canControlStatus,
  isUpdating,
  isResending,
  onClose,
  onEdit,
  onUpdateStatus,
  onResendConfirmation,
}: Props) {
  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [openedAt] = useState(() => Date.now());
  const actions = allowedStatusActions(appointment.status as AppointmentStatus);
  const items = appointmentItems(appointment);
  const payment = [...appointment.pagamentos].sort((a, b) => b.id - a.id)[0];
  const refund = [...appointment.estornos].sort((a, b) => b.id - a.id)[0];
  const canResend = !["cancelado", "finalizado", "no_show"].includes(appointment.status);
  const noShowAllowed = openedAt >= new Date(appointment.inicio).getTime();
  async function update(status: AppointmentStatus, reason?: string) {
    try {
      await onUpdateStatus(status, reason);
      onClose();
    } catch {
      return;
    }
  }
  async function resend() {
    try {
      await onResendConfirmation();
    } catch {
      return;
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={appointment.cliente?.nome ?? "Detalhes do agendamento"}
      description={`${new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(new Date(appointment.inicio))} · ${formatTime(appointment.inicio)}–${formatTime(appointment.fim)}`}
      size="lg"
      isDismissible={!isUpdating}
      footer={
        <div className="appointment-details__footer">
          <button
            className="btn btn--secondary"
            type="button"
            onClick={onClose}
            disabled={isUpdating}
          >
            Fechar
          </button>
          {canManage && canReschedule && actions.edit && (
            <button
              className="btn btn--secondary"
              type="button"
              onClick={onEdit}
              disabled={isUpdating}
            >
              <Pencil size={16} /> Editar
            </button>
          )}
        </div>
      }
    >
      <div className="appointment-details">
        <div className="appointment-details__summary">
          <span className={statusClass(appointment.status)}>
            {STATUS_LABELS[appointment.status as AppointmentStatus] ??
              appointment.status}
          </span>
          <div>
            <span>Contato</span>
            <strong>
              {appointment.cliente?.telefone_principal ||
                appointment.cliente?.email ||
                "Não informado"}
            </strong>
          </div>
          <div>
            <span>Origem</span>
            <strong className="text-capitalize">{appointment.origem}</strong>
          </div>
          <div>
            <span>Sinal</span>
            <strong>
              {appointment.sinal_valor
                ? `${formatCurrency(Number(appointment.sinal_valor))} · ${appointment.pagamento_status}`
                : "Não exigido"}
            </strong>
          </div>
        </div>
        {(appointment.sinal_valor || payment || refund) && (
          <section className="appointment-details__payment">
            <CreditCard size={20} aria-hidden="true" />
            <div>
              <h3>Pagamento e sinal</h3>
              <p>
                <strong>{payment ? formatCurrency(Number(payment.valor)) : formatCurrency(Number(appointment.sinal_valor ?? 0))}</strong>
                {" · "}{payment?.status ?? appointment.pagamento_status}
                {payment?.provedor ? ` via ${payment.provedor.replaceAll("_", " ")}` : ""}
              </p>
              {payment?.provedor_status_detalhe && <small>Retorno do provedor: {payment.provedor_status_detalhe}</small>}
              {payment?.expira_em && payment.status !== "confirmado" && <small>Expira em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(payment.expira_em))}</small>}
              {refund && <small>Estorno: {refund.status} · {formatCurrency(Number(refund.valor))}</small>}
              {refund?.ultimo_erro && <small className="text-danger">Falha no estorno: {refund.ultimo_erro}</small>}
            </div>
          </section>
        )}
        {appointment.status === "cancelado" && (
          <section className="appointment-details__cancellation-reason">
            <Ban size={19} aria-hidden="true" />
            <div>
              <h3>Motivo do cancelamento</h3>
              <p>
                {appointment.motivo_cancelamento?.trim() ||
                  "Motivo não informado."}
              </p>
            </div>
          </section>
        )}
        <section className="appointment-details__services">
          <h3>Serviços</h3>
          {items.map((item) => (
            <article key={item.id}>
              <span className="appointment-details__service-time">
                {formatTime(item.inicio)}–{formatTime(item.fim)}
              </span>
              <div>
                <strong>{item.servico?.nome ?? "Serviço"}</strong>
                <span>
                  {item.funcionario?.nome ?? "Profissional"} ·{" "}
                  {item.duracao_minutos} min
                </span>
              </div>
              <strong>{formatCurrency(Number(item.preco))}</strong>
            </article>
          ))}
          <footer>
            <span>Total previsto</span>
            <strong>{formatCurrency(totalAppointment(appointment))}</strong>
          </footer>
        </section>
        {appointment.observacoes && (
          <section className="appointment-details__notes">
            <h3>Observações</h3>
            <p>{appointment.observacoes}</p>
          </section>
        )}
        {canManage && (
          <section className="appointment-status-actions">
            <h3>Próxima ação</h3>
            <div>
              {canResend && (
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => void resend()}
                  disabled={isUpdating || isResending}
                >
                  {isResending ? <span className="btn-spinner" /> : <Send size={17} />} Reenviar confirmação
                </button>
              )}
              {actions.confirm && (
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => void update("confirmado")}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <span className="btn-spinner" />
                  ) : (
                    <Check size={17} />
                  )}{" "}
                  Confirmar reserva
                </button>
              )}
              {canControlStatus && actions.start && (
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => void update("em_atendimento")}
                  disabled={isUpdating}
                >
                  <Play size={17} /> Confirmar chegada
                </button>
              )}
              {canControlStatus && actions.finish && (
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={() => void update("finalizado")}
                  disabled={isUpdating}
                >
                  <SquareCheckBig size={17} /> Finalizar
                </button>
              )}
              {canControlStatus && actions.noShow && (
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={() => void update("no_show")}
                  disabled={isUpdating || !noShowAllowed}
                  title={
                    !noShowAllowed
                      ? "Disponível após o início previsto"
                      : undefined
                  }
                >
                  <UserX size={17} /> Não compareceu
                </button>
              )}
              {canReschedule && actions.cancel && (
                <button
                  className="btn btn--danger"
                  type="button"
                  onClick={() => setShowCancellation(true)}
                  disabled={isUpdating}
                >
                  <Ban size={17} /> Cancelar
                </button>
              )}
            </div>
          </section>
        )}
        {!canManage && (
          <div className="appointment-read-only">
            <Clock3 size={18} />
            <span>
              Você pode consultar este atendimento, mas as alterações são feitas
              pela equipe de gestão.
            </span>
          </div>
        )}
        {showCancellation && (
          <section className="appointment-cancellation">
            <div>
              <XCircle size={20} />
              <div>
                <strong>Cancelar agendamento</strong>
                <p>
                  O horário será liberado, mas o registro continuará no
                  histórico.
                </p>
              </div>
            </div>
            <TextAreaField
              label="Motivo do cancelamento"
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              rows={2}
              maxLength={500}
              required
              autoFocus
            />
            <div>
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => setShowCancellation(false)}
                disabled={isUpdating}
              >
                Voltar
              </button>
              <button
                className="btn btn--danger"
                type="button"
                onClick={() => void update("cancelado", cancellationReason)}
                disabled={isUpdating || !cancellationReason.trim()}
              >
                {isUpdating ? (
                  <span className="btn-spinner" />
                ) : (
                  <CheckCircle2 size={16} />
                )}{" "}
                Confirmar cancelamento
              </button>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
