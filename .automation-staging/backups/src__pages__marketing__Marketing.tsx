import {
  ArrowRight, BarChart3, Bot, CalendarDays, CheckCircle2, Clock3,
  Eye, HeartHandshake, MailCheck, MessageCircle, PauseCircle, Plus,
  RefreshCw, Send, ShieldCheck, Sparkles, Star, UsersRound,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { FormActions, Modal, TextAreaField, TextField } from '../../components_shared'
import { useAuth } from '../../features/auth/hooks/useAuth'
import {
  useCreateMarketingDraft, useMarketingAudiencePreview, useMarketingAudiences,
  useMarketingAutomations, useMarketingCampaigns, useMarketingReviewSummary,
  usePublishMarketingCampaign, useSaveMarketingAutomation, useSuggestMarketingCopy,
  useWhatsAppMarketingConfig,
} from '../../features/marketing/marketing.hooks'
import { daysUntil, marketingOccasions } from '../../features/marketing/marketing-calendar'
import type { MarketingAutomation, MarketingCampaign } from '../../features/marketing/marketing.api'
import { useServices } from '../servicos/hooks/useServices'
import './marketing.css'

type Tab = 'campanhas' | 'automacoes' | 'avaliacoes' | 'calendario'
type Channel = 'whatsapp' | 'email'

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function percentage(value: number, total: number) {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : '—'
}

function localDateTimeMinimum() {
  const value = new Date(Date.now() + 300_000)
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset())
  return value.toISOString().slice(0, 16)
}

function campaignStatus(status: string) {
  const labels: Record<string, string> = {
    rascunho: 'Rascunho', pronta: 'Na fila', processando: 'Enviando',
    concluida: 'Concluída', cancelada: 'Cancelada', programada: 'Programada',
  }
  return labels[status] ?? status
}

function ResultsCard({ campaign }: { campaign: MarketingCampaign }) {
  return <article className="marketing-result">
    <header><div><strong>{campaign.nome}</strong><span>{campaignStatus(campaign.status)} · {campaign.total_destinatarios} destinatários</span></div><span data-status={campaign.status}>{campaignStatus(campaign.status)}</span></header>
    <div className="marketing-result__flow" aria-label="Funil da campanha">
      <div><Send size={16} /><strong>{campaign.enviados}</strong><span>enviados</span></div><ArrowRight size={15} />
      <div><MailCheck size={16} /><strong>{campaign.entregues}</strong><span>entregues</span></div><ArrowRight size={15} />
      <div><Eye size={16} /><strong>{campaign.lidos}</strong><span>visualizados</span></div><ArrowRight size={15} />
      <div><CalendarDays size={16} /><strong>{campaign.agendamentos}</strong><span>agendaram</span></div>
    </div>
    <footer><span>Leitura <strong>{percentage(campaign.lidos, campaign.entregues)}</strong></span><span>Conversão <strong>{percentage(campaign.agendamentos, campaign.lidos)}</strong></span><span>Receita atribuída <strong>{currency.format(campaign.receita_gerada)}</strong></span></footer>
  </article>
}

