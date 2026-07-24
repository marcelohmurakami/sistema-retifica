import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  * {
    margin: 0;
    padding: 0;
  }

  html {
    min-width: 320px;
    font-size: 100%;
    scroll-behavior: smooth;
    text-rendering: optimizeLegibility;
  }

  html,
  body,
  #root {
    min-height: 100%;
  }

  body {
    min-width: 320px;
    min-height: 100vh;
    min-height: 100dvh;
    overflow-x: hidden;
    background:
      radial-gradient(circle at 78% -10%, rgba(242, 106, 46, 0.075), transparent 27rem),
      ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-family: ${({ theme }) => theme.typography.fontFamily};
    font-size: ${({ theme }) => theme.typography.sizes.sm};
    line-height: ${({ theme }) => theme.typography.lineHeights.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  button,
  a,
  input,
  textarea,
  select {
    -webkit-tap-highlight-color: transparent;
  }

  button {
    color: inherit;
  }

  button:not(:disabled),
  [role="button"]:not([aria-disabled="true"]) {
    cursor: pointer;
  }

  button:disabled {
    cursor: not-allowed;
  }

  input,
  textarea,
  select {
    min-width: 0;
  }

  img,
  svg {
    max-width: 100%;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  h1,
  h2,
  h3,
  h4 {
    font-family: ${({ theme }) => theme.typography.displayFamily};
    letter-spacing: -0.025em;
  }

  ::selection {
    background: ${({ theme }) => theme.colors.accent};
    color: #fff;
  }

  :focus-visible {
    outline: 3px solid color-mix(in srgb, ${({ theme }) => theme.colors.accent} 55%, transparent);
    outline-offset: 3px;
  }

  ::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  ::-webkit-scrollbar-thumb {
    border: 3px solid transparent;
    border-radius: ${({ theme }) => theme.radius.pill};
    background: color-mix(in srgb, ${({ theme }) => theme.colors.textSecondary} 35%, transparent);
    background-clip: padding-box;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, ${({ theme }) => theme.colors.textSecondary} 55%, transparent);
    background-clip: padding-box;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }

    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  @page {
    size: A4;
    margin: 10mm;
  }
`;
