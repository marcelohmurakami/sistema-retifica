-- Teste de regressão sem persistir dados nem disponibilizar mensagens ao n8n.
begin;
set local role postgres;
set local search_path=extensions,public,pg_catalog;

do $$
declare
  v_func text;
  v_blocked boolean:=false;
  v_constraint text;
begin
  if exists(select 1 from public.regras_automacao_marketing
    where tipo='avaliacao_pos_atendimento' and ativo) then
    raise exception 'TESTE: regra de avaliacao legada permaneceu ativa.';
  end if;

  v_func:=pg_get_functiondef('public.n8n_processar_automacoes_marketing(integer)'::regprocedure);
  if position('q.hoje+q.dias_apos' in v_func)=0
    or position('link_agendamento' in v_func)=0
    or position('''{empresa}''' in v_func)=0 then
    raise exception 'TESTE: antecedencia ou variaveis de automacao ausentes.';
  end if;
  v_func:=pg_get_functiondef('public.n8n_criar_solicitacao_avaliacao(bigint,bigint)'::regprocedure);
  if position('Configure a URL HTTPS' in v_func)=0 then
    raise exception 'TESTE: bloqueio de avaliacao sem site HTTPS ausente.';
  end if;
  if not exists(select 1 from pg_constraint c
    where c.conrelid='public.execucoes_automacao_marketing'::regclass
      and c.contype='u'
      and pg_get_constraintdef(c.oid) ilike '%id_regra, id_cliente, data_referencia%') then
    raise exception 'TESTE: deduplicacao anual por regra/cliente/data ausente.';
  end if;

  -- A antecedência deve funcionar inclusive quando aniversário e envio
  -- ficam em anos diferentes e quando o dia local muda de fuso.
  if date '2026-12-28'+5<>date '2027-01-02'
    or date '2027-01-01'-1<>date '2026-12-31'
    or ('2026-12-31 01:00+00'::timestamptz at time zone 'America/Sao_Paulo')::date
      <>date '2026-12-30' then
    raise exception 'TESTE: calculo de antecedencia/fuso incorreto.';
  end if;

  begin
    update public.configuracoes_automacao_whatsapp
      set ativo=true, modo='sandbox', telefone_teste='5516991731306',
        site_base_url=null, avaliacoes_ativas=true
    where id_empresa=10;
  exception when check_violation then
    get stacked diagnostics v_constraint=constraint_name;
    if v_constraint='configuracoes_whatsapp_avaliacao_url_check' then
      v_blocked:=true;
    else
      raise;
    end if;
  end;
  if not v_blocked then
    raise exception 'TESTE: avaliacoes puderam ser ativadas sem site HTTPS.';
  end if;
end;
$$;

create temporary table review_test_manager(user_id uuid,company_id bigint) on commit drop;
insert into review_test_manager
select ue.user_id,ue.empresa_id from public.usuarios_empresas ue
where ue.status='ativo' and ue.tipo in ('dono','gerente')
order by (ue.tipo='dono') desc,ue.id limit 1;
grant select on review_test_manager to authenticated;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object(
  'sub',(select user_id from review_test_manager limit 1),'role','authenticated'
)::text,true);
select set_config('request.jwt.claim.sub',
  (select user_id::text from review_test_manager limit 1),true);

do $$
declare v_company bigint:=(select company_id from review_test_manager limit 1);
  v_blocked boolean:=false;
begin
  if v_company is null then raise exception 'TESTE: gestor de teste ausente.'; end if;
  begin
    perform public.salvar_regra_automacao_marketing(
      v_company,null,'Avaliação enganosa','avaliacao_pos_atendimento',null,
      0,'10:00','Mensagem de teste','{}'::jsonb,false
    );
  exception when others then
    if position('Avaliacoes sao controladas' in sqlerrm)>0 then
      v_blocked:=true;
    else
      raise;
    end if;
  end;
  if not v_blocked then
    raise exception 'TESTE: RPC aceitou regra generica de avaliacao.';
  end if;
end;
$$;

reset role;
rollback;
