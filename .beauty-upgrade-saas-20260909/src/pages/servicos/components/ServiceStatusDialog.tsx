import { Power } from 'lucide-react'
import { Modal } from '../../../components_shared'
import type { Servico } from '../types/servicos.types'

type ServiceStatusDialogProps = {
  service: Servico
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function ServiceStatusDialog({
  service,
  isSubmitting,
  onClose,
  onConfirm,
}: ServiceStatusDialogProps) {
  async function handleConfirm() {
    try {
      await onConfirm()
    } catch {
      return
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Desativar serviço"
      description="O histórico será preservado e o serviço poderá ser reativado depois."
      size="sm"
      isDismissible={!isSubmitting}
      footer={
        <>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            className="btn btn--danger"
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
          >
            {isSubmitting ? <span className="btn-spinner" /> : <Power size={17} />}
            {isSubmitting ? 'Desativando...' : 'Desativar'}
          </button>
        </>
      }
    >
      <div className="confirmation-dialog">
        <span className="confirmation-dialog__icon" aria-hidden="true">
          <Power size={26} />
        </span>
        <div>
          <p>
            Você está prestes a desativar <strong>{service.nome}</strong>.
          </p>
          <small>Ele deixará de aparecer em novos agendamentos.</small>
        </div>
      </div>
    </Modal>
  )
}
