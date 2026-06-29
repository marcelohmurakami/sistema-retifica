import { FiPlus } from "react-icons/fi";
import { BtnFlex, CreateButton } from "./AddBtnStyled";

type AddBtnProps = {
    novo: string,
    setIsCreateOpen: React.Dispatch<React.SetStateAction<boolean>>,
    children?: React.ReactNode,
}

export function AddBtn ({ novo, setIsCreateOpen }: AddBtnProps) {
    return (
        <BtnFlex>
            <CreateButton onClick={() => setIsCreateOpen(true)}>
                <FiPlus />
                <p>{`${novo}`}</p>
            </CreateButton>
        </BtnFlex>
    )
}