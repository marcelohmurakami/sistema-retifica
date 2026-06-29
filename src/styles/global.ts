import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    * {
        margin:0;
        padding: 0;
        box-sizing: border-box;
    }

    html {
        font-size: 62.5%;
    }

    body {
        margin: 0;
        background: ${({ theme }) => theme.colors.background};
        color: ${({ theme }) => theme.colors.textPrimary};
        font-family: ${({ theme }) => theme.typography.fontFamily};
        font-size: ${({ theme }) => theme.typography.sizes.sm};
        line-height: ${({ theme }) => theme.typography.lineHeights.relaxed};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    a {
        color: inherit;
        text-decoration: none;
    }

    button, input, textarea, select {
        font: inherit;
    }

    /* foco bonito e consistente */
    :focus-visible {
        outline: 3px solid ${({ theme }) => theme.colors.accent};
        outline-offset: 2px;
        border-radius: 10px;
    }

    /* scrollbar (opcional, mas dá vibe de produto) */
    ::-webkit-scrollbar {
        width: 10px;
    }
    ::-webkit-scrollbar-thumb {
        background: rgba(51, 65, 85, 0.25);
        border-radius: 999px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }

    @page {
        size: A4;
        margin: 10mm;
    }
`
