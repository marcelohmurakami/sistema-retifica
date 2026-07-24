import { useQuery } from "@tanstack/react-query";
import { getAllClientesCount } from "./clientesApi";
import { useAuth } from "../../contexts/AuthContext";

export function useGetAllClientes() {
    const { user } = useAuth();

    const { data: count = 0, isLoading } = useQuery<number>({
        queryKey: ["clientes", "lista", user?.id],
        enabled: !!user?.id,
        queryFn: getAllClientesCount,
    });
    return { isLoading, count };
}
