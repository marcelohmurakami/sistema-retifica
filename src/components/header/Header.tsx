import { useState } from "react";
import {
  FaBars,
  FaCog,
  FaMoon,
  FaSignOutAlt,
  FaSun,
} from "react-icons/fa";

import {
  HeaderContainer,
  LeftSection,
  RightSection,
  Avatar,
  AvatarFallback,
  UserMenu,
  UserTrigger,
  UserText,
  UserInfo,
  UserName,
  UserEmail,
  Dropdown,
  DropdownItem,
  Divider,
  MenuButton,
  ThemeButton,
  TitleGroup,
  AppName,
  PageName,
} from "./HeaderStyled";
import { useGetCurrentUser } from "../../pages/configuracoes/useConfiguracoes";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useThemeMode } from "../../contexts/ThemeModeContext";

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/clientes")) return "Clientes";
  if (pathname.startsWith("/ordens-de-serviço")) return "Ordens de serviço";
  if (pathname.startsWith("/orcamentos")) return "Orçamentos";
  if (pathname.startsWith("/servi")) return "Serviços e peças";
  if (pathname.startsWith("/estoque")) return "Estoque";
  if (pathname.startsWith("/financeiro")) return "Financeiro";
  if (pathname.startsWith("/anotações")) return "Anotações";
  if (pathname.startsWith("/relatórios")) return "Relatórios";
  if (pathname.startsWith("/histórico")) return "Histórico";
  if (pathname.startsWith("/configurações")) return "Configurações";

  return "Visão geral";
}

function getInitials(name?: string) {
  if (!name) return "RE";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

type HeaderProps = {
  onOpenSidebar?: () => void;
};

export function Header({ onOpenSidebar }: HeaderProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const { data: user } = useGetCurrentUser();
  const avatarUrl = user?.user_metadata.avatar_url as string | undefined;
  const userName = (user?.user_metadata.name as string | undefined) || "Usuário";
  const queryClient = useQueryClient();
  const page = useLocation().pathname;
  const { themeMode, toggleThemeMode } = useThemeMode();

  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    queryClient.clear();
    await signOut();
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  return (
    <HeaderContainer>
      <LeftSection>
        <MenuButton type="button" onClick={onOpenSidebar} aria-label="Abrir menu">
          <FaBars />
        </MenuButton>

        <TitleGroup>
          <AppName>Retífica Estação</AppName>
          <PageName>{getPageTitle(page)}</PageName>
        </TitleGroup>
      </LeftSection>

      <RightSection>
        <ThemeButton
          type="button"
          onClick={toggleThemeMode}
          aria-label={themeMode === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
          title={themeMode === "light" ? "Tema escuro" : "Tema claro"}
        >
          {themeMode === "light" ? <FaMoon /> : <FaSun />}
        </ThemeButton>

        <UserMenu>
          <UserTrigger
            type="button"
            onClick={() => setOpenMenu((current) => !current)}
            aria-expanded={openMenu}
            aria-haspopup="menu"
          >
            {avatarUrl ? (
              <Avatar src={avatarUrl} alt="" />
            ) : (
              <AvatarFallback aria-hidden="true">{getInitials(userName)}</AvatarFallback>
            )}
            <UserText>
              <strong>{userName}</strong>
              <small>Minha conta</small>
            </UserText>
          </UserTrigger>

          {openMenu && (
            <Dropdown role="menu">
              <UserInfo>
                <UserName>{userName}</UserName>
                <UserEmail>{user?.user_metadata.email}</UserEmail>
              </UserInfo>

              <Divider />

              <Link to="/configurações" onClick={() => setOpenMenu(false)}>
                <DropdownItem role="menuitem">
                  <FaCog />
                  Configurações
                </DropdownItem>
              </Link>

              <Divider />

              <DropdownItem $danger onClick={handleSignOut} role="menuitem">
                <FaSignOutAlt />
                Sair com segurança
              </DropdownItem>
            </Dropdown>
          )}
        </UserMenu>
      </RightSection>
    </HeaderContainer>
  );
}
