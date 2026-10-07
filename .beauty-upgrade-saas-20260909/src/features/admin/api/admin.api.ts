import { supabase } from '../../../supabase/supabaseApi'
import type { Json } from '../../../types/database.types'
import { APP_MODULES, type AppModule } from '../../access/access.constants'
import type {
  AdministrationData,
  AdminUser,
  AuditFilters,
  AuditPage,
  CompanyInput,
  CompanySettings,
  CompanySettingsInput,
  IntegrationInput,
  InviteInput,
  ModulePermission,
  MessageTemplateInput,
  PublicSiteInput,
  ReminderSettingsInput,
  ReviewModerationInput,
  UserAccessInput,
  UserPermissionsInput,
} from '../types/admin.types'
import {
  COMPANY_ASSETS_BUCKET,
  MAX_COMPANY_LOGO_BYTES,
  companyLogoPathFromUrl,
  getCompanyLogoExtension,
} from '../utils/logo-storage.utils'

function adminError(message: string, cause: unknown) {
  const detail =
    cause && typeof cause === 'object' && 'message' in cause
      ? String(cause.message)
      : ''
  const expected = [
    'permissão', 'plano', 'limite', 'usuário', 'convite', 'e-mail',
    'empresa', 'integração', 'credenciais', 'auditoria', 'logotipo', 'lembrete', 'antecedência', 'tentativa',
  ]

  if (expected.some((word) => detail.toLocaleLowerCase('pt-BR').includes(word))) {
    return new Error(detail, { cause })
  }

  return new Error(message, { cause })
}

function parsePermissions(value: Json): ModulePermission[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const module = item.modulo
    const allowed = item.permitido
    if (
      typeof module !== 'string' ||
      !APP_MODULES.includes(module as AppModule) ||
      typeof allowed !== 'boolean'
    ) return []

    return [{ modulo: module as AppModule, permitido: allowed }]
  })
}

export async function getAdministration(
  companyId: number,
  planId: number | null,
): Promise<AdministrationData> {
  const [company, settings, users, invites, integrations, plan, publicSite, domains, units, reviews, reminderSettings, messageTemplates] = await Promise.all([
    supabase.from('empresas').select('*').eq('id', companyId).single(),
    supabase.from('configuracoes_empresas').select('*').eq('id_empresa', companyId).maybeSingle(),
    supabase.rpc('listar_usuarios_administracao', { p_id_empresa: companyId }),
    supabase.from('convites_empresa').select('*').eq('id_empresa', companyId).order('created_at', { ascending: false }),
    supabase.from('integracoes').select('id,id_empresa,tipo,provedor,status,configuracoes,identificador_externo,ultimo_erro,ultimo_sucesso_em,created_at,updated_at,credencial_referencia').eq('id_empresa', companyId).order('tipo'),
    planId
      ? supabase.from('planos').select('*').eq('id', planId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from('sites_publicos').select('*').eq('id_empresa', companyId).maybeSingle(),
    supabase.from('sites_publicos_dominios').select('dominio').eq('id_empresa', companyId).order('principal', { ascending: false }),
    supabase.from('unidades').select('*').eq('id_empresa', companyId).eq('ativo', true).order('principal', { ascending: false }),
    supabase.from('avaliacoes').select('*').eq('id_empresa', companyId).order('created_at', { ascending: false }).limit(30),
    supabase.from('configuracoes_lembretes_empresa').select('*').eq('id_empresa', companyId).maybeSingle(),
    supabase.from('templates_mensagens_empresa').select('*').eq('id_empresa', companyId).order('tipo').order('canal'),
  ])

  const error = company.error ?? settings.error ?? users.error ?? invites.error ?? integrations.error ?? plan.error ?? publicSite.error ?? domains.error ?? units.error ?? reviews.error ?? reminderSettings.error ?? messageTemplates.error
  if (error) throw adminError('Não foi possível carregar a administração da empresa.', error)
  if (!company.data) throw new Error('Empresa não encontrada.')

  return {
    company: company.data,
    settings: settings.data,
    users: (users.data ?? []).map((user) => ({
      ...user,
      permissoes: parsePermissions(user.permissoes),
    })) as AdminUser[],
    invites: invites.data ?? [],
    integrations: integrations.data ?? [],
    plan: plan.data,
    publicSite: publicSite.data ? { ...publicSite.data, dominios: (domains.data ?? []).map((item) => item.dominio) } : null,
    units: units.data ?? [],
    reviews: reviews.data ?? [],
    reminderSettings: reminderSettings.data,
    messageTemplates: messageTemplates.data ?? [],
  }
}

export async function saveMessageTemplate(input: MessageTemplateInput) {
  const { data, error } = await supabase.rpc('salvar_template_mensagem', { p_id_empresa: input.companyId, p_tipo: input.type, p_canal: input.channel, p_assunto: input.subject, p_conteudo: input.content, p_ativo: input.active })
  if (error) throw adminError('Não foi possível salvar o template.', error)
  return data
}

export async function saveReminderSettings(input: ReminderSettingsInput) {
  const { data, error } = await supabase.rpc('salvar_configuracao_lembretes_administracao', {
    p_id_empresa: input.companyId,
    p_ativo: input.active,
    p_email: input.email,
    p_whatsapp: input.whatsapp,
    p_antecedencias_minutos: input.leadTimesMinutes,
    p_max_tentativas: input.maxAttempts,
  })
  if (error) throw adminError('Não foi possível salvar as regras de lembrete.', error)
  return data
}

export async function savePublicSite(input: PublicSiteInput) {
  const { data, error } = await supabase.rpc('salvar_site_publico', {
    p_id_empresa: input.companyId,
    p_config: input.configuration,
  })
  if (error) throw adminError('Não foi possível salvar o site público.', error)
  return data
}

export async function moderatePublicReview(input: ReviewModerationInput) {
  const { error } = await supabase.from('avaliacoes').update({
    status: input.status,
    autorizado_publicacao: input.authorized,
    updated_at: new Date().toISOString(),
  }).eq('id_empresa', input.companyId).eq('id', input.reviewId)
  if (error) throw adminError('Não foi possível moderar a avaliação.', error)
}

export async function getCompanyAppearance(companyId: number): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('configuracoes_empresas')
    .select('*')
    .eq('id_empresa', companyId)
    .maybeSingle()

  if (error) throw adminError('Não foi possível carregar a aparência da empresa.', error)
  return data
}

