import { useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import { validateAccount, type ValidationErrors } from "../schemas/finance.validation";
import type { AccountType, AccountWriteInput, FinancialAccount, FinancialCatalogs } from "../types/finance.types";
import { localDateInput } from "../utils/finance.utils";

type Props = { companyId: number; account?: FinancialAccount; catalogs: FinancialCatalogs; isSubmitting: boolean; onClose: () => void; onSubmit: (input: AccountWriteInput) => Promise<void> };

export function AccountFormModal({ companyId, account, catalogs, isSubmitting, onClose, onSubmit }: Props) {
  const installments = account?.parcelas.filter((item) => item.status !== "cancelada").sort((a, b) => a.numero_parcela - b.numero_parcela) ?? [];
  const [type, setType] = useState<AccountType>((account?.tipo as AccountType) ?? "receber");
  const [categoryId, setCategoryId] = useState(account?.id_categoria ? String(account.id_categoria) : "");
  const [counterpartyId, setCounterpartyId] = useState(account?.id_cliente ? String(account.id_cliente) : account?.id_fornecedor ? String(account.id_fornecedor) : "");
  const [description, setDescription] = useState(account?.descricao ?? "");
  const [document, setDocument] = useState(account?.documento ?? "");
  const [issueDate, setIssueDate] = useState(account?.data_emissao ?? localDateInput());
  const [competence, setCompetence] = useState(account?.competencia ?? localDateInput().slice(0, 7));
  const [total, setTotal] = useState(String(account?.valor_total ?? ""));
  const [installmentCount, setInstallmentCount] = useState(String(installments.length || 1));
  const [firstDueDate, setFirstDueDate] = useState(installments[0]?.data_vencimento ?? localDateInput());
  const [notes, setNotes] = useState(account?.observacoes ?? "");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const categoryOptions = useMemo(() => catalogs.categories.filter((category) => category.ativo && (category.tipo === "ambos" || category.tipo === (type === "receber" ? "entrada" : "saida"))).map((category) => ({ value: String(category.id), label: category.nome })), [catalogs.categories, type]);
  const counterpartOptions = type === "receber"
    ? catalogs.clients.filter((item) => item.ativo).map((item) => ({ value: String(item.id), label: item.nome }))
    : catalogs.suppliers.filter((item) => item.ativo).map((item) => ({ value: String(item.id), label: item.nome_fantasia ?? item.nome }));

  function changeType(value: AccountType) { setType(value); setCategoryId(""); setCounterpartyId(""); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: AccountWriteInput = { accountId: account?.id, companyId, type, categoryId: categoryId ? Number(categoryId) : null, clientId: type === "receber" && counterpartyId ? Number(counterpartyId) : null, supplierId: type === "pagar" && counterpartyId ? Number(counterpartyId) : null, description: description.trim(), document: document.trim(), issueDate, competence: competence ? `${competence}-01` : null, total: Number(total), installmentCount: Number(installmentCount), firstDueDate, notes: notes.trim() };
    const nextErrors = validateAccount(input); setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    try { await onSubmit(input); } catch { return; }
  }

  return <Modal open onClose={onClose} title={account ? "Editar conta" : "Nova conta"} description="O sistema cria e acompanha todas as parcelas automaticamente." size="lg" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form="financial-account-form" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : account ? "Salvar alterações" : "Criar conta"}</button></FormActions>}>
    <form id="financial-account-form" className="finance-form" onSubmit={submit}>
      <div className="form-grid form-grid--2">
        <SelectField label="Tipo" value={type} onChange={(event) => changeType(event.target.value as AccountType)} options={[{ value: "receber", label: "Conta a receber" }, { value: "pagar", label: "Conta a pagar" }]} required />
        <SelectField label="Categoria" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} options={categoryOptions} placeholder="Sem categoria" />
        <SelectField label={type === "receber" ? "Cliente" : "Fornecedor"} value={counterpartyId} onChange={(event) => setCounterpartyId(event.target.value)} options={counterpartOptions} placeholder={type === "receber" ? "Sem cliente" : "Sem fornecedor"} />
        <TextField label="Documento" value={document} onChange={(event) => setDocument(event.target.value)} placeholder="Nota, boleto ou referência" />
      </div>
      <TextField label="Descrição" value={description} onChange={(event) => setDescription(event.target.value)} error={errors.description} placeholder={type === "receber" ? "Ex.: Mensalidade do pacote" : "Ex.: Aluguel do estabelecimento"} required />
      <div className="form-grid form-grid--3">
        <TextField label="Emissão" type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} required />
        <TextField label="Competência" type="month" value={competence} onChange={(event) => setCompetence(event.target.value)} />
        <TextField label="Valor total" type="number" min="0.01" step="0.01" value={total} onChange={(event) => setTotal(event.target.value)} error={errors.total} required />
        <TextField label="Parcelas" type="number" min="1" max="120" step="1" value={installmentCount} onChange={(event) => setInstallmentCount(event.target.value)} error={errors.installmentCount} required />
        <TextField label="Primeiro vencimento" type="date" value={firstDueDate} onChange={(event) => setFirstDueDate(event.target.value)} error={errors.firstDueDate} required wrapperClassName="form-grid__span-2" />
      </div>
      <TextAreaField label="Observações" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Informações internas sobre a conta" />
    </form>
  </Modal>;
}
