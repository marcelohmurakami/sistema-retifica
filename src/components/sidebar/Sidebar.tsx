import { SidebarStyled, LogoStyled, NavStyled, NavItemStyled } from "./SidebarStyled";
import { FaHome, FaUsers, FaClipboardList, FaMoneyBill, FaCog, FaTools, FaBox, FaFileInvoiceDollar, FaFileAlt, FaChartBar, FaHistory } from "react-icons/fa";
import logo from '../../assets/logo-print.jpg'
import { Link } from "react-router";
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
      <LogoStyled src={logo} alt="Logo da retífica" />

      <NavStyled>
        <Link to="/" onClick={onClose}>
          <NavItemStyled>
            <FaHome />
            <span>Home</span>
          </NavItemStyled>
        </Link>

        <Link to="/clientes" onClick={onClose}>
          <NavItemStyled>
            <FaUsers />
            <span>Clientes</span>
          </NavItemStyled>
        </Link>

        <Link to="/ordens-de-serviço" onClick={onClose}>
          <NavItemStyled>
            <FaClipboardList />
            <span>Ordens de serviço</span>
          </NavItemStyled>
        </Link>

        <Link to="/orcamentos" onClick={onClose}>
          <NavItemStyled>
            <FaFileInvoiceDollar />
            <span>Orçamentos</span>
          </NavItemStyled>
        </Link>

        <Link to="/serviços" onClick={onClose}>
          <NavItemStyled>
            <FaTools />
            <span>Serviços</span>
          </NavItemStyled>
        </Link>

        <Link to="/estoque" onClick={onClose}>
          <NavItemStyled>
            <FaBox />
            <span>Estoque</span>
          </NavItemStyled>
        </Link>

        {isAdmin && (
          <Link to="/financeiro" onClick={onClose}>
            <NavItemStyled>
              <FaMoneyBill />
              <span>Financeiro</span>
            </NavItemStyled>
          </Link>
        )}

        <Link to="/anotações" onClick={onClose}>
          <NavItemStyled>
            <FaFileAlt />
            <span>Anotações</span>
          </NavItemStyled>
        </Link>

        {isAdmin && 
        <Link to="/relatórios" onClick={onClose}>
          <NavItemStyled>
            <FaChartBar />
            <span>Relatórios</span>
          </NavItemStyled>
        </Link>}
        

        <Link to="/histórico" onClick={onClose}>
          <NavItemStyled>
            <FaHistory />
            <span>Histórico</span>
          </NavItemStyled>
        </Link>

        <Link to="/configurações" onClick={onClose}>
          <NavItemStyled>
            <FaCog />
            <span>Configurações</span>
          </NavItemStyled>
        </Link>
      </NavStyled>
    </SidebarStyled>
  );
}