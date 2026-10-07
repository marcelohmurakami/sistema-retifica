import { useId, useState, type FormEvent } from 'react'
import { CheckboxField, FormActions, MaskedInput, Modal, TextAreaField, TextField } from '../../../components_shared'
import { hasFuncionarioFormErrors, validateFuncionarioForm } from '../schemas/funcionario-form.validation'
import type { Funcionario, FuncionarioFormErrors, FuncionarioFormValues, FuncionarioWriteInput } from '../types/funcionarios.types'
import { employeeFormToInput, employeeToFormValues, getEmptyFuncionarioFormValues } from '../utils/funcionarios.utils'

type Props = { employee?: Funcionario; isSubmitting: boolean; onClose: () => void; onSubmit: (input: FuncionarioWriteInput) => Promise<void> }

export function EmployeeFormModal({ employee, isSubmitting, onClose, onSubmit }: Props) {
  const formId = useId()
  const [values, setValues] = useState<FuncionarioFormValues>(() => employee ? employeeToFormValues(employee) : getEmptyFuncionarioFormValues())
  const [errors, setErrors] = useState<FuncionarioFormErrors>({})
  function update<K extends keyof FuncionarioFormValues>(field: K, value: FuncionarioFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => { if (!current[field]) return current; const next = { ...current }; delete next[field]; return next })
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validation = validateFuncionarioForm(values)
    setErrors(validation)
    if (hasFuncionarioFormErrors(validation)) return
    try { await onSubmit(employeeFormToInput(values)) } catch { return }
  }
  return <Modal open onClose={onClose} title={employee ? 'Editar funcionário' : 'Novo funcionário'} description="Dados cadastrais e configuração de atendimento." size="lg" isDismissible={!isSubmitting} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancelar</button><button className="btn btn--primary" type="submit" form={formId} disabled={isSubmitting}>{isSubmitting && <span className="btn-spinner" />}{isSubmitting ? 'Salvando...' : 'Salvar funcionário'}</button></FormActions>}>
    <form id={formId} className="employee-form" onSubmit={(event) => void submit(event)} noValidate>
      <div className="employee-form__heading field--full"><h3>Identificação</h3><p>Informações básicas do colaborador.</p></div>
      <TextField label="Nome completo" value={values.nome} onChange={(event) => update('nome', event.target.value)} error={errors.nome} maxLength={160} autoFocus required wrapperClassName="field--full" />
      <MaskedInput mask="cpf" label="CPF" value={values.cpf} onValueChange={(formatted) => update('cpf', formatted)} error={errors.cpf} placeholder="000.000.000-00" />
      <MaskedInput mask="telefone" label="Telefone" value={values.telefone} onValueChange={(formatted) => update('telefone', formatted)} error={errors.telefone} placeholder="(00) 00000-0000" />
      <TextField label="E-mail" type="email" value={values.email} onChange={(event) => update('email', event.target.value)} error={errors.email} placeholder="funcionario@email.com" />
      <TextField label="Cargo ou função" value={values.cargo} onChange={(event) => update('cargo', event.target.value)} maxLength={100} placeholder="Ex.: Cabeleireira" />
      <TextField label="Data de nascimento" type="date" value={values.dataNascimento} onChange={(event) => update('dataNascimento', event.target.value)} error={errors.dataNascimento} />
      <TextField label="Data de admissão" type="date" value={values.dataAdmissao} onChange={(event) => update('dataAdmissao', event.target.value)} />
      <TextField label="Data de desligamento" type="date" value={values.dataDesligamento} onChange={(event) => update('dataDesligamento', event.target.value)} error={errors.dataDesligamento} />
      <div className="field"><label className="field__label" htmlFor={`${formId}-color`}>Cor na agenda</label><div className="employee-color-input"><input id={`${formId}-color`} type="color" value={values.corAgenda} onChange={(event) => update('corAgenda', event.target.value)} /><span>{values.corAgenda}</span></div></div>
      <TextField label="Endereço" value={values.endereco} onChange={(event) => update('endereco', event.target.value)} maxLength={300} wrapperClassName="field--full" />
      <TextAreaField label="Observações" value={values.observacoes} onChange={(event) => update('observacoes', event.target.value)} rows={3} maxLength={1000} wrapperClassName="field--full" />
      <div className="employee-form__options field--full"><CheckboxField label="Realiza atendimentos" description="Aparece como profissional disponível na agenda." checked={values.atendeClientes} onChange={(event) => update('atendeClientes', event.target.checked)} /><CheckboxField label="Funcionário ativo" description="Funcionários inativos permanecem apenas no histórico." checked={values.ativo} onChange={(event) => update('ativo', event.target.checked)} /></div>
    </form>
  </Modal>
}
