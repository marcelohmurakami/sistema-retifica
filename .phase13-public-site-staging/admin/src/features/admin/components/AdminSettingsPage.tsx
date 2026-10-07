import {
  BadgeCheck, Building2, CalendarDays, Check, ChevronRight,
  CircleDollarSign, Clock3, Edit3, KeyRound, Link2, Mail,
  Globe2, MessageCircle, Palette, Plus, Save, ShieldCheck, Star, Trash2,
  UserCog, Users, Webhook, X,
} from 'lucide-react'
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import {
  ConfirmDeleteDialog, DataTable, ErrorState, FileUpload, LoadingState, MaskedInput,
  Modal, SelectField, TextAreaField, TextField, type DataTableColumn,
} from '../../../components_shared'
import {
  APP_MODULES, FEATURES, MODULE_ACCESS, ROLE_LABELS, type AppModule,
} from '../../access/access.constants'
import { useAccess } from '../../access/hooks/useAccess'
import {
  useAdministration, useCancelInvite, useCreateInvite, useRemoveIntegration,
  useModeratePublicReview, useSaveCompanySettings, useSaveIntegration, useSavePublicSite, useSaveUserPermissions,
  useUpdateCompany, useUpdateUserAccess,
} from '../hooks/useAdmin'
import type {
  AdminUser, Company, CompanyInvite, CompanySettings, Integration,
  CompanyUnit, IntegrationInput, ModulePermission, PublicReview, PublicSiteSettings, UserRole,
} from '../types/admin.types'
import {
  DEFAULT_APPEARANCE, formatAdminDate, getAppearance, isHexColor,
  isValidEmail, validateCompanyName,
} from '../utils/admin.utils'
import { useAuth } from '../../auth/hooks/useAuth'
import '../admin.css'

type AdministrationTab = 'empresa' | 'site' | 'usuarios' | 'cargos' | 'plano' | 'integracoes' | 'aparencia'

const tabs: Array<{ id: AdministrationTab; label: string; icon: typeof Building2 }> = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'site', label: 'Site público', icon: Globe2 },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'cargos', label: 'Cargos e permissões', icon: ShieldCheck },
  { id: 'plano', label: 'Plano e assinatura', icon: CircleDollarSign },
  { id: 'integracoes', label: 'Integrações', icon: Link2 },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
]

const roleOptions = (Object.entries(ROLE_LABELS) as Array<[UserRole, string]>).map(
  ([value, label]) => ({ value, label }),
)
const moduleLabels = Object.fromEntries(
  APP_MODULES.map((module) => [module, MODULE_ACCESS[module].label]),
) as Record<AppModule, string>

function SectionHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="admin-section-heading"><div><h2>{title}</h2><p>{description}</p></div>{action}</header>
}

function CompanyPanel({ company, canEdit }: { company: Company; canEdit: boolean }) {
  const mutation = useUpdateCompany(company.id)
  const [form, setForm] = useState({ fantasyName: company.fantasia, legalName: company.razao_social ?? '', cnpj: company.cnpj ?? '', email: company.email ?? '', primaryPhone: company.contato1 ?? '', secondaryPhone: company.contato2 ?? '', timezone: company.fuso_horario })
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!validateCompanyName(form.fantasyName)) return setError('Informe um nome com pelo menos 2 caracteres.')
    if (form.email && !isValidEmail(form.email)) return setError('Informe um e-mail válido.')
    setError('')
    await mutation.mutateAsync({ companyId: company.id, ...form })
  }

  return <section className="admin-panel card">
    <SectionHeading title="Dados da empresa" description="Informações usadas em documentos, contatos e regras de horário." />
    {!canEdit && <div className="alert alert--info">Somente o administrador pode alterar estes dados.</div>}
    <form className="admin-form" onSubmit={(event) => void submit(event)}>
      <div className="form-grid">
        <TextField label="Nome da empresa" required value={form.fantasyName} disabled={!canEdit} onChange={(e) => setForm({ ...form, fantasyName: e.target.value })} />
        <TextField label="Razão social" value={form.legalName} disabled={!canEdit} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
        <MaskedInput label="CNPJ" mask="cnpj" value={form.cnpj} disabled={!canEdit} onValueChange={(value) => setForm({ ...form, cnpj: value })} />
        <TextField label="E-mail comercial" type="email" value={form.email} disabled={!canEdit} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <MaskedInput label="Telefone principal" mask="telefone" value={form.primaryPhone} disabled={!canEdit} onValueChange={(value) => setForm({ ...form, primaryPhone: value })} />
        <MaskedInput label="Telefone secundário" mask="telefone" value={form.secondaryPhone} disabled={!canEdit} onValueChange={(value) => setForm({ ...form, secondaryPhone: value })} />
        <SelectField label="Fuso horário" value={form.timezone} disabled={!canEdit} onChange={(e) => setForm({ ...form, timezone: e.target.value })} options={[
          { value: 'America/Sao_Paulo', label: 'Brasília (São Paulo)' }, { value: 'America/Manaus', label: 'Manaus' },
          { value: 'America/Cuiaba', label: 'Cuiabá' }, { value: 'America/Rio_Branco', label: 'Rio Branco' },
          { value: 'America/Noronha', label: 'Fernando de Noronha' },
        ]} />
        <TextField label="Status" value={company.status === 'ativo' ? 'Ativa' : 'Inativa'} disabled />
      </div>
      {error && <p className="field__error" role="alert">{error}</p>}
      {canEdit && <div className="admin-form__actions"><button className="btn btn--primary" disabled={mutation.isPending} type="submit">{mutation.isPending ? <span className="btn-spinner" /> : <Save size={17} />} Salvar alterações</button></div>}
    </form>
  </section>
}

