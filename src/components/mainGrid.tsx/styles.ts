import styled from "styled-components";

export const Grid = styled.section`
  min-height: 100dvh;
  width: 100%;
  display: grid;
  grid-template-columns: ${({ theme }) => theme.layout.sidebarWidth} minmax(0, 1fr);
  grid-template-rows: ${({ theme }) => theme.layout.headerHeight} minmax(0, 1fr);
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
  scrollbar-gutter: stable;
  background:
    radial-gradient(circle at 92% 0%, rgba(242, 106, 46, 0.055), transparent 28rem),
    ${({ theme }) => theme.colors.background};
`;

export const Overlay = styled.div`
  display: none;

  @media (max-width: 900px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 180;
    background: rgba(7, 10, 14, 0.58);
    backdrop-filter: blur(5px);
    animation: overlay-in 0.18s ease-out;

    @keyframes overlay-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  }
`;
