import styled from "styled-components";

export const LogoStyled = styled.img`
  display: block;
  width: clamp(180px, 24vw, 300px);
  max-width: 100%;
  height: auto;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  object-fit: contain;
`;

export const LoginPage = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const BrandSection = styled.section`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing[10]};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primaryDark} 0%
  );
  overflow: hidden;

  @media (max-width: 960px) {
    display: none;
  }

  @media (max-width: 1180px) {
    padding: ${({ theme }) => theme.spacing[8]};
  }
`;

export const BrandOverlay = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top left, rgba(249, 115, 22, 0.22), transparent 32%),
    radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.06), transparent 28%);
`;

export const BrandContent = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 520px;
  color: ${({ theme }) => theme.colors.surface};
`;

export const BrandBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing[2]} ${theme.spacing[4]}`};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: ${({ theme }) => theme.radius.pill};
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);

  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  letter-spacing: 0.2px;
`;

export const BrandTitle = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing[4]} 0;
  color: ${({ theme }) => theme.colors.surface};
  font-size: clamp(2rem, 3.8vw, 3.4rem);
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  line-height: 1.05;
`;

export const BrandHighlight = styled.span`
  color: ${({ theme }) => theme.colors.accent};
`;

export const BrandDescription = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing[8]} 0;
  max-width: 460px;
  color: rgba(255, 255, 255, 0.82);
  font-size: clamp(
    ${({ theme }) => theme.typography.sizes.md},
    1.35vw,
    ${({ theme }) => theme.typography.sizes.lg}
  );
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

export const BrandFeatures = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const FeatureCard = styled.div`
  padding: ${({ theme }) => theme.spacing[4]};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(8px);
`;

export const FeatureTitle = styled.h3`
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
  color: ${({ theme }) => theme.colors.surface};
  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

export const FeatureText = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.74);
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

export const FormSection = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing[8]};
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: 960px) {
    min-height: 100vh;
    min-height: 100dvh;
    padding: ${({ theme }) => theme.spacing[6]};
  }

  @media (max-width: 520px) {
    align-items: stretch;
    padding: ${({ theme }) => theme.spacing[3]};
  }
`;

export const LoginCard = styled.div`
  width: 100%;
  max-width: 460px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  box-shadow: ${({ theme }) => theme.shadow.md};
  overflow: hidden;

  @media (max-width: 520px) {
    max-width: none;
    border-radius: ${({ theme }) => theme.radius.md};
  }
`;

export const LoginTopBar = styled.div`
  height: 8px;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.primaryDark}
  );
`;

export const LoginContent = styled.div`
  padding: ${({ theme }) => theme.spacing[8]};

  @media (max-width: 520px) {
    padding: ${({ theme }) => theme.spacing[5]};
  }

  @media (max-width: 360px) {
    padding: ${({ theme }) => theme.spacing[4]};
  }
`;

export const MobileBrand = styled.div`
  display: none;

  @media (max-width: 960px) {
    display: block;
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }
`;

export const MobileTitle = styled.h1`
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: clamp(
    ${({ theme }) => theme.typography.sizes.xl},
    7vw,
    ${({ theme }) => theme.typography.sizes["2xl"]}
  );
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
`;

export const MobileSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

export const LoginHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

export const LoginTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: clamp(
    ${({ theme }) => theme.typography.sizes.xl},
    7vw,
    ${({ theme }) => theme.typography.sizes["2xl"]}
  );
  font-weight: ${({ theme }) => theme.typography.weights.bold};
  line-height: ${({ theme }) => theme.typography.lineHeights.tight};
`;

export const LoginSubtitle = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
`;

export const Label = styled.label`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
`;

export const Input = styled.input`
  width: 100%;
  height: 48px;
  box-sizing: border-box;
  padding: 0 ${({ theme }) => theme.spacing[4]};

  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-family: ${({ theme }) => theme.typography.fontFamily};

  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.14);
    background: ${({ theme }) => theme.colors.surface};
  }
`;

export const ErrorMessage = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.sizes.sm};
  font-weight: ${({ theme }) => theme.typography.weights.medium};
`;

export const SubmitButton = styled.button`
  width: 100%;
  height: 50px;
  min-height: 50px;
  margin-top: ${({ theme }) => theme.spacing[2]};

  border: none;
  border-radius: ${({ theme }) => theme.radius.md};

  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.accent},
    ${({ theme }) => theme.colors.accentDark}
  );
  color: ${({ theme }) => theme.colors.surface};

  font-size: ${({ theme }) => theme.typography.sizes.md};
  font-weight: ${({ theme }) => theme.typography.weights.semibold};
  font-family: ${({ theme }) => theme.typography.fontFamily};

  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadow.sm};
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadow.md};
    filter: brightness(1.02);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.75;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 3px;
  }
`;

export const LoginFooter = styled.div`
  margin-top: ${({ theme }) => theme.spacing[5]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.typography.sizes.xs};
  line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
  text-align: center;
`;
