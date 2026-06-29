import { useState } from "react";
import {
  FaBars,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

import {
  HeaderContainer,
  LeftSection,
  RightSection,
  Avatar,
  UserMenu,
  UserInfo,
  UserName,
  UserEmail,
  Dropdown,
  DropdownItem,
  Divider,
  MenuButton,
  TitleGroup,
  AppName,
  PageName,
} from "./HeaderStyled";
import { useGetCurrentUser } from "../../pages/configuracoes/useConfiguracoes";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/clientes")) return "CLIENTES";
  if (pathname.startsWith("/ordens-de-serviço")) return "ORDENS DE SERVIÇO";
  if (pathname.startsWith("/orcamentos")) return "ORÇAMENTOS";
  if (pathname.startsWith("/servicos")) return "SERVIÇOS E PEÇAS";
  if (pathname.startsWith("/estoque")) return "ESTOQUE";
  if (pathname.startsWith("/financeiro")) return "FINANCEIRO";
  if (pathname.startsWith("/configurações")) return "CONFIGURAÇÕES";

  return "SISTEMA";
}

type HeaderProps = {
  onOpenSidebar?: () => void;
};

export function Header({ onOpenSidebar }: HeaderProps) {
  const [openMenu, setOpenMenu] = useState(false);
  const { data: user } = useGetCurrentUser();
  const avatarUrl = user?.user_metadata.avatar_url || "https://i.pravatar.cc/100";
  const queryClient = useQueryClient();
  const page = useLocation().pathname;

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
        <UserMenu onClick={() => setOpenMenu(!openMenu)}>
          <Avatar src={avatarUrl} alt="Avatar do usuário" />

          {openMenu && (
            <Dropdown>
              <UserInfo>
                <UserName>{user?.user_metadata.name}</UserName>
                <UserEmail>{user?.user_metadata.email}</UserEmail>
              </UserInfo>

              <Divider />

              <Link to="/configurações">
                <DropdownItem>
                  <FaCog />
                  Configurações
                </DropdownItem>
              </Link>

              <Divider />

              <DropdownItem $danger onClick={handleSignOut}>
                <FaSignOutAlt />
                Sair
              </DropdownItem>
            </Dropdown>
          )}
        </UserMenu>
      </RightSection>
    </HeaderContainer>
  );
}