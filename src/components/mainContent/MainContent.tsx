import { MainContentStyled } from "./MainContentStyled";

type ChildrenProps = {
    children: React.ReactNode,
}

export function MainContent ({ children }: ChildrenProps) {
    return (
        <MainContentStyled>
            {children}
        </MainContentStyled>
    )
}