import styled, { css } from "styled-components";

export const HeaderContainer = styled.header`
  grid-area: header;
  height: 70px;
  min-width: 0;
  padding: 0 clamp(1rem, 3vw, 2rem);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: sticky;
  top: 0;
  z-index: 120;
`;

export const LeftSection = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const MenuButton = styled.button`
  display: none;
  width: 42px;
  height: 42px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  @media (max-width: 900px) {
    display: grid;
    place-items: center;
  }
`;

export const TitleGroup = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.85rem;

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
  }
`;

export const AppName = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  font-weight: 800;
  white-space: nowrap;
`;

export const PageName = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: clamp(1.1rem, 1.7vw, 1.6rem);
  font-weight: 700;
  white-space: nowrap;

  &::before {
    content: "|";
    margin-right: 0.85rem;
    color: ${({ theme }) => theme.colors.border};
  }

  @media (max-width: 560px) {
    &::before {
      display: none;
    }
  }
`;

export const RightSection = styled.div`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const UserMenu = styled.div`
  position: relative;
  cursor: pointer;
`;

export const Avatar = styled.img`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.colors.background};
`;

export const Dropdown = styled.div`
  position: absolute;
  top: 55px;
  right: 0;
  width: min(260px, calc(100vw - 2rem));

  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.14);
  padding: 0.6rem;
`;

export const UserInfo = styled.div`
  min-width: 0;
  padding: 0.6rem;
`;

export const UserName = styled.strong`
  display: block;
  font-size: 0.95rem;
  overflow-wrap: anywhere;
`;

export const UserEmail = styled.span`
  display: block;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-wrap: anywhere;
`;

export const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 0.5rem 0;
`;

export const DropdownItem = styled.div<{ $danger?: boolean }>`
  padding: 0.7rem;
  border-radius: 10px;

  display: flex;
  align-items: center;
  gap: 0.6rem;

  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;

  ${({ theme, $danger }) =>
    $danger
      ? css`
          color: ${theme.colors.error};

          &:hover {
            background: rgba(239, 68, 68, 0.1);
          }
        `
      : css`
          color: ${theme.colors.textPrimary};

          &:hover {
            background: ${theme.colors.background};
          }
        `}
`;