import { useId, useState, type FormEvent } from 'react'
import {
  CheckboxField,
  FormActions,
  MaskedInput,
  Modal,
  SelectField,
  TextAreaField,
  TextField,
} from '../../../components_shared'
import { hasClienteFormErrors, validateClienteForm } from '../schemas/cliente-form.validation'
import type { Cliente, ClienteFormErrors, ClienteFormValues, ClienteWriteInput, ConsentKey, Consentimento } from '../types/clientes.types'
import { clientFormToInput, clientToFormValues, CONSENT_DEFINITIONS, getEmptyClienteFormValues } from '../utils/clientes.utils'

type Props = {
  client?: Cliente
  consents?: Consentimento[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (input: ClienteWriteInput) => Promise<void>
}

export function ClientFormModal({ client, consents = [], isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId()
  const [values, setValues] = useState<ClienteFormValues>(() => client ? clientToFormValues(client, consents) : getEmptyClienteFormValues())
  const [errors, setErrors] = useState<ClienteFormErrors>({})

  function updateValue<K extends keyof ClienteFormValues>(field: K, value: ClienteFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function updateConsent(key: ConsentKey, checked: boolean) {
    setValues((current) => ({
      ...current,
      consentimentos: { ...current.consentimentos, [key]: checked },
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateClienteForm(values)
    setErrors(validationErrors)
    if (hasClienteFormErrors(validationErrors)) return
    try {
      await onSubmit(clientFormToInput(values))
    } catch {
      return
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={client ? 'Editar cliente' : 'Novo cliente'}
      description="Dados cadastrais e preferências de comunicação em um só lugar."
      size="xl"
      isDismissible={!isSubmitting}
      footer={
        <FormActions>
          <button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button>
          <button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>
            {isSubmitting && <span className="btn-spinner" />}
            {isSubmitting ? 'Salvando...' : 'Salvar cliente'}
          </button>
        </FormActions>
      }
    >
      <form id={formId} className="client-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <section className="client-form__section client-form__grid">
          <div className="client-form__section-heading field--full"><h3>Dados principais</h3><p>Identificação e canais de contato do cliente.</p></div>
          <TextField label="Nome completo" value={values.nome} onChange={(event) => updateValue('nome', event.target.value)} error={errors.nome} maxLength={160} autoFocus required wrapperClassName="field--full" />
          <MaskedInput mask="cpf" label="CPF" value={values.cpf} onValueChange={(formatted) => updateValue('cpf', formatted)} error={errors.cpf} placeholder="000.000.000-00" />
          <TextField label="Data de nascimento" type="date" value={values.dataNascimento} onChange={(event) => updateValue('dataNascimento', event.target.value)} error={errors.dataNascimento} />
          <MaskedInput mask="telefone" label="Telefone principal" value={values.telefonePrincipal} onValueChange={(formatted) => updateValue('telefonePrincipal', formatted)} error={errors.telefonePrincipal} placeholder="(00) 00000-0000" />
          <MaskedInput mask="telefone" label="Telefone secundário" value={values.telefoneSecundario} onValueChange={(formatted) => updateValue('telefoneSecundario', formatted)} error={errors.telefoneSecundario} placeholder="(00) 00000-0000" />
          <TextField label="E-mail" type="email" value={values.email} onChange={(event) => updateValue('email', event.target.value)} error={errors.email} placeholder="cliente@email.com" />
          <SelectField label="Gênero" value={values.genero} onChange={(event) => updateValue('genero', event.target.value)} placeholder="Não informado" options={[{ value: 'feminino', label: 'Feminino' }, { value: 'masculino', label: 'Masculino' }, { value: 'nao_binario', label: 'Não binário' }, { value: 'outro', label: 'Outro' }, { value: 'prefere_nao_informar', label: 'Prefere não informar' }]} />
          <TextField label="Endereço" value={values.endereco} onChange={(event) => updateValue('endereco', event.target.value)} maxLength={300} wrapperClassName="field--full" />
          <TextAreaField label="Observações" value={values.observacoes} onChange={(event) => updateValue('observacoes', event.target.value)} rows={3} maxLength={1000} wrapperClassName="field--full" />
          <CheckboxField label="Cliente ativo" description="Clientes inativos permanecem no histórico, mas não aparecem como opção padrão." checked={values.ativo} onChange={(event) => updateValue('ativo', event.target.checked)} />
        </section>

        <section className="client-form__section">
          <div className="client-form__section-heading"><h3>Consentimentos de comunicação</h3><p>Registre a autorização por canal e finalidade para respeitar a LGPD.</p></div>
          <SelectField label="Canal preferido" value={values.canalPreferido} onChange={(event) => updateValue('canalPreferido', event.target.value)} placeholder="Não informado" options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'E-mail' }, { value: 'sms', label: 'SMS' }, { value: 'telefone', label: 'Telefone' }, { value: 'nenhum', label: 'Nenhum' }]} />
          <div className="client-consents">
            {(Object.entries(CONSENT_DEFINITIONS) as [ConsentKey, (typeof CONSENT_DEFINITIONS)[ConsentKey]][]).map(([key, definition]) => (
              <CheckboxField key={key} label={definition.label} description={definition.description} checked={values.consentimentos[key]} disabled={values.bloquearComunicacao} onChange={(event) => updateConsent(key, event.target.checked)} />
            ))}
          </div>
          <div className="client-consents__block">
            <CheckboxField label="Bloquear toda comunicação" description="Desativa os consentimentos e impede disparos para este cliente." checked={values.bloquearComunicacao} onChange={(event) => updateValue('bloquearComunicacao', event.target.checked)} />
          </div>
        </section>
      </form>
    </Modal>
  )
}
