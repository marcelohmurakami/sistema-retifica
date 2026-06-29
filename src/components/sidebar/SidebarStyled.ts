import styled from "styled-components";

export const SidebarStyled = styled.aside<{ $isOpen?: boolean }>`
  grid-area: sidebar;
  z-index: 200;

  position: sticky;
  top: 0;
  align-self: start;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;

  width: 280px;
  height: 100dvh;
  overflow: hidden;

  padding: 1.8rem 2.5rem;

  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 12px 0 30px rgba(15, 23, 42, 0.04);

  @media (max-width: 900px) {
    position: fixed;
    inset: 0 auto 0 0;
    transform: translateX(${({ $isOpen }) => ($isOpen ? "0" : "-105%")});
    transition: transform 0.22s ease;
  }

  @media (max-width: 420px) {
    width: min(84vw, 300px);
  }
`;

export const LogoStyled = styled.img`
  width: min(230px, 100%);
  height: auto;
  object-fit: contain;
  margin: 1rem 0 1.2rem;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  transition: filter 0.2s ease, background 0.2s ease;

  [data-theme="dark"] & {
    filter: invert(1) hue-rotate(180deg);
  }
`;

export const NavStyled = styled.nav`
  width: 100%;
  display: flex;
  flex-direction: column;

  a {
    width: 100%;
    color: inherit;
    text-decoration: none;
  }
`;

export const NavItemStyled = styled.div`
  min-height: 48px;
  padding: 0.5rem 0.9rem;

  display: flex;
  align-items: center;
  gap: 0.85rem;

  border-radius: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 1.08rem;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;

  svg {
    flex: 0 0 auto;
    height: 1.5rem;
    color: ${({ theme }) => theme.colors.primaryDark};
  }

  span {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 1.7rem;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.primaryDark};
    transform: translateX(4px);
  }

  @media (max-height: 760px) {
    min-height: 43px;
    padding: 0.65rem 0.8rem;
    font-size: 1rem;

    svg {
      font-size: 1.5rem;
    }
  }
`;
