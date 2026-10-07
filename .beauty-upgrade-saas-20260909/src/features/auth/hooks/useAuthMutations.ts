import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  requestPasswordReset,
  signInWithPassword,
  signOutCurrentSession,
  updatePassword,
} from '../api/auth.api'
import { authKeys } from '../auth.keys'

export function useLogin() {
  return useMutation({
    mutationKey: [...authKeys.all, 'login'],
    mutationFn: signInWithPassword,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...authKeys.all, 'logout'],
    mutationFn: signOutCurrentSession,
    onSuccess: () => queryClient.clear(),
  })
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationKey: [...authKeys.all, 'recuperar-senha'],
    mutationFn: requestPasswordReset,
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationKey: [...authKeys.all, 'alterar-senha'],
    mutationFn: updatePassword,
  })
}