function InviteModal({ open, companyId, onClose }: { open: boolean; companyId: number; onClose: () => void }) {
  const mutation = useCreateInvite(companyId)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('recepcionista')
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!isValidEmail(email)) return setError('Informe um e-mail válido.')
    setError('')
    await mutation.mutateAsync({ companyId, email, role })
    setEmail(''); setRole('recepcionista'); onClose()
  }
  return <Modal open={open} onClose={onClose} title="Adicionar usuário" description="Se a conta já existir, o acesso será imediato. Caso contrário, o convite ficará pendente." size="sm" isDismissible={!mutation.isPending} footer={<><button className="btn btn--secondary" type="button" onClick={onClose}>Cancelar</button><button className="btn btn--primary" type="submit" form="invite-user-form" disabled={mutation.isPending}>{mutation.isPending ? <span className="btn-spinner" /> : <Plus size={17} />} Adicionar</button></>}>
    <form id="invite-user-form" className="stack" onSubmit={(event) => void submit(event)}>
      <TextField label="E-mail" type="email" autoFocus required value={email} error={error} onChange={(e) => setEmail(e.target.value)} />
      <SelectField label="Cargo inicial" value={role} onChange={(e) => setRole(e.target.value as UserRole)} options={roleOptions} />
      <div className="alert alert--info">O sistema não armazena senha. A identidade continua sendo controlada pelo Supabase Auth.</div>
    </form>
  </Modal>
}

function UserAccessModal({ user, companyId, customPermissions, onClose }: { user: AdminUser | null; companyId: number; customPermissions: boolean; onClose: () => void }) {
  const accessMutation = useUpdateUserAccess(companyId)
  const permissionsMutation = useSaveUserPermissions(companyId)
  const [role, setRole] = useState<UserRole>(user?.tipo ?? 'profissional')
  const [status, setStatus] = useState<AdminUser['status']>(user?.status ?? 'ativo')
  const [blockedModules, setBlockedModules] = useState<Set<AppModule>>(
    new Set(user?.permissoes.filter((item) => !item.permitido).map((item) => item.modulo) ?? []),
  )
  const baseModules = APP_MODULES.filter((module) => MODULE_ACCESS[module].allowedRoles.includes(role))
  const isPending = accessMutation.isPending || permissionsMutation.isPending
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!user) return
    await accessMutation.mutateAsync({ companyId, membershipId: user.id, role, status })
    if (customPermissions) {
      const permissions: ModulePermission[] = baseModules.map((module) => ({ modulo: module, permitido: role === 'dono' && module === 'configuracoes' ? true : !blockedModules.has(module) }))
      await permissionsMutation.mutateAsync({ companyId, membershipId: user.id, permissions })
    }
    onClose()
  }
  return <Modal open={Boolean(user)} onClose={onClose} title={user ? `Acesso de ${user.nome}` : 'Editar acesso'} description="O cargo define a base; as personalizações abaixo somente restringem essa base." size="lg" isDismissible={!isPending} footer={<><button className="btn btn--secondary" type="button" onClick={onClose}>Cancelar</button><button className="btn btn--primary" type="submit" form="user-access-form" disabled={isPending}>{isPending ? <span className="btn-spinner" /> : <Save size={17} />} Salvar acesso</button></>}>
    <form id="user-access-form" className="stack" onSubmit={(event) => void submit(event)}>
      <div className="form-grid"><SelectField label="Cargo" value={role} onChange={(e) => setRole(e.target.value as UserRole)} options={roleOptions} /><SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as AdminUser['status'])} options={[{ value: 'ativo', label: 'Ativo' }, { value: 'desativado', label: 'Desativado' }, { value: 'convidado', label: 'Convidado', disabled: true }]} /></div>
      <div className="permission-editor"><div><strong>Visibilidade dos módulos</strong><p>{customPermissions ? 'Desmarque o que este usuário não deve visualizar.' : 'Seu plano usa apenas as permissões padrão do cargo.'}</p></div><div className="permission-grid">{baseModules.map((module) => { const protectedOwnerAccess = role === 'dono' && module === 'configuracoes'; return <label key={module} className="permission-toggle"><input type="checkbox" checked={protectedOwnerAccess || !blockedModules.has(module)} disabled={!customPermissions || protectedOwnerAccess} onChange={(event) => { const next = new Set(blockedModules); if (event.target.checked) next.delete(module); else next.add(module); setBlockedModules(next) }} /><span>{moduleLabels[module]}{protectedOwnerAccess ? ' · obrigatório' : ''}</span></label> })}</div></div>
    </form>
  </Modal>
}

