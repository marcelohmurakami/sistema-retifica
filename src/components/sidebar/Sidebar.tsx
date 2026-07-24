import {
  SidebarStyled,
  BrandBlock,
  LogoStyled,
  CloseButton,
  NavStyled,
  NavGroupLabel,
  NavItemStyled,
  SidebarFooter,
  StatusDot,
  StatusText,
} from "./SidebarStyled";
import {
  FaHome,
  FaUsers,
  FaClipboardList,
  FaMoneyBill,
  FaCog,
  FaTools,
  FaBox,
  FaFileInvoiceDollar,
  FaFileAlt,
  FaChartBar,
  FaHistory,
  FaTimes,
} from "react-icons/fa";
import logo from "../../assets/logo-print.jpg";
import { useEmpresaAtual } from "../empresas/useEmpresas";

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { data: user } = useEmpresaAtual();
  const isAdmin = user?.role === "financeiro_master";

  return (
    <SidebarStyled $isOpen={isOpen}>
      <BrandBlock>
        <LogoStyled src={logo} alt="Retífica Estação" />
        <CloseButton type="button" onClick={onClose} aria-label="Fechar menu">
          <FaTimes />
        </CloseButton>
      </BrandBlock>

      <NavStyled aria-label="Navegação principal">
        <NavGroupLabel>Operação</NavGroupLabel>

        <NavItemStyled to="/" end onClick={onClose}>
          <FaHome />
          <span>Visão geral</span>
        </NavItemStyled>

        <NavItemStyled to="/clientes" onClick={onClose}>
          <FaUsers />
          <span>Clientes</span>
        </NavItemStyled>

        <NavItemStyled to="/ordens-de-serviço" onClick={onClose}>
          <FaClipboardList />
          <span>Ordens de serviço</span>
        </NavItemStyled>

        <NavItemStyled to="/orcamentos" onClick={onClose}>
          <FaFileInvoiceDollar />
          <span>Orçamentos</span>
        </NavItemStyled>

        <NavItemStyled to="/serviços" onClick={onClose}>
          <FaTools />
          <span>Serviços e peças</span>
        </NavItemStyled>

        <NavItemStyled to="/estoque" onClick={onClose}>
          <FaBox />
          <span>Estoque</span>
        </NavItemStyled>

        <NavGroupLabel>Gestão</NavGroupLabel>

        {isAdmin && (
          <NavItemStyled to="/financeiro" onClick={onClose}>
            <FaMoneyBill />
            <span>Financeiro</span>
          </NavItemStyled>
        )}

        <NavItemStyled to="/anotações" onClick={onClose}>
          <FaFileAlt />
          <span>Anotações</span>
        </NavItemStyled>

        {isAdmin && (
          <NavItemStyled to="/relatórios" onClick={onClose}>
            <FaChartBar />
            <span>Relatórios</span>
          </NavItemStyled>
        )}

        <NavItemStyled to="/histórico" onClick={onClose}>
          <FaHistory />
          <span>Histórico</span>
        </NavItemStyled>

        <NavItemStyled to="/configurações" onClick={onClose}>
          <FaCog />
          <span>Configurações</span>
        </NavItemStyled>
      </NavStyled>

      <SidebarFooter>
        <StatusDot />
        <StatusText>
          <strong>Sistema operacional</strong>
          <span>Dados sincronizados com segurança</span>
        </StatusText>
      </SidebarFooter>
    </SidebarStyled>
  );
}
