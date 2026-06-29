import styled from "styled-components"

export const DetalhesContainer = styled.div`
  width: 100%;
  min-height: 100%;
  padding: clamp(1.2rem, 3vw, 2rem);
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  flex-direction: column;
  gap: clamp(1.2rem, 2.5vw, 2rem);
  overflow-x: hidden;
`

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.2rem;
  flex-wrap: wrap;

  > div:first-child {
    min-width: min(320px, 100%);
    flex: 1 1 280px;
  }

  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
    gap: 1rem;

    > div:first-child {
      flex: 0 0 auto;
    }
  }
`

export const PageTitle = styled.h1`
  min-width: 0;
  font-size: clamp(1.8rem, 4.4vw, 2rem);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primaryDark};
  margin: 0;
  overflow-wrap: anywhere;
  
`

export const FlexButtons = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 0.8rem;
    flex-wrap: wrap;
    flex: 1 1 420px;

    a {
      display: inline-flex;
      min-width: 0;
      text-decoration: none;
    }

    @media (max-width: 900px) {
      justify-content: flex-start;
      flex: 1 1 100%;
    }

    @media (max-width: 760px) {
      flex: 0 0 auto;
    }

    @media (max-width: 640px) {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.8rem;

      a {
        width: 100%;
      }
    }

    @media (max-width: 420px) {
      grid-template-columns: 1fr;
    }
`

export const PrintButton = styled.button`
  border: none;
  background: #2563eb;
  color: #fff;
  padding: 0.9rem 1.35rem;
  border-radius: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
  min-height: 40px;
  white-space: normal;
  text-align: center;
  line-height: 1.2;

  &:hover {
    filter: brightness(0.95);
    transform: translateY(-1px);
  }

  @media (max-width: 760px) {
    flex: 1 1 180px;
  }

  @media (max-width: 640px) {
    width: 100%;
    min-height: 44px;
  }
`

export const BackButton = styled.button`
  border: none;
  background: #2563eb;
  color: #fff;
  padding: 0.9rem 1.35rem;
  border-radius: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
  min-height: 40px;
  white-space: normal;
  text-align: center;
  line-height: 1.2;

  &:hover {
    filter: brightness(0.95);
    transform: translateY(-1px);
  }

  @media (max-width: 760px) {
    flex: 1 1 180px;
  }

  @media (max-width: 640px) {
    width: 100%;
    min-height: 44px;
  }
`

export const DetalhesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: 1.1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

export const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 14px;
  padding: clamp(1.2rem, 2.8vw, 1.45rem);
  box-shadow: ${({ theme }) => theme.shadow.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;

  @media (max-width: 640px) {
    grid-column: auto !important;
  }
`

export const InfoLabel = styled.span`
  font-size: clamp(1rem, 2.4vw, 1.15rem);
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  overflow-wrap: anywhere;
`

export const InfoValue = styled.span`
  font-size: clamp(1.25rem, 3vw, 1.4rem);
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  word-break: break-word;
  white-space: pre-wrap;
  min-width: 0;
`

export const MessageBox = styled.div`
  width: 100%;
  max-width: 520px;
  margin: clamp(2rem, 8vw, 4rem) auto 0;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px;
  padding: clamp(1.25rem, 4vw, 2rem);
  box-shadow: ${({ theme }) => theme.shadow.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;

  h2 {
    margin: 0 0 0.75rem;
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: clamp(1.35rem, 4vw, 1.7rem);
    overflow-wrap: anywhere;
  }

  p {
    margin: 0 0 1.5rem;
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: clamp(0.95rem, 2.6vw, 1rem);
  }
`
