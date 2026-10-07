import { useState, type FormEvent } from "react";
import { CheckboxField, FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import type { CashDrawer, CashDrawerWriteInput, CategoryWriteInput, FinancialCategory, PaymentMethod, PaymentMethodType, PaymentMethodWriteInput } from "../types/finance.types";
import { PAYMENT_METHOD_LABELS } from "../utils/finance.utils";

export type CatalogModalState = { kind: "category"; item?: FinancialCategory } | { kind: "method"; item?: PaymentMethod } | { kind: "drawer"; item?: CashDrawer };
type Props = { companyId: number; state: CatalogModalState; isSubmitting: boolean; onClose: () => void; onSaveCategory: (input: CategoryWriteInput) => Promise<void>; onSaveMethod: (input: PaymentMethodWriteInput) => Promise<void>; onSaveDrawer: (input: CashDrawerWriteInput) => Promise<void> };

export function FinancialCatalogModal({ companyId, state, isSubmitting, onClose, onSaveCategory, onSaveMethod, onSaveDrawer }: Props) {
  const item = state.item;
  const [name, setName] = useState(item?.nome ?? "");
  const [active, setActive] = useState(item?.ativo ?? true);
  const category = state.kind === "category" ? state.item : undefined;
  const method = state.kind === "method" ? state.item : undefined;
  const drawer = state.kind === "drawer" ? state.item : undefined;
  const [categoryType, setCategoryType] = useState(category?.tipo ?? "ambos");
  const [methodType, setMethodType] = useState<PaymentMethodType>((method?.tipo as PaymentMethodType | undefined) ?? "pix");
  const [allowsInstallments, setAllowsInstallments] = useState(method?.permite_parcelamento ?? false);
  const [maxInstallments, setMaxInstallments] = useState(String(method?.max_parcelas ?? 1));
  const [fee, setFee] = useState(String(method?.taxa_percentual ?? 0));
  const [settlementDays, setSettlementDays] = useState(String(method?.prazo_recebimento_dias ?? 0));
  const [code, setCode] = useState(drawer?.codigo ?? "");
  const [description, setDescription] = useState(drawer?.descricao ?? "");
  const [location, setLocation] = useState(drawer?.localizacao ?? "");
  const [allowNegative, setAllowNegative] = useState(drawer?.permite_saldo_negativo ?? false);
  const [error, setError] = useState("");
  const label = state.kind === "category" ? "categoria" : state.kind === "method" ? "forma de pagamento" : "caixa";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError("Informe o nome."); return; }
    try {
      if (state.kind === "category") await onSaveCategory({ id: category?.id, id_empresa: companyId, nome: name.trim(), tipo: categoryType, ativo: active });
      if (state.kind === "method") await onSaveMethod({ id: method?.id, id_empresa: companyId, nome: name.trim(), tipo: methodType, permite_parcelamento: allowsInstallments, max_parcelas: allowsInstallments ? Math.max(2, Number(maxInstallments)) : 1, taxa_percentual: Math.max(0, Number(fee)), prazo_recebimento_dias: Math.max(0, Number(settlementDays)), ativo: active });
      if (state.kind === "drawer") await onSaveDrawer({ id: drawer?.id, id_empresa: companyId, nome: name.trim(), codigo: code.trim() || null, descricao: description.trim() || null, localizacao: location.trim() || null, permite_saldo_negativo: allowNegative, ativo: active });
    } catch { return; }
  }

  return <Modal open onClose={onClose} title={`${item ? "Editar" : "Nova"} ${label}`} description="As alterações passam a valer nos próximos lançamentos." size="sm" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form="financial-catalog-form" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</button></FormActions>}>
    <form id="financial-catalog-form" className="finance-form" onSubmit={submit}>
      <TextField label="Nome" value={name} onChange={(event) => { setName(event.target.value); setError(""); }} error={error} required autoFocus />
      {state.kind === "category" && <SelectField label="Aplicação" value={categoryType} onChange={(event) => setCategoryType(event.target.value as typeof categoryType)} options={[{ value: "entrada", label: "Somente receitas" }, { value: "saida", label: "Somente despesas" }, { value: "ambos", label: "Receitas e despesas" }]} />}
      {state.kind === "method" && <><SelectField label="Tipo" value={methodType} onChange={(event) => setMethodType(event.target.value as PaymentMethodType)} options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))} /><div className="form-grid form-grid--2"><TextField label="Taxa (%)" type="number" min="0" step="0.01" value={fee} onChange={(event) => setFee(event.target.value)} /><TextField label="Receber em (dias)" type="number" min="0" step="1" value={settlementDays} onChange={(event) => setSettlementDays(event.target.value)} /></div><CheckboxField label="Permite parcelamento" description="Disponibiliza esta forma para pagamentos parcelados." checked={allowsInstallments} onChange={(event) => setAllowsInstallments(event.target.checked)} />{allowsInstallments && <TextField label="Máximo de parcelas" type="number" min="2" max="120" step="1" value={maxInstallments} onChange={(event) => setMaxInstallments(event.target.value)} />}</>}
      {state.kind === "drawer" && <><div className="form-grid form-grid--2"><TextField label="Código" value={code} onChange={(event) => setCode(event.target.value)} placeholder="CX-01" /><TextField label="Localização" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Recepção" /></div><TextAreaField label="Descrição" value={description} onChange={(event) => setDescription(event.target.value)} rows={2} /><CheckboxField label="Permitir saldo negativo" description="Use apenas se a operação realmente aceitar saídas acima do saldo contado." checked={allowNegative} onChange={(event) => setAllowNegative(event.target.checked)} /></>}
      <CheckboxField label="Cadastro ativo" description={`Disponível para novos lançamentos de ${label}.`} checked={active} onChange={(event) => setActive(event.target.checked)} />
    </form>
  </Modal>;
}