export async function updateCompany(input: CompanyInput) {
  const { data, error } = await supabase.rpc('atualizar_empresa_administracao', {
    p_id_empresa: input.companyId,
    p_fantasia: input.fantasyName,
    p_razao_social: input.legalName,
    p_cnpj: input.cnpj,
    p_email: input.email,
    p_contato1: input.primaryPhone,
    p_contato2: input.secondaryPhone,
    p_fuso_horario: input.timezone,
  })
  if (error) throw adminError('Não foi possível atualizar a empresa.', error)
  return data
}

async function uploadCompanyLogo(companyId: number, file: File) {
  const extension = getCompanyLogoExtension(file.type)
  if (!extension) {
    throw new Error('Use uma imagem PNG, JPG ou WEBP para o logotipo.')
  }
  if (file.size === 0) throw new Error('O arquivo do logotipo está vazio.')
  if (file.size > MAX_COMPANY_LOGO_BYTES) {
    throw new Error('O logotipo deve ter no máximo 2 MB.')
  }

  const objectPath = `${companyId}/logos/logo-${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from(COMPANY_ASSETS_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '31536000',
      contentType: file.type,
      upsert: false,
    })

  if (error) throw adminError('Não foi possível enviar o logotipo.', error)

  const { data } = supabase.storage
    .from(COMPANY_ASSETS_BUCKET)
    .getPublicUrl(objectPath)

  return { objectPath, publicUrl: data.publicUrl }
}

async function removeCompanyLogo(companyId: number, logoUrl: string) {
  const objectPath = companyLogoPathFromUrl(companyId, logoUrl)
  if (!objectPath) return

  const { error } = await supabase.storage
    .from(COMPANY_ASSETS_BUCKET)
    .remove([objectPath])

  if (error) throw adminError('Não foi possível remover o logotipo anterior.', error)
}

export async function saveCompanySettings(input: CompanySettingsInput) {
  let uploadedLogo: { objectPath: string; publicUrl: string } | null = null
  let nextLogoUrl = input.removeLogo ? '' : input.currentLogoUrl

  if (input.logoFile) {
    uploadedLogo = await uploadCompanyLogo(input.companyId, input.logoFile)
    nextLogoUrl = uploadedLogo.publicUrl
  }

  const { data, error } = await supabase.rpc('salvar_configuracoes_empresa', {
    p_id_empresa: input.companyId,
    p_tema_preferido: input.preferredTheme,
    p_cor_primaria: input.primaryColor,
    p_cor_destaque: input.accentColor,
    p_raio_interface: input.interfaceRadius,
    p_densidade_interface: input.interfaceDensity,
    p_logo_url: nextLogoUrl,
    p_idioma: input.language,
    p_moeda: input.currency,
    p_semana_inicia: input.weekStartsOn,
    p_duracao_slot_minutos: input.slotDurationMinutes,
  })

  if (error) {
    if (uploadedLogo) {
      await supabase.storage
        .from(COMPANY_ASSETS_BUCKET)
        .remove([uploadedLogo.objectPath])
    }
    throw adminError('Não foi possível salvar as preferências.', error)
  }

  if (input.currentLogoUrl && input.currentLogoUrl !== nextLogoUrl) {
    await removeCompanyLogo(input.companyId, input.currentLogoUrl).catch(() => undefined)
  }

  return data
}

export async function createInvite(input: InviteInput) {
  const { data, error } = await supabase.rpc('criar_convite_empresa', {
    p_id_empresa: input.companyId,
    p_email: input.email,
    p_tipo: input.role,
  })
  if (error) throw adminError('Não foi possível criar o convite.', error)
  return data
}

export async function cancelInvite(companyId: number, inviteId: number) {
  const { error } = await supabase.rpc('cancelar_convite_empresa', {
    p_id_empresa: companyId,
    p_convite_id: inviteId,
  })
  if (error) throw adminError('Não foi possível cancelar o convite.', error)
}

export async function updateUserAccess(input: UserAccessInput) {
  const { error } = await supabase.rpc('atualizar_usuario_empresa_administracao', {
    p_id_empresa: input.companyId,
    p_usuario_empresa_id: input.membershipId,
    p_tipo: input.role,
    p_status: input.status,
  })
  if (error) throw adminError('Não foi possível atualizar o usuário.', error)
}

export async function saveUserPermissions(input: UserPermissionsInput) {
  const { error } = await supabase.rpc('salvar_permissoes_usuario', {
    p_id_empresa: input.companyId,
    p_usuario_empresa_id: input.membershipId,
    p_permissoes: input.permissions,
  })
  if (error) throw adminError('Não foi possível salvar as permissões.', error)
}

export async function saveIntegration(input: IntegrationInput) {
  const { data, error } = await supabase.rpc('salvar_integracao_administracao', {
    p_id_empresa: input.companyId,
    p_tipo: input.type,
    p_provedor: input.provider,
    p_configuracoes: input.configuration,
    p_status: input.status ?? 'configurando',
  })
  if (error) throw adminError('Não foi possível salvar a integração.', error)
  return data
}

export async function removeIntegration(companyId: number, integrationId: number) {
  const { error } = await supabase.rpc('remover_integracao_administracao', {
    p_id_empresa: companyId,
    p_integracao_id: integrationId,
  })
  if (error) throw adminError('Não foi possível remover a integração.', error)
}

export async function listAudit(filters: AuditFilters): Promise<AuditPage> {
  const endExclusive = filters.end
    ? new Date(`${filters.end}T00:00:00`).setDate(new Date(`${filters.end}T00:00:00`).getDate() + 1)
    : null
  const { data, error } = await supabase.rpc('listar_auditoria_administracao', {
    p_id_empresa: filters.companyId,
    p_busca: filters.search || undefined,
    p_acao: filters.action === 'todos' ? undefined : filters.action,
    p_tabela: filters.table === 'todas' ? undefined : filters.table,
    p_inicio: filters.start ? new Date(`${filters.start}T00:00:00`).toISOString() : undefined,
    p_fim: endExclusive ? new Date(endExclusive).toISOString() : undefined,
    p_pagina: filters.page,
    p_por_pagina: filters.pageSize,
  })
  if (error) throw adminError('Não foi possível carregar a auditoria.', error)

  return {
    rows: data ?? [],
    total: data?.[0]?.total_count ?? 0,
  }
}
