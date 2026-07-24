import { useQuery } from "@tanstack/react-query";
import { GetAllOs } from "./osApi";
import { useAuth } from "../../contexts/AuthContext";
import type { OsType } from "../../models/os";

export function useGetAllOs() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<{ data: OsType[]; count: number }>({
    queryKey: ["os", "lista", user?.id],
    enabled: !!user?.id,
    queryFn: GetAllOs,
  });

  return {
    data: data?.data ?? [],
    isLoading,
    error,
    count: data?.count ?? 0,
  };
}
