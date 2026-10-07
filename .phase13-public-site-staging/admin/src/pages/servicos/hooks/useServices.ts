import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '../../../components_shared/feedback/error.utils'
import {
  createService,
  getServicesMetrics,
  listServices,
  toggleServiceStatus,
  updateService,
} from '../api/servicos.api'
import type {
  ServicoWritePayload,
  ServicosListParams,
  ToggleServicoStatusVariables,
  UpdateServicoVariables,
} from '../types/servicos.types'
import { serviceKeys } from './servicos.keys'

export function useServices(params: ServicosListParams) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => listServices(params),
    enabled: params.companyId > 0,
    placeholderData: keepPreviousData,
  })
}

export function useServicesMetrics(companyId: number) {
  return useQuery({
    queryKey: serviceKeys.metrics(companyId),
    queryFn: () => getServicesMetrics(companyId),
    enabled: companyId > 0,
  })
}

function useInvalidateServices(companyId: number) {
  const queryClient = useQueryClient()

  return () =>
    queryClient.invalidateQueries({ queryKey: serviceKeys.all(companyId) })
}

function showMutationError(error: unknown) {
  toast.error(getErrorMessage(error, 'Não foi possível salvar o serviço.'))
}

export function useCreateService(companyId: number) {
  const invalidateServices = useInvalidateServices(companyId)

  return useMutation({
    mutationFn: (input: ServicoWritePayload) =>
      createService(companyId, input),
    onSuccess: async () => {
      await invalidateServices()
      toast.success('Serviço cadastrado com sucesso.')
    },
    onError: showMutationError,
  })
}

export function useUpdateService(companyId: number) {
  const invalidateServices = useInvalidateServices(companyId)

  return useMutation({
    mutationFn: ({ serviceId, input }: UpdateServicoVariables) =>
      updateService(companyId, serviceId, input),
    onSuccess: async () => {
      await invalidateServices()
      toast.success('Serviço atualizado com sucesso.')
    },
    onError: showMutationError,
  })
}

export function useToggleServiceStatus(companyId: number) {
  const invalidateServices = useInvalidateServices(companyId)

  return useMutation({
    mutationFn: ({ serviceId, active }: ToggleServicoStatusVariables) =>
      toggleServiceStatus(companyId, serviceId, active),
    onSuccess: async (service) => {
      await invalidateServices()
      toast.success(
        service.ativo
          ? 'Serviço ativado com sucesso.'
          : 'Serviço desativado com sucesso.',
      )
    },
    onError: showMutationError,
  })
}
