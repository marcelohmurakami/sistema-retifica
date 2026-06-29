import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, updatePassword, updateUserProfile, uploadAvatar } from "../../services/userApi";
import { useAuth } from "../../contexts/AuthContext";

export function useGetCurrentUser() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["CurrentUser", user?.id],
    enabled: !!user?.id,
    queryFn: getCurrentUser,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["CurrentUser"],
      });
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: updatePassword,
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["CurrentUser"],
      });
    },
  });
}