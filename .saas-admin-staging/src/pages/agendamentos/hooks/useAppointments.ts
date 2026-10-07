import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '../../../components_shared/feedback/error.utils'
import { getAgendaOptions, getDayAvailability, listAppointments, resendAppointmentConfirmation, saveAppointment, updateAppointmentStatus } from '../api/agendamentos.api'
import type { AgendaQueryParams, AppointmentWriteInput, ResendAppointmentConfirmationInput, UpdateAppointmentStatusInput } from '../types/agendamento.types'
import { STATUS_LABELS } from '../utils/agenda.utils'
import { appointmentKeys } from './agendamentos.keys'

export function useAppointments(params: AgendaQueryParams) { return useQuery({ queryKey: appointmentKeys.range(params), queryFn: () => listAppointments(params), enabled: params.companyId > 0, placeholderData: keepPreviousData }) }
export function useAgendaOptions(companyId: number) { return useQuery({ queryKey: appointmentKeys.options(companyId), queryFn: () => getAgendaOptions(companyId), enabled: companyId > 0, staleTime: 60_000 }) }
export function useDayAvailability(params: AgendaQueryParams, enabled = true) { return useQuery({ queryKey: appointmentKeys.availability(params), queryFn: () => getDayAvailability(params), enabled: enabled && params.companyId > 0, staleTime: 15_000 }) }
function useInvalidateAgenda(companyId: number) { const client = useQueryClient(); return () => client.invalidateQueries({ queryKey: appointmentKeys.all(companyId) }) }
const showError = (error: unknown) => toast.error(getErrorMessage(error, 'Não foi possível concluir a operação.'))

export function useSaveAppointment(companyId: number) {
  const invalidate = useInvalidateAgenda(companyId)
  return useMutation({ mutationFn: (input: AppointmentWriteInput) => saveAppointment(input), onSuccess: async (_data, input) => { await invalidate(); toast.success(input.appointmentId ? 'Agendamento atualizado com sucesso.' : 'Agendamento criado com sucesso.') }, onError: showError })
}

export function useUpdateAppointmentStatus(companyId: number) {
  const invalidate = useInvalidateAgenda(companyId)
  return useMutation({ mutationFn: ({ appointmentId, status, cancellationReason }: UpdateAppointmentStatusInput) => updateAppointmentStatus(companyId, appointmentId, status, cancellationReason), onSuccess: async (_data, input) => { await invalidate(); toast.success(`Agendamento: ${STATUS_LABELS[input.status].toLowerCase()}.`) }, onError: showError })
}

export function useResendAppointmentConfirmation(companyId: number) {
  const invalidate = useInvalidateAgenda(companyId)
  return useMutation({
    mutationFn: ({ appointmentId }: ResendAppointmentConfirmationInput) => resendAppointmentConfirmation(companyId, appointmentId),
    onSuccess: async () => { await invalidate(); toast.success('Confirmação reenviada para os canais habilitados.') },
    onError: showError,
  })
}