function UsersPanel({ companyId, users, invites, canEdit, customPermissions, userLimit }: { companyId: number; users: AdminUser[]; invites: CompanyInvite[]; canEdit: boolean; customPermissions: boolean; userLimit: number | null }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [cancelingInvite, setCancelingInvite] = useState<CompanyInvite | null>(null)
  const cancelMutation = useCancelInvite(companyId)
  const pendingInvites = invites.filter((invite) => invite.status === 'pendente')
  const activeUsers = users.filter((user) => user.status === 'ativo').length
  const columns: DataTableColumn<AdminUser>[] = [
    { id: 'user', header: 'Usuário', cell: (user) => <div className="admin-user"><span>{user.nome.slice(0, 2).toUpperCase()}</span><div><strong>{user.nome}</strong><small>{user.email}</small></div></div> },
    { id: 'role', header: 'Cargo', cell: (user) => ROLE_LABELS[user.tipo] },
    { id: 'status', header: 'Status', cell: (user) => <span className={`badge ${user.status === 'ativo' ? 'badge--success' : ''}`}>{user.status === 'ativo' ? 'Ativo' : 'Inativo'}</span> },
    { id: 'last', header: 'Último acesso', cell: (user) => formatAdminDate(user.ultimo_acesso_em), hideOnMobile: true },
    { id: 'actions', header: '', align: 'right', cell: (user) => canEdit ? <button className="btn btn--icon btn--ghost" type="button" title="Editar acesso" onClick={(event) => { event.stopPropagation(); setEditingUser(user) }}><Edit3 size={17} /></button> : null },
  ]
  return <div className="admin-panel-stack">
    <section className="admin-panel card"><SectionHeading title="Usuários da empresa" description={`${activeUsers} ativo(s)${userLimit === null ? ' · limite ilimitado' : ` de ${userLimit} permitido(s)`}.`} action={canEdit ? <button className="btn btn--primary" type="button" onClick={() => setInviteOpen(true)}><Plus size={17} /> Adicionar usuário</button> : undefined} />{!canEdit && <div className="alert alert--info">Gerentes podem consultar a equipe. Somente o administrador altera cargos e acessos.</div>}<DataTable data={users} columns={columns} rowKey="id" emptyTitle="Nenhum usuário encontrado" /></section>
    {pendingInvites.length > 0 && <section className="admin-panel card"><SectionHeading title="Convites pendentes" description="O acesso será ativado automaticamente quando o e-mail confirmado entrar no sistema." /><div className="pending-invites">{pendingInvites.map((invite) => <article key={invite.id}><Mail size={18} /><div><strong>{invite.email}</strong><small>{ROLE_LABELS[invite.tipo]} · expira em {formatAdminDate(invite.expires_at, false)}</small></div>{canEdit && <button className="btn btn--icon btn--ghost" type="button" aria-label="Cancelar convite" onClick={() => setCancelingInvite(invite)}><X size={17} /></button>}</article>)}</div></section>}
    <InviteModal open={inviteOpen} companyId={companyId} onClose={() => setInviteOpen(false)} />
    <UserAccessModal key={editingUser?.id ?? 'closed'} user={editingUser} companyId={companyId} customPermissions={customPermissions} onClose={() => setEditingUser(null)} />
    <ConfirmDeleteDialog open={Boolean(cancelingInvite)} onClose={() => setCancelingInvite(null)} onConfirm={() => cancelingInvite ? cancelMutation.mutateAsync(cancelingInvite.id) : Promise.resolve()} title="Cancelar convite" description="Este e-mail não receberá acesso por este convite." resourceName={cancelingInvite?.email} confirmLabel="Cancelar convite" />
  </div>
}

function RolesPanel({ customPermissions }: { customPermissions: boolean }) {
  return <section className="admin-panel card"><SectionHeading title="Cargos e permissões" description="Visão clara do acesso padrão de cada cargo. O banco continua aplicando as regras críticas por RLS." /><div className={`alert ${customPermissions ? 'alert--success' : 'alert--info'}`}><KeyRound size={19} />{customPermissions ? 'Seu plano permite restringir módulos individualmente na edição de cada usuário.' : 'Seu plano utiliza a matriz padrão. Permissões personalizadas exigem um plano compatível.'}</div><div className="role-cards">{(Object.entries(ROLE_LABELS) as Array<[UserRole, string]>).map(([role, label]) => { const allowed = APP_MODULES.filter((module) => MODULE_ACCESS[module].allowedRoles.includes(role)); return <article key={role} className="role-card"><div className="role-card__icon"><UserCog size={20} /></div><div><h3>{label}</h3><p>{role === 'dono' ? 'Controle administrativo completo.' : role === 'gerente' ? 'Gestão da operação sem alterar proprietários.' : role === 'recepcionista' ? 'Agenda, atendimento e cadastros operacionais.' : 'Rotina e agenda do profissional.'}</p></div><ul>{allowed.map((module) => <li key={module}><Check size={14} /> {moduleLabels[module]}</li>)}</ul></article> })}</div><p className="admin-note">Uma personalização nunca concede acesso além do cargo e do plano; ela apenas pode restringir módulos. Isso evita uma permissão visual furar a segurança do banco.</p></section>
}

