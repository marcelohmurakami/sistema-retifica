import { onlyDigits } from '../../../components_shared/forms/masks'
import type {
  Cliente,
  ClienteFormValues,
  ClienteWriteInput,
  ConsentKey,
  ConsentValues,
  Consentimento,
} from '../types/clientes.types'

export const CONSENT_DEFINITIONS: Record<
  ConsentKey,
  { canal: string; finalidade: string; label: string; description: string }
> = {
  whatsapp_lembrete: {
    canal: 'whatsapp',
    finalidade: 'lembrete',
    label: 'Lembretes por WhatsApp',
    description: 'Confirmações e lembretes de horários.',
  },
  whatsapp_marketing: {
    canal: 'whatsapp',
    finalidade: 'marketing',
    label: 'Ofertas por WhatsApp',
    description: 'Novidades, promoções e campanhas.',
  },
  email_lembrete: {
    canal: 'email',
    finalidade: 'lembrete',
    label: 'Lembretes por e-mail',
    description: 'Confirmações e informações de atendimento.',
  },
  email_marketing: {
    canal: 'email',
    finalidade: 'marketing',
    label: 'Ofertas por e-mail',
    description: 'Novidades e comunicações promocionais.',
  },
  sms_lembrete: {
    canal: 'sms',
    finalidade: 'lembrete',
    label: 'Lembretes por SMS',
    description: 'Avisos curtos sobre horários marcados.',
  },
}

export function getEmptyConsentValues(): ConsentValues {
  return {
    whatsapp_lembrete: false,
    whatsapp_marketing: false,
    email_lembrete: false,
    email_marketing: false,
    sms_lembrete: false,
  }
}

export function getEmptyClienteFormValues(): ClienteFormValues {
  return {
    nome: '',
    cpf: '',
    telefonePrincipal: '',
    telefoneSecundario: '',
    email: '',
    dataNascimento: '',
    genero: '',
    endereco: '',
    canalPreferido: '',
    observacoes: '',
    ativo: true,
    bloquearComunicacao: false,
    consentimentos: getEmptyConsentValues(),
  }
}

export function consentsToValues(consents: Consentimento[]): ConsentValues {
  const values = getEmptyConsentValues()
  for (const consent of consents) {
    const entry = Object.entries(CONSENT_DEFINITIONS).find(
      ([, definition]) =>
        definition.canal === consent.canal &&
        definition.finalidade === consent.finalidade,
    )
    if (entry) values[entry[0] as ConsentKey] = consent.consentiu
  }
  return values
}

export function clientToFormValues(
  client: Cliente,
  consents: Consentimento[],
): ClienteFormValues {
  return {
    nome: client.nome,
    cpf: client.cpf ?? '',
    telefonePrincipal: client.telefone_principal ?? '',
    telefoneSecundario: client.telefone_secundario ?? '',
    email: client.email ?? '',
    dataNascimento: client.data_nascimento ?? '',
    genero: client.genero ?? '',
    endereco: client.endereco ?? '',
    canalPreferido: client.canal_preferido ?? '',
    observacoes: client.observacoes ?? '',
    ativo: client.ativo,
    bloquearComunicacao: Boolean(client.bloqueado_comunicacao_em),
    consentimentos: consentsToValues(consents),
  }
}

export function toBrazilianE164(phone: string) {
  const digits = onlyDigits(phone)
  if (!digits) return null
  return digits.length === 10 || digits.length === 11 ? `+55${digits}` : null
}

function optionalText(value: string) {
  return value.trim() || null
}

export function clientFormToInput(values: ClienteFormValues): ClienteWriteInput {
  return {
    cliente: {
      nome: values.nome.trim(),
      cpf: optionalText(onlyDigits(values.cpf)),
      telefone_principal: optionalText(values.telefonePrincipal),
      telefone_secundario: optionalText(values.telefoneSecundario),
      telefone_e164: toBrazilianE164(values.telefonePrincipal),
      email: optionalText(values.email.toLowerCase()),
      data_nascimento: optionalText(values.dataNascimento),
      genero: optionalText(values.genero),
      endereco: optionalText(values.endereco),
      canal_preferido: optionalText(values.canalPreferido),
      observacoes: optionalText(values.observacoes),
      ativo: values.ativo,
      bloqueado_comunicacao_em: values.bloquearComunicacao
        ? new Date().toISOString()
        : null,
    },
    consentimentos: values.bloquearComunicacao
      ? getEmptyConsentValues()
      : values.consentimentos,
  }
}

export function sanitizeClientSearch(value: string) {
  return value.trim().replace(/[,%()]/g, ' ').replace(/\s+/g, ' ')
}

export function canManageClients(role: string | null | undefined) {
  return role === 'dono' || role === 'gerente' || role === 'recepcionista'
}

export function formatClientContact(client: Cliente) {
  return client.telefone_principal || client.email || 'Sem contato informado'
}
