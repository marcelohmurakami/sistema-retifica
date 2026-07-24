import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { DeleteButton, EditButton, IconBtnStyled } from "./IconBtnStyled";
type IconBtnProps<T extends { id?: number }> = {
  cliente: T;
  handleDelete: (id: number) => void;
  handleUpdate: (item: T) => void;
}

export function IconBtn<T extends { id?: number }>({ cliente, handleDelete, handleUpdate }: IconBtnProps<T>) {
    return (
        <IconBtnStyled>
            <EditButton onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUpdate(cliente);
            }} >
            <FiEdit2 />
            </EditButton>
            <DeleteButton onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (cliente.id !== undefined) handleDelete(cliente.id);
            }}>
                <FiTrash2 />
            </DeleteButton>
        </IconBtnStyled>
    )
}
