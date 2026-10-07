import { Power } from 'lucide-react'
import { Modal } from '../../../components_shared'
import type { Cliente } from '../types/clientes.types'

export function ClientStatusDialog({ client, isSubmitting, onClose, onConfirm }: { client: Cliente; isSubmitting: boolean; onClose: () => void; onConfirm: () => Promise<void> }) {
  async function confirm() { try { await onConfirm() } catch { return } }
  return <Modal open onClose={onClose} title="Arquivar cliente" description="O cadastro e todo o histórico serão preservados." size="sm" isDismissible={!isSubmitting} footer={<><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--danger" type="button" onClick={() => void confirm()} disabled={isSubmitting}>{isSubmitting ? <span className="btn-spinner" /> : <Power size={17} />}{isSubmitting ? 'Arquivando...' : 'Arquivar'}</button></>}><div className="confirmation-dialog"><span className="confirmation-dialog__icon"><Power size={26} /></span><div><p>Você está prestes a arquivar <strong>{client.nome}</strong>.</p><small>O cliente poderá ser reativado a qualquer momento.</small></div></div></Modal>
}
