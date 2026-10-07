import { createClient } from 'npm:@supabase/supabase-js@2.112.3'

type Incoming = {
  companyId?: unknown
  instanceName?: unknown
  messageId?: unknown
  phone?: unknown
  text?: unknown
  fromMe?: unknown
  isGroup?: unknown
}

type PublicService = {
  nome?: string
  descricao?: string | null
  preco?: number | null
  duracao_minutos?: number
  exige_sinal?: boolean
}

type PublicSite = {
  site?: { slug?: string; dominio?: string; nome_publico?: string; perguntas_frequentes?: unknown }
  empresa?: { nome?: string }
  unidade?: { endereco?: string; numero?: string; bairro?: string; cidade?: string; estado?: string } | null
  horarios?: Array<{ dia_semana?: number; hora_abertura?: string; hora_fechamento?: string }>
  servicos?: PublicService[]
}

const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8' }

function reply(status: number, value: Record<string, unknown>): Response {
  return new Response(JSON.stringify(value), { status, headers: jsonHeaders })
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function digits(value: string): string {
  return value.replace(/\D/g, '')
}

function bookingUrl(site: PublicSite, configuredBase?: string | null): string | null {
  const domain = site.site?.dominio?.trim()
  const slug = site.site?.slug?.trim()
  if (!slug) return null
  try {
    const url = configuredBase ? new URL(configuredBase) : new URL(`https://${domain}`)
    if (url.protocol !== 'https:' || !url.hostname.includes('.')
      || /^(localhost|127\.0\.0\.1)$/i.test(url.hostname)
      || url.username || url.password || url.search || url.hash) return null
    url.pathname = '/agendar'
    url.searchParams.set('empresa', slug)
    return url.toString()
  } catch {
    return null
  }
}

function answerPublicQuestion(input: string, site: PublicSite, configuredBase?: string | null): string {
  const question = normalize(input)
  const businessName = site.site?.nome_publico || site.empresa?.nome || 'nosso espaço'
  const services = Array.isArray(site.servicos) ? site.servicos : []
  const serviceTerms = question.split(/[^a-z0-9]+/).filter((term) => term.length >= 4)
  const matchedServices = services.filter((service) => {
    const name = normalize(service.nome ?? '')
    return name && serviceTerms.some((term) => name.includes(term))
  })
  const link = bookingUrl(site, configuredBase)
  const booking = link
    ? `Você pode escolher o serviço, profissional e horário aqui: ${link}. Se houver sinal, o pagamento é feito com segurança no próprio site.`
    : 'O agendamento online ainda não tem um link público configurado. A recepção pode ajudar você.'

  if (/\b(agendar|agenda|marcar|reservar|horario disponivel|tem vaga)\b/.test(question)) return booking

  if (/\b(endereco|localizacao|onde fica|como chegar)\b/.test(question)) {
    const unit = site.unidade
    if (!unit?.endereco) return 'O endereço não está publicado no momento. Nossa recepção pode informar.'
    const address = [unit.endereco, unit.numero, unit.bairro, unit.cidade, unit.estado]
      .map((part) => String(part ?? '').trim()).filter(Boolean).join(', ')
    return `Nosso endereço publicado é: ${address}.`
  }

  if (/\b(funcionamento|abre|fecha|horario de atendimento)\b/.test(question)) {
    const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
    const opening = (site.horarios ?? []).map((hour) => {
      const day = days[Number(hour.dia_semana)]
      if (!day || !hour.hora_abertura || !hour.hora_fechamento) return ''
      return `${day}: ${hour.hora_abertura.slice(0, 5)} às ${hour.hora_fechamento.slice(0, 5)}`
    }).filter(Boolean)
    return opening.length
      ? `Horários publicados de ${businessName}: ${opening.join('; ')}.`
      : 'Os horários de funcionamento não estão publicados. Nossa recepção pode confirmar.'
  }

  const faqs = Array.isArray(site.site?.perguntas_frequentes) ? site.site.perguntas_frequentes : []
  const questionTerms = new Set(question.split(/[^a-z0-9]+/).filter((term) => term.length >= 6))
  for (const item of faqs) {
    if (!item || typeof item !== 'object') continue
    const faq = item as { pergunta?: unknown; resposta?: unknown }
    if (typeof faq.pergunta !== 'string' || typeof faq.resposta !== 'string') continue
    const faqTerms = normalize(faq.pergunta).split(/[^a-z0-9]+/).filter((term) => term.length >= 6)
    if (faqTerms.some((term) => questionTerms.has(term))) return faq.resposta.slice(0, 1200)
  }

  if (matchedServices.length || /\b(servico|servicos|procedimento|procedimentos|preco|precos|valor|valores|quanto custa|tabela)\b/.test(question)) {
    if (!services.length) return 'Ainda não há serviços publicados. Nossa recepção pode ajudar.'
    const shown = (matchedServices.length ? matchedServices : services).slice(0, matchedServices.length ? 3 : 8)
    const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    const lines = shown.map((service) => {
      const price = typeof service.preco === 'number' ? ` — ${currency.format(service.preco)}` : ''
      const duration = service.duracao_minutos ? ` (${service.duracao_minutos} min)` : ''
      const deposit = service.exige_sinal ? ' • exige sinal no agendamento' : ''
      return `• ${service.nome}${duration}${price}${deposit}`
    })
    return `${matchedServices.length ? 'Encontrei:' : 'Serviços publicados:'}\n${lines.join('\n')}\n${booking}`.slice(0, 1500)
  }

  if (/\b(ola|oi|bom dia|boa tarde|boa noite|menu|ajuda)\b/.test(question)) {
    return `Olá! Sou o atendimento automático de ${businessName}. Posso informar serviços, preços publicados, endereço, funcionamento e o link para agendar. O que você procura?`
  }

  return `Posso ajudar com serviços, preços publicados, endereço, funcionamento e agendamentos de ${businessName}. Qual dessas informações você gostaria de saber?`
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return reply(405, { error: 'Método não permitido.' })

  // Somente o n8n no servidor pode chamar esta função. A chave jamais vai ao navegador.
  const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceRole || request.headers.get('Authorization') !== `Bearer ${serviceRole}`) {
    return reply(401, { error: 'Não autorizado.' })
  }

  let body: Incoming
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 8192) return reply(413, { error: 'Evento muito grande.' })
    const raw = await request.text()
    if (raw.length > 8192) return reply(413, { error: 'Evento muito grande.' })
    body = JSON.parse(raw)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid body')
  } catch {
    return reply(400, { error: 'Evento inválido.' })
  }

  const companyId = Number(body.companyId)
  const instanceName = String(body.instanceName ?? '').trim()
  const messageId = String(body.messageId ?? '').trim()
  const phone = digits(String(body.phone ?? ''))
  const text = String(body.text ?? '').trim()
  if (!Number.isSafeInteger(companyId) || companyId <= 0 || !/^[\w-]{2,80}$/.test(instanceName)
    || messageId.length < 4 || messageId.length > 200 || phone.length < 10 || phone.length > 15
    || text.length < 1 || text.length > 2000) {
    return reply(400, { error: 'Dados de mensagem inválidos.' })
  }
  if (body.fromMe === true || body.isGroup === true) return reply(200, { ignored: true })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  if (!supabaseUrl) return reply(503, { error: 'Banco indisponível.' })
  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: config, error: configError } = await admin.from('configuracoes_automacao_whatsapp')
    .select('ativo,modo,instancia_evolution,telefone_teste,chatbot_ativo,site_base_url')
    .eq('id_empresa', companyId).maybeSingle()
  if (configError) return reply(503, { error: 'Não foi possível validar a integração.' })
  if (!config?.ativo || !config.chatbot_ativo || config.instancia_evolution !== instanceName) {
    return reply(200, { ignored: true, reason: 'Chatbot desligado ou instância diferente.' })
  }
  if (config.modo === 'sandbox' && digits(config.telefone_teste ?? '') !== phone) {
    return reply(200, { ignored: true, reason: 'Fora do número de teste.' })
  }

  const { data: registered, error: registerError } = await admin.rpc('n8n_registrar_evento_evolution', {
    p_id_empresa: companyId,
    p_instancia_evolution: instanceName,
    p_identificador_externo: messageId,
    p_evento: 'MESSAGES_UPSERT',
    p_payload: { telefone: phone, texto: text.slice(0, 500) },
    p_assinatura_valida: true,
  })
  if (registerError) return reply(503, { error: 'Não foi possível registrar o evento.' })
  if (registered?.duplicated || !registered?.accepted) return reply(200, { ignored: true, duplicate: !!registered?.duplicated })

  const finish = async (message: string | null, action: string) => {
    await admin.from('eventos_webhook_whatsapp')
      .update({ processado_em: new Date().toISOString() })
      .eq('id', registered.id).eq('id_empresa', companyId)
    return reply(200, { action, message, instanceName, phone })
  }

  const normalized = normalize(text)
  if (/^(sair|parar|cancelar mensagens|descadastrar)$/.test(normalized)) {
    const { error } = await admin.rpc('n8n_registrar_optout_whatsapp', {
      p_id_empresa: companyId, p_telefone: phone, p_identificador_externo: messageId,
    })
    if (error) return reply(503, { error: 'Não foi possível registrar a saída.' })
    return finish('Você não receberá mais campanhas de marketing por WhatsApp. Para falar com a equipe, basta responder a esta conversa.', 'optout')
  }

  if (/^(1|sim|confirmar|confirmo|2|remarcar|reagendar)$/.test(normalized)) {
    const { data: result, error } = await admin.rpc('n8n_processar_resposta_whatsapp', {
      p_id_empresa: companyId, p_identificador_externo: messageId,
      p_remetente: phone, p_conteudo: text,
    })
    if (error) return reply(503, { error: 'Não foi possível processar a resposta do agendamento.' })
    let message = String(result?.message ?? 'Sua resposta foi recebida.')
    if (result?.relativeLink) {
      const { data: context } = await admin.rpc('n8n_contexto_chatbot_whatsapp', {
        p_id_empresa: companyId, p_telefone: phone,
      })
      const slug = context?.site?.slug
      if (slug) {
        const { data: publicSite } = await admin.rpc('resolver_site_publico', {
          p_dominio: null, p_slug: slug,
        })
        const base = bookingUrl(publicSite as PublicSite, config.site_base_url)
        if (base) message += ` Acesse: ${new URL(String(result.relativeLink), base).toString()}`
      }
    }
    return finish(message, String(result?.action ?? 'agendamento'))
  }

  const { data: context, error: contextError } = await admin.rpc('n8n_contexto_chatbot_whatsapp', {
    p_id_empresa: companyId, p_telefone: phone,
  })
  if (contextError || !context?.site?.slug) {
    return finish('O atendimento automático está indisponível agora. Nossa equipe responderá assim que possível.', 'handoff')
  }
  const { data: publicSite, error: siteError } = await admin.rpc('resolver_site_publico', {
    p_dominio: null, p_slug: context.site.slug,
  })
  if (siteError || !publicSite) {
    return finish('Não consegui consultar os serviços agora. Nossa equipe responderá assim que possível.', 'handoff')
  }
  return finish(answerPublicQuestion(text, publicSite as PublicSite, config.site_base_url), 'faq')
})
