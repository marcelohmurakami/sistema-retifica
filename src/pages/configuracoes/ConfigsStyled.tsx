import styled, { css } from "styled-components";

/* LAYOUT */

export const PageContainer = styled.div`
  min-height: 100%;
  padding: clamp(1rem, 3vw, 2rem);
  background: ${({ theme }) => theme.colors.background};
  overflow-x: hidden;

  @media (max-width: 760px) {
    padding: 0.85rem;
  }
`;

export const Header = styled.div`
  max-width: 1180px;
  margin: 0 auto 1rem;
  padding: clamp(1.1rem, 3vw, 1.6rem);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};

  @media (max-width: 520px) {
    border-radius: 0.85rem;
  }
`;

export const PageTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: clamp(1.7rem, 6vw, 2.5rem);
  font-weight: 800;
  line-height: 1.1;
  overflow-wrap: anywhere;
`;

/* GRID */

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  max-width: 1180px;
  margin: 0 auto;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 0.85rem;
  }
`;

/* CARD */

export const SectionCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 1rem;
  padding: 1.15rem;
  box-shadow: ${({ theme }) => theme.shadow.sm};

  @media (max-width: 520px) {
    border-radius: 0.85rem;
    padding: 1rem;
  }
`;

export const SectionHeader = styled.div`
  margin-bottom: 1.1rem;
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 1.15rem;
  line-height: 1.25;

  svg {
    color: ${({ theme }) => theme.colors.accent};
    flex: 0 0 auto;
  }
`;

/* FORM */

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  gap: 0.35rem;
`;

export const Label = styled.label`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

export const Input = styled.input`
  width: 100%;
  height: 44px;
  min-width: 0;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 0.8rem;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  font: inherit;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
  }

  @media (max-width: 520px) {
    height: 48px;
    font-size: 1rem;
  }
`;

export const Button = styled.button`
  width: 100%;
  min-height: 44px;
  border: none;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.accent};
  color: white;
  font-weight: bold;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.7rem 1rem;
  transition: background 0.2s ease, transform 0.15s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentDark};
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  @media (max-width: 520px) {
    min-height: 48px;
    font-size: 1rem;
  }
`;

/* AVATAR */

export const AvatarWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.1rem;
  padding: 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: 420px) {
    align-items: stretch;
    flex-direction: column;
    text-align: center;
  }
`;

export const AvatarImage = styled.img`
  width: 76px;
  height: 76px;
  flex: 0 0 auto;
  border-radius: 50%;
  border: 3px solid ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.sm};
  object-fit: cover;

  @media (max-width: 420px) {
    align-self: center;
    width: 88px;
    height: 88px;
  }
`;

export const AvatarUpload = styled.input`
  display: none;
`;

export const AvatarUploadLabel = styled.label`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.primaryDark};
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: ${({ theme }) => theme.typography.weights.semibold};

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }

  @media (max-width: 420px) {
    width: 100%;
    min-height: 44px;
  }
`;

/* THEME */

export const ThemeToggle = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 420px) {
    flex-direction: column;
  }
`;

export const ThemeOption = styled.button<{ $active?: boolean }>`
  padding: 0.8rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  ${({ theme, $active }) =>
    $active &&
    css`
      background: ${theme.colors.accent};
      border-color: ${theme.colors.accent};
      color: white;
    `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;