function CampaignComposer({ companyId }: { companyId: number }) {
  const [channel, setChannel] = useState<Channel>('whatsapp')
  const audiences = useMarketingAudiences(companyId, channel)
  const [selectedAudienceCode, setAudienceCode] = useState('')
  const audienceCode = (audiences.data ?? []).some((item) => item.codigo === selectedAudienceCode)
    ? selectedAudienceCode : (audiences.data?.[0]?.codigo ?? '')
  const preview = useMarketingAudiencePreview(companyId, audienceCode, channel)
  const createDraft = useCreateMarketingDraft(companyId)
  const ai = useSuggestMarketingCopy(companyId)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [schedule, setSchedule] = useState('')
  const [brief, setBrief] = useState('')
  const [aiNote, setAiNote] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await createDraft.mutateAsync({
        companyId, name: name.trim(), message: message.trim(), audienceCode, channel,
        scheduledFor: schedule ? new Date(schedule).toISOString() : null,
      })
      setName(''); setMessage(''); setSchedule(''); setBrief(''); setAiNote('')
    } catch { /* mutation displays the safe server error */ }
  }

  async function askAI() {
    try {
      const result = await ai.mutateAsync(brief.trim())
      setMessage(result.message)
      if ((audiences.data ?? []).some((item) => item.codigo === result.audienceCode)) setAudienceCode(result.audienceCode)
      setAiNote(result.rationale)
    } catch { /* mutation reports unavailable AI without clearing the draft */ }
  }

  const audience = (audiences.data ?? []).find((item) => item.codigo === audienceCode)
  const canSave = name.trim().length > 2 && message.trim().length > 4 && !!audienceCode && (preview.data?.total ?? 0) > 0

  return <section className="card marketing-composer">
    <header><div><span className="page-eyebrow">Nova campanha</span><h2>Prepare a mensagem e revise o público</h2><p>O rascunho não dispara nada. O envio só pode ser liberado depois da revisão.</p></div><span className="marketing-safe"><ShieldCheck size={16} /> Opt-in obrigatório</span></header>
    <form onSubmit={(event) => void submit(event)}>
      <div className="marketing-composer__main">
        <TextField label="Nome interno" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Reativação cabelo — setembro" maxLength={120} required />
        <div className="marketing-field"><span>Canal</span><div className="marketing-segmented"><button type="button" data-active={channel === 'whatsapp'} onClick={() => setChannel('whatsapp')}><MessageCircle size={16} /> WhatsApp</button><button type="button" data-active={channel === 'email'} disabled title="Campanhas por e-mail ainda não estão habilitadas" onClick={() => setChannel('email')}><MailCheck size={16} /> E-mail (em breve)</button></div></div>
        <label className="marketing-field"><span>Público</span><select value={audienceCode} onChange={(event) => setAudienceCode(event.target.value)} disabled={audiences.isPending}>{(audiences.data ?? []).map((item) => <option key={item.codigo} value={item.codigo}>{item.nome} ({item.quantidade})</option>)}</select><small>{audience?.descricao ?? 'Carregando públicos com consentimento válido...'}</small></label>
        <TextAreaField label="Mensagem" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Escreva uma mensagem curta, clara e com opção de saída." maxLength={1000} rows={5} hint="Variável disponível: {nome}. Para incluir um link, use a URL pública real do seu site." required />
        <label className="marketing-field"><span>Programar para (opcional)</span><input type="datetime-local" value={schedule} min={localDateTimeMinimum()} onChange={(event) => setSchedule(event.target.value)} /><small>Sem data, o rascunho fica aguardando sua decisão.</small></label>
      </div>
      <aside className="marketing-composer__aside">
        <div className="marketing-ai"><span><Sparkles size={18} /> Assistente de campanha</span><p>Descreva o objetivo. A IA sugere público e texto, mas você sempre revisa antes de salvar.</p><textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Ex.: trazer clientes de cabelo que estão há 2 meses sem voltar" maxLength={400} rows={3} /><button className="btn btn--secondary" type="button" onClick={() => void askAI()} disabled={brief.trim().length < 10 || ai.isPending}>{ai.isPending ? <span className="btn-spinner" /> : <Sparkles size={16} />} Criar sugestão com IA</button>{aiNote && <small>{aiNote}</small>}</div>
        <div className="marketing-preview"><span><UsersRound size={18} /> Prévia do público</span>{preview.isPending ? <p>Calculando pessoas elegíveis...</p> : preview.isError ? <p className="marketing-error">Não foi possível calcular o público.</p> : <><strong>{preview.data?.total ?? 0} pessoa(s)</strong><p>Somente contatos ativos, válidos e com consentimento para {channel === 'whatsapp' ? 'WhatsApp' : 'e-mail'}.</p>{Boolean(preview.data?.amostra.length) && <div>{preview.data!.amostra.map((client) => <span key={client.id}>{client.nome}</span>)}</div>}</>}</div>
        <button className="btn btn--primary" type="submit" disabled={!canSave || createDraft.isPending}>{createDraft.isPending ? <span className="btn-spinner" /> : <PauseCircle size={17} />} Salvar como rascunho</button>
      </aside>
    </form>
  </section>
}

