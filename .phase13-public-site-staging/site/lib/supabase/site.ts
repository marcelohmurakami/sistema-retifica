import "server-only";

import { createClient } from "@supabase/supabase-js";

export type PublicService = { id: number; nome: string; descricao: string | null; preco: number | null; duracao_minutos: number; intervalo_minutos: number; exige_sinal: boolean; sinal_tipo: "percentual" | "valor_fixo" | null; sinal_valor: number | null };
export type PublicProfessional = { id: number; nome: string; cargo: string; cor_agenda: string | null; servicos: number[] };
export type PublicCatalog = { empresa: { id: number; nome: string; fuso_horario: string }; servicos: Array<PublicService & { preco: number }>; profissionais: PublicProfessional[] };

export type PublicSite = {
  site: {
    id: number; slug: string; dominio: string; nome_publico: string;
    titulo_hero: string | null; destaque_hero: string | null; descricao_hero: string | null;
    titulo_sobre: string | null; descricao_sobre: string | null;
    imagem_hero_url: string | null; imagem_compartilhamento_url: string | null;
    instagram_url: string | null; whatsapp: string | null; email_publico: string | null;
    texto_rodape: string | null; titulo_seo: string; descricao_seo: string | null;
    palavras_chave: string[]; diferenciais: string[];
    perguntas_frequentes: Array<{ pergunta: string; resposta: string }>;
    mostrar_precos: boolean; mostrar_profissionais: boolean; mostrar_avaliacoes: boolean;
    mostrar_endereco: boolean; mostrar_horarios: boolean; logo_url: string | null;
  };
  empresa: { id: number; nome: string; fuso_horario: string };
  unidade: { id: number; nome: string; telefone: string | null; email: string | null; endereco: string | null; numero: string | null; complemento: string | null; bairro: string | null; cidade: string | null; estado: string | null; cep: string | null; fuso_horario: string } | null;
  horarios: Array<{ dia_semana: number; hora_abertura: string; hora_fechamento: string; intervalo_inicio: string | null; intervalo_fim: string | null }>;
  servicos: PublicService[];
  profissionais: PublicProfessional[];
  avaliacoes: Array<{ id: number; nota: number; comentario: string; nome: string; created_at: string }>;
};

export type AvailabilitySlot = { id_funcionario: number; nome_funcionario: string; inicio: string; fim: string; horario: string; duracao_minutos: number; intervalo_minutos: number; preco: number };
export type PublicBooking = {
  token?: string; codigo: string; status: string; inicio: string; fim: string; sinal_status: string; sinal_valor: number | null;
  cliente: { nome: string; email: string | null; telefone: string | null };
  empresa: { id: number; nome: string; fuso_horario: string };
  servico: { id: number; nome: string; duracao_minutos: number; preco: number };
  profissional: { id: number; nome: string; cargo: string };
  lembretes: { whatsapp?: boolean; email?: boolean };
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("A conexão pública com o Supabase ainda não foi configurada.");
  return { url, key };
}

export function createSiteSupabase() {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function rpcError(message: string, error: { message?: string } | null) { return new Error(error?.message || message); }

export async function getPublicSite(input: { domain?: string | null; slug?: string | null }): Promise<PublicSite | null> {
  const { data, error } = await createSiteSupabase().rpc("resolver_site_publico", { p_dominio: input.domain ?? null, p_slug: input.slug ?? null });
  if (error) throw rpcError("Não foi possível carregar o site da empresa.", error);
  return data ? (data as PublicSite) : null;
}

export async function getPublicCatalog(companyId: number): Promise<PublicCatalog> {
  const { data, error } = await createSiteSupabase().rpc("obter_catalogo_site", { p_id_empresa: companyId });
  if (error) throw rpcError("Não foi possível carregar o catálogo.", error);
  if (!data) throw new Error("Empresa indisponível para agendamento online.");
  return data as PublicCatalog;
}

export async function getAvailability(companyId: number, input: { unitId: number; date: string; serviceId: number; professionalId?: number | null }): Promise<AvailabilitySlot[]> {
  const { data, error } = await createSiteSupabase().rpc("obter_disponibilidade_site", { p_id_empresa: companyId, p_id_unidade: input.unitId, p_data: input.date, p_id_servico: input.serviceId, p_id_funcionario: input.professionalId ?? null });
  if (error) throw rpcError("Não foi possível consultar os horários.", error);
  return (data ?? []) as AvailabilitySlot[];
}

export async function createPublicBooking(companyId: number, input: { unitId: number; name: string; phone: string; email: string; serviceId: number; professionalId: number; start: string; notes?: string; reminderWhatsapp: boolean; reminderEmail: boolean; idempotencyKey: string }): Promise<PublicBooking> {
  const { data, error } = await createSiteSupabase().rpc("criar_agendamento_site", {
    p_id_empresa: companyId, p_id_unidade: input.unitId, p_nome: input.name, p_telefone: input.phone, p_email: input.email,
    p_id_servico: input.serviceId, p_id_funcionario: input.professionalId, p_inicio: input.start,
    p_observacoes: input.notes || null, p_lembrete_whatsapp: input.reminderWhatsapp,
    p_lembrete_email: input.reminderEmail, p_chave_idempotencia: input.idempotencyKey,
  });
  if (error) throw rpcError("Não foi possível criar o agendamento.", error);
  return data as PublicBooking;
}

export async function getPublicBooking(token: string): Promise<PublicBooking> {
  const { data, error } = await createSiteSupabase().rpc("obter_agendamento_site", { p_token: token });
  if (error) throw rpcError("Não foi possível carregar o agendamento.", error);
  if (!data) throw new Error("Agendamento não encontrado neste dispositivo.");
  return data as PublicBooking;
}

export async function changePublicBooking(token: string, action: "confirmar" | "cancelar", reason?: string): Promise<PublicBooking> {
  const { data, error } = await createSiteSupabase().rpc("alterar_agendamento_site", { p_token: token, p_acao: action, p_motivo: reason || null });
  if (error) throw rpcError("Não foi possível alterar o agendamento.", error);
  return data as PublicBooking;
}

export async function reschedulePublicBooking(token: string, professionalId: number, start: string): Promise<PublicBooking> {
  const { data, error } = await createSiteSupabase().rpc("reagendar_agendamento_site", { p_token: token, p_id_funcionario: professionalId, p_inicio: start });
  if (error) throw rpcError("Não foi possível reagendar.", error);
  return data as PublicBooking;
}
