import { Minus, Plus, PackageOpen } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { CheckboxField, FormActions, LoadingState, Modal, SelectField, TextField } from '../../../components_shared'
import { useInputProducts, useSaveServiceInputs, useServiceInputs } from '../hooks/useServices'
import type { Servico, ServicoInsumoInput } from '../types/servicos.types'

type DraftInput = { productId: string; quantity: string; deductCommission: boolean }
type Props = { companyId: number; service: Servico; onClose: () => void }

const emptyInput = (): DraftInput => ({ productId: '', quantity: '', deductCommission: true })

export function ServiceInputsModal({ companyId, service, onClose }: Props) {
  const formId = useId()
  const inputsQuery = useServiceInputs(companyId, service.id)
  const productsQuery = useInputProducts(companyId)
  const mutation = useSaveServiceInputs(companyId, service.id)
  const [rows, setRows] = useState<DraftInput[]>([emptyInput()])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!inputsQuery.data) return
    setRows(inputsQuery.data.length ? inputsQuery.data.map((item) => ({
      productId: String(item.id_produto),
      quantity: String(item.quantidade_padrao),
      deductCommission: item.descontar_comissao,
    })) : [emptyInput()])
  }, [inputsQuery.data])

  function update(index: number, patch: Partial<DraftInput>) {
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row))
    setError('')
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const filled = rows.filter((row) => row.productId || row.quantity)
    const ids = filled.map((row) => Number(row.productId))
    if (filled.some((row) => !Number.isInteger(Number(row.productId)) || Number(row.quantity) <= 0)) return setError('Selecione o produto e informe uma quantidade maior que zero.')
    if (new Set(ids).size !== ids.length) return setError('O mesmo produto não pode aparecer duas vezes.')
    const payload: ServicoInsumoInput[] = filled.map((row) => ({ id_produto: Number(row.productId), quantidade: Number(row.quantity), descontar_comissao: row.deductCommission }))
    await mutation.mutateAsync(payload)
    onClose()
  }

  const products = productsQuery.data ?? []
  const loading = inputsQuery.isPending || productsQuery.isPending
  return <Modal open onClose={onClose} title={`Insumos de ${service.nome}`} description="Defina a quantidade normalmente utilizada. Ela poderá ser ajustada ao finalizar cada atendimento." size="lg" isDismissible={!mutation.isPending} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose} disabled={mutation.isPending}>Cancelar</button><button className="btn btn--primary" type="submit" form={formId} disabled={loading || mutation.isPending}>{mutation.isPending ? 'Salvando…' : 'Salvar receita'}</button></FormActions>}>
    {loading ? <LoadingState label="Carregando insumos…" /> : <form id={formId} className="service-inputs-form" onSubmit={(event) => void submit(event)} noValidate>
      <div className="service-inputs-callout"><PackageOpen size={19} /><p><strong>Receita operacional</strong><span>O custo é congelado no atendimento e pode ser abatido da base da comissão.</span></p></div>
      <div className="service-inputs-list">
        {rows.map((row, index) => <article key={`${index}-${row.productId}`}>
          <SelectField label="Produto" value={row.productId} onChange={(event) => update(index, { productId: event.target.value })} placeholder="Selecione um insumo" options={products.map((product) => ({ value: String(product.id), label: `${product.nome} · ${product.estoque_atual} ${product.unidade_medida}` }))} />
          <TextField label="Quantidade" type="number" min="0.0001" step="0.0001" value={row.quantity} onChange={(event) => update(index, { quantity: event.target.value })} />
          <CheckboxField label="Abater da comissão" description="Reduz a base do profissional." checked={row.deductCommission} onChange={(event) => update(index, { deductCommission: event.target.checked })} />
          <button className="btn btn--icon btn--ghost service-input-remove" type="button" aria-label="Remover insumo" onClick={() => setRows((current) => current.length === 1 ? [emptyInput()] : current.filter((_, rowIndex) => rowIndex !== index))}><Minus size={17} /></button>
        </article>)}
      </div>
      <button className="btn btn--secondary" type="button" onClick={() => setRows((current) => [...current, emptyInput()])}><Plus size={17} /> Adicionar insumo</button>
      {!products.length && <p className="alert alert--info">Cadastre produtos ativos com controle de estoque para montar a receita.</p>}
      {error && <p className="alert alert--danger" role="alert">{error}</p>}
    </form>}
  </Modal>
}
