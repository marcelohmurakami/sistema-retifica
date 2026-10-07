-- Teste transacional da protecao mais critica da agenda.
-- A tentativa de duplicacao ocorre em uma subtransacao e e desfeita ao receber
-- exclusion_violation; nenhum atendimento de teste permanece no banco.

do $$
declare
  v_item public.agendamentos_servicos%rowtype;
  v_bloqueado boolean := false;
begin
  select item.* into v_item
  from public.agendamentos_servicos item
  where item.status not in ('cancelado', 'concluido')
  order by item.id
  limit 1;

  if not found then
    raise exception 'Nao ha atendimento ativo para executar o teste de sobreposicao.';
  end if;

  begin
    insert into public.agendamentos_servicos (
      id_empresa, id_agendamento, id_servico, id_funcionario,
      inicio, fim, duracao_minutos, preco, ordem, status, observacoes
    ) values (
      v_item.id_empresa, v_item.id_agendamento, v_item.id_servico,
      v_item.id_funcionario, v_item.inicio, v_item.fim,
      v_item.duracao_minutos, v_item.preco, v_item.ordem + 100000,
      'reservado', '[TESTE TRANSACIONAL] Esta linha deve ser rejeitada.'
    );
  exception
    when exclusion_violation then
      v_bloqueado := true;
  end;

  if not v_bloqueado then
    raise exception 'Falha critica: o banco aceitou dois atendimentos simultaneos para o mesmo profissional.';
  end if;
end;
$$;
