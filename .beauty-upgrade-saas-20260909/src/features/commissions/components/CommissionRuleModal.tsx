import { useState, type FormEvent } from "react";
import { CheckboxField, FormActions, Modal, SelectField, TextField } from "../../../components_shared";
import { validateCommissionRule, type CommissionValidationErrors } from "../schemas/commission.validation";
import type { CommissionBase, CommissionCalculationType, CommissionCatalogs, CommissionItemType, CommissionReleaseMoment, CommissionRule, RuleWriteInput } from "../types/commission.types";
import { localCommissionDate } from "../utils/commission.utils";

type Props = { companyId: number; rule?: CommissionRule; catalogs: CommissionCatalogs; advanced: boolean; isSubmitting: boolean; onClose: () => void; onSubmit: (input: RuleWriteInput) => Promise<void> };

export function CommissionRuleModal({ companyId, rule, catalogs, advanced, isSubmitting, onClose, onSubmit }: Props) {
  const [employeeId, setEmployeeId] = useState(rule?.id_funcionario ? String(rule.id_funcionario) : "");
  const [itemType, setItemType] = useState<CommissionItemType>((rule?.tipo_item as CommissionItemType | undefined) ?? "todos");
  const [referenceId, setReferenceId] = useState(rule?.id_servico ? String(rule.id_servico) : rule?.id_produto ? String(rule.id_produto) : "");
  const [calculationType, setCalculationType] = useState<CommissionCalculationType>((rule?.tipo_calculo as CommissionCalculationType | undefined) ?? "percentual");
  const [value, setValue] = useState(String(rule?.percentual ?? rule?.valor_fixo ?? ""));
  const [base, setBase] = useState<CommissionBase>((rule?.base_calculo as CommissionBase | undefined) ?? "liquido_desconto");
  const [releaseMoment, setReleaseMoment] = useState<CommissionReleaseMoment>((rule?.momento_liberacao as CommissionReleaseMoment | undefined) ?? "fechamento_comanda");
  const [deductPaymentFee, setDeductPaymentFee] = useState(rule?.descontar_taxa_pagamento ?? false);
  const [deductInputs, setDeductInputs] = useState(rule?.descontar_insumos ?? false);
  const [validFrom, setValidFrom] = useState(rule?.vigente_de ?? localCommissionDate());
  const [validUntil, setValidUntil] = useState(rule?.vigente_ate ?? "");
  const [priority, setPriority] = useState(String(rule?.prioridade ?? 0));
  const [active, setActive] = useState(rule?.ativo ?? true);
  const [errors, setErrors] = useState<CommissionValidationErrors>({});
  const shownItemType = advanced || rule ? itemType : "todos";
  const referenceOptions = shownItemType === "servico"
    ? catalogs.services.map((item) => ({ value: String(item.id), label: `${item.nome}${item.ativo ? "" : " (inativo)"}` }))
    : catalogs.products.map((item) => ({ value: String(item.id), label: `${item.nome}${item.ativo ? "" : " (inativo)"}` }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    const input: RuleWriteInput = {
      ruleId: rule?.id, companyId, employeeId: employeeId ? Number(employeeId) : null,
      itemType: shownItemType, serviceId: shownItemType === "servico" && referenceId ? Number(referenceId) : null,
      productId: shownItemType === "produto" && referenceId ? Number(referenceId) : null,
      calculationType, percentage: calculationType === "percentual" ? Number(value) : null,
      fixedValue: calculationType === "valor_fixo" ? Number(value) : null,
      base: advanced || rule ? base : "liquido_desconto", releaseMoment: advanced || rule ? releaseMoment : "fechamento_comanda",
      deductPaymentFee, deductInputs,
      validFrom, validUntil: validUntil || null, priority: advanced || rule ? Number(priority) : 0, active,
    };
    const nextErrors = validateCommissionRule(input); setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    try { await onSubmit(input); } catch { return; }
  }

  return <Modal open onClose={onClose} title={rule ? "Editar regra" : "Nova regra de comissão"} description="A regra mais específica e com maior prioridade é aplicada ao fechar a comanda." size="lg" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form="commission-rule-form" disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar regra"}</button></FormActions>}>
    <form id="commission-rule-form" className="commission-form" onSubmit={submit}>
      {!advanced && !rule && <div className="commission-plan-note">Seu plano permite a regra simples por equipe ou funcionário. Regras por serviço, produto, prioridade e liberação fazem parte das regras avançadas.</div>}
      <div className="form-grid form-grid--2">
        <SelectField label="Funcionário" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} options={catalogs.employees.map((employee) => ({ value: String(employee.id), label: `${employee.nome}${employee.ativo ? "" : " (inativo)"}` }))} placeholder="Toda a equipe" hint="Uma regra individual tem preferência sobre a regra geral." />
        {advanced && <SelectField label="Aplicar sobre" value={itemType} onChange={(event) => { setItemType(event.target.value as CommissionItemType); setReferenceId(""); }} options={[{ value: "todos", label: "Todos os serviços e produtos" }, { value: "servico", label: "Serviços" }, { value: "produto", label: "Produtos" }]} />}
      </div>
      {advanced && itemType !== "todos" && <SelectField label={itemType === "servico" ? "Serviço específico" : "Produto específico"} value={referenceId} onChange={(event) => setReferenceId(event.target.value)} options={referenceOptions} placeholder={itemType === "servico" ? "Todos os serviços" : "Todos os produtos"} />}
      <div className="form-grid form-grid--2">
        <SelectField label="Cálculo" value={calculationType} onChange={(event) => { setCalculationType(event.target.value as CommissionCalculationType); setValue(""); }} options={[{ value: "percentual", label: "Percentual" }, { value: "valor_fixo", label: "Valor fixo por unidade" }]} />
        <TextField label={calculationType === "percentual" ? "Percentual (%)" : "Valor fixo"} type="number" min="0.0001" max={calculationType === "percentual" ? 100 : undefined} step={calculationType === "percentual" ? "0.0001" : "0.01"} value={value} onChange={(event) => setValue(event.target.value)} error={errors.value} required />
      </div>
      {advanced && <div className="form-grid form-grid--2"><SelectField label="Base do cálculo" value={base} onChange={(event) => setBase(event.target.value as CommissionBase)} options={[{ value: "liquido_desconto", label: "Valor após descontos" }, { value: "bruto", label: "Valor bruto do item" }]} /><SelectField label="Liberar comissão" value={releaseMoment} onChange={(event) => setReleaseMoment(event.target.value as CommissionReleaseMoment)} options={[{ value: "fechamento_comanda", label: "Ao fechar a comanda" }, { value: "pagamento_cliente", label: "Quando o cliente pagar" }]} /></div>}
      <div className="form-grid form-grid--2">
        <CheckboxField label="Descontar taxa de pagamento" description="Rateia a taxa do cartão ou da forma de pagamento na base desta comissão." checked={deductPaymentFee} onChange={(event) => setDeductPaymentFee(event.target.checked)} />
        <CheckboxField label="Descontar insumos" description="Abate os materiais marcados como descontáveis ao finalizar o serviço." checked={deductInputs} onChange={(event) => setDeductInputs(event.target.checked)} />
      </div>
      <div className="form-grid form-grid--3"><TextField label="Vigente desde" type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} error={errors.validFrom} required /><TextField label="Vigente até" type="date" min={validFrom} value={validUntil} onChange={(event) => setValidUntil(event.target.value)} error={errors.validUntil} />{advanced && <TextField label="Prioridade" type="number" step="1" value={priority} onChange={(event) => setPriority(event.target.value)} hint="Maior número vence em escopos iguais." />}</div>
      <CheckboxField label="Regra ativa" description="Somente regras ativas e vigentes entram nos próximos cálculos." checked={active} onChange={(event) => setActive(event.target.checked)} />
    </form>
  </Modal>;
}
