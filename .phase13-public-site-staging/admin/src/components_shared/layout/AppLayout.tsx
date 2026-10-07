import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  Archive, Boxes, BriefcaseBusiness, CalendarDays,
  CircleDollarSign, ClipboardList, Command, FileText, History,
  LayoutDashboard, LogOut, Menu, Moon, PackageSearch, PanelLeftClose, PanelLeftOpen,
  Search, Settings, Sparkles, Sun, Users, WalletCards, X,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { toast } from 'sonner'
import {
  ROLE_LABELS,
  type AppModule,
} from '../../features/access/access.constants'
import { useAccess } from '../../features/access/hooks/useAccess'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useLogout } from '../../features/auth/hooks/useAuthMutations'
import { useCompanyAppearance } from '../../features/admin/hooks/useAdmin'
import { COMPANY_APPEARANCE_UPDATED_EVENT } from '../../features/admin/admin.keys'
import { appearanceStyles } from '../../features/admin/utils/admin.utils'

type Icon = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>

type NavigationItem = {
  label: string
  path: string
  icon: Icon
  moduleKey: AppModule
}

type NavigationSection = {
  label: string
  items: NavigationItem[]
}

const navigation: NavigationSection[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Visão geral', path: '/', icon: LayoutDashboard, moduleKey: 'dashboard' },
      { label: 'Agenda', path: '/agendamentos', icon: CalendarDays, moduleKey: 'agendamentos' },
      { label: 'Comandas', path: '/comandas', icon: ClipboardList, moduleKey: 'comandas' },
      { label: 'Orçamentos', path: '/orcamentos', icon: FileText, moduleKey: 'orcamentos' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { label: 'Clientes', path: '/clientes', icon: Users, moduleKey: 'clientes' },
      { label: 'Funcionários', path: '/funcionarios', icon: BriefcaseBusiness, moduleKey: 'funcionarios' },
      { label: 'Serviços', path: '/servicos', icon: Sparkles, moduleKey: 'servicos' },
      { label: 'Produtos', path: '/produtos', icon: PackageSearch, moduleKey: 'produtos' },
      { label: 'Fornecedores', path: '/fornecedores', icon: Boxes, moduleKey: 'fornecedores' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { label: 'Financeiro', path: '/financeiro', icon: WalletCards, moduleKey: 'financeiro' },
      { label: 'Comissões', path: '/comissoes', icon: CircleDollarSign, moduleKey: 'comissoes' },
      { label: 'Estoque', path: '/estoque', icon: Archive, moduleKey: 'estoque' },
      { label: 'Histórico', path: '/historico', icon: History, moduleKey: 'historico' },
      { label: 'Configurações', path: '/configuracoes', icon: Settings, moduleKey: 'configuracoes' },
    ],
  },
]

