import { useQuery } from "@tanstack/react-query";
import { GetAllOs } from "./osApi";
import { useAuth } from "../../contexts/AuthContext";

export function useGetAllOs() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<any>({
    queryKey: ["os", "lista", user?.id],
    enabled: !!user?.id,
    queryFn: GetAllOs,
  });

  return {
    data,
    isLoading,
    error,
    count: data?.length || 0,
  };
}