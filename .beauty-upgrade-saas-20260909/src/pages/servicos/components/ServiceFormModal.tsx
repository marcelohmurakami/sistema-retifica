import { useId, useState, type FormEvent } from "react";
import {
  CheckboxField,
  FormActions,
  MaskedInput,
  Modal,
  SelectField,
  TextAreaField,
  TextField,
} from "../../../components_shared";
import {
  hasServicoFormErrors,
  validateServicoForm,
} from "../schemas/servico-form.validation";
import type {
  Servico,
  ServicoFormErrors,
  ServicoFormValues,
  ServicoSignalType,
  ServicoWritePayload,
} from "../types/servicos.types";
import {
  getEmptyServicoFormValues,
  serviceFormToPayload,
  serviceToFormValues,
} from "../utils/servicos.utils";

type ServiceFormModalProps = {
  service?: Servico;
  canUseOnlineScheduling: boolean;
  canActivate: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (input: ServicoWritePayload) => Promise<void>;
};

export function ServiceFormModal({
  service,
  canUseOnlineScheduling,
  canActivate,
  isSubmitting,
  onClose,
  onSubmit,
}: ServiceFormModalProps) {
  const formId = useId();
  const [values, setValues] = useState<ServicoFormValues>(() =>
    service ? serviceToFormValues(service) : getEmptyServicoFormValues(),
  );
  const [errors, setErrors] = useState<ServicoFormErrors>({});

  function updateValue<K extends keyof ServicoFormValues>(
    field: K,
    value: ServicoFormValues[K],
  ) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => {
      if (!currentErrors[field]) return currentErrors;
      const nextErrors = { ...currentErrors };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateServicoForm(values);
    setErrors(validationErrors);

    if (hasServicoFormErrors(validationErrors)) return;
    try {
      await onSubmit(serviceFormToPayload(values));
    } catch {
      return;
    }
  }

  const signalValueLabel =
    values.sinalTipo === "percentual"
      ? "Percentual do sinal"
      : "Valor do sinal";

  return (
    <Modal
      open
      onClose={onClose}
      title={service ? "Editar serviço" : "Novo serviço"}
      description="Defina preço, duração e regras usadas no agendamento."
      size="lg"
      isDismissible={!isSubmitting}
      footer={
        <FormActions>
          <button
            className="btn btn--secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            className="btn btn--primary"
            type="submit"
            form={formId}
            disabled={isSubmitting}
          >
            {isSubmitting && <span className="btn-spinner" />}
            {isSubmitting ? "Salvando..." : "Salvar serviço"}
          </button>
        </FormActions>
      }
    >
      <form
        id={formId}
        className="service-form"
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
        <TextField
          label="Nome do serviço"
          value={values.nome}
          onChange={(event) => updateValue("nome", event.target.value)}
          error={errors.nome}
          placeholder="Ex.: Corte feminino"
          maxLength={120}
          autoFocus
          required
          wrapperClassName="field--full"
        />

        <TextAreaField
          label="Descrição"
          value={values.descricao}
          onChange={(event) => updateValue("descricao", event.target.value)}
          error={errors.descricao}
          placeholder="Informações que ajudam a identificar o serviço"
          maxLength={500}
          rows={3}
          wrapperClassName="field--full"
        />

        <MaskedInput
          mask="dinheiro"
          label="Preço"
          value={values.preco}
          onValueChange={(formattedValue) =>
            updateValue("preco", formattedValue)
          }
          error={errors.preco}
          required
        />

        <TextField
          label="Duração"
          type="number"
          inputMode="numeric"
          min={5}
          max={1440}
          step={5}
          value={values.duracaoMinutos}
          onChange={(event) =>
            updateValue("duracaoMinutos", event.target.value)
          }
          error={errors.duracaoMinutos}
          hint="Em minutos"
          required
        />

        <TextField
          label="Intervalo após o serviço"
          type="number"
          inputMode="numeric"
          min={0}
          max={480}
          step={5}
          value={values.intervaloMinutos}
          onChange={(event) =>
            updateValue("intervaloMinutos", event.target.value)
          }
          error={errors.intervaloMinutos}
          hint="Tempo de limpeza ou preparação, em minutos"
        />

        <div className="service-form__options field--full">
          <CheckboxField
            label="Serviço ativo"
            description={
              canActivate
                ? "Serviços ativos podem ser usados em novos atendimentos."
                : "O limite de serviços ativos do plano foi atingido."
            }
            checked={values.ativo}
            onChange={(event) => updateValue("ativo", event.target.checked)}
            disabled={!canActivate && !values.ativo}
          />

          <CheckboxField
            label="Permitir agendamento online"
            description={
              canUseOnlineScheduling
                ? "O cliente poderá escolher este serviço no agendamento público."
                : "Este recurso não está disponível no plano atual."
            }
            checked={values.permiteAgendamentoOnline}
            onChange={(event) =>
              updateValue("permiteAgendamentoOnline", event.target.checked)
            }
            disabled={!canUseOnlineScheduling}
          />

          <CheckboxField
            label="Exigir sinal"
            description="Cobre uma entrada para confirmar o agendamento."
            checked={values.exigeSinal}
            onChange={(event) => {
              const requiresSignal = event.target.checked;
              setValues((currentValues) => ({
                ...currentValues,
                exigeSinal: requiresSignal,
                sinalTipo: requiresSignal
                  ? currentValues.sinalTipo || "valor_fixo"
                  : "",
                sinalValor: requiresSignal ? currentValues.sinalValor : "",
              }));
              setErrors((currentErrors) => {
                const nextErrors = { ...currentErrors };
                delete nextErrors.sinalTipo;
                delete nextErrors.sinalValor;
                return nextErrors;
              });
            }}
          />
        </div>

        {values.exigeSinal && (
          <div className="service-form__signal field--full">
            <SelectField
              label="Tipo de sinal"
              value={values.sinalTipo}
              onChange={(event) => {
                updateValue(
                  "sinalTipo",
                  event.target.value as ServicoSignalType,
                );
                updateValue("sinalValor", "");
              }}
              options={[
                { value: "valor_fixo", label: "Valor fixo" },
                { value: "percentual", label: "Percentual do serviço" },
              ]}
              error={errors.sinalTipo}
              required
            />

            {values.sinalTipo === "percentual" ? (
              <TextField
                label={signalValueLabel}
                type="number"
                inputMode="decimal"
                min={0.01}
                max={100}
                step={0.01}
                value={values.sinalValor}
                onChange={(event) =>
                  updateValue("sinalValor", event.target.value)
                }
                trailingContent="%"
                error={errors.sinalValor}
                required
              />
            ) : (
              <MaskedInput
                mask="dinheiro"
                label={signalValueLabel}
                value={values.sinalValor}
                onValueChange={(formattedValue) =>
                  updateValue("sinalValor", formattedValue)
                }
                error={errors.sinalValor}
                required
              />
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
