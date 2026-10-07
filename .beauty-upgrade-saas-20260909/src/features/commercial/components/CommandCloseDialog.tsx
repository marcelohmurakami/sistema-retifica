import { Banknote, Beaker, CheckCircle2, Clock3, CircleDollarSign } from "lucide-react";
import { useId, useMemo, useState, type FormEvent } from "react";
import { FormActions, Modal, SelectField, TextAreaField, TextField } from "../../../components_shared";
import type { CloseCommandInput, Command, CommercialCatalogs, PaymentSituation } from "../types/commercial.types";
import { addDays, formatCommercialCurrency, localDateTime } from "../utils/commercial.utils";

type Props = {
  companyId: number;
  command: Command;
  catalogs: CommercialCatalogs;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: CloseCommandInput) => Promise<void>;
};

type FormErrors = Partial<Record<"dueDate" | "paymentMethodId" | "paidAt" | "amount", string>>;
type ConsumptionDraft = { key: string; commandItemId: number; productId: number; productName: string; unit: string; suggested: number; quantity: string; unitCost: number; deductCommission: boolean };

const SITUATIONS: Array<{ value: PaymentSituation; title: string; description: string; icon: typeof Clock3 }> = [
  { value: "a_receber", title: "Receber depois", description: "Fecha a comanda e deixa o valor em aberto.", icon: Clock3 },
  { value: "parcial", title: "Pagamento parcial", description: "Registra uma entrada e mantém o saldo a receber.", icon: CircleDollarSign },
  { value: "pago", title: "Já foi pago", description: "Registra o valor total como recebido agora.", icon: Banknote },
];

