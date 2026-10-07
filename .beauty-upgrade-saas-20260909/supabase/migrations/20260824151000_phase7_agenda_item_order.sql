-- Itens removidos de um agendamento ficam cancelados para preservar auditoria.
-- A ordem precisa ser única apenas entre itens que ainda fazem parte do atendimento.
alter table public.agendamentos_servicos
  drop constraint if exists agendamentos_servicos_ordem_unique;

create unique index if not exists agendamentos_servicos_ordem_ativa_unique
  on public.agendamentos_servicos (id_empresa, id_agendamento, ordem)
  where status <> 'cancelado';
