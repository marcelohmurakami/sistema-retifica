import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '../../../components_shared/feedback/error.utils'
import { createClient, getClientConsents, getClientsMetrics, listClients, toggleClientStatus, updateClient } from '../api/clientes.api'
import type { ClienteWriteInput, ClientesListParams, ToggleClienteStatusVariables, UpdateClienteVariables } from '../types/clientes.types'
import { clientKeys } from './clientes.keys'

export function useClients(params: ClientesListParams) {
  return useQuery({ queryKey: clientKeys.list(params), queryFn: () => listClients(params), enabled: params.companyId > 0, placeholderData: keepPreviousData })
}

export function useClientsMetrics(companyId: number) {
  return useQuery({ queryKey: clientKeys.metrics(companyId), queryFn: () => getClientsMetrics(companyId), enabled: companyId > 0 })
}

export function useClientConsents(companyId: number, clientId: number) {
  return useQuery({ queryKey: clientKeys.consents(companyId, clientId), queryFn: () => getClientConsents(companyId, clientId), enabled: companyId > 0 && clientId > 0 })
}

function useInvalidateClients(companyId: number) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: clientKeys.all(companyId) })
}

function showError(error: unknown) {
  toast.error(getErrorMessage(error, 'Não foi possível salvar o cliente.'))
}

export function useCreateClient(companyId: number) {
  const invalidate = useInvalidateClients(companyId)
  return useMutation({ mutationFn: (input: ClienteWriteInput) => createClient(companyId, input), onSuccess: async () => { await invalidate(); toast.success('Cliente cadastrado com sucesso.') }, onError: showError })
}

export function useUpdateClient(companyId: number) {
  const invalidate = useInvalidateClients(companyId)
  return useMutation({ mutationFn: ({ clientId, input }: UpdateClienteVariables) => updateClient(companyId, clientId, input), onSuccess: async () => { await invalidate(); toast.success('Cliente atualizado com sucesso.') }, onError: showError })
}

export function useToggleClientStatus(companyId: number) {
  const invalidate = useInvalidateClients(companyId)
  return useMutation({ mutationFn: ({ clientId, active }: ToggleClienteStatusVariables) => toggleClientStatus(companyId, clientId, active), onSuccess: async (client) => { await invalidate(); toast.success(client.ativo ? 'Cliente reativado.' : 'Cliente arquivado.') }, onError: showError })
}
