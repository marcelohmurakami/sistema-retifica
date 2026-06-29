import styled from "styled-components";

export const Grid = styled.section`
  min-height: 100dvh;
  width: 100%;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  grid-template-rows: 70px minmax(0, 1fr);
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  background: ${({ theme }) => theme.colors.background};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main";
  }
`;

export const Main = styled.main`
  grid-area: main;
  min-width: 0;
  overflow: auto;
  background: ${({ theme }) => theme.colors.background};
`;

export const Overlay = styled.div`
  display: none;

  @media (max-width: 900px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 180;
    background: rgba(15, 23, 42, 0.38);
    backdrop-filter: blur(2px);
  }
`;