const pageTitles = new Map(
  navigation.flatMap((section) => section.items.map((item) => [item.path, item.label])),
)

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'US'
}

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function AppLayout() {
  const location = useLocation()
  const { user, vinculoAtual } = useAuth()
  const companyId = vinculoAtual?.empresa.id ?? 0
  const appearanceQuery = useCompanyAppearance(companyId)
  const appearance = appearanceQuery.data
  const { podeAcessarModulo } = useAccess()
  const logout = useLogout()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [failedLogoUrl, setFailedLogoUrl] = useState<string | null>(null)
  const [themeOverride, setThemeOverride] = useState<'light' | 'dark' | null>(() => {
    const savedTheme = localStorage.getItem('app-theme')
    return savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : null
  })
  const companyTheme = appearance?.tema_preferido
  const theme = themeOverride ?? (
    companyTheme === 'escuro'
      ? 'dark'
      : companyTheme === 'claro'
        ? 'light'
        : getSystemTheme()
  )

  const pageTitle = useMemo(
    () => pageTitles.get(location.pathname) ?? 'Visão geral',
    [location.pathname],
  )
  const visibleNavigation = useMemo(
    () =>
      navigation
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            podeAcessarModulo(item.moduleKey),
          ),
        }))
        .filter((section) => section.items.length > 0),
    [podeAcessarModulo],
  )
  const userName =
    (typeof user?.user_metadata.full_name === 'string' &&
      user.user_metadata.full_name.trim()) ||
    user?.email?.split('@')[0] ||
    'Usuário'
  const userRole = vinculoAtual
    ? ROLE_LABELS[vinculoAtual.tipo]
    : 'Sem acesso'

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    if (themeOverride) localStorage.setItem('app-theme', themeOverride)
    else localStorage.removeItem('app-theme')
  }, [theme, themeOverride])

  useEffect(() => {
    const useCompanyDefault = () => setThemeOverride(null)
    window.addEventListener(COMPANY_APPEARANCE_UPDATED_EVENT, useCompanyDefault)
    return () => window.removeEventListener(COMPANY_APPEARANCE_UPDATED_EVENT, useCompanyDefault)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const styles = appearanceStyles(appearance) as Record<string, string>

    Object.entries(styles).forEach(([property, value]) => {
      root.style.setProperty(property, value)
    })

    return () => {
      Object.keys(styles).forEach((property) => root.style.removeProperty(property))
    }
  }, [appearance])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  async function handleLogout() {
    try {
      await logout.mutateAsync()
      toast.success('Você saiu da sua conta.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível sair.',
      )
    }
  }

  return (
    <div
      className="app-shell"
      data-sidebar-collapsed={isCollapsed}
      data-density={appearance?.densidade_interface ?? 'confortavel'}
      style={appearanceStyles(appearance)}
    >
      <button
        className={`sidebar-backdrop ${isMobileMenuOpen ? 'is-visible' : ''}`}
        type="button"
        aria-label="Fechar menu"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside className={`sidebar ${isMobileMenuOpen ? 'is-open' : ''}`}>
        <div className="sidebar__brand">
          <NavLink className="brand" to="/" aria-label="AgendaPro - início" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="brand__mark">
              {appearance?.logo_url && appearance.logo_url !== failedLogoUrl ? (
                <img
                  src={appearance.logo_url}
                  alt=""
                  onError={() => setFailedLogoUrl(appearance.logo_url)}
                />
              ) : (
                <Command size={21} strokeWidth={2.4} />
              )}
            </span>
            <span className="brand__copy">
              <strong>AgendaPro</strong>
              <small>Gestão inteligente</small>
            </span>
          </NavLink>

          <button
            className="sidebar__mobile-close"
            type="button"
            aria-label="Fechar menu"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          {visibleNavigation.map((section) => (
            <div className="nav-section" key={section.label}>
              <p className="nav-section__title">{section.label}</p>
              <ul className="nav-list">
                {section.items.map((item) => {
                  const ItemIcon = item.icon

                  return (
                    <li key={item.path}>
                      <NavLink
                        className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
                        to={item.path}
                        end={item.path === '/'}
                        title={isCollapsed ? item.label : undefined}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ItemIcon size={19} strokeWidth={2} aria-hidden />
                        <span className="nav-item__label">{item.label}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button
            className="sidebar-collapse"
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span>{isCollapsed ? 'Expandir menu' : 'Recolher menu'}</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar__leading">
            <button
              className="topbar__menu-button"
              type="button"
              aria-label="Abrir menu"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={21} />
            </button>

            <div className="topbar__title">
              <strong>{pageTitle}</strong>
            </div>
          </div>

          <div className="topbar__actions">
            <button className="global-search" type="button">
              <Search size={17} />
              <span>Buscar...</span>
              <kbd>⌘ K</kbd>
            </button>

            <button
              className="topbar__icon-button"
              type="button"
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              onClick={() => setThemeOverride(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <div className="profile-menu">
              <span className="profile-menu__avatar">{getInitials(userName)}</span>
              <span className="profile-menu__copy">
                <strong>{userName}</strong>
                <small>{userRole}</small>
              </span>
              <button
                className="profile-menu__logout"
                type="button"
                aria-label="Sair da conta"
                title="Sair da conta"
                onClick={() => void handleLogout()}
                disabled={logout.isPending}
              >
                {logout.isPending ? <span className="btn-spinner" /> : <LogOut size={17} />}
              </button>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
