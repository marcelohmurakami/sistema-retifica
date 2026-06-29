import { useQuery } from "@tanstack/react-query";
import { getEmpresaAtual } from "./empresasApi";
import { useAuth } from "../../contexts/AuthContext";

export function useEmpresaAtual() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["empresa-atual", user?.id],
    enabled: !!user?.id,
    queryFn: getEmpresaAtual,
  });
}