import styled, { css } from "styled-components";

export const HeaderContainer = styled.header`
  grid-area: header;
  height: ${({ theme }) => theme.layout.headerHeight};
  min-width: 0;
  padding: 0 clamp(1rem, 2.6vw, 2.25rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: sticky;
  top: 0;
  z-index: 120;
  border-bottom: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.border} 84%, transparent);
  background: color-mix(in srgb, ${({ theme }) => theme.colors.surface} 88%, transparent);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(18px) saturate(140%);
`;

export const LeftSection = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.9rem;
`;

export const MenuButton = styled.button`
  display: none;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 13px;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.primaryDark};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  transition: transform 0.18s ease, border-color 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.accent} 45%, ${({ theme }) => theme.colors.border});
    transform: translateY(-1px);
  }

  @media (max-width: 900px) {
    display: grid;
    place-items: center;
  }
`;

export const TitleGroup = styled.div`
  min-width: 0;
`;

export const AppName = styled.span`
  display: block;
  margin-bottom: 0.12rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.7rem;
  font-weight: 720;
  letter-spacing: 0.11em;
  line-height: 1;
  text-transform: uppercase;

  @media (max-width: 520px) {
    display: none;
  }
`;

export const PageName = styled.h1`
  margin: 0;
  overflow: hidden;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: clamp(1.05rem, 2vw, 1.28rem);
  font-weight: 720;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RightSection = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

export const ThemeButton = styled.button`
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 13px;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition:
    transform 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.accent} 45%, ${({ theme }) => theme.colors.border});
    background: ${({ theme }) => theme.colors.accentSoft};
    transform: translateY(-1px);
  }
`;

export const UserMenu = styled.div`
  position: relative;
`;

export const UserTrigger = styled.button`
  min-width: 0;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.25rem 0.35rem 0.25rem 0.3rem;
  border: 1px solid transparent;
  border-radius: 15px;
  background: transparent;
  transition: background 0.18s ease, border-color 0.18s ease;

  &:hover,
  &[aria-expanded="true"] {
    border-color: ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surfaceElevated};
  }
`;

export const Avatar = styled.img`
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border: 2px solid ${({ theme }) => theme.colors.surfaceElevated};
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.border};
`;

export const AvatarFallback = styled.span`
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background:
    linear-gradient(145deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentDark});
  color: #fff;
  font-size: 0.8rem;
  font-weight: 760;
  box-shadow: 0 7px 16px rgba(217, 76, 19, 0.2);
`;

export const UserText = styled.span`
  min-width: 0;
  max-width: 160px;
  display: block;
  padding-right: 0.35rem;
  text-align: left;

  strong,
  small {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 0.78rem;
    font-weight: 680;
  }

  small {
    margin-top: 0.08rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: 0.67rem;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

export const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.65rem);
  right: 0;
  width: min(280px, calc(100vw - 2rem));
  padding: 0.55rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  box-shadow: ${({ theme }) => theme.shadow.lg};
  transform-origin: top right;
  animation: menu-in 0.18s ease-out;

  @keyframes menu-in {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

export const UserInfo = styled.div`
  min-width: 0;
  padding: 0.7rem;
`;

export const UserName = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 0.9rem;
  overflow-wrap: anywhere;
`;

export const UserEmail = styled.span`
  display: block;
  margin-top: 0.15rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.75rem;
  overflow-wrap: anywhere;
`;

export const Divider = styled.div`
  height: 1px;
  margin: 0.35rem 0;
  background: ${({ theme }) => theme.colors.border};
`;

export const DropdownItem = styled.div<{ $danger?: boolean }>`
  min-height: 42px;
  padding: 0.65rem 0.7rem;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  border-radius: 11px;
  font-size: 0.82rem;
  font-weight: 620;
  transition: color 0.16s ease, background 0.16s ease;

  ${({ theme, $danger }) =>
    $danger
      ? css`
          color: ${theme.colors.error};

          &:hover {
            background: color-mix(in srgb, ${theme.colors.error} 10%, transparent);
          }
        `
      : css`
          color: ${theme.colors.textPrimary};

          &:hover {
            color: ${theme.colors.accent};
            background: ${theme.colors.accentSoft};
          }
        `}
`;
