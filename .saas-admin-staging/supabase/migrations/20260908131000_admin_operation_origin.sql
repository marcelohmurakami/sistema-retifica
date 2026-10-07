-- Permite distinguir ações feitas pelo painel das demais ações da equipe.
alter table public.agendamentos
  drop constraint if exists agendamentos_confirmacao_origem_check;
alter table public.agendamentos
  add constraint agendamentos_confirmacao_origem_check
  check (confirmacao_origem is null or confirmacao_origem in (
    'link_cliente', 'area_cliente', 'pagamento_mercado_pago',
    'equipe', 'painel_administrativo', 'sistema'
  ));

alter table public.agendamentos
  drop constraint if exists agendamentos_cancelamento_origem_check;
alter table public.agendamentos
  add constraint agendamentos_cancelamento_origem_check
  check (cancelamento_origem is null or cancelamento_origem in (
    'link_cliente', 'area_cliente', 'equipe', 'painel_administrativo',
    'expiracao_pagamento', 'sistema'
  ));