function CampaignsTab({ companyId }: { companyId: number }) {
  const campaigns = useMarketingCampaigns(companyId)
  const publish = usePublishMarketingCampaign(companyId)
  const rows = campaigns.data ?? []
  const totals = rows.reduce((sum, item) => ({ sent: sum.sent + item.enviados, read: sum.read + item.lidos, bookings: sum.bookings + item.agendamentos, revenue: sum.revenue + item.receita_gerada }), { sent: 0, read: 0, bookings: 0, revenue: 0 })
  async function release(campaign: MarketingCampaign) {
    if (!window.confirm(`Liberar “${campaign.nome}” para a fila de envio? A integração só processará contatos com consentimento válido.`)) return
    try { await publish.mutateAsync(campaign.id) } catch { /* error toast is handled by the hook */ }
  }
  return <>
    <CampaignComposer companyId={companyId} />
    <section className="marketing-kpis" aria-label="Resultados consolidados"><article><Send size={19} /><div><strong>{totals.sent}</strong><span>mensagens enviadas</span></div></article><article><Eye size={19} /><div><strong>{percentage(totals.read, totals.sent)}</strong><span>taxa de leitura</span></div></article><article><CalendarDays size={19} /><div><strong>{totals.bookings}</strong><span>agendamentos atribuídos</span></div></article><article><BarChart3 size={19} /><div><strong>{currency.format(totals.revenue)}</strong><span>receita atribuída</span></div></article></section>
    <section className="card marketing-history"><header><div><span className="page-eyebrow">Acompanhamento</span><h2>Campanhas e resultados</h2><p>Do rascunho ao agendamento, sem misturar envio com faturamento estimado.</p></div><button className="btn btn--icon btn--ghost" type="button" title="Atualizar campanhas" onClick={() => void campaigns.refetch()}><RefreshCw size={18} /></button></header>
      {campaigns.isPending ? <p className="marketing-state">Carregando campanhas...</p> : campaigns.isError ? <p className="marketing-state marketing-error">Não foi possível carregar as campanhas. Verifique se a migração de marketing foi aplicada.</p> : rows.length === 0 ? <div className="marketing-empty"><MessageCircle size={30} /><strong>Nenhuma campanha criada</strong><p>Crie o primeiro rascunho acima. Nenhuma mensagem será disparada ao salvar.</p></div> : <div className="marketing-results">{rows.map((campaign) => <div key={campaign.id}><ResultsCard campaign={campaign} />{campaign.status === 'rascunho' && <button className="btn btn--secondary marketing-release" type="button" onClick={() => void release(campaign)} disabled={publish.isPending}><Send size={16} /> Revisar e liberar envio</button>}</div>)}</div>}
    </section>
  </>
}

const automationLabels: Record<MarketingAutomation['tipo'], string> = {
  retorno_servico: 'Retorno após serviço', reativacao: 'Cliente sumido',
  aniversario: 'Aniversário', avaliacao_pos_atendimento: 'Avaliação pós-atendimento',
}

function AutomationEditor({ companyId, automation, onClose }: { companyId: number; automation: MarketingAutomation | null; onClose: () => void }) {
  const save = useSaveMarketingAutomation(companyId)
  const services = useServices({ companyId, search: '', status: 'ativos', page: 1, pageSize: 100 })
  const [name, setName] = useState(automation?.nome ?? '')
  const [type, setType] = useState<MarketingAutomation['tipo']>(automation?.tipo ?? 'reativacao')
  const [serviceId, setServiceId] = useState(automation?.id_servico?.toString() ?? '')
  const [days, setDays] = useState(automation?.dias_apos ?? 60)
  const [time, setTime] = useState(automation?.horario_local?.slice(0, 5) ?? '10:00')
  const [message, setMessage] = useState(automation?.mensagem ?? 'Olá, {nome}! Sentimos sua falta. Quando quiser, veja os horários disponíveis: {link_agendamento}')
  const [active, setActive] = useState(automation?.ativo ?? false)
  const needsService = type === 'retorno_servico'
  const canSave = name.trim().length > 2 && message.trim().length > 4 && days >= 0 && days <= 730 && (!needsService || Number(serviceId) > 0)
  async function submit(event: FormEvent) {
    event.preventDefault()
    try {
      await save.mutateAsync({ companyId, id: automation?.id ?? null, nome: name.trim(), tipo: type,
        id_servico: needsService ? Number(serviceId) : null, dias_apos: days, horario_local: time,
        mensagem: message.trim(), filtros: automation?.filtros ?? {}, ativo: active })
      onClose()
    } catch { /* hook presents the server validation */ }
  }
  return <Modal open onClose={onClose} title={automation ? 'Editar automação' : 'Nova automação'} description="Salve pausada e ative somente depois de validar a integração." size="md" isDismissible={!save.isPending} footer={<FormActions><button className="btn btn--secondary" type="button" onClick={onClose}>Cancelar</button><button className="btn btn--primary" form="automation-editor" type="submit" disabled={!canSave || save.isPending}>{save.isPending ? <span className="btn-spinner" /> : <CheckCircle2 size={16} />} Salvar regra</button></FormActions>}>
    <form id="automation-editor" className="marketing-automation-form" onSubmit={(event) => void submit(event)}>
      <TextField label="Nome da regra" value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required />
      <label className="marketing-field"><span>Quando executar</span><select value={type} onChange={(event) => { const next = event.target.value as MarketingAutomation['tipo']; setType(next); if (next !== 'retorno_servico') setServiceId('') }}><option value="reativacao">Cliente sem retornar</option><option value="retorno_servico">Após um serviço específico</option><option value="aniversario">Aniversário</option><option value="avaliacao_pos_atendimento">Após finalizar atendimento</option></select></label>
      {needsService && <label className="marketing-field"><span>Serviço</span><select value={serviceId} onChange={(event) => setServiceId(event.target.value)} required><option value="">Selecione o serviço</option>{(services.data?.items ?? []).map((service) => <option key={service.id} value={service.id}>{service.nome}</option>)}</select></label>}
      <div className="marketing-automation-form__row"><label className="marketing-field"><span>{type === 'aniversario' ? 'Dias de antecedência' : 'Dias depois'}</span><input type="number" min={0} max={730} value={days} onChange={(event) => setDays(Number(event.target.value))} /></label><label className="marketing-field"><span>Horário local</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label></div>
      <TextAreaField label="Mensagem" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={5} hint="{nome}, {empresa} e {link_agendamento}." required />
      <label className="marketing-switch"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /><span><strong>Ativar ao salvar</strong><small>O banco só permite ativar se WhatsApp e automações estiverem validados.</small></span></label>
    </form>
  </Modal>
}

