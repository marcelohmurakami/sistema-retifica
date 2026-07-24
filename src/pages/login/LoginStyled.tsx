import styled from "styled-components";

export const LoginPage = styled.main`
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(430px, 0.92fr);
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const BrandSection = styled.section`
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: clamp(2rem, 6vw, 5.5rem);
  background:
    linear-gradient(118deg, rgba(242, 106, 46, 0.19), transparent 42%),
    linear-gradient(145deg, #181d25 0%, #090c11 100%);

  &::before {
    content: "";
    position: absolute;
    width: 30rem;
    height: 30rem;
    right: -15rem;
    bottom: -14rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    box-shadow:
      0 0 0 4rem rgba(255, 255, 255, 0.018),
      0 0 0 8rem rgba(255, 255, 255, 0.012);
  }

  @media (max-width: 980px) {
    display: none;
  }
`;

export const BrandOverlay = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.2;
  background-image: radial-gradient(circle, rgba(255, 255, 255, 0.72) 1px, transparent 1px);
  background-size: 23px 23px;
  mask-image: linear-gradient(125deg, #000, transparent 48%);
`;

export const BrandContent = styled.div`
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 650px;
  color: #fff;
`;

export const LogoStyled = styled.img`
  display: block;
  width: clamp(220px, 28vw, 330px);
  height: auto;
  margin: -3.5rem 0 -2.2rem -3rem;
  object-fit: contain;
  filter: invert(1) grayscale(1) brightness(2);
  opacity: 0.96;
`;

export const BrandBadge = styled.div`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${({ theme }) => theme.radius.pill};
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.05em;
  backdrop-filter: blur(10px);

  &::before {
    content: "";
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 5px rgba(242, 106, 46, 0.14);
  }
`;

export const BrandTitle = styled.h1`
  max-width: 640px;
  margin-bottom: 1.2rem;
  color: #fff;
  font-size: clamp(2.45rem, 5vw, 4.65rem);
  font-weight: 760;
  letter-spacing: -0.06em;
  line-height: 0.98;
`;

export const BrandHighlight = styled.span`
  color: ${({ theme }) => theme.colors.accent};
`;

export const BrandDescription = styled.p`
  max-width: 530px;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.62);
  font-size: clamp(0.9rem, 1.25vw, 1.02rem);
  line-height: 1.65;
`;

export const BrandFeatures = styled.div`
  max-width: 610px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
`;

export const FeatureCard = styled.article`
  min-width: 0;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(12px);
`;

export const FeatureTitle = styled.h3`
  margin-bottom: 0.35rem;
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.82rem;
  font-weight: 680;
`;

export const FeatureText = styled.p`
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.72rem;
  line-height: 1.5;
`;

export const FormSection = styled.section`
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1.25rem, 5vw, 4rem);
  background:
    radial-gradient(circle at 100% 0%, rgba(242, 106, 46, 0.08), transparent 22rem),
    ${({ theme }) => theme.colors.background};

  @media (max-width: 980px) {
    min-height: 100vh;
    min-height: 100dvh;
  }

  @media (max-width: 520px) {
    align-items: stretch;
    padding: 0;
  }
`;

export const LoginCard = styled.div`
  width: 100%;
  max-width: 460px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 26px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadow.lg};

  @media (max-width: 520px) {
    max-width: none;
    min-height: 100dvh;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
`;

export const LoginTopBar = styled.div`
  height: 5px;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.accent},
    ${({ theme }) => theme.colors.accentDark} 52%,
    #2a303a 52%
  );
`;

export const LoginContent = styled.div`
  padding: clamp(1.5rem, 4vw, 2.65rem);

  @media (max-width: 520px) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: calc(100dvh - 5px);
  }
`;

export const MobileBrand = styled.div`
  display: none;

  @media (max-width: 980px) {
    display: block;
    margin-bottom: 2.25rem;
  }
`;

export const MobileTitle = styled.h1`
  margin-bottom: 0.35rem;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: 1.35rem;
  font-weight: 760;
  letter-spacing: -0.04em;
`;

export const MobileSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.78rem;
  line-height: 1.55;
`;

export const LoginHeader = styled.div`
  margin-bottom: 1.65rem;
`;

export const LoginTitle = styled.h2`
  margin-bottom: 0.4rem;
  color: ${({ theme }) => theme.colors.primaryDark};
  font-size: clamp(1.65rem, 5vw, 2.1rem);
  font-weight: 760;
  letter-spacing: -0.045em;
  line-height: 1.1;
`;

export const LoginSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 0.8rem;
  line-height: 1.55;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.42rem;
`;

export const Label = styled.label`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.76rem;
  font-weight: 650;
`;

export const Input = styled.input`
  width: 100%;
  height: 50px;
  padding: 0 0.95rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 13px;
  outline: 0;
  background: ${({ theme }) => theme.colors.surfaceElevated};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 0.86rem;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:hover {
    border-color: color-mix(in srgb, ${({ theme }) => theme.colors.textSecondary} 45%, ${({ theme }) => theme.colors.border});
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 0 0 4px color-mix(in srgb, ${({ theme }) => theme.colors.accent} 13%, transparent);
  }
`;

export const ErrorMessage = styled.p`
  padding: 0.7rem 0.8rem;
  border: 1px solid color-mix(in srgb, ${({ theme }) => theme.colors.error} 20%, transparent);
  border-radius: 11px;
  background: color-mix(in srgb, ${({ theme }) => theme.colors.error} 7%, transparent);
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.75rem;
  font-weight: 580;
`;

export const SubmitButton = styled.button`
  width: 100%;
  min-height: 50px;
  margin-top: 0.3rem;
  border: 0;
  border-radius: 13px;
  background:
    linear-gradient(135deg, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.accentDark});
  color: #fff;
  font-size: 0.86rem;
  font-weight: 700;
  box-shadow: 0 12px 26px rgba(217, 76, 19, 0.24);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 16px 32px rgba(217, 76, 19, 0.3);
    filter: saturate(1.08);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.65;
  }
`;

export const LoginFooter = styled.div`
  margin-top: 1.4rem;
  padding-top: 1.1rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;
  line-height: 1.5;
  text-align: center;
`;
