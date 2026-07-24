import styled from "styled-components";

export const MainContentStyled = styled.div `
    width: min(100%, ${({ theme }) => theme.layout.containerMax});
    min-height: calc(100dvh - ${({ theme }) => theme.layout.headerHeight});
    margin: 0 auto;
    padding: clamp(1rem, 2.8vw, 2.25rem);

    @media (max-width: 768px) {
        padding: 1rem;
    }
`
