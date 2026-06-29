import { useQuery } from "@tanstack/react-query";
import { getAllClientes } from "./clientesApi";
import { useAuth } from "../../contexts/AuthContext";

export function useGetAllClientes() {
    const { user } = useAuth();

    const { data, isLoading } = useQuery<any>({
        queryKey: ["clientes", "lista", user?.id],
        enabled: !!user?.id,
        queryFn: getAllClientes,
    });
    return { data, isLoading, count: data?.length || 0 };
}