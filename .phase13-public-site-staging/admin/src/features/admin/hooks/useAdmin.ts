import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '../../../components_shared'
import { accessKeys } from '../../access/access.keys'
import { authKeys } from '../../auth/auth.keys'
import {
  cancelInvite,
  createInvite,
  getAdministration,
  getCompanyAppearance,
  listAudit,
  removeIntegration,
  saveCompanySettings,
  saveIntegration,
  savePublicSite,
  moderatePublicReview,
  saveUserPermissions,
  updateCompany,
  updateUserAccess,
} from '../api/admin.api'
import { adminKeys, COMPANY_APPEARANCE_UPDATED_EVENT } from '../admin.keys'
import type {
  AuditFilters,
  CompanyInput,
  CompanySettingsInput,
  IntegrationInput,
  InviteInput,
  PublicSiteInput,
  ReviewModerationInput,
  UserAccessInput,
  UserPermissionsInput,
} from '../types/admin.types'

const showError = (error: unknown) => toast.error(getErrorMessage(error))

function useInvalidateAdministration(companyId: number) {
  const client = useQueryClient()
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: adminKeys.all(companyId) }),
      client.invalidateQueries({ queryKey: accessKeys.company(companyId) }),
    ])
  }
}

export function useAdministration(companyId: number, planId: number | null) {
  return useQuery({
    queryKey: adminKeys.overview(companyId, planId),
    queryFn: () => getAdministration(companyId, planId),
    enabled: companyId > 0,
    staleTime: 60_000,
  })
}

export function useCompanyAppearance(companyId: number) {
  return useQuery({
    queryKey: adminKeys.appearance(companyId),
    queryFn: () => getCompanyAppearance(companyId),
    enabled: companyId > 0,
    staleTime: 5 * 60_000,
  })
}

export function useAudit(filters: AuditFilters) {
  return useQuery({
    queryKey: adminKeys.audit(filters),
    queryFn: () => listAudit(filters),
    enabled: filters.companyId > 0,
    placeholderData: (previous) => previous,
  })
}

export function useUpdateCompany(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CompanyInput) => updateCompany(input),
    onSuccess: async () => {
      await invalidate()
      await client.invalidateQueries({ queryKey: authKeys.all })
      toast.success('Dados da empresa atualizados.')
    },
    onError: showError,
  })
}

export function useSaveCompanySettings(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CompanySettingsInput) => saveCompanySettings(input),
    onSuccess: async (settings) => {
      client.setQueryData(adminKeys.appearance(companyId), settings)
      localStorage.removeItem('app-theme')
      window.dispatchEvent(new Event(COMPANY_APPEARANCE_UPDATED_EVENT))
      await invalidate()
      toast.success('Preferências salvas e aplicadas.')
    },
    onError: showError,
  })
}

export function useSavePublicSite(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  return useMutation({
    mutationFn: (input: PublicSiteInput) => savePublicSite(input),
    onSuccess: async () => { await invalidate(); toast.success('Site público atualizado.') },
    onError: showError,
  })
}

export function useModeratePublicReview(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  return useMutation({
    mutationFn: (input: ReviewModerationInput) => moderatePublicReview(input),
    onSuccess: async () => { await invalidate(); toast.success('Avaliação moderada.') },
    onError: showError,
  })
}

export function useCreateInvite(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  return useMutation({
    mutationFn: (input: InviteInput) => createInvite(input),
    onSuccess: async () => {
      await invalidate()
      toast.success('Convite registrado com segurança.')
    },
    onError: showError,
  })
}

export function useCancelInvite(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  return useMutation({
    mutationFn: (inviteId: number) => cancelInvite(companyId, inviteId),
    onSuccess: async () => {
      await invalidate()
      toast.success('Convite cancelado.')
    },
    onError: showError,
  })
}

export function useUpdateUserAccess(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  return useMutation({
    mutationFn: (input: UserAccessInput) => updateUserAccess(input),
    onSuccess: async () => {
      await invalidate()
      toast.success('Acesso do usuário atualizado.')
    },
    onError: showError,
  })
}

export function useSaveUserPermissions(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  return useMutation({
    mutationFn: (input: UserPermissionsInput) => saveUserPermissions(input),
    onSuccess: async () => {
      await invalidate()
      toast.success('Permissões personalizadas salvas.')
    },
    onError: showError,
  })
}

export function useSaveIntegration(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  return useMutation({
    mutationFn: (input: IntegrationInput) => saveIntegration(input),
    onSuccess: async () => {
      await invalidate()
      toast.success('Configuração da integração salva.')
    },
    onError: showError,
  })
}

export function useRemoveIntegration(companyId: number) {
  const invalidate = useInvalidateAdministration(companyId)
  return useMutation({
    mutationFn: (integrationId: number) => removeIntegration(companyId, integrationId),
    onSuccess: async () => {
      await invalidate()
      toast.success('Integração removida.')
    },
    onError: showError,
  })
}
