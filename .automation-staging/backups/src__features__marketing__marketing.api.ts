import { supabase } from '../../supabase/supabaseApi'

export type MarketingAudience = {
  codigo: string
  nome: string
  descricao: string
  quantidade: number
}

export type MarketingPreview = {
  total: number
  amostra: { id: number; nome: string }[]
}

export type MarketingCampaign = {
  id: number
  nome: string
  mensagem: string
  publico_codigo: string
  canal: 'whatsapp' | 'email'
  status: string
  programada_para: string | null
  total_destinatarios: number
  enviados: number
  entregues: number
  lidos: number
  agendamentos: number
  receita_gerada: number
}

export type MarketingDraftInput = {
  companyId: number
  name: string
  message: string
  audienceCode: string
  channel: 'whatsapp' | 'email'
  scheduledFor: string | null
}

export type MarketingCopySuggestion = {
  message: string
  audienceCode: string
  rationale: string
}

export type MarketingAutomation = {
  id: number
  nome: string
  tipo: 'retorno_servico' | 'reativacao' | 'aniversario' | 'avaliacao_pos_atendimento'
  id_servico: number | null
  servico: string | null
  dias_apos: number
  horario_local: string
  mensagem: string
  filtros: Record<string, unknown>
  ativo: boolean
  ultima_execucao_em: string | null
}

export type MarketingAutomationInput = Omit<MarketingAutomation, 'id' | 'servico' | 'ultima_execucao_em'> & {
  id: number | null
  companyId: number
}

export type MarketingReviewSummary = {
  solicitacoes: number
  pendentes: number
  respondidas: number
  nota_media: number | null
  notas_baixas: number
  convites_google: number
}

export type WhatsAppMarketingConfig = {
  ativo: boolean
  modo: 'desativado' | 'sandbox' | 'producao'
  instancia_evolution?: string
  chatbot_ativo: boolean
  campanhas_ativas: boolean
  automacoes_ativas: boolean
  avaliacoes_ativas: boolean
  url_avaliacao_google_configurada?: boolean
}

type RpcName =
  | 'listar_publicos_marketing'
  | 'previsualizar_publico_marketing'
  | 'criar_rascunho_campanha_marketing'
  | 'publicar_campanha_marketing'
  | 'listar_campanhas_marketing'
  | 'listar_regras_automacao_marketing'
  | 'salvar_regra_automacao_marketing'
  | 'resumo_avaliacoes_marketing'
  | 'obter_configuracao_whatsapp_marketing'

async function rpc(name: RpcName, args: Record<string, unknown>): Promise<unknown> {
  // These RPCs are introduced by the versioned marketing migration. Generated
  // Supabase types are refreshed after the migration is deployed.
  const { data, error } = await supabase.rpc(name as never, args as never)
  if (error) throw new Error(error.message)
  return data
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object') : []
}

function numberValue(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : 0 }
function stringValue(value: unknown) { return typeof value === 'string' ? value : '' }

export async function listMarketingAudiences(companyId: number, channel: 'whatsapp' | 'email'): Promise<MarketingAudience[]> {
  const data = await rpc('listar_publicos_marketing', { p_id_empresa: companyId, p_canal: channel })
  return asArray(data).map((item) => ({
    codigo: stringValue(item.codigo), nome: stringValue(item.nome),
    descricao: stringValue(item.descricao), quantidade: numberValue(item.quantidade),
  })).filter((item) => item.codigo && item.nome)
}

export async function previewMarketingAudience(companyId: number, audienceCode: string, channel: 'whatsapp' | 'email'): Promise<MarketingPreview> {
  const data = await rpc('previsualizar_publico_marketing', { p_id_empresa: companyId, p_publico_codigo: audienceCode, p_canal: channel })
  const value = data && typeof data === 'object' ? data as Record<string, unknown> : {}
  return {
    total: numberValue(value.total),
    amostra: asArray(value.amostra).map((item) => ({ id: numberValue(item.id), nome: stringValue(item.nome) })).filter((item) => item.id > 0 && item.nome),
  }
}

export async function createMarketingDraft(input: MarketingDraftInput) {
  return rpc('criar_rascunho_campanha_marketing', {
    p_id_empresa: input.companyId, p_nome: input.name, p_mensagem: input.message,
    p_publico_codigo: input.audienceCode, p_canal: input.channel,
    p_programada_para: input.scheduledFor,
  })
}

export async function publishMarketingCampaign(companyId: number, campaignId: number) {
  return rpc('publicar_campanha_marketing', { p_id_empresa: companyId, p_id_campanha: campaignId })
}

