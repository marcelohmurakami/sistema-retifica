import { CalendarClock, CircleDollarSign } from "lucide-react";
import { Modal } from "../../../components_shared";
import type { AccountInstallment, FinancialAccount } from "../types/finance.types";
import { ACCOUNT_STATUS_LABELS, ACCOUNT_TYPE_LABELS, accountBalance, accountCounterparty, formatFinancialCurrency, formatFinancialDate, INSTALLMENT_STATUS_LABELS, installmentBalance } from "../utils/finance.utils";

type Props = { account: FinancialAccount; canManage: boolean; onClose: () => void; onPay: (installment: AccountInstallment) => void; onEdit: () => void; onCancel: () => void };

export function AccountDetailsModal({ account, canManage, onClose, onPay, onEdit, onCancel }: Props) {
  const canEdit = !account.id_comanda && account.valor_pago === 0 && ["aberta", "vencida"].includes(account.status);
  const canCancel = !["cancelada", "paga"].includes(account.status) && account.valor_pago === 0;
  return <Modal open onClose={onClose} title={`Conta #${account.id}`} description={`${ACCOUNT_TYPE_LABELS[account.tipo as keyof typeof ACCOUNT_TYPE_LABELS]} · ${accountCounterparty(account)}`} size="lg" footer={<><button className="btn btn--secondary" type="button" onClick={onClose}>Fechar</button>{canManage && canEdit && <button className="btn btn--secondary" type="button" onClick={onEdit}>Editar</button>}{canManage && canCancel && <button className="btn btn--danger" type="button" onClick={onCancel}>Cancelar conta</button>}</>}>
    <div className="finance-details">
      <div className="finance-details__metrics"><article><span>Total</span><strong>{formatFinancialCurrency(account.valor_total)}</strong></article><article><span>Pago</span><strong>{formatFinancialCurrency(account.valor_pago)}</strong></article><article><span>Saldo</span><strong>{formatFinancialCurrency(accountBalance(account))}</strong></article><article><span>Status</span><strong><span className="status-badge" data-status={account.status}>{ACCOUNT_STATUS_LABELS[account.status as keyof typeof ACCOUNT_STATUS_LABELS]}</span></strong></article></div>
      <dl className="finance-details__info"><div><dt>Descrição</dt><dd>{account.descricao}</dd></div><div><dt>Categoria</dt><dd>{account.categoria?.nome ?? "Sem categoria"}</dd></div><div><dt>Emissão</dt><dd>{formatFinancialDate(account.data_emissao)}</dd></div><div><dt>Documento</dt><dd>{account.documento ?? "—"}</dd></div></dl>
      <section className="finance-installments"><header><div><span className="page-eyebrow">Parcelamento</span><h3>Parcelas</h3></div><span>{account.parcelas.length}</span></header><div className="finance-installment-list">{account.parcelas.map((installment) => { const balance = installmentBalance(installment); const payable = canManage && account.status !== "cancelada" && !["paga", "cancelada"].includes(installment.status) && balance > 0; return <article key={installment.id}><span className="finance-installment-icon"><CalendarClock size={17} /></span><div><strong>Parcela {installment.numero_parcela}</strong><small>Vence em {formatFinancialDate(installment.data_vencimento)}</small></div><div className="finance-installment-values"><strong>{formatFinancialCurrency(installment.valor_parcela)}</strong><small>saldo {formatFinancialCurrency(balance)}</small></div><span className="status-badge" data-status={installment.status}>{INSTALLMENT_STATUS_LABELS[installment.status as keyof typeof INSTALLMENT_STATUS_LABELS]}</span>{payable && <button className="btn btn--small btn--primary" type="button" onClick={() => onPay(installment)}><CircleDollarSign size={16} /> {account.tipo === "receber" ? "Receber" : "Pagar"}</button>}</article>; })}</div></section>
      {account.observacoes && <div className="finance-details__notes"><strong>Observações</strong><p>{account.observacoes}</p></div>}
    </div>
  </Modal>;
}
