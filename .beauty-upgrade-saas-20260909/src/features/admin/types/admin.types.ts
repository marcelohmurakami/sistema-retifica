import type { Database, Json, Tables } from '../../../types/database.types'
import type { AppModule } from '../../access/access.constants'

export type Company = Tables<'empresas'>
export type CompanySettings = Tables<'configuracoes_empresas'>
export type CompanyInvite = Tables<'convites_empresa'>
export type Integration = Tables<'integracoes'>
export type PlanDetails = Tables<'planos'>
export type CompanyUnit = Tables<'unidades'>
export type PublicReview = Tables<'avaliacoes'>
export type PublicSiteSettings = Tables<'sites_publicos'> & { dominios: string[] }
export type ReminderSettings = Tables<'configuracoes_lembretes_empresa'>
export type MessageTemplate = Tables<'templates_mensagens_empresa'>
export type UserRole = Database['public']['Enums']['tipos_usuarios']
export type MembershipStatus = Database['public']['Enums']['status_usuario_empresa']

export type ModulePermission = {
  modulo: AppModule
  permitido: boolean
}

type AdminUserRow = Database['public']['Functions']['listar_usuarios_administracao']['Returns'][number]

export type AdminUser = Omit<AdminUserRow, 'permissoes'> & {
  permissoes: ModulePermission[]
}

export type AdministrationData = {
  company: Company
  settings: CompanySettings | null
  users: AdminUser[]
  invites: CompanyInvite[]
  integrations: Integration[]
  plan: PlanDetails | null
  publicSite: PublicSiteSettings | null
  units: CompanyUnit[]
  reviews: PublicReview[]
  reminderSettings: ReminderSettings | null
  messageTemplates: MessageTemplate[]
}

export type PublicSiteInput = {
  companyId: number
  configuration: Json
}

export type ReviewModerationInput = {
  companyId: number
  reviewId: number
  status: 'aprovada' | 'rejeitada'
  authorized: boolean
}

export type ReminderSettingsInput = {
  companyId: number
  active: boolean
  email: boolean
  whatsapp: boolean
  leadTimesMinutes: number[]
  maxAttempts: number
}

export type MessageTemplateInput = { companyId: number; type: string; channel: 'email' | 'whatsapp'; subject: string; content: string; active: boolean }

export type CompanyInput = {
  companyId: number
  fantasyName: string
  legalName: string
  cnpj: string
  email: string
  primaryPhone: string
  secondaryPhone: string
  timezone: string
}

export type CompanySettingsInput = {
  companyId: number
  preferredTheme: 'sistema' | 'claro' | 'escuro'
  primaryColor: string
  accentColor: string
  interfaceRadius: 'discreto' | 'medio' | 'arredondado'
  interfaceDensity: 'compacta' | 'confortavel'
  currentLogoUrl: string
  logoFile: File | null
  removeLogo: boolean
  language: string
  currency: string
  weekStartsOn: number
  slotDurationMinutes: number
}

export type InviteInput = {
  companyId: number
  email: string
  role: UserRole
}

export type UserAccessInput = {
  companyId: number
  membershipId: number
  role: UserRole
  status: MembershipStatus
}

export type UserPermissionsInput = {
  companyId: number
  membershipId: number
  permissions: ModulePermission[]
}

export type IntegrationInput = {
  companyId: number
  type: IntegrationType
  provider: IntegrationProvider
  configuration: Record<string, string | boolean>
  status?: 'configurando' | 'inativa'
}

export type IntegrationType = 'whatsapp' | 'calendario' | 'email' | 'webhook'
export type IntegrationProvider = 'meta_cloud' | 'google_calendar' | 'resend' | 'webhook'

type AuditRow = Database['public']['Functions']['listar_auditoria_administracao']['Returns'][number]

export type AuditEvent = Omit<AuditRow, 'dados_anteriores' | 'dados_novos'> & {
  dados_anteriores: Json | null
  dados_novos: Json | null
}

export type AuditFilters = {
  companyId: number
  search: string
  action: string
  table: string
  start: string
  end: string
  page: number
  pageSize: number
}

export type AuditPage = {
  rows: AuditEvent[]
  total: number
}
