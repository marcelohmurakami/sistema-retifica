import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { getAuditoria } from "./auditoriaApi";

export function useGetAuditoria() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["auditoria", user?.id],
        queryFn: getAuditoria,
        enabled: !!user?.id,
    })
}