function PlanPanel() {
  const { assinatura, plano, permissoes, statusAcesso } = useAccess()
  const activePermissions = permissoes.filter((permission) => permission.ativo)
  return <div className="admin-panel-stack">
    <section className="plan-hero card"><div className="plan-hero__icon"><BadgeCheck size={26} /></div><div className="plan-hero__copy"><span className="eyebrow">Plano atual</span><h2>{plano?.nome ?? 'Não identificado'}</h2><p>{activePermissions.length} recursos habilitados para a empresa.</p></div><span className={`badge ${statusAcesso === 'ativa' || statusAcesso === 'teste' ? 'badge--success' : 'badge--warning'}`}>{statusAcesso.replaceAll('_', ' ')}</span></section>
    <section className="admin-panel card"><SectionHeading title="Assinatura" description="Informações contratuais somente para consulta; alterações de cobrança não são feitas diretamente no banco." /><dl className="subscription-details"><div><dt>Início</dt><dd>{formatAdminDate(assinatura?.inicio ?? null, false)}</dd></div><div><dt>Período atual</dt><dd>{formatAdminDate(assinatura?.periodo_atual_inicio ?? null, false)} até {formatAdminDate(assinatura?.periodo_atual_fim ?? null, false)}</dd></div><div><dt>Renovação</dt><dd>{assinatura?.cancelar_ao_fim_periodo ? 'Cancelamento programado' : 'Renovação normal'}</dd></div><div><dt>Versão do plano</dt><dd>{plano ? `v${plano.versao}` : '—'}</dd></div></dl><div className="alert alert--info">A troca de plano será ligada futuramente ao provedor de cobrança. Manter esta área somente leitura evita liberar recursos sem pagamento confirmado.</div></section>
    <section className="admin-panel card"><SectionHeading title="Recursos habilitados" description="Permissões efetivamente carregadas da tabela permissoes_planos." /><div className="feature-list">{activePermissions.map((permission) => <span key={permission.funcionalidade}><Check size={14} /> {permission.funcionalidade.replaceAll('_', ' ')}{permission.ilimitado ? ' · ilimitado' : permission.limite !== null ? ` · limite ${permission.limite}` : ''}</span>)}</div></section>
  </div>
}

const integrationCatalog: Array<{ type: IntegrationInput['type']; provider: IntegrationInput['provider']; title: string; description: string; icon: typeof MessageCircle; field: string; fieldLabel: string; placeholder: string }> = [
  { type: 'whatsapp', provider: 'meta_cloud', title: 'WhatsApp Business', description: 'Confirmações e lembretes de agendamento.', icon: MessageCircle, field: 'numero_exibicao', fieldLabel: 'Número de exibição', placeholder: '+55 11 99999-9999' },
  { type: 'calendario', provider: 'google_calendar', title: 'Google Calendar', description: 'Sincronização futura das agendas profissionais.', icon: CalendarDays, field: 'calendar_id', fieldLabel: 'ID público do calendário', placeholder: 'agenda@group.calendar.google.com' },
  { type: 'email', provider: 'resend', title: 'E-mail transacional', description: 'Remetente para avisos e recuperações.', icon: Mail, field: 'remetente', fieldLabel: 'E-mail remetente', placeholder: 'agenda@suaempresa.com.br' },
  { type: 'webhook', provider: 'webhook', title: 'Webhook', description: 'Envie eventos para automações externas.', icon: Webhook, field: 'url', fieldLabel: 'URL HTTPS do endpoint', placeholder: 'https://automacao.exemplo.com/eventos' },
]
function integrationConfiguration(integration: Integration | undefined) { const value = integration?.configuracoes; return value && typeof value === 'object' && !Array.isArray(value) ? value : {} }

function IntegrationsPanel({ companyId, integrations }: { companyId: number; integrations: Integration[] }) {
  const saveMutation = useSaveIntegration(companyId); const removeMutation = useRemoveIntegration(companyId)
  const [editing, setEditing] = useState<(typeof integrationCatalog)[number] | null>(null); const [removing, setRemoving] = useState<Integration | null>(null); const [value, setValue] = useState('')
  const current = editing ? integrations.find((item) => item.tipo === editing.type && item.provedor === editing.provider) : undefined
  function openIntegration(catalog: (typeof integrationCatalog)[number], integration: Integration | undefined) { const config = integrationConfiguration(integration); const stored = config[catalog.field]; setValue(typeof stored === 'string' ? stored : ''); setEditing(catalog) }
  async function save(event: FormEvent) { event.preventDefault(); if (!editing) return; await saveMutation.mutateAsync({ companyId, type: editing.type, provider: editing.provider, configuration: { [editing.field]: value }, status: current?.status === 'inativa' ? 'inativa' : 'configurando' }); setEditing(null) }
  return <section className="admin-panel card"><SectionHeading title="Integrações" description="Prepare conexões sem expor tokens no navegador. A ativação real depende do backend e do Vault." /><div className="integration-grid">{integrationCatalog.map((catalog) => { const Icon = catalog.icon; const integration = integrations.find((item) => item.tipo === catalog.type && item.provedor === catalog.provider); return <article key={catalog.type} className="integration-card"><div className="integration-card__top"><span><Icon size={21} /></span><span className={`badge ${integration?.status === 'ativa' ? 'badge--success' : integration?.status === 'erro' ? 'badge--danger' : ''}`}>{integration ? integration.status : 'Não configurada'}</span></div><div><h3>{catalog.title}</h3><p>{catalog.description}</p></div>{integration?.ultimo_erro && <small className="text-danger">{integration.ultimo_erro}</small>}<div className="integration-card__actions"><button className="btn btn--secondary" type="button" onClick={() => openIntegration(catalog, integration)}>{integration ? <Edit3 size={16} /> : <Plus size={16} />}{integration ? 'Configurar' : 'Preparar'}</button>{integration && <button className="btn btn--icon btn--ghost" type="button" aria-label="Remover integração" onClick={() => setRemoving(integration)}><Trash2 size={16} /></button>}</div></article> })}</div><div className="alert alert--warning"><ShieldCheck size={19} /> Tokens, senhas e chaves de API não entram nesta tela nem na coluna configuracoes. Eles deverão ficar em Supabase Vault ou em um backend seguro.</div>
    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.title ?? 'Configurar integração'} description="Salve somente dados públicos de identificação." size="sm" footer={<><button className="btn btn--secondary" type="button" onClick={() => setEditing(null)}>Cancelar</button><button className="btn btn--primary" type="submit" form="integration-form" disabled={saveMutation.isPending}>{saveMutation.isPending ? <span className="btn-spinner" /> : <Save size={17} />} Salvar</button></>}><form id="integration-form" className="stack" onSubmit={(event) => void save(event)}><TextField label={editing?.fieldLabel ?? 'Configuração'} value={value} required onChange={(e) => setValue(e.target.value)} placeholder={editing?.placeholder} /><div className="alert alert--info">Salvar prepara a integração, mas não a marca como ativa sem validação de credenciais no servidor.</div></form></Modal>
    <ConfirmDeleteDialog open={Boolean(removing)} onClose={() => setRemoving(null)} onConfirm={() => removing ? removeMutation.mutateAsync(removing.id) : Promise.resolve()} title="Remover integração" description="A configuração pública será removida. Credenciais externas devem ser revogadas no provedor." resourceName={integrationCatalog.find((item) => item.type === removing?.tipo)?.title} confirmLabel="Remover" />
  </section>
}

