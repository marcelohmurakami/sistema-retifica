import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const workflow = JSON.parse(readFileSync(new URL('./02-evolution-inbound-and-receipts.json', import.meta.url), 'utf8'))
assert.equal(workflow.active, false)

const names = new Set(workflow.nodes.map((node) => node.name))
for (const [source, outputs] of Object.entries(workflow.connections)) {
  assert.ok(names.has(source), `Origem inexistente: ${source}`)
  for (const branch of outputs.main ?? []) {
    for (const edge of branch ?? []) assert.ok(names.has(edge.node), `Destino inexistente: ${edge.node}`)
  }
}
for (const node of workflow.nodes) {
  if (node.type === 'n8n-nodes-base.code') new Function(node.parameters.jsCode)
}
function strings(value) {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}
for (const value of strings(workflow)) {
  if (value.startsWith('={{') && value.endsWith('}}')) new Function(`return (${value.slice(3, -2)})`)
}

const normalizer = workflow.nodes.find((node) => node.name === 'Validar e normalizar')
const normalize = new Function('$input', '$env', normalizer.parameters.jsCode)
const items = normalize(
  { first: () => ({ json: {
    headers: { 'x-webhook-secret': 'segredo-de-teste' },
    body: { instance: 'estudos-whatsapp', event: 'messages.update', data: [
      { keyId: 'id-evolution-1', messageId: 'id-interno-1', status: 'DELIVERY_ACK' },
      { keyId: 'id-evolution-2', messageId: 'id-interno-2', status: 'READ' },
    ] },
  } }) },
  { EVOLUTION_WEBHOOK_SECRET: 'segredo-de-teste', EVOLUTION_INSTANCE: 'estudos-whatsapp', WHATSAPP_COMPANY_ID: '10' },
)
assert.deepEqual(items.map((item) => item.json), [
  { route: 'receipt', companyId: 10, instanceName: 'estudos-whatsapp', externalId: 'id-evolution-1', deliveryStatus: 'entregue' },
  { route: 'receipt', companyId: 10, instanceName: 'estudos-whatsapp', externalId: 'id-evolution-2', deliveryStatus: 'lida' },
])

const receiptSwitch = workflow.connections['Recibo de entrega?'].main[0]
assert.equal(receiptSwitch.length, 1)
assert.equal(receiptSwitch[0].node, 'Registrar recibo e reconciliar')
const receiptRpc = workflow.nodes.find((node) => node.name === 'Registrar recibo e reconciliar')
assert.match(receiptRpc.parameters.url, /n8n_registrar_recibo_whatsapp/)
assert.match(receiptRpc.parameters.body, /p_identificador_externo: \$json.externalId/)
assert.match(receiptRpc.parameters.body, /p_status: \$json.deliveryStatus/)
assert.equal(workflow.connections[receiptRpc.name], undefined)

console.log('OK recibos: keyId, data[], estados, grafo e workflow inativo.')
