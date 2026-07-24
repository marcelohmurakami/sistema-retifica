import styled from "styled-components";
import { NavLink } from "react-router";

export const SidebarStyled = styled.aside<{ $isOpen?: boolean }>`
  grid-area: sidebar;
  z-index: 200;
  position: sticky;
  top: 0;
  align-self: start;
  width: ${({ theme }) => theme.layout.sidebarWidth};
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem 1rem;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.textPrimary};
  background:
    radial-gradient(
      circle at 35% -5%,
      color-mix(in srgb, ${({ theme }) => theme.colors.accent} 18%, transparent),
      transparent 15rem
    ),
    linear-gradient(
      180deg,
      ${({ theme }) => theme.colors.surfaceElevated} 0%,
      ${({ theme }) => theme.colors.background} 100%
    );
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadow.md};
  transition:
    color 0.22s ease,
    background 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;

  @media (max-width: 900px) {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(86vw, 310px);
    box-shadow: ${({ theme }) => theme.shadow.lg};
    transform: translateX(${({ $isOpen }) => ($isOpen ? "0" : "-105%")});
    transition:
      transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
      color 0.22s ease,
      background 0.22s ease,
      border-color 0.22s ease,
      box-shadow 0.22s ease;
  }
`;

export const BrandBlock = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  min-height: 78px;
  margin-bottom: 1rem;
  padding: 0.7rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surfaceElevated} 72%,
    transparent
  );
  box-shadow: ${({ theme }) => theme.shadow.sm};
  transition:
    background 0.22s ease,
    border-color 0.22s ease,
    box-shadow 0.22s ease;
`;

export const LogoStyled = styled.img`
  width: 100%;
  height: 64px;
  object-fit: contain;
  padding: 0.45rem;
  border: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.border} 72%, transparent);
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  transition:
    background 0.22s ease,
    border-color 0.22s ease;
`;

export const CloseButton = styled.button`
  display: none;
  position: absolute;
  top: -0.55rem;
  right: -0.55rem;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  box-shadow: ${({ theme }) => theme.shadow.md};
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 45%,
      ${({ theme }) => theme.colors.border}
    );
    transform: rotate(4deg);
  }

  @media (max-width: 900px) {
    display: grid;
  }
`;

export const NavStyled = styled.nav`
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  overflow-y: auto;
  padding: 0.2rem 0.15rem 0.75rem;
  scrollbar-width: thin;
`;

export const NavGroupLabel = styled.span`
  margin: 0.6rem 0.7rem 0.35rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.67rem;
  font-weight: 750;
  letter-spacing: 0.13em;
  text-transform: uppercase;
`;

export const NavItemStyled = styled(NavLink)`
  position: relative;
  width: 100%;
  min-height: 46px;
  padding: 0.65rem 0.78rem;
  display: flex;
  align-items: center;
  gap: 0.78rem;
  border: 1px solid transparent;
  border-radius: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.875rem;
  font-weight: 610;
  letter-spacing: -0.01em;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;

  &::before {
    content: "";
    position: absolute;
    left: -0.15rem;
    width: 3px;
    height: 20px;
    border-radius: 0 4px 4px 0;
    background: ${({ theme }) => theme.colors.accent};
    opacity: 0;
    transform: scaleY(0.5);
    transition: inherit;
  }

  svg {
    width: 17px;
    height: 17px;
    flex: 0 0 auto;
    color: ${({ theme }) => theme.colors.textMuted};
    transition: inherit;
  }

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.surfaceElevated} 76%,
      transparent
    );
    transform: translateX(2px);

    svg {
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  &.active {
    color: ${({ theme }) => theme.colors.textPrimary};
    background: linear-gradient(
      90deg,
      color-mix(in srgb, ${({ theme }) => theme.colors.accent} 18%, transparent),
      color-mix(in srgb, ${({ theme }) => theme.colors.accent} 7%, transparent)
    );
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 24%,
      ${({ theme }) => theme.colors.border}
    );
    box-shadow: inset 0 1px
      color-mix(in srgb, ${({ theme }) => theme.colors.surfaceElevated} 38%, transparent);

    &::before {
      opacity: 1;
      transform: scaleY(1);
    }

    svg {
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  @media (max-height: 760px) {
    min-height: 42px;
    padding-block: 0.5rem;
  }
`;

export const SidebarFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.35rem;
  padding: 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surfaceElevated} 58%,
    transparent
  );
  transition:
    background 0.22s ease,
    border-color 0.22s ease;
`;

export const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.success};
  box-shadow: 0 0 0 5px
    color-mix(in srgb, ${({ theme }) => theme.colors.success} 12%, transparent);
`;

export const StatusText = styled.div`
  min-width: 0;

  strong,
  span {
    display: block;
  }

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 0.75rem;
    font-weight: 650;
  }

  span {
    margin-top: 0.08rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.67rem;
  }
`;