export function CommandCloseDialog({ companyId, command, catalogs, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId();
  const total = Number(command.valor_total ?? 0);
  const methods = useMemo(() => catalogs.paymentMethods.filter((item) => item.ativo), [catalogs.paymentMethods]);
  const [paymentSituation, setPaymentSituation] = useState<PaymentSituation>(command.condicao_pagamento === "pago" ? "pago" : "a_receber");
  const [dueDate, setDueDate] = useState(addDays(new Date(), 0));
  const [paymentMethodId, setPaymentMethodId] = useState(methods[0] ? String(methods[0].id) : "");
  const selectedMethod = methods.find((item) => item.id === Number(paymentMethodId));
  const [cashSessionId, setCashSessionId] = useState("");
  const [paidAt, setPaidAt] = useState(localDateTime());
  const [amount, setAmount] = useState(String(Math.max(Math.round(total * 50) / 100, 0)));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [consumptions, setConsumptions] = useState<ConsumptionDraft[]>(() => command.itens.flatMap((item) => {
    if (!item.id_servico) return [];
    return catalogs.serviceInputs.filter((recipe) => recipe.id_servico === item.id_servico && recipe.ativo).map((recipe) => {
      const product = catalogs.products.find((candidate) => candidate.id === recipe.id_produto);
      return {
        key: `${item.id}-${recipe.id_produto}`,
        commandItemId: item.id,
        productId: recipe.id_produto,
        productName: product?.nome ?? `Produto #${recipe.id_produto}`,
        unit: product?.unidade_medida ?? "un",
        suggested: Number(recipe.quantidade_padrao),
        quantity: String(Number(recipe.quantidade_padrao)),
        unitCost: Number(product?.custo_medio ?? 0),
        deductCommission: recipe.descontar_comissao,
      };
    });
  }));
  const recordsPayment = paymentSituation !== "a_receber";
  const leavesBalance = paymentSituation !== "pago";
  const paymentAmount = paymentSituation === "pago" ? total : Number(amount || 0);
  const remaining = paymentSituation === "a_receber" ? total : Math.max(total - paymentAmount, 0);
  const materialCost = consumptions.reduce((sum, item) => sum + Math.max(Number(item.quantity) || 0, 0) * item.unitCost, 0);
  const paymentFee = recordsPayment ? paymentAmount * Number(selectedMethod?.taxa_percentual ?? 0) / 100 : 0;

  function changeSituation(value: PaymentSituation) {
    setPaymentSituation(value);
    setErrors({});
    if (value === "parcial" && (Number(amount) <= 0 || Number(amount) >= total)) {
      setAmount(String(Math.max(Math.floor(total * 50) / 100, 0)));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (leavesBalance && !dueDate) nextErrors.dueDate = "Informe o vencimento do saldo.";
    if (recordsPayment && !paymentMethodId) nextErrors.paymentMethodId = "Selecione a forma de pagamento.";
    if (recordsPayment && !paidAt) nextErrors.paidAt = "Informe quando o pagamento ocorreu.";
    if (paymentSituation === "parcial" && (paymentAmount <= 0 || paymentAmount >= total)) nextErrors.amount = "Informe um valor maior que zero e menor que o total.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await onSubmit({
        companyId,
        commandId: command.id,
        dueDate: leavesBalance ? dueDate : addDays(new Date(), 0),
        paymentSituation,
        paymentMethodId: recordsPayment ? Number(paymentMethodId) : null,
        cashSessionId: recordsPayment && selectedMethod?.tipo === "dinheiro" && cashSessionId ? Number(cashSessionId) : null,
        paidAt: recordsPayment ? paidAt : null,
        amount: paymentSituation === "parcial" ? paymentAmount : paymentSituation === "pago" ? total : null,
        reference: reference.trim(),
        notes: notes.trim(),
        consumptions: consumptions.filter((item) => Number(item.quantity) > 0).map((item) => ({ id_comanda_item: item.commandItemId, id_produto: item.productId, quantidade: Number(item.quantity), descontar_comissao: item.deductCommission })),
      });
    } catch {
      return;
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Fechar comanda #${command.id}`}
      description="Confirme como este atendimento será recebido."
      size="md"
      isDismissible={!isSubmitting}
      footer={
        <FormActions>
          <button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Voltar</button>
          <button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting || total <= 0 && recordsPayment}>
            {isSubmitting ? <span className="btn-spinner" /> : <CheckCircle2 size={17} />}
            {isSubmitting ? "Fechando..." : "Confirmar fechamento"}
          </button>
        </FormActions>
      }
    >
      <form id={formId} className="command-close-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="command-close-value"><span>Total da comanda</span><strong>{formatCommercialCurrency(total)}</strong></div>

        <fieldset className="command-payment-options">
          <legend>Situação do pagamento</legend>
          <div>
            {SITUATIONS.map((option) => {
              const Icon = option.icon;
              const checked = paymentSituation === option.value;
              const disabled = total <= 0 && option.value !== "a_receber";
              return (
                <label key={option.value} data-selected={checked} data-disabled={disabled}>
                  <input type="radio" name="payment-situation" value={option.value} checked={checked} disabled={disabled} onChange={() => changeSituation(option.value)} />
                  <span className="command-payment-options__icon"><Icon size={18} /></span>
                  <span><strong>{option.title}</strong><small>{option.description}</small></span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {leavesBalance && <TextField label={paymentSituation === "parcial" ? "Vencimento do saldo" : "Vencimento da conta"} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} error={errors.dueDate} required />}

        {recordsPayment && (
          <section className="command-payment-fields">
            {paymentSituation === "parcial" && <TextField label="Valor recebido agora" type="number" min="0.01" max={Math.max(total - 0.01, 0)} step="0.01" value={amount} onChange={(event) => { setAmount(event.target.value); setErrors((current) => ({ ...current, amount: undefined })); }} error={errors.amount} trailingContent="R$" required />}
            <SelectField label="Forma de pagamento" value={paymentMethodId} onChange={(event) => { setPaymentMethodId(event.target.value); setCashSessionId(""); setErrors((current) => ({ ...current, paymentMethodId: undefined })); }} options={methods.map((item) => ({ value: String(item.id), label: item.nome }))} placeholder="Selecione" error={errors.paymentMethodId} hint={!methods.length ? "Cadastre uma forma de pagamento ativa no Financeiro." : undefined} required />
            {selectedMethod?.tipo === "dinheiro" && <SelectField label="Sessão de caixa" value={cashSessionId} onChange={(event) => setCashSessionId(event.target.value)} options={catalogs.cashSessions.map((session) => ({ value: String(session.id), label: `${session.caixa?.nome ?? "Caixa"} · saldo ${formatCommercialCurrency(session.saldo_esperado)}` }))} placeholder="Não movimentar caixa físico" hint={catalogs.cashSessions.length ? "Selecione para refletir o dinheiro no caixa." : "Nenhuma sessão está aberta; o recebimento ainda pode ser registrado."} />}
            <TextField label="Data e hora do pagamento" type="datetime-local" value={paidAt} onChange={(event) => { setPaidAt(event.target.value); setErrors((current) => ({ ...current, paidAt: undefined })); }} error={errors.paidAt} required />
            <TextField label="Referência" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="NSU, comprovante ou identificação" />
            <TextAreaField label="Observações do pagamento" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} wrapperClassName="command-payment-fields__notes" />
          </section>
        )}

        {consumptions.length > 0 && <section className="command-consumptions" aria-labelledby={`${formId}-consumptions`}>
          <header><span><Beaker size={18} /></span><div><h3 id={`${formId}-consumptions`}>Insumos utilizados</h3><p>A receita do serviço já veio preenchida. Ajuste somente o que foi usado de verdade.</p></div></header>
          <div>{consumptions.map((item) => <article key={item.key}>
            <div><strong>{item.productName}</strong><small>Sugerido: {item.suggested} {item.unit} · custo {formatCommercialCurrency(item.unitCost)}/{item.unit}</small></div>
            <label><span>Quantidade</span><input type="number" min="0" step="0.001" value={item.quantity} onChange={(event) => setConsumptions((current) => current.map((candidate) => candidate.key === item.key ? { ...candidate, quantity: event.target.value } : candidate))} /><small>{item.unit}</small></label>
            <label className="command-consumption-check"><input type="checkbox" checked={item.deductCommission} onChange={(event) => setConsumptions((current) => current.map((candidate) => candidate.key === item.key ? { ...candidate, deductCommission: event.target.checked } : candidate))} /><span>Abater da base da comissão</span></label>
          </article>)}</div>
        </section>}

        <div className="command-payment-summary">
          {recordsPayment && <div><span>Recebido agora</span><strong>{formatCommercialCurrency(paymentAmount)}</strong></div>}
          {paymentFee > 0 && <div><span>Taxa estimada da forma de pagamento</span><strong>- {formatCommercialCurrency(paymentFee)}</strong></div>}
          {materialCost > 0 && <div><span>Custo dos insumos informados</span><strong>- {formatCommercialCurrency(materialCost)}</strong></div>}
          <div><span>{remaining > 0 ? "Saldo a receber" : "Saldo restante"}</span><strong>{formatCommercialCurrency(remaining)}</strong></div>
        </div>
        <ul><li>Baixa os produtos do estoque.</li><li>Calcula e lança as comissões.</li><li>{paymentSituation === "pago" ? "Gera e quita a conta a receber." : paymentSituation === "parcial" ? "Gera a conta e registra o pagamento parcial." : "Gera uma conta a receber em aberto."}</li></ul>
      </form>
    </Modal>
  );
}
