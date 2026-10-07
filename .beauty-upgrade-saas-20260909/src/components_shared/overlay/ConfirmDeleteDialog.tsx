import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { getErrorMessage } from '../feedback/error.utils'
import { Modal } from './Modal'

export type ConfirmDeleteDialogProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  resourceName?: string
  confirmLabel?: string
  cancelLabel?: string
}

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar exclusão',
  description = 'Esta ação não poderá ser desfeita.',
  resourceName,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
}: ConfirmDeleteDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (isConfirming) return
    setError(null)
    onClose()
  }

  async function handleConfirm() {
    setError(null)
    setIsConfirming(true)

    try {
      await onConfirm()
      setIsConfirming(false)
      onClose()
    } catch (confirmationError) {
      setError(getErrorMessage(confirmationError))
      setIsConfirming(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      description={description}
      size="sm"
      isDismissible={!isConfirming}
      footer={
        <>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={handleClose}
            disabled={isConfirming}
          >
            {cancelLabel}
          </button>
          <button
            className="btn btn--danger"
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isConfirming}
          >
            {isConfirming ? <span className="btn-spinner" /> : <Trash2 size={17} />}
            {isConfirming ? 'Excluindo...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirmation-dialog">
        <span className="confirmation-dialog__icon" aria-hidden="true">
          <Trash2 size={26} />
        </span>
        <div>
          <p>
            {resourceName
              ? `Você está prestes a excluir “${resourceName}”.`
              : 'Você está prestes a excluir este registro.'}
          </p>
          <small>Verifique se este é realmente o item correto.</small>
        </div>
      </div>
      {error && (
        <p className="field__error confirmation-dialog__error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  )
}