function PublicSitePanel({ companyId, companyName, site, units, reviews, canEdit }: { companyId: number; companyName: string; site: PublicSiteSettings | null; units: CompanyUnit[]; reviews: PublicReview[]; canEdit: boolean }) {
  const saveMutation = useSavePublicSite(companyId)
  const reviewMutation = useModeratePublicReview(companyId)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    published: site?.publicado ?? false,
    publicName: site?.nome_publico ?? companyName,
    slug: site?.slug ?? companyName.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    domains: site?.dominios.join(', ') ?? 'localhost',
    unitId: site?.id_unidade_principal ? String(site.id_unidade_principal) : String(units[0]?.id ?? ''),
    heroTitle: site?.titulo_hero ?? '', heroHighlight: site?.destaque_hero ?? '', heroDescription: site?.descricao_hero ?? '',
    aboutTitle: site?.titulo_sobre ?? '', aboutDescription: site?.descricao_sobre ?? '', heroImage: site?.imagem_hero_url ?? '', shareImage: site?.imagem_compartilhamento_url ?? '',
    instagram: site?.instagram_url ?? '', whatsapp: site?.whatsapp ?? '', publicEmail: site?.email_publico ?? '', footerText: site?.texto_rodape ?? '',
    seoTitle: site?.titulo_seo ?? '', seoDescription: site?.descricao_seo ?? '', keywords: site?.palavras_chave.join(', ') ?? '',
    differences: Array.isArray(site?.diferenciais) ? site.diferenciais.filter((item): item is string => typeof item === 'string').join('\n') : '',
    faqs: Array.isArray(site?.perguntas_frequentes) ? site.perguntas_frequentes.flatMap((item) => item && typeof item === 'object' && !Array.isArray(item) && typeof item.pergunta === 'string' && typeof item.resposta === 'string' ? [`${item.pergunta} | ${item.resposta}`] : []).join('\n') : '',
    showPrices: site?.mostrar_precos ?? true, showProfessionals: site?.mostrar_profissionais ?? true, showReviews: site?.mostrar_avaliacoes ?? false, showAddress: site?.mostrar_endereco ?? true, showHours: site?.mostrar_horarios ?? true,
  })

  async function submit(event: FormEvent) {
    event.preventDefault()
    const domains = form.domains.split(',').map((item) => item.trim()).filter(Boolean)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) return setError('Use um slug com letras minúsculas, números e hífens.')
    if (!domains.length) return setError('Informe ao menos um domínio.')
    const faqs = form.faqs.split('\n').map((line) => { const [pergunta, ...answer] = line.split('|'); return { pergunta: pergunta?.trim(), resposta: answer.join('|').trim() } }).filter((item) => item.pergunta && item.resposta)
    setError('')
    await saveMutation.mutateAsync({ companyId, configuration: {
      publicado: form.published, nome_publico: form.publicName, slug: form.slug, dominios: domains,
      id_unidade_principal: form.unitId || null, titulo_hero: form.heroTitle, destaque_hero: form.heroHighlight,
      descricao_hero: form.heroDescription, titulo_sobre: form.aboutTitle, descricao_sobre: form.aboutDescription,
      imagem_hero_url: form.heroImage, imagem_compartilhamento_url: form.shareImage, instagram_url: form.instagram,
      whatsapp: form.whatsapp, email_publico: form.publicEmail, texto_rodape: form.footerText,
      titulo_seo: form.seoTitle, descricao_seo: form.seoDescription,
      palavras_chave: form.keywords.split(',').map((item) => item.trim()).filter(Boolean),
      diferenciais: form.differences.split('\n').map((item) => item.trim()).filter(Boolean), perguntas_frequentes: faqs,
      mostrar_precos: form.showPrices, mostrar_profissionais: form.showProfessionals, mostrar_avaliacoes: form.showReviews,
      mostrar_endereco: form.showAddress, mostrar_horarios: form.showHours,
    } })
  }

  return <div className="admin-panel-stack"><section className="admin-panel card"><SectionHeading title="Site público" description="Conteúdo, domínio e visibilidade controlados sem alterar o código ou fazer novo deploy." />{!canEdit && <div className="alert alert--info">Somente o administrador pode publicar ou alterar o site.</div>}<form className="admin-form" onSubmit={(event) => void submit(event)}><fieldset disabled={!canEdit || saveMutation.isPending} className="stack">
    <label className="site-publish-switch"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /><span><strong>{form.published ? 'Site publicado' : 'Site em rascunho'}</strong><small>Quando desativado, domínio e slug retornam página não encontrada.</small></span></label>
    <div className="form-grid"><TextField label="Nome público" required value={form.publicName} onChange={(e) => setForm({ ...form, publicName: e.target.value })} /><TextField label="Slug" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} /><TextField label="Domínios" required value={form.domains} hint="Separe por vírgula. Não inclua https:// nem porta." onChange={(e) => setForm({ ...form, domains: e.target.value })} /><SelectField label="Unidade principal" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} options={units.map((unit) => ({ value: String(unit.id), label: `${unit.nome}${unit.principal ? ' · principal' : ''}` }))} />
      <TextField label="Título principal" value={form.heroTitle} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })} /><TextField label="Destaque do título" value={form.heroHighlight} onChange={(e) => setForm({ ...form, heroHighlight: e.target.value })} /><TextAreaField label="Descrição principal" wrapperClassName="field--full" value={form.heroDescription} onChange={(e) => setForm({ ...form, heroDescription: e.target.value })} />
      <TextField label="Título sobre a empresa" value={form.aboutTitle} onChange={(e) => setForm({ ...form, aboutTitle: e.target.value })} /><TextAreaField label="Texto sobre a empresa" value={form.aboutDescription} onChange={(e) => setForm({ ...form, aboutDescription: e.target.value })} /><TextField label="URL da imagem principal" value={form.heroImage} onChange={(e) => setForm({ ...form, heroImage: e.target.value })} /><TextField label="URL da imagem para compartilhamento" value={form.shareImage} onChange={(e) => setForm({ ...form, shareImage: e.target.value })} />
      <TextField label="Instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /><TextField label="WhatsApp público" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /><TextField label="E-mail público" type="email" value={form.publicEmail} onChange={(e) => setForm({ ...form, publicEmail: e.target.value })} /><TextField label="Texto do rodapé" value={form.footerText} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
      <TextField label="Título SEO" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} /><TextAreaField label="Descrição SEO" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} /><TextField label="Palavras-chave" wrapperClassName="field--full" value={form.keywords} hint="Separe por vírgula." onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
      <TextAreaField label="Diferenciais" value={form.differences} hint="Um diferencial por linha." onChange={(e) => setForm({ ...form, differences: e.target.value })} /><TextAreaField label="Perguntas frequentes" value={form.faqs} hint="Uma por linha no formato Pergunta | Resposta." onChange={(e) => setForm({ ...form, faqs: e.target.value })} />
    </div>
    <div className="site-visibility-grid">{[
      ['showPrices', 'Mostrar preços'], ['showProfessionals', 'Mostrar profissionais'], ['showReviews', 'Mostrar avaliações autorizadas'], ['showAddress', 'Mostrar endereço'], ['showHours', 'Mostrar horários'],
    ].map(([key, label]) => <label key={key}><input type="checkbox" checked={form[key as keyof typeof form] as boolean} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} /><span>{label}</span></label>)}</div>
  </fieldset>{error && <p className="field__error" role="alert">{error}</p>}{canEdit && <div className="admin-form__actions"><button className="btn btn--primary" type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? <span className="btn-spinner" /> : <Save size={17} />} Salvar e aplicar no site</button></div>}</form></section>
    <section className="admin-panel card"><SectionHeading title="Avaliações e autorização" description="Somente avaliações aprovadas e com autorização registrada podem aparecer no site." />{reviews.length === 0 ? <p className="admin-note">Nenhuma avaliação recebida até agora.</p> : <div className="public-review-list">{reviews.map((review) => <article key={review.id}><span><Star size={16} /> {review.nota}/5</span><div><strong>{review.nome_publico || 'Cliente'}</strong><p>{review.comentario || 'Sem comentário.'}</p><small>{review.status} · {review.autorizado_publicacao ? 'autorização registrada' : 'sem autorização registrada'}</small></div>{canEdit && <div><button className="btn btn--secondary" type="button" disabled={reviewMutation.isPending} onClick={() => void reviewMutation.mutateAsync({ companyId, reviewId: review.id, status: 'aprovada', authorized: true })}>Aprovar com autorização</button><button className="btn btn--ghost" type="button" disabled={reviewMutation.isPending} onClick={() => void reviewMutation.mutateAsync({ companyId, reviewId: review.id, status: 'rejeitada', authorized: false })}>Rejeitar</button></div>}</article>)}</div>}<div className="alert alert--warning">Ao aprovar, confirme que o cliente autorizou a publicação do nome e comentário.</div></section>
  </div>
}