export async function listMarketingCampaigns(companyId: number): Promise<MarketingCampaign[]> {
  const data = await rpc('listar_campanhas_marketing', { p_id_empresa: companyId })
  return asArray(data).map((item) => ({
    id: numberValue(item.id), nome: stringValue(item.nome), mensagem: stringValue(item.mensagem),
    publico_codigo: stringValue(item.publico_codigo), canal: (item.canal === 'email' ? 'email' : 'whatsapp') as MarketingCampaign['canal'],
    status: stringValue(item.status), programada_para: item.programada_para === null ? null : stringValue(item.programada_para) || null,
    total_destinatarios: numberValue(item.total_destinatarios), enviados: numberValue(item.enviados),
    entregues: numberValue(item.entregues), lidos: numberValue(item.lidos),
    agendamentos: numberValue(item.agendamentos ?? item.agendamentos_atribuicao_explicita),
    receita_gerada: numberValue(item.receita_gerada ?? item.receita_atribuicao_explicita),
  })).filter((item) => item.id > 0)
}

export async function suggestMarketingCopy(companyId: number, request: string): Promise<MarketingCopySuggestion> {
  const { data, error } = await supabase.functions.invoke('marketing-ai', {
    body: { companyId, brief: request },
  })
  if (error) throw new Error('A sugestão com IA ainda não está configurada com segurança no servidor.')
  const value = data && typeof data === 'object' ? data as Record<string, unknown> : {}
  const message = stringValue(value.message)
  const audienceCode = stringValue(value.segmentKey)
  if (!message || !audienceCode) throw new Error('A IA retornou uma sugestão incompleta. Tente descrever melhor a campanha.')
  return { message, audienceCode, rationale: stringValue(value.rationale) }
}

export async function listMarketingAutomations(companyId: number): Promise<MarketingAutomation[]> {
  const data = await rpc('listar_regras_automacao_marketing', { p_id_empresa: companyId })
  return asArray(data).map((item) => ({
    id: numberValue(item.id), nome: stringValue(item.nome), tipo: item.tipo as MarketingAutomation['tipo'],
    id_servico: item.id_servico === null ? null : numberValue(item.id_servico),
    servico: item.servico === null ? null : stringValue(item.servico), dias_apos: numberValue(item.dias_apos),
    horario_local: stringValue(item.horario_local), mensagem: stringValue(item.mensagem),
    filtros: item.filtros && typeof item.filtros === 'object' && !Array.isArray(item.filtros) ? item.filtros as Record<string, unknown> : {},
    ativo: item.ativo === true, ultima_execucao_em: item.ultima_execucao_em === null ? null : stringValue(item.ultima_execucao_em) || null,
  })).filter((item) => item.id > 0)
}

export async function saveMarketingAutomation(input: MarketingAutomationInput) {
  return rpc('salvar_regra_automacao_marketing', {
    p_id_empresa: input.companyId, p_id: input.id, p_nome: input.nome, p_tipo: input.tipo,
    p_id_servico: input.id_servico, p_dias_apos: input.dias_apos,
    p_horario_local: input.horario_local, p_mensagem: input.mensagem,
    p_filtros: input.filtros, p_ativo: input.ativo,
  })
}

export async function getMarketingReviewSummary(companyId: number): Promise<MarketingReviewSummary> {
  const data = await rpc('resumo_avaliacoes_marketing', { p_id_empresa: companyId })
  const value = data && typeof data === 'object' ? data as Record<string, unknown> : {}
  return {
    solicitacoes: numberValue(value.solicitacoes), pendentes: numberValue(value.pendentes),
    respondidas: numberValue(value.respondidas), nota_media: value.nota_media === null ? null : numberValue(value.nota_media),
    notas_baixas: numberValue(value.notas_baixas), convites_google: numberValue(value.convites_google),
  }
}

export async function getWhatsAppMarketingConfig(companyId: number): Promise<WhatsAppMarketingConfig> {
  const data = await rpc('obter_configuracao_whatsapp_marketing', { p_id_empresa: companyId })
  const value = data && typeof data === 'object' ? data as Record<string, unknown> : {}
  return {
    ativo: value.ativo === true, modo: value.modo === 'sandbox' || value.modo === 'producao' ? value.modo : 'desativado',
    instancia_evolution: stringValue(value.instancia_evolution) || undefined,
    chatbot_ativo: value.chatbot_ativo === true, campanhas_ativas: value.campanhas_ativas === true,
    automacoes_ativas: value.automacoes_ativas === true, avaliacoes_ativas: value.avaliacoes_ativas === true,
    url_avaliacao_google_configurada: value.url_avaliacao_google_configurada === true,
  }
}
