import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { DeleteButton, EditButton, IconBtnStyled } from "./IconBtnStyled";
import type { ClienteType } from "../../models/cliente";
import type { OsType } from "../../models/os";

type IconBtnProps = {
  cliente: any;
  handleDelete: (id: number) => void;
  handleUpdate: (item: ClienteType | OsType) => void;
}

export function IconBtn ({ cliente, handleDelete, handleUpdate }: IconBtnProps) {
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
                handleDelete(cliente.id);
            }}>
                <FiTrash2 />
            </DeleteButton>
        </IconBtnStyled>
    )
}