function AutomationsTab({ companyId }: { companyId: number }) {
  const rules = useMarketingAutomations(companyId)
  const config = useWhatsAppMarketingConfig(companyId)
  const [editing, setEditing] = useState<MarketingAutomation | 'new' | null>(null)
  const activeCount = (rules.data ?? []).filter((item) => item.ativo).length
  return <section className="card marketing-simple"><header><div><span className="page-eyebrow">Jornadas automáticas</span><h2>Mensagens no momento certo</h2><p>Cada regra tem trava de consentimento e deduplicação. Uma regra pausada nunca entra na fila.</p></div><div className="marketing-header-actions"><span className="marketing-safe"><PauseCircle size={16} /> {activeCount} ativa(s)</span><button className="btn btn--primary" type="button" onClick={() => setEditing('new')}><Plus size={16} /> Nova regra</button></div></header>
    {config.data && !config.data.automacoes_ativas && <div className="marketing-warning"><ShieldCheck size={18} /><div><strong>Automações bloqueadas na integração</strong><p>Você pode preparar regras pausadas. Para ativá-las, valide o número e habilite automações no modo sandbox primeiro.</p></div></div>}
    {rules.isPending ? <p className="marketing-state">Carregando regras...</p> : rules.isError ? <p className="marketing-state marketing-error">Não foi possível carregar as automações.</p> : (rules.data ?? []).length === 0 ? <div className="marketing-empty"><Bot size={30} /><strong>Nenhuma regra criada</strong><p>Comece com uma regra pausada e revise quem receberá antes de ativar.</p></div> : <div className="marketing-automation-grid">{(rules.data ?? []).map((item) => <article key={item.id}><span><Clock3 size={19} /></span><div><strong>{item.nome}</strong><p>{automationLabels[item.tipo]}{item.servico ? ` · ${item.servico}` : ''} · {item.dias_apos} dia(s), às {item.horario_local.slice(0, 5)}</p><small data-active={item.ativo}>{item.ativo ? 'Ativa' : 'Pausada'}{item.ultima_execucao_em ? ` · última execução ${dateTime.format(new Date(item.ultima_execucao_em))}` : ''}</small></div><button className="btn btn--secondary" type="button" onClick={() => setEditing(item)}>Configurar</button></article>)}</div>}
    {editing && <AutomationEditor companyId={companyId} automation={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
  </section>
}

function ReviewsTab({ companyId }: { companyId: number }) {
  const summary = useMarketingReviewSummary(companyId)
  const config = useWhatsAppMarketingConfig(companyId)
  const data = summary.data
  return <section className="card marketing-simple"><header><div><span className="page-eyebrow">Pós-atendimento</span><h2>Avaliações sem expor uma experiência ruim</h2><p>Nota alta pode levar ao Google; nota baixa vira alerta interno para o gerente tratar primeiro.</p></div><span className="marketing-safe"><Star size={16} /> {data?.nota_media ? `${data.nota_media.toFixed(1)} de 5` : 'Sem média'}</span></header>
    <div className="marketing-review-flow"><article><span>1</span><div><strong>Atendimento finalizado</strong><p>O sistema cria uma solicitação única, sem duplicar o pedido.</p></div></article><ArrowRight /><article><span>2</span><div><strong>Cliente avalia de 1 a 5</strong><p>O link tem token opaco e validade controlada.</p></div></article><ArrowRight /><article><span>3</span><div><strong>Destino pela nota</strong><p>4–5: convite ao Google. 1–3: feedback privado ao gerente.</p></div></article></div>
    <div className="marketing-review-kpis"><article><strong>{data?.solicitacoes ?? 0}</strong><span>solicitações</span></article><article><strong>{data?.respondidas ?? 0}</strong><span>respostas</span></article><article><strong>{data?.notas_baixas ?? 0}</strong><span>pedem atenção</span></article><article><strong>{data?.convites_google ?? 0}</strong><span>convites ao Google</span></article></div>
    {config.data && !config.data.avaliacoes_ativas && <div className="marketing-warning"><ShieldCheck size={18} /><div><strong>Envio pós-atendimento está pausado</strong><p>As métricas estão prontas, mas nenhuma solicitação será enviada até habilitar avaliações na integração.</p></div></div>}
  </section>
}

function CalendarTab() {
  const occasions = marketingOccasions()
  return <section className="card marketing-simple"><header><div><span className="page-eyebrow">Planejamento</span><h2>Calendário de oportunidades</h2><p>Sugestões para planejar com antecedência. Nenhuma campanha é criada automaticamente.</p></div></header><div className="marketing-calendar">{occasions.map((occasion) => { const days = daysUntil(occasion.date); return <article key={`${occasion.code}-${occasion.date.getFullYear()}`}><time dateTime={occasion.date.toISOString()}><strong>{occasion.date.getDate().toString().padStart(2, '0')}</strong><span>{occasion.date.toLocaleDateString('pt-BR', { month: 'short' })}</span></time><div><strong>{occasion.name}</strong><p>{occasion.suggestion}</p><small>{days === 0 ? 'Hoje' : `em ${days} dias · iniciar ${occasion.leadDays} dias antes`}</small></div><button className="btn btn--secondary" type="button" disabled><Plus size={16} /> Planejar</button></article> })}</div></section>
}

export function Marketing() {
  const { empresaAtual } = useAuth()
  const companyId = empresaAtual?.id ?? 0
  const [tab, setTab] = useState<Tab>('campanhas')
  const integration = useWhatsAppMarketingConfig(companyId)
  const tabs: { id: Tab; label: string; icon: typeof Send }[] = [
    { id: 'campanhas', label: 'Campanhas', icon: Send }, { id: 'automacoes', label: 'Automações', icon: Bot },
    { id: 'avaliacoes', label: 'Avaliações', icon: HeartHandshake }, { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  ]
  const integrationLabel = integration.isPending ? 'Verificando integração' : integration.data?.modo === 'producao' ? 'WhatsApp em produção' : integration.data?.modo === 'sandbox' ? 'WhatsApp em sandbox' : 'WhatsApp desativado'
  return <div className="page marketing-page"><header className="page-header"><div className="page-header__content"><span className="page-eyebrow">Relacionamento e crescimento</span><h1>Marketing</h1><p>Crie campanhas, acompanhe retorno e prepare automações de WhatsApp com controle e consentimento.</p></div><div className="marketing-connection" data-mode={integration.data?.modo ?? 'desativado'}><span /><div><strong>{integrationLabel}</strong><small>{integration.data?.instancia_evolution ? `Instância: ${integration.data.instancia_evolution}` : 'Envios dependem do n8n e do número habilitado'}</small></div></div></header>
    <nav className="marketing-tabs" aria-label="Áreas de marketing">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" data-active={tab === id} onClick={() => setTab(id)}><Icon size={17} /> {label}</button>)}</nav>
    {tab === 'campanhas' && <CampaignsTab companyId={companyId} />}
    {tab === 'automacoes' && <AutomationsTab companyId={companyId} />}
    {tab === 'avaliacoes' && <ReviewsTab companyId={companyId} />}
    {tab === 'calendario' && <CalendarTab />}
    <p className="marketing-footnote"><CheckCircle2 size={15} /> Receita atribuída conta apenas agendamentos vinculados à campanha; não é estimativa de cliques.</p>
  </div>
}
