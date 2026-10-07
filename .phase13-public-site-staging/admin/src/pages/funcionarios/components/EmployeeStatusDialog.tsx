import { Power } from 'lucide-react'
import { Modal } from '../../../components_shared'
import type { Funcionario } from '../types/funcionarios.types'

export function EmployeeStatusDialog({ employee, isSubmitting, onClose, onConfirm }: { employee: Funcionario; isSubmitting: boolean; onClose: () => void; onConfirm: () => Promise<void> }) {
  async function confirm() { try { await onConfirm() } catch { return } }
  return <Modal open onClose={onClose} title="Desativar funcionário" description="O histórico, a jornada e os vínculos serão preservados." size="sm" isDismissible={!isSubmitting} footer={<><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--danger" type="button" onClick={() => void confirm()} disabled={isSubmitting}>{isSubmitting ? <span className="btn-spinner" /> : <Power size={17} />}{isSubmitting ? 'Desativando...' : 'Desativar'}</button></>}><div className="confirmation-dialog"><span className="confirmation-dialog__icon"><Power size={26} /></span><div><p>Desativar <strong>{employee.nome}</strong>?</p><small>O profissional deixará de aparecer em novos atendimentos.</small></div></div></Modal>
}
