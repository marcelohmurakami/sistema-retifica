import type { UserRole } from './types/access.types'

export const FEATURES = {
  AGENDA: 'agenda',
  SCHEDULE_BY_PROFESSIONAL: 'agenda_por_profissional',
  MANUAL_SCHEDULING: 'agendamento_manual',
  MULTI_SERVICE_SCHEDULING: 'agendamento_multisservico',
  ONLINE_SCHEDULING: 'agendamento_online',
  SUBSCRIPTIONS: 'assinaturas_mensalidades',
  AUDIT: 'auditoria',
  CLIENT_SELF_SERVICE: 'autoatendimento_cliente',
  POST_SERVICE_REVIEW: 'avaliacao_pos_atendimento',
  TIME_OFF: 'bloqueios_folgas_ferias',
  CASH_REGISTER: 'caixa',
  CLIENTS: 'clientes',
  COMMANDS: 'comandas',
  COMMISSIONS: 'comissoes',
  PAYABLES_RECEIVABLES: 'contas_pagar_receber',
  BASIC_DASHBOARD: 'dashboard_basico',
  INDIVIDUAL_AVAILABILITY: 'disponibilidade_individual',
  INVENTORY: 'estoque',
  FINANCIAL: 'financeiro',
  SUPPLIERS: 'fornecedores',
  BASIC_SERVICE_HISTORY: 'historico_basico_atendimentos',
  BASIC_CLIENT_HISTORY: 'historico_basico_cliente',
  COMPLETE_CLIENT_HISTORY: 'historico_completo_cliente',
  SCHEDULING_LINK: 'link_qrcode_agendamento',
  WAITING_LIST: 'lista_espera',
  PROFESSIONAL_GOALS: 'metas_profissionais',
  AUTOMATIC_NOTIFICATIONS: 'notificacoes_automaticas',
  SESSION_PACKAGES: 'pacotes_sessoes',
  MULTIPLE_PAYMENTS: 'pagamentos_multiplos',
  BASIC_PERMISSIONS: 'permissoes_basicas',
  CUSTOM_PERMISSIONS: 'permissoes_personalizadas',
  CANCELLATION_AUTOFILL: 'preenchimento_automatico_cancelamentos',
  PRODUCTS: 'produtos',
  PROFESSIONALS: 'profissionais',
  RESCHEDULING: 'reagendamento_cancelamento',
  SIMPLE_RECEIPTS: 'recebimento_simples',
  SERVICE_RECORD: 'registro_atendimento',
  ADVANCED_COMMISSION_RULES: 'regras_comissao_avancadas',
  ADVANCED_REPORTS: 'relatorios_dashboards_avancados',
  BASIC_FINANCIAL_REPORTS: 'relatorios_financeiros_basicos',
  SERVICES: 'servicos',
  SERVICES_BY_PROFESSIONAL: 'servicos_por_profissional',
  INTEGRATED_SITE: 'site_integrado',
  SERVICE_STATUS: 'status_atendimento',
  USERS: 'usuarios',
  MANUAL_WHATSAPP: 'whatsapp_manual',
} as const

export type FeatureCode = (typeof FEATURES)[keyof typeof FEATURES]

export const APP_MODULES = [
  'dashboard',
  'agendamentos',
  'clientes',
  'comandas',
  'orcamentos',
  'funcionarios',
  'servicos',
  'produtos',
  'fornecedores',
  'financeiro',
  'comissoes',
  'estoque',
  'historico',
  'configuracoes',
] as const

export type AppModule = (typeof APP_MODULES)[number]

type ModuleAccessRule = {
  label: string
  path: string
  feature: FeatureCode | null
  allowedRoles: readonly UserRole[]
}

const allRoles: readonly UserRole[] = [
  'dono',
  'gerente',
  'recepcionista',
  'profissional',
]
const managementRoles: readonly UserRole[] = ['dono', 'gerente']
const frontDeskRoles: readonly UserRole[] = [
  'dono',
  'gerente',
  'recepcionista',
]

export const MODULE_ACCESS: Record<AppModule, ModuleAccessRule> = {
  dashboard: {
    label: 'Visão geral',
    path: '/',
    feature: FEATURES.BASIC_DASHBOARD,
    allowedRoles: allRoles,
  },
  agendamentos: {
    label: 'Agenda',
    path: '/agendamentos',
    feature: FEATURES.AGENDA,
    allowedRoles: allRoles,
  },
  clientes: {
    label: 'Clientes',
    path: '/clientes',
    feature: FEATURES.CLIENTS,
    allowedRoles: allRoles,
  },
  comandas: {
    label: 'Comandas',
    path: '/comandas',
    feature: FEATURES.COMMANDS,
    allowedRoles: allRoles,
  },
  orcamentos: {
    label: 'Orçamentos',
    path: '/orcamentos',
    feature: FEATURES.COMMANDS,
    allowedRoles: frontDeskRoles,
  },
  funcionarios: {
    label: 'Funcionários',
    path: '/funcionarios',
    feature: FEATURES.PROFESSIONALS,
    allowedRoles: managementRoles,
  },
  servicos: {
    label: 'Serviços',
    path: '/servicos',
    feature: FEATURES.SERVICES,
    allowedRoles: frontDeskRoles,
  },
  produtos: {
    label: 'Produtos',
    path: '/produtos',
    feature: FEATURES.PRODUCTS,
    allowedRoles: frontDeskRoles,
  },
  fornecedores: {
    label: 'Fornecedores',
    path: '/fornecedores',
    feature: FEATURES.SUPPLIERS,
    allowedRoles: managementRoles,
  },
  financeiro: {
    label: 'Financeiro',
    path: '/financeiro',
    feature: FEATURES.FINANCIAL,
    allowedRoles: managementRoles,
  },
  comissoes: {
    label: 'Comissões',
    path: '/comissoes',
    feature: FEATURES.COMMISSIONS,
    allowedRoles: managementRoles,
  },
  estoque: {
    label: 'Estoque',
    path: '/estoque',
    feature: FEATURES.INVENTORY,
    allowedRoles: frontDeskRoles,
  },
  historico: {
    label: 'Histórico',
    path: '/historico',
    feature: FEATURES.AUDIT,
    allowedRoles: managementRoles,
  },
  configuracoes: {
    label: 'Configurações',
    path: '/configuracoes',
    feature: null,
    allowedRoles: managementRoles,
  },
}

export const ROLE_LABELS: Record<UserRole, string> = {
  dono: 'Administrador',
  gerente: 'Gerente',
  recepcionista: 'Recepcionista',
  profissional: 'Profissional',
}