function AppearancePanel({ companyId, settings, canEdit }: { companyId: number; settings: CompanySettings | null; canEdit: boolean }) {
  const initial = getAppearance(settings); const mutation = useSaveCompanySettings(companyId)
  const [form, setForm] = useState({ preferredTheme: initial.tema_preferido as 'sistema' | 'claro' | 'escuro', primaryColor: initial.cor_primaria, accentColor: initial.cor_destaque, interfaceRadius: initial.raio_interface as 'discreto' | 'medio' | 'arredondado', interfaceDensity: initial.densidade_interface as 'compacta' | 'confortavel', logoUrl: initial.logo_url ?? '', language: initial.idioma, currency: initial.moeda, weekStartsOn: initial.semana_inicia, slotDurationMinutes: initial.duracao_slot_minutos })
  const [logoFiles, setLogoFiles] = useState<File[]>([])
  const [logoPreview, setLogoPreview] = useState(initial.logo_url ?? '')
  const [removeLogo, setRemoveLogo] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => () => {
    if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
  }, [logoPreview])

  function changeLogoFiles(files: File[]) {
    setLogoFiles(files)
    setRemoveLogo(false)
    setLogoPreview(files[0] ? URL.createObjectURL(files[0]) : form.logoUrl)
  }

  function markLogoForRemoval() {
    setLogoFiles([])
    setLogoPreview('')
    setRemoveLogo(true)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!isHexColor(form.primaryColor) || !isHexColor(form.accentColor)) return setError('Use cores no formato hexadecimal completo, por exemplo #226FE7.')
    setError('')

    try {
      const saved = await mutation.mutateAsync({
        companyId,
        preferredTheme: form.preferredTheme,
        primaryColor: form.primaryColor,
        accentColor: form.accentColor,
        interfaceRadius: form.interfaceRadius,
        interfaceDensity: form.interfaceDensity,
        currentLogoUrl: form.logoUrl,
        logoFile: logoFiles[0] ?? null,
        removeLogo,
        language: form.language,
        currency: form.currency,
        weekStartsOn: form.weekStartsOn,
        slotDurationMinutes: form.slotDurationMinutes,
      })
      const savedLogoUrl = saved.logo_url ?? ''
      setForm((current) => ({ ...current, logoUrl: savedLogoUrl }))
      setLogoFiles([])
      setLogoPreview(savedLogoUrl)
      setRemoveLogo(false)
    } catch {
      // O hook da mutação mostra a mensagem detalhada ao usuário.
    }
  }
  return <section className="admin-panel card"><SectionHeading title="Personalização visual" description="Uma identidade consistente para toda a empresa, mantendo contraste e responsividade." />{!canEdit && <div className="alert alert--info">Somente o administrador pode alterar a aparência compartilhada.</div>}<form className="admin-form" onSubmit={(event) => void submit(event)}>
    <fieldset className="appearance-themes" disabled={!canEdit}><legend>Tema padrão da empresa</legend>{(['sistema', 'claro', 'escuro'] as const).map((theme) => <label key={theme} data-selected={form.preferredTheme === theme}><input type="radio" name="theme" value={theme} checked={form.preferredTheme === theme} onChange={() => setForm({ ...form, preferredTheme: theme })} /><span className={`theme-preview theme-preview--${theme}`}><i /><i /><i /></span><strong>{theme === 'sistema' ? 'Automático' : theme === 'claro' ? 'Claro' : 'Escuro'}</strong><small>{theme === 'sistema' ? 'Segue o dispositivo' : `Usa o tema ${theme}`}</small></label>)}</fieldset>
    <div className="form-grid"><label className="field color-field"><span className="field__label">Cor principal</span><span><input type="color" value={form.primaryColor} disabled={!canEdit} onChange={(e) => setForm({ ...form, primaryColor: e.target.value.toUpperCase() })} /><input className="input" value={form.primaryColor} disabled={!canEdit} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></span></label><label className="field color-field"><span className="field__label">Cor de destaque</span><span><input type="color" value={form.accentColor} disabled={!canEdit} onChange={(e) => setForm({ ...form, accentColor: e.target.value.toUpperCase() })} /><input className="input" value={form.accentColor} disabled={!canEdit} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} /></span></label><SelectField label="Arredondamento" value={form.interfaceRadius} disabled={!canEdit} onChange={(e) => setForm({ ...form, interfaceRadius: e.target.value as typeof form.interfaceRadius })} options={[{ value: 'discreto', label: 'Discreto' }, { value: 'medio', label: 'Equilibrado' }, { value: 'arredondado', label: 'Arredondado' }]} /><SelectField label="Densidade" value={form.interfaceDensity} disabled={!canEdit} onChange={(e) => setForm({ ...form, interfaceDensity: e.target.value as typeof form.interfaceDensity })} options={[{ value: 'confortavel', label: 'Confortável' }, { value: 'compacta', label: 'Compacta' }]} /><div className="company-logo-setting field--full"><div className="company-logo-setting__preview"><span className="company-logo-setting__image">{logoPreview ? <img src={logoPreview} alt="Prévia do logotipo da empresa" /> : <Palette size={25} aria-hidden="true" />}</span><span className="company-logo-setting__copy"><strong>{logoPreview ? 'Logotipo da empresa' : 'Sem logotipo personalizado'}</strong><small>A imagem salva aparece imediatamente no topo da barra lateral.</small></span>{logoPreview && canEdit && <button className="btn btn--secondary" type="button" onClick={markLogoForRemoval}><Trash2 size={16} /> Remover</button>}{removeLogo && canEdit && <button className="btn btn--secondary" type="button" onClick={() => { setRemoveLogo(false); setLogoPreview(form.logoUrl) }}>Desfazer</button>}</div><FileUpload label={form.logoUrl ? 'Trocar arquivo do logotipo' : 'Arquivo do logotipo'} files={logoFiles} onFilesChange={changeLogoFiles} accept="image/png,image/jpeg,image/webp" maxSizeMB={2} maxFiles={1} helperText="PNG, JPG ou WEBP, com até 2 MB. Para melhor resultado, use uma imagem quadrada." disabled={!canEdit || mutation.isPending} />{removeLogo && <small className="company-logo-setting__notice">O logotipo atual será removido quando você aplicar a personalização.</small>}</div><SelectField label="Primeiro dia da semana" value={String(form.weekStartsOn)} disabled={!canEdit} onChange={(e) => setForm({ ...form, weekStartsOn: Number(e.target.value) })} options={[{ value: '0', label: 'Domingo' }, { value: '1', label: 'Segunda-feira' }]} /><SelectField label="Intervalo padrão da agenda" value={String(form.slotDurationMinutes)} disabled={!canEdit} onChange={(e) => setForm({ ...form, slotDurationMinutes: Number(e.target.value) })} options={[10, 15, 20, 30, 45, 60].map((item) => ({ value: String(item), label: `${item} minutos` }))} /></div>
    {error && <p className="field__error" role="alert">{error}</p>}<div className="appearance-preview" style={{ '--preview-primary': isHexColor(form.primaryColor) ? form.primaryColor : DEFAULT_APPEARANCE.cor_primaria } as CSSProperties}><span>Prévia</span><strong>Botões e destaques da empresa</strong><button type="button">Ação principal</button></div>{canEdit && <div className="admin-form__actions"><button className="btn btn--primary" type="submit" disabled={mutation.isPending}>{mutation.isPending ? <span className="btn-spinner" /> : <Save size={17} />} Aplicar personalização</button></div>}
  </form></section>
}

export function AdminSettingsPage() {
  const { empresaAtual } = useAuth(); const { cargo, plano, obterLimite, possuiPermissaoPlano } = useAccess(); const companyId = empresaAtual?.id ?? 0
  const [tab, setTab] = useState<AdministrationTab>('empresa'); const query = useAdministration(companyId, plano?.id ?? null); const canEdit = cargo === 'dono'; const customPermissions = possuiPermissaoPlano(FEATURES.CUSTOM_PERMISSIONS); const userLimit = obterLimite(FEATURES.USERS); const data = query.data
  const configuredIntegrations = data?.integrations.length ?? 0; const activeUsers = data?.users.filter((user) => user.status === 'ativo').length ?? 0
  return <div className="page admin-page"><header className="page-header"><div className="page-header__content"><span className="eyebrow">Administração</span><h1>Configurações</h1><p>Gerencie sua empresa, pessoas, acessos e conexões em um só lugar.</p></div><div className="admin-health"><span><ShieldCheck size={17} /> RLS ativa</span><span><BadgeCheck size={17} /> {plano?.nome ?? 'Sem plano'}</span></div></header>
    <section className="admin-metrics" aria-label="Resumo da administração"><article><Users size={19} /><div><strong>{activeUsers}</strong><span>usuários ativos</span></div></article><article><Link2 size={19} /><div><strong>{configuredIntegrations}</strong><span>integrações preparadas</span></div></article><article><Clock3 size={19} /><div><strong>{data ? formatAdminDate(data.company.created_at, false) : '—'}</strong><span>empresa criada em</span></div></article></section>
    <div className="admin-workspace"><nav className="admin-tabs" aria-label="Configurações da empresa">{tabs.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" data-active={tab === item.id} onClick={() => setTab(item.id)}><Icon size={18} /><span>{item.label}</span><ChevronRight size={15} /></button> })}</nav><main className="admin-content">{query.isPending && <LoadingState label="Carregando administração..." />}{query.error && <ErrorState error={query.error} onRetry={() => void query.refetch()} isRetrying={query.isFetching} />}{data && tab === 'empresa' && <CompanyPanel company={data.company} canEdit={canEdit} />}{data && tab === 'site' && <PublicSitePanel companyId={companyId} companyName={data.company.fantasia} site={data.publicSite} units={data.units} reviews={data.reviews} canEdit={canEdit} />}{data && tab === 'usuarios' && <UsersPanel companyId={companyId} users={data.users} invites={data.invites} canEdit={canEdit} customPermissions={customPermissions} userLimit={userLimit} />}{data && tab === 'cargos' && <RolesPanel customPermissions={customPermissions} />}{data && tab === 'plano' && <PlanPanel />}{data && tab === 'integracoes' && <IntegrationsPanel companyId={companyId} integrations={data.integrations} />}{data && tab === 'aparencia' && <AppearancePanel companyId={companyId} settings={data.settings} canEdit={canEdit} />}</main></div>
  </div>
}
