


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios, 'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para abrir o caixa.';
  end if;
  if coalesce(p_saldo_inicial, -1) < 0 then
    raise exception 'O saldo inicial não pode ser negativo.';
  end if;
  if not exists (
    select 1 from public.caixas c
    where c.id = p_id_caixa and c.id_empresa = p_id_empresa and c.ativo
  ) then
    raise exception 'Caixa inválido ou inativo.';
  end if;
  if exists (
    select 1 from public.sessoes_caixa s
    where s.id_empresa = p_id_empresa
      and s.id_caixa = p_id_caixa
      and s.status = 'aberta'
  ) then
    raise exception 'Este caixa já possui uma sessão aberta.';
  end if;

  insert into public.sessoes_caixa (
    id_empresa, id_caixa, status, saldo_inicial,
    observacoes_abertura, aberta_por
  ) values (
    p_id_empresa, p_id_caixa, 'aberta', p_saldo_inicial,
    nullif(btrim(p_observacoes), ''), auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$$;


ALTER FUNCTION "private"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."aceitar_convites_pendentes"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_email text;
  v_confirmado timestamptz;
  v_convite record;
  v_total integer := 0;
begin
  if auth.uid() is null then return 0; end if;

  select lower(u.email), u.email_confirmed_at
    into v_email, v_confirmado
  from auth.users u
  where u.id = auth.uid();

  if v_email is null or v_confirmado is null then return 0; end if;

  update public.convites_empresa
     set status = 'expirado', updated_at = now()
   where status = 'pendente'
     and expires_at <= now()
     and lower(email) = v_email;

  for v_convite in
    select ce.*
    from public.convites_empresa ce
    where ce.status = 'pendente'
      and ce.expires_at > now()
      and lower(ce.email) = v_email
    order by ce.created_at
    for update
  loop
    insert into public.usuarios_empresas (empresa_id, user_id, tipo, status)
    values (v_convite.id_empresa, auth.uid(), v_convite.tipo, 'ativo'::public.status_usuario_empresa)
    on conflict (empresa_id, user_id) do update
      set tipo = excluded.tipo,
          status = 'ativo'::public.status_usuario_empresa;

    update public.convites_empresa
       set status = 'aceito', aceito_por = auth.uid(),
           aceito_em = now(), updated_at = now()
     where id = v_convite.id;
    v_total := v_total + 1;
  end loop;

  return v_total;
end;
$$;


ALTER FUNCTION "private"."aceitar_convites_pendentes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."adicionar_dono_da_empresa"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.criado_por is not null then
    insert into public.usuarios_empresas (empresa_id, user_id, tipo, status)
    values (
      new.id,
      new.criado_por,
      'dono'::public.tipos_usuarios,
      'ativo'::public.status_usuario_empresa
    )
    on conflict (empresa_id, user_id) do nothing;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."adicionar_dono_da_empresa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."alterar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_acao" "text", "p_motivo" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_agendamento public.agendamentos%rowtype;
  v_antecedencia_cancelamento integer := 1440;
begin
  select a.* into v_agendamento
  from public.agendamentos a
  join public.clientes c
    on c.id_empresa = a.id_empresa and c.id = a.id_cliente
  where a.id_empresa = p_id_empresa
    and a.id = p_id_agendamento
    and c.auth_user_id = auth.uid()
    and c.ativo
  for update of a;

  if not found then
    raise exception 'Agendamento nao encontrado para este cliente.';
  end if;

  if p_acao = 'confirmar' then
    if v_agendamento.status not in ('aguardando_confirmacao', 'aguardando_pagamento') then
      raise exception 'Este agendamento nao pode ser confirmado.';
    end if;
    if v_agendamento.sinal_status = 'pendente' then
      raise exception 'O pagamento do sinal ainda esta pendente.';
    end if;
    if v_agendamento.inicio <= now() then
      raise exception 'Agendamentos passados nao podem ser confirmados.';
    end if;

    update public.agendamentos
    set status = 'confirmado'
    where id_empresa = p_id_empresa and id = p_id_agendamento;
  elsif p_acao = 'cancelar' then
    if v_agendamento.status in ('cancelado', 'finalizado', 'no_show', 'em_atendimento') then
      raise exception 'Este agendamento nao pode mais ser cancelado.';
    end if;

    select coalesce(p.antecedencia_cancelamento_minutos, 1440)
      into v_antecedencia_cancelamento
    from public.politicas_cancelamento p
    where p.id_empresa = p_id_empresa
      and p.ativo
      and current_date between p.vigente_desde and coalesce(p.vigente_ate, 'infinity'::date)
      and (p.id_unidade = v_agendamento.id_unidade or p.id_unidade is null)
    order by (p.id_unidade = v_agendamento.id_unidade) desc, p.vigente_desde desc, p.id desc
    limit 1;

    if v_agendamento.inicio <= now() + make_interval(mins => coalesce(v_antecedencia_cancelamento, 1440)) then
      raise exception 'O prazo para cancelamento online desta reserva ja terminou.';
    end if;

    update public.agendamentos
    set status = 'cancelado',
        motivo_cancelamento = coalesce(nullif(btrim(p_motivo), ''), 'Cancelado pelo cliente na area autenticada.')
    where id_empresa = p_id_empresa and id = p_id_agendamento;
  else
    raise exception 'Acao invalida.';
  end if;

  return private.obter_area_cliente_site(p_id_empresa);
end;
$$;


ALTER FUNCTION "private"."alterar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_acao" "text", "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_agendamento public.agendamentos%rowtype;
begin
  select * into v_agendamento
  from public.agendamentos a
  where a.site_access_token = p_token
  for update;

  if not found then
    raise exception 'Agendamento não encontrado.';
  end if;

  if p_acao = 'confirmar' then
    if v_agendamento.status not in ('aguardando_confirmacao', 'aguardando_pagamento') then
      raise exception 'Este agendamento não pode ser confirmado.';
    end if;
    if v_agendamento.sinal_status = 'pendente' then
      raise exception 'O pagamento do sinal ainda está pendente.';
    end if;
    update public.agendamentos
    set status = 'confirmado'
    where id = v_agendamento.id and id_empresa = v_agendamento.id_empresa;
  elsif p_acao = 'cancelar' then
    if v_agendamento.status in ('cancelado', 'finalizado', 'no_show', 'em_atendimento') then
      raise exception 'Este agendamento não pode mais ser cancelado.';
    end if;
    update public.agendamentos
    set status = 'cancelado',
        motivo_cancelamento = coalesce(nullif(btrim(p_motivo), ''), 'Cancelado pelo cliente no site.')
    where id = v_agendamento.id and id_empresa = v_agendamento.id_empresa;
  else
    raise exception 'Ação inválida.';
  end if;

  return public.obter_agendamento_site(p_token);
end;
$$;


ALTER FUNCTION "private"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text" DEFAULT NULL::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_validade date;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array[
      'dono'::public.tipos_usuarios,
      'gerente'::public.tipos_usuarios,
      'recepcionista'::public.tipos_usuarios
    ]
  ) then
    raise exception 'Você não possui permissão para alterar o orçamento.';
  end if;

  select o.validade into v_validade
  from public.orcamentos o
  where o.id = p_orcamento_id and o.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Orçamento não encontrado.'; end if;

  if p_status in ('enviado', 'aprovado') and not exists (
    select 1
    from public.orcamentos_itens i
    where i.id_orcamento = p_orcamento_id
  ) then
    raise exception 'O orçamento precisa ter pelo menos um item.';
  end if;
  if p_status in ('enviado', 'aprovado')
     and v_validade is not null
     and v_validade < current_date then
    raise exception 'O orçamento está vencido. Atualize a validade antes de continuar.';
  end if;
  if p_status = 'expirado'
     and (v_validade is null or v_validade >= current_date) then
    raise exception 'O orçamento ainda não está vencido.';
  end if;

  update public.orcamentos
  set status = p_status,
      observacoes = case
        when nullif(btrim(p_observacao), '') is null then observacoes
        when observacoes is null then btrim(p_observacao)
        else observacoes || E'\n' || btrim(p_observacao)
      end
  where id = p_orcamento_id and id_empresa = p_id_empresa;

  return p_status;
end;
$$;


ALTER FUNCTION "private"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."atualizar_dados_cliente_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_data_nascimento" "date" DEFAULT NULL::"date", "p_canal_preferido" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_telefone_numeros text := regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g');
begin
  if auth.uid() is null then
    raise exception 'Autenticacao do cliente obrigatoria.';
  end if;
  if char_length(v_nome) < 2 or char_length(v_nome) > 120 then
    raise exception 'Informe um nome valido.';
  end if;
  if char_length(v_telefone_numeros) < 10 or char_length(v_telefone_numeros) > 13 then
    raise exception 'Informe um telefone valido com DDD.';
  end if;
  if p_data_nascimento is not null and (p_data_nascimento > current_date or p_data_nascimento < current_date - interval '120 years') then
    raise exception 'Informe uma data de nascimento valida.';
  end if;
  if p_canal_preferido is not null and p_canal_preferido not in ('whatsapp', 'email', 'sms', 'telefone') then
    raise exception 'Canal de contato invalido.';
  end if;

  update public.clientes
  set nome = v_nome,
      telefone_principal = p_telefone,
      telefone_e164 = case
        when v_telefone_numeros like '55%' then '+' || v_telefone_numeros
        else '+55' || v_telefone_numeros
      end,
      data_nascimento = p_data_nascimento,
      canal_preferido = p_canal_preferido,
      updated_at = now()
  where id_empresa = p_id_empresa
    and auth_user_id = auth.uid()
    and ativo;

  if not found then
    raise exception 'Cliente autenticado nao encontrado.';
  end if;

  return private.obter_area_cliente_site(p_id_empresa);
end;
$$;


ALTER FUNCTION "private"."atualizar_dados_cliente_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_data_nascimento" "date", "p_canal_preferido" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") RETURNS "public"."empresas"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_empresa public.empresas;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono']::public.tipos_usuarios[]
  ) then
    raise exception 'Somente o administrador pode alterar os dados da empresa.';
  end if;

  if nullif(btrim(p_fantasia), '') is null then
    raise exception 'Informe o nome da empresa.';
  end if;

  update public.empresas
     set fantasia = btrim(p_fantasia),
         razao_social = nullif(btrim(p_razao_social), ''),
         cnpj = nullif(regexp_replace(coalesce(p_cnpj, ''), '\D', '', 'g'), ''),
         email = nullif(lower(btrim(p_email)), ''),
         contato1 = nullif(btrim(p_contato1), ''),
         contato2 = nullif(btrim(p_contato2), ''),
         fuso_horario = coalesce(nullif(btrim(p_fuso_horario), ''), 'America/Sao_Paulo')
   where id = p_id_empresa
  returning * into v_empresa;

  if v_empresa.id is null then
    raise exception 'Empresa não encontrada.';
  end if;

  return v_empresa;
end;
$$;


ALTER FUNCTION "private"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."atualizar_preferencias_cliente_site"("p_id_empresa" bigint, "p_whatsapp" boolean, "p_email" boolean) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id_cliente bigint;
begin
  select c.id into v_id_cliente
  from public.clientes c
  where c.id_empresa = p_id_empresa
    and c.auth_user_id = auth.uid()
    and c.ativo;

  if v_id_cliente is null then
    raise exception 'Cliente autenticado nao encontrado.';
  end if;

  insert into public.preferencias_lembrete (
    id_empresa, id_cliente, whatsapp, email, sms, push,
    antecedencias_minutos, ativo, origem, updated_at
  ) values (
    p_id_empresa, v_id_cliente, p_whatsapp, p_email, false, false,
    array[1440, 120], true, 'site_cliente', now()
  )
  on conflict (id_empresa, id_cliente) do update
    set whatsapp = excluded.whatsapp,
        email = excluded.email,
        ativo = true,
        origem = 'site_cliente',
        updated_at = now();

  return private.obter_area_cliente_site(p_id_empresa);
end;
$$;


ALTER FUNCTION "private"."atualizar_preferencias_cliente_site"("p_id_empresa" bigint, "p_whatsapp" boolean, "p_email" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_limite bigint;
  v_ativos bigint;
  v_status_atual public.status_usuario_empresa;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono']::public.tipos_usuarios[]
  ) then
    raise exception 'Somente o administrador pode alterar usuários e cargos.';
  end if;

  select ue.status into v_status_atual
  from public.usuarios_empresas ue
  where ue.id = p_usuario_empresa_id
    and ue.empresa_id = p_id_empresa
  for update;

  if v_status_atual is null then
    raise exception 'Usuário da empresa não encontrado.';
  end if;

  if v_status_atual <> 'ativo'::public.status_usuario_empresa
     and p_status = 'ativo'::public.status_usuario_empresa then
    v_limite := private.plano_limite_funcionalidade_empresa(
      p_id_empresa,
      'usuarios'
    );

    select count(*) into v_ativos
    from public.usuarios_empresas ue
    where ue.empresa_id = p_id_empresa
      and ue.status = 'ativo'::public.status_usuario_empresa;

    if v_limite is not null and v_ativos >= v_limite then
      raise exception 'O limite de usuários do plano foi atingido.';
    end if;
  end if;

  update public.usuarios_empresas
     set tipo = p_tipo,
         status = p_status
   where id = p_usuario_empresa_id
     and empresa_id = p_id_empresa;
end;
$$;


ALTER FUNCTION "private"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_quantidade integer;
  v_conta_id bigint;
begin
  if not private.usuario_pertence_empresa(p_id_empresa) then
    raise exception 'Você não possui acesso a esta empresa.';
  end if;

  update public.contas_parcelas cp
     set status = case
       when cp.data_vencimento < current_date then 'atrasada'
       else 'aberta'
     end,
     updated_at = now()
   where cp.id_empresa = p_id_empresa
     and cp.valor_pago = 0
     and cp.status in ('aberta', 'atrasada');
  get diagnostics v_quantidade = row_count;

  for v_conta_id in
    select c.id from public.contas c
    where c.id_empresa = p_id_empresa
      and c.status in ('aberta', 'vencida')
  loop
    perform private.recalcular_conta(v_conta_id);
  end loop;

  return v_quantidade;
end;
$$;


ALTER FUNCTION "private"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."bloquear_exclusao_movimento_estoque"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  raise exception 'Movimentos de estoque não podem ser excluídos; utilize o estorno.';
end;
$$;


ALTER FUNCTION "private"."bloquear_exclusao_movimento_estoque"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_status text;
  v_conta_id bigint;
  v_valor_pago numeric;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para cancelar comandas.';
  end if;
  if nullif(btrim(p_motivo),'') is null then
    raise exception 'Informe o motivo do cancelamento.';
  end if;

  select c.status into v_status
  from public.comandas c
  where c.id = p_comanda_id and c.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Comanda não encontrada.'; end if;
  if v_status not in ('aberta','fechada') then raise exception 'Esta comanda não pode ser cancelada.'; end if;

  select c.id,c.valor_pago into v_conta_id,v_valor_pago
  from public.contas c
  where c.id_empresa = p_id_empresa and c.id_comanda = p_comanda_id;
  if coalesce(v_valor_pago,0) > 0 then
    raise exception 'A comanda possui pagamentos. Estorne-os antes de cancelar.';
  end if;

  update public.comandas
     set status = 'cancelada', motivo_cancelamento = btrim(p_motivo)
   where id = p_comanda_id and id_empresa = p_id_empresa;

  if v_conta_id is not null then
    update public.contas_parcelas
       set status = 'cancelada', observacoes = coalesce(observacoes || E'\n','') || 'Cancelada com a comanda: ' || btrim(p_motivo)
     where id_conta = v_conta_id and id_empresa = p_id_empresa and status <> 'cancelada';
    update public.contas
       set status = 'cancelada', cancelada_em = now(), motivo_cancelamento = btrim(p_motivo)
     where id = v_conta_id and id_empresa = p_id_empresa;
  end if;

  return 'cancelada';
end;
$$;


ALTER FUNCTION "private"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_conta record;
begin
  select c.* into v_conta
  from public.contas c
  where c.id = p_conta_id and c.id_empresa = p_id_empresa
  for update;

  if not found then raise exception 'Conta não encontrada.'; end if;
  if not (
    private.usuario_tem_tipo_empresa(
      p_id_empresa,
      array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
    )
    or (
      v_conta.tipo = 'receber'
      and private.usuario_tem_tipo_empresa(
        p_id_empresa,
        array['recepcionista'::public.tipos_usuarios]
      )
    )
  ) then
    raise exception 'Você não possui permissão para cancelar esta conta.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do cancelamento.';
  end if;
  if v_conta.status = 'cancelada' then return 'cancelada'; end if;
  if exists (
    select 1
    from public.contas_parcelas cp
    join public.pagamentos_alocacoes pa on pa.id_parcela = cp.id
    join public.pagamentos p on p.id = pa.id_pagamento and p.status = 'confirmado'
    where cp.id_conta = p_conta_id
  ) then
    raise exception 'A conta possui pagamentos confirmados. Estorne-os antes de cancelar.';
  end if;

  update public.contas_parcelas
     set status = 'cancelada', paga_em = null
   where id_conta = p_conta_id and id_empresa = p_id_empresa;

  update public.contas
     set status = 'cancelada', cancelada_em = now(),
         motivo_cancelamento = btrim(p_motivo),
         valor_total = v_conta.valor_total,
         valor_pago = v_conta.valor_pago
   where id = p_conta_id and id_empresa = p_id_empresa;

  return 'cancelada';
end;
$$;


ALTER FUNCTION "private"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono']::public.tipos_usuarios[]
  ) then
    raise exception 'Somente o administrador pode cancelar convites.';
  end if;

  update public.convites_empresa
     set status = 'cancelado', cancelado_em = now(), updated_at = now()
   where id = p_convite_id
     and id_empresa = p_id_empresa
     and status = 'pendente';

  if not found then
    raise exception 'Convite pendente não encontrado.';
  end if;
end;
$$;


ALTER FUNCTION "private"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."configurar_financeiro_nova_empresa"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  perform private.configurar_financeiro_padrao(new.id);
  return new;
end;
$$;


ALTER FUNCTION "private"."configurar_financeiro_nova_empresa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."configurar_financeiro_padrao"("p_id_empresa" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.categorias_financeiras (id_empresa, nome, tipo, ativo)
  select p_id_empresa, v.nome, v.tipo, true
  from (values
    ('Serviços', 'entrada'),
    ('Venda de produtos', 'entrada'),
    ('Fornecedores', 'saida'),
    ('Despesas operacionais', 'saida'),
    ('Salários e comissões', 'saida'),
    ('Impostos e taxas', 'saida'),
    ('Outros', 'ambos')
  ) as v(nome, tipo)
  where not exists (
    select 1
    from public.categorias_financeiras c
    where c.id_empresa = p_id_empresa
      and lower(btrim(c.nome)) = lower(v.nome)
  );

  insert into public.formas_pagamento (
    id_empresa, nome, tipo, permite_parcelamento, max_parcelas,
    taxa_percentual, prazo_recebimento_dias, ativo
  )
  select p_id_empresa, v.nome, v.tipo, v.parcela, v.maximo, v.taxa, v.prazo, true
  from (values
    ('Dinheiro', 'dinheiro', false, 1::smallint, 0::numeric, 0),
    ('PIX', 'pix', false, 1::smallint, 0::numeric, 0),
    ('Cartão de débito', 'cartao_debito', false, 1::smallint, 1.50::numeric, 1),
    ('Cartão de crédito', 'cartao_credito', true, 12::smallint, 3.50::numeric, 30),
    ('Transferência', 'transferencia', false, 1::smallint, 0::numeric, 0),
    ('Boleto', 'boleto', true, 12::smallint, 0::numeric, 1)
  ) as v(nome, tipo, parcela, maximo, taxa, prazo)
  where not exists (
    select 1
    from public.formas_pagamento f
    where f.id_empresa = p_id_empresa
      and lower(btrim(f.nome)) = lower(v.nome)
  );

  insert into public.caixas (
    id_empresa, nome, codigo, descricao, localizacao,
    permite_saldo_negativo, ativo
  )
  select p_id_empresa, 'Caixa principal', 'CX-01',
         'Caixa padrão da empresa', 'Recepção', false, true
  where not exists (
    select 1 from public.caixas c
    where c.id_empresa = p_id_empresa
  );
end;
$$;


ALTER FUNCTION "private"."configurar_financeiro_padrao"("p_id_empresa" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text" DEFAULT NULL::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_orcamento record;
  v_comanda_id bigint;
  v_item record;
  v_funcionario_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para converter o orçamento.';
  end if;

  select o.* into v_orcamento
  from public.orcamentos o
  where o.id = p_orcamento_id and o.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Orçamento não encontrado.'; end if;

  if v_orcamento.status = 'convertido' then
    select c.id into v_comanda_id
    from public.comandas c
    where c.id_empresa = p_id_empresa and c.id_orcamento = p_orcamento_id;
    if v_comanda_id is not null then return v_comanda_id; end if;
  end if;
  if v_orcamento.status <> 'aprovado' then
    raise exception 'Apenas orçamentos aprovados podem ser convertidos.';
  end if;
  if v_orcamento.validade is not null and v_orcamento.validade < current_date then
    raise exception 'O orçamento aprovado está vencido.';
  end if;

  insert into public.comandas (
    id_empresa,id_cliente,id_orcamento,id_funcionario_responsavel,
    status,observacoes,subtotal,desconto_itens,desconto,acrescimo,criado_por
  ) values (
    p_id_empresa,v_orcamento.id_cliente,p_orcamento_id,p_id_funcionario_responsavel,
    'aberta',coalesce(nullif(btrim(p_observacoes),''),v_orcamento.observacoes),
    0,0,0,0,auth.uid()
  ) returning id into v_comanda_id;

  for v_item in
    select i.* from public.orcamentos_itens i
    where i.id_orcamento = p_orcamento_id
    order by i.ordem,i.id
  loop
    v_funcionario_id := case
      when v_item.tipo_item = 'servico'
        then nullif(p_funcionarios_servicos ->> v_item.id::text,'')::bigint
      else null
    end;
    if v_item.tipo_item = 'servico' and v_funcionario_id is null then
      raise exception 'Selecione o profissional de todos os serviços.';
    end if;

    insert into public.comandas_itens (
      id_empresa,id_comanda,id_orcamento_item,tipo_item,id_servico,id_produto,
      id_funcionario,descricao_snapshot,quantidade,valor_unitario_snapshot,
      desconto,ordem,observacoes
    ) values (
      p_id_empresa,v_comanda_id,v_item.id,v_item.tipo_item,v_item.id_servico,v_item.id_produto,
      v_funcionario_id,v_item.descricao_snapshot,v_item.quantidade,v_item.valor_unitario_snapshot,
      v_item.desconto,v_item.ordem,v_item.observacoes
    );
  end loop;

  update public.comandas
     set desconto = v_orcamento.desconto,
         acrescimo = v_orcamento.acrescimo
   where id = v_comanda_id and id_empresa = p_id_empresa;

  update public.orcamentos
     set status = 'convertido'
   where id = p_orcamento_id and id_empresa = p_id_empresa;

  return v_comanda_id;
end;
$$;


ALTER FUNCTION "private"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text") IS 'Converte orçamento aprovado em uma única comanda preservando snapshots.';



CREATE OR REPLACE FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text" DEFAULT NULL::"text", "p_lembrete_whatsapp" boolean DEFAULT true, "p_lembrete_email" boolean DEFAULT true, "p_chave_idempotencia" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id_unidade bigint;
begin
  select u.id into v_id_unidade
  from public.unidades u
  where u.id_empresa = p_id_empresa and u.ativo
  order by u.principal desc, u.id
  limit 1;

  return private.criar_agendamento_site(
    p_id_empresa, v_id_unidade, p_nome, p_telefone, p_email,
    p_id_servico, p_id_funcionario, p_inicio, p_observacoes,
    p_lembrete_whatsapp, p_lembrete_email, p_chave_idempotencia
  );
end;
$$;


ALTER FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text" DEFAULT NULL::"text", "p_lembrete_whatsapp" boolean DEFAULT true, "p_lembrete_email" boolean DEFAULT true, "p_chave_idempotencia" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_nome text := btrim(coalesce(p_nome, ''));
  v_telefone text := regexp_replace(coalesce(p_telefone, ''), '[^0-9]', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_cliente_id bigint;
  v_agendamento_id bigint;
  v_token uuid;
  v_duracao integer;
  v_preco numeric(10,2);
  v_exige_sinal boolean;
  v_sinal_tipo text;
  v_sinal_config numeric;
  v_sinal numeric(10,2);
  v_fim timestamptz;
  v_disponivel boolean;
begin
  if p_chave_idempotencia is null then
    raise exception 'Identificador da solicitacao ausente.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    'site-booking:' || p_id_empresa::text || ':' || p_chave_idempotencia::text,
    0
  ));

  select a.id, a.site_access_token
    into v_agendamento_id, v_token
  from public.agendamentos a
  where a.id_empresa = p_id_empresa
    and a.site_booking_key = p_chave_idempotencia;

  if found then
    return private.obter_agendamento_site(v_token);
  end if;

  if not exists (
    select 1 from public.unidades u
    where u.id_empresa = p_id_empresa and u.id = p_id_unidade and u.ativo
  ) then
    raise exception 'Unidade indisponivel para agendamento online.';
  end if;
  if char_length(v_nome) < 2 or char_length(v_nome) > 120 then
    raise exception 'Informe um nome valido.';
  end if;
  if char_length(v_telefone) < 10 or char_length(v_telefone) > 13 then
    raise exception 'Informe um WhatsApp valido com DDD.';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Informe um e-mail valido.';
  end if;
  if char_length(coalesce(p_observacoes, '')) > 1000 then
    raise exception 'As observacoes podem ter no maximo 1000 caracteres.';
  end if;

  if (
    select count(*)
    from public.agendamentos a
    join public.clientes c
      on c.id_empresa = a.id_empresa and c.id = a.id_cliente
    where a.id_empresa = p_id_empresa
      and a.site_booking_key is not null
      and a.created_at >= now() - interval '1 hour'
      and regexp_replace(coalesce(c.telefone_e164, c.telefone_principal, ''), '[^0-9]', '', 'g') = v_telefone
  ) >= 3 then
    raise exception 'Muitas solicitacoes recentes para este telefone. Aguarde antes de tentar novamente.';
  end if;

  select
    coalesce(fs.duracao_personalizada, s.duracao_minutos),
    coalesce(fs.valor_personalizado, s.preco),
    s.exige_sinal,
    s.sinal_tipo,
    s.sinal_valor
    into v_duracao, v_preco, v_exige_sinal, v_sinal_tipo, v_sinal_config
  from public.servicos s
  join public.funcionarios f
    on f.id_empresa = s.id_empresa
   and f.id = p_id_funcionario
   and f.ativo
   and f.atende_clientes
  left join public.funcionarios_servicos fs
    on fs.id_empresa = s.id_empresa
   and fs.id_servico = s.id
   and fs.id_funcionario = f.id
   and fs.ativo
  where s.id_empresa = p_id_empresa
    and s.id = p_id_servico
    and s.ativo
    and s.permite_agendamento_online
    and (
      not exists (
        select 1
        from public.funcionarios_servicos configuracao
        where configuracao.id_empresa = f.id_empresa
          and configuracao.id_funcionario = f.id
      )
      or fs.id is not null
    );

  if not found then
    raise exception 'Servico ou profissional indisponivel para agendamento online.';
  end if;

  -- A trava e a segunda consulta acontecem na mesma transacao do INSERT.
  perform pg_advisory_xact_lock(hashtextextended(
    p_id_empresa::text || ':' || p_id_funcionario::text,
    0
  ));

  select exists (
    select 1
    from jsonb_array_elements(private.obter_disponibilidade_site(
      p_id_empresa,
      p_id_unidade,
      (p_inicio at time zone coalesce((
        select u.fuso_horario from public.unidades u
        where u.id_empresa = p_id_empresa and u.id = p_id_unidade
      ), 'America/Sao_Paulo'))::date,
      p_id_servico,
      p_id_funcionario
    )) slot
    where (slot->>'id_funcionario')::bigint = p_id_funcionario
      and (slot->>'inicio')::timestamptz = p_inicio
  ) into v_disponivel;

  if not v_disponivel then
    raise exception using
      errcode = '23P01',
      message = 'Este horario nao esta mais disponivel. Escolha outro horario.';
  end if;

  select c.id into v_cliente_id
  from public.clientes c
  where c.id_empresa = p_id_empresa
    and regexp_replace(coalesce(c.telefone_e164, c.telefone_principal, ''), '[^0-9]', '', 'g') = v_telefone
  order by c.ativo desc, c.id
  limit 1;

  if v_cliente_id is null then
    insert into public.clientes (
      id_empresa, nome, telefone_principal, telefone_e164, email,
      canal_preferido, observacoes
    ) values (
      p_id_empresa, v_nome, p_telefone, '+' || v_telefone, v_email,
      case when p_lembrete_whatsapp then 'whatsapp' when p_lembrete_email then 'email' else null end,
      '[SITE] Cadastro criado pelo agendamento publico.'
    ) returning id into v_cliente_id;
  end if;

  v_fim := p_inicio + make_interval(mins => v_duracao);
  v_sinal := case
    when not v_exige_sinal or coalesce(v_sinal_config, 0) <= 0 then null
    when v_sinal_tipo = 'percentual' then round(v_preco * v_sinal_config / 100, 2)
    else least(v_preco, v_sinal_config)
  end;
  v_token := gen_random_uuid();

  insert into public.agendamentos (
    id_empresa, id_unidade, id_cliente, inicio, fim, observacoes,
    sinal_status, sinal_valor, status, origem, criado_por,
    site_access_token, site_booking_key, site_notification_preferences
  ) values (
    p_id_empresa, p_id_unidade, v_cliente_id, p_inicio, v_fim,
    nullif(btrim(p_observacoes), ''),
    case when v_sinal is null then 'nao_exigido' else 'pendente' end,
    v_sinal,
    case when v_sinal is null then 'aguardando_confirmacao' else 'aguardando_pagamento' end,
    'sistema', null, v_token, p_chave_idempotencia,
    jsonb_build_object('whatsapp', p_lembrete_whatsapp, 'email', p_lembrete_email)
  ) returning id into v_agendamento_id;

  insert into public.agendamentos_servicos (
    id_empresa, id_agendamento, id_servico, id_funcionario,
    inicio, fim, duracao_minutos, preco, ordem, status, observacoes
  ) values (
    p_id_empresa, v_agendamento_id, p_id_servico, p_id_funcionario,
    p_inicio, v_fim, v_duracao, v_preco, 1, 'reservado',
    '[SITE] Item criado pelo agendamento publico.'
  );

  return private.obter_agendamento_site(v_token);
end;
$_$;


ALTER FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para criar ajustes de comissão.';
  end if;
  if not exists (
    select 1 from public.funcionarios f
    where f.id = p_id_funcionario and f.id_empresa = p_id_empresa
  ) then
    raise exception 'Funcionário inválido ou pertencente a outra empresa.';
  end if;
  if nullif(btrim(p_descricao), '') is null then
    raise exception 'Informe o motivo do ajuste.';
  end if;
  if coalesce(p_valor, 0) <= 0 then
    raise exception 'O valor do ajuste deve ser maior que zero.';
  end if;

  insert into public.lancamentos_comissao (
    id_empresa, id_funcionario, id_regra, id_comanda, id_comanda_item,
    tipo_origem, tipo_item, descricao_snapshot, desconto_rateado,
    base_calculo, tipo_calculo, percentual_snapshot, valor_fixo_snapshot,
    valor_comissao, valor_pago, status, competencia, momento_liberacao,
    liberada_em
  ) values (
    p_id_empresa, p_id_funcionario, null, null, null,
    'ajuste_manual', 'outro', btrim(p_descricao), 0,
    p_valor, 'valor_fixo', null, p_valor,
    p_valor, 0, 'liberada', coalesce(p_competencia, current_date),
    'fechamento_comanda', now()
  ) returning id into v_id;

  return v_id;
end;
$$;


ALTER FUNCTION "private"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") IS 'Cria um crédito manual de comissão liberado e auditável.';



CREATE OR REPLACE FUNCTION "private"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_email text := lower(btrim(p_email));
  v_user_id uuid;
  v_limite bigint;
  v_em_uso bigint;
  v_convite_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono']::public.tipos_usuarios[]
  ) then
    raise exception 'Somente o administrador pode convidar usuários.';
  end if;

  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Informe um e-mail válido.';
  end if;

  if not private.plano_tem_funcionalidade_empresa(p_id_empresa, 'usuarios') then
    raise exception 'O plano atual não permite adicionar usuários.';
  end if;

  update public.convites_empresa
     set status = 'expirado', updated_at = now()
   where id_empresa = p_id_empresa
     and status = 'pendente'
     and expires_at <= now();

  v_limite := private.plano_limite_funcionalidade_empresa(
    p_id_empresa,
    'usuarios'
  );

  select
    (select count(*) from public.usuarios_empresas ue
      where ue.empresa_id = p_id_empresa
        and ue.status = 'ativo'::public.status_usuario_empresa)
    +
    (select count(*) from public.convites_empresa ce
      where ce.id_empresa = p_id_empresa
        and ce.status = 'pendente'
        and ce.expires_at > now())
    into v_em_uso;

  if v_limite is not null and v_em_uso >= v_limite then
    raise exception 'O limite de usuários do plano foi atingido.';
  end if;

  if exists (
    select 1
    from public.usuarios_empresas ue
    join auth.users u on u.id = ue.user_id
    where ue.empresa_id = p_id_empresa
      and lower(u.email) = v_email
      and ue.status = 'ativo'::public.status_usuario_empresa
  ) then
    raise exception 'Este usuário já possui acesso ativo à empresa.';
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = v_email
    and u.email_confirmed_at is not null
  order by u.created_at
  limit 1;

  if v_user_id is not null then
    insert into public.usuarios_empresas (empresa_id, user_id, tipo, status)
    values (
      p_id_empresa,
      v_user_id,
      p_tipo,
      'ativo'::public.status_usuario_empresa
    )
    on conflict (empresa_id, user_id) do update
      set tipo = excluded.tipo,
          status = 'ativo'::public.status_usuario_empresa;

    return jsonb_build_object(
      'status', 'ativado',
      'mensagem', 'O usuário já possuía conta e recebeu acesso imediatamente.'
    );
  end if;

  update public.convites_empresa
     set tipo = p_tipo,
         expires_at = now() + interval '7 days',
         criado_por = auth.uid(),
         updated_at = now()
   where id_empresa = p_id_empresa
     and lower(email) = v_email
     and status = 'pendente'
  returning id into v_convite_id;

  if v_convite_id is null then
    insert into public.convites_empresa (
      id_empresa, email, tipo, criado_por
    ) values (
      p_id_empresa, v_email, p_tipo, auth.uid()
    ) returning id into v_convite_id;
  end if;

  return jsonb_build_object(
    'status', 'pendente',
    'convite_id', v_convite_id,
    'mensagem', 'Convite registrado. O acesso será ativado quando esse e-mail entrar no sistema.'
  );
end;
$_$;


ALTER FUNCTION "private"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."definir_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "private"."definir_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_lancamento record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para estornar comissões.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;

  select lc.* into v_lancamento
  from public.lancamentos_comissao lc
  where lc.id = p_lancamento_id and lc.id_empresa = p_id_empresa
  for update;

  if not found then raise exception 'Lançamento de comissão não encontrado.'; end if;
  if v_lancamento.status = 'estornada' then return 'estornada'; end if;
  if v_lancamento.valor_pago > 0 or v_lancamento.status in ('parcial', 'paga') then
    raise exception 'Estorne primeiro os pagamentos vinculados a esta comissão.';
  end if;

  update public.lancamentos_comissao
     set status = 'estornada', estornada_em = now(), motivo_estorno = btrim(p_motivo)
   where id = p_lancamento_id and id_empresa = p_id_empresa;

  return 'estornada';
end;
$$;


ALTER FUNCTION "private"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_movimento record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios, 'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para estornar este movimento.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;

  select m.* into v_movimento
  from public.movimentos_caixa m
  where m.id = p_movimento_id and m.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Movimento de caixa não encontrado.'; end if;
  if v_movimento.origem <> 'manual' then
    raise exception 'Movimentos de pagamentos devem ser estornados pelo pagamento.';
  end if;
  if v_movimento.status = 'estornado' then return 'estornado'; end if;

  update public.movimentos_caixa
     set status = 'estornado', motivo_estorno = btrim(p_motivo),
         estornado_em = now(), estornado_por = auth.uid()
   where id = p_movimento_id and id_empresa = p_id_empresa;
  return 'estornado';
end;
$$;


ALTER FUNCTION "private"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_pagamento record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para estornar pagamentos de comissão.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;

  select pc.* into v_pagamento
  from public.pagamentos_comissao pc
  where pc.id = p_pagamento_comissao_id and pc.id_empresa = p_id_empresa
  for update;

  if not found then raise exception 'Pagamento de comissão não encontrado.'; end if;
  if v_pagamento.status = 'cancelado' then return 'cancelado'; end if;
  if v_pagamento.status <> 'confirmado' then
    raise exception 'Somente pagamentos confirmados podem ser estornados.';
  end if;

  update public.pagamentos_comissao
     set status = 'cancelado',
         cancelado_em = now(),
         motivo_cancelamento = btrim(p_motivo)
   where id = p_pagamento_comissao_id and id_empresa = p_id_empresa;

  return 'cancelado';
end;
$$;


ALTER FUNCTION "private"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_pagamento record;
begin
  select p.* into v_pagamento
  from public.pagamentos p
  where p.id = p_pagamento_id and p.id_empresa = p_id_empresa
  for update;

  if not found then raise exception 'Pagamento não encontrado.'; end if;
  if not (
    private.usuario_tem_tipo_empresa(
      p_id_empresa,
      array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
    )
    or (
      v_pagamento.tipo = 'entrada'
      and private.usuario_tem_tipo_empresa(
        p_id_empresa,
        array['recepcionista'::public.tipos_usuarios]
      )
    )
  ) then
    raise exception 'Você não possui permissão para estornar este pagamento.';
  end if;
  if nullif(btrim(p_motivo), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;
  if v_pagamento.status = 'estornado' then return 'estornado'; end if;
  if v_pagamento.status <> 'confirmado' then
    raise exception 'Somente pagamentos confirmados podem ser estornados.';
  end if;
  if exists (
    select 1 from public.pagamentos_comissao pc
    where pc.id_pagamento = p_pagamento_id
      and pc.id_empresa = p_id_empresa
      and pc.status = 'confirmado'
  ) then
    raise exception 'Este pagamento pertence a uma comissão. Faça o estorno pelo módulo Comissões.';
  end if;

  update public.pagamentos
     set status = 'estornado', estornado_em = now(),
         estornado_por = auth.uid(), motivo_estorno = btrim(p_motivo)
   where id = p_pagamento_id and id_empresa = p_id_empresa;

  return 'estornado';
end;
$$;


ALTER FUNCTION "private"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") IS 'Estorna pagamento, parcelas e movimento de caixa relacionado.';



CREATE OR REPLACE FUNCTION "private"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date" DEFAULT CURRENT_DATE) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_comanda record;
  v_conta_id bigint;
  v_falta record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para fechar comandas.';
  end if;

  select c.* into v_comanda
  from public.comandas c
  where c.id = p_comanda_id and c.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Comanda não encontrada.'; end if;
  if v_comanda.status <> 'aberta' then raise exception 'Apenas comandas abertas podem ser fechadas.'; end if;
  if not exists (select 1 from public.comandas_itens i where i.id_comanda = p_comanda_id) then
    raise exception 'Adicione pelo menos um item antes de fechar a comanda.';
  end if;

  select p.nome,
         p.estoque_atual,
         sum(i.quantidade) as necessario
    into v_falta
  from public.comandas_itens i
  join public.produtos p on p.id = i.id_produto and p.id_empresa = i.id_empresa
  where i.id_comanda = p_comanda_id
    and i.tipo_item = 'produto'
    and p.controla_estoque
  group by p.id,p.nome,p.estoque_atual
  having p.estoque_atual < sum(i.quantidade)
  limit 1;
  if found then
    raise exception 'Estoque insuficiente para %. Disponível: %, necessário: %.',
      v_falta.nome,v_falta.estoque_atual,v_falta.necessario;
  end if;

  update public.comandas
     set status = 'fechada'
   where id = p_comanda_id and id_empresa = p_id_empresa;

  select c.* into v_comanda
  from public.comandas c
  where c.id = p_comanda_id and c.id_empresa = p_id_empresa;

  if coalesce(v_comanda.valor_total,0) > 0 then
    insert into public.contas (
      id_empresa,tipo,id_cliente,id_comanda,descricao,data_emissao,
      competencia,valor_total,valor_pago,status,criado_por
    ) values (
      p_id_empresa,'receber',v_comanda.id_cliente,p_comanda_id,
      'Comanda #' || p_comanda_id,current_date,current_date,
      v_comanda.valor_total,0,'aberta',auth.uid()
    ) returning id into v_conta_id;

    insert into public.contas_parcelas (
      id_empresa,id_conta,numero_parcela,data_vencimento,
      valor_parcela,valor_pago,status
    ) values (
      p_id_empresa,v_conta_id,1,coalesce(p_data_vencimento,current_date),
      v_comanda.valor_total,0,'aberta'
    );
  end if;

  return v_conta_id;
end;
$$;


ALTER FUNCTION "private"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date") IS 'Fecha comanda, movimenta estoque, gera comissões e conta a receber.';



CREATE OR REPLACE FUNCTION "private"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date" DEFAULT CURRENT_DATE, "p_id_forma_pagamento" bigint DEFAULT NULL::bigint, "p_id_sessao_caixa" bigint DEFAULT NULL::bigint, "p_data_pagamento" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_valor_pagamento" numeric DEFAULT NULL::numeric, "p_referencia" "text" DEFAULT NULL::"text", "p_observacoes_pagamento" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_status text;
  v_total numeric(14,2);
  v_valor_pagamento numeric(14,2);
  v_conta_id bigint;
  v_parcela_id bigint;
  v_pagamento_id bigint;
begin
  if p_situacao_pagamento not in ('a_receber', 'parcial', 'pago') then
    raise exception 'Situação de pagamento inválida.';
  end if;

  select c.status, round(coalesce(c.valor_total, 0), 2)
    into v_status, v_total
  from public.comandas c
  where c.id = p_comanda_id
    and c.id_empresa = p_id_empresa
  for update;

  if not found then
    raise exception 'Comanda não encontrada.';
  end if;
  if v_status <> 'aberta' then
    raise exception 'Apenas comandas abertas podem ser fechadas.';
  end if;

  if p_situacao_pagamento in ('a_receber', 'parcial')
     and p_data_vencimento is null then
    raise exception 'Informe o vencimento do saldo a receber.';
  end if;

  if p_situacao_pagamento <> 'a_receber' then
    if v_total <= 0 then
      raise exception 'Uma comanda sem valor não pode registrar pagamento.';
    end if;
    if p_id_forma_pagamento is null then
      raise exception 'Selecione a forma de pagamento.';
    end if;
  end if;

  if p_situacao_pagamento = 'pago' then
    v_valor_pagamento := v_total;
  elsif p_situacao_pagamento = 'parcial' then
    v_valor_pagamento := round(coalesce(p_valor_pagamento, 0), 2);
    if v_valor_pagamento <= 0 or v_valor_pagamento >= v_total then
      raise exception 'O pagamento parcial deve ser maior que zero e menor que o total da comanda.';
    end if;
  else
    v_valor_pagamento := null;
  end if;

  -- A condição faz parte dos dados comerciais e, por isso, precisa ser
  -- consolidada enquanto a comanda ainda está aberta. A função inteira roda
  -- na mesma transação: qualquer falha posterior também desfaz esta alteração.
  update public.comandas
     set condicao_pagamento = p_situacao_pagamento
   where id = p_comanda_id
     and id_empresa = p_id_empresa
     and status = 'aberta';

  if not found then
    raise exception 'A condição de pagamento só pode ser definida em uma comanda aberta.';
  end if;

  v_conta_id := public.fechar_comanda(
    p_comanda_id,
    p_id_empresa,
    case
      when p_situacao_pagamento = 'pago' then current_date
      else p_data_vencimento
    end
  );

  if v_valor_pagamento is not null then
    select cp.id
      into v_parcela_id
    from public.contas_parcelas cp
    where cp.id_conta = v_conta_id
      and cp.id_empresa = p_id_empresa
      and cp.status <> 'cancelada'
    order by cp.numero_parcela
    limit 1
    for update;

    if not found then
      raise exception 'A parcela da comanda não foi encontrada.';
    end if;

    v_pagamento_id := public.registrar_pagamento_financeiro(
      p_id_empresa,
      'entrada',
      p_id_forma_pagamento,
      p_id_sessao_caixa,
      coalesce(p_data_pagamento, now()),
      v_valor_pagamento,
      p_referencia,
      p_observacoes_pagamento,
      jsonb_build_array(
        jsonb_build_object(
          'id_parcela', v_parcela_id,
          'valor', v_valor_pagamento
        )
      )
    );
  end if;

  return jsonb_build_object(
    'conta_id', v_conta_id,
    'pagamento_id', v_pagamento_id,
    'situacao_pagamento', p_situacao_pagamento,
    'valor_pago', coalesce(v_valor_pagamento, 0),
    'saldo', greatest(v_total - coalesce(v_valor_pagamento, 0), 0)
  );
end;
$$;


ALTER FUNCTION "private"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor_pagamento" numeric, "p_referencia" "text", "p_observacoes_pagamento" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor_pagamento" numeric, "p_referencia" "text", "p_observacoes_pagamento" "text") IS 'Define a condição, fecha a comanda, gera a conta e registra atomicamente o recebimento total ou parcial.';



CREATE OR REPLACE FUNCTION "private"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_sessao record;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios, 'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para fechar o caixa.';
  end if;
  if coalesce(p_saldo_contado, -1) < 0 then
    raise exception 'O saldo contado não pode ser negativo.';
  end if;

  select s.* into v_sessao
  from public.sessoes_caixa s
  where s.id = p_sessao_id and s.id_empresa = p_id_empresa
  for update;
  if not found then raise exception 'Sessão de caixa não encontrada.'; end if;
  if v_sessao.status <> 'aberta' then
    raise exception 'Somente sessões abertas podem ser fechadas.';
  end if;

  update public.sessoes_caixa
     set status = 'fechada', saldo_final_informado = p_saldo_contado,
         observacoes_fechamento = nullif(btrim(p_observacoes), '')
   where id = p_sessao_id and id_empresa = p_id_empresa;

  select s.* into v_sessao
  from public.sessoes_caixa s
  where s.id = p_sessao_id and s.id_empresa = p_id_empresa;
  return v_sessao.diferenca;
end;
$$;


ALTER FUNCTION "private"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."gerar_comissoes_comanda"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  i record;
  v_regra_id bigint;
  v_tipo text;
  v_percentual numeric;
  v_valor_fixo numeric;
  v_base_tipo text;
  v_momento text;
  v_base numeric;
  v_comissao numeric;
begin
  if new.status='fechada' and old.status is distinct from 'fechada' then
    for i in
      select ci.* from public.comandas_itens ci
       where ci.id_comanda=new.id
         and ci.id_funcionario is not null
         and ci.tipo_item in ('servico','produto')
    loop
      v_regra_id:=null; v_tipo:=null; v_percentual:=null; v_valor_fixo:=null;
      v_base_tipo:=null; v_momento:=null;

      select r.id,r.tipo_calculo,r.percentual,r.valor_fixo,r.base_calculo,r.momento_liberacao
        into v_regra_id,v_tipo,v_percentual,v_valor_fixo,v_base_tipo,v_momento
        from public.comissoes_regras r
       where r.id_empresa=new.id_empresa
         and r.ativo
         and r.vigente_de<=current_date
         and (r.vigente_ate is null or r.vigente_ate>=current_date)
         and (r.id_funcionario is null or r.id_funcionario=i.id_funcionario)
         and (
           r.tipo_item='todos'
           or (i.tipo_item='servico' and r.tipo_item='servico' and (r.id_servico is null or r.id_servico=i.id_servico))
           or (i.tipo_item='produto' and r.tipo_item='produto' and (r.id_produto is null or r.id_produto=i.id_produto))
         )
       order by
         (r.id_funcionario is not null) desc,
         (r.id_servico is not null or r.id_produto is not null) desc,
         r.prioridade desc,
         r.vigente_de desc,
         r.id desc
       limit 1;

      if v_regra_id is null and i.comissao_tipo_snapshot is not null and i.comissao_valor_snapshot is not null then
        v_tipo:=case when i.comissao_tipo_snapshot='fixo' then 'valor_fixo' else i.comissao_tipo_snapshot end;
        v_percentual:=case when i.comissao_tipo_snapshot='percentual' then i.comissao_valor_snapshot end;
        v_valor_fixo:=case when i.comissao_tipo_snapshot='fixo' then i.comissao_valor_snapshot end;
        v_base_tipo:='liquido_desconto';
        v_momento:='fechamento_comanda';
      end if;

      if v_tipo is not null then
        v_base:=case when v_base_tipo='bruto'
          then i.quantidade*i.valor_unitario_snapshot
          else greatest(i.valor_total,0)
        end;
        v_comissao:=case when v_tipo='percentual'
          then round(v_base*v_percentual/100,2)
          else round(i.quantidade*v_valor_fixo,2)
        end;

        if v_comissao>0 then
          insert into public.lancamentos_comissao(
            id_empresa,id_funcionario,id_regra,id_comanda,id_comanda_item,
            tipo_origem,tipo_item,descricao_snapshot,desconto_rateado,base_calculo,
            tipo_calculo,percentual_snapshot,valor_fixo_snapshot,valor_comissao,
            valor_pago,status,competencia,momento_liberacao,liberada_em
          ) values (
            new.id_empresa,i.id_funcionario,v_regra_id,new.id,i.id,
            'comanda',i.tipo_item,i.descricao_snapshot,i.desconto,v_base,
            v_tipo,v_percentual,v_valor_fixo,v_comissao,
            0,case when v_momento='fechamento_comanda' then 'liberada' else 'prevista' end,
            current_date,v_momento,
            case when v_momento='fechamento_comanda' then now() end
          )
          on conflict (id_comanda_item) do nothing;
        end if;
      end if;
    end loop;
  elsif new.status='cancelada' and old.status is distinct from 'cancelada' then
    update public.lancamentos_comissao
       set status='estornada',estornada_em=now(),
           motivo_estorno='Cancelamento da comanda',updated_at=now()
     where id_comanda=new.id and valor_pago=0 and status not in ('paga','parcial','estornada');
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."gerar_comissoes_comanda"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."impedir_conflito_profissional_agendamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_intervalo_novo integer;
begin
  if new.status in ('cancelado', 'concluido') then
    return new;
  end if;

  if new.fim <= new.inicio then
    raise exception 'O fim do atendimento deve ser posterior ao inicio.';
  end if;

  -- Serializa qualquer tentativa concorrente para o mesmo profissional.
  perform pg_advisory_xact_lock(hashtextextended(
    new.id_empresa::text || ':' || new.id_funcionario::text,
    0
  ));

  select greatest(coalesce(s.intervalo_minutos, 0), 0)
    into v_intervalo_novo
  from public.servicos s
  where s.id_empresa = new.id_empresa
    and s.id = new.id_servico;

  if exists (
    select 1
    from public.agendamentos_servicos item
    join public.servicos servico_existente
      on servico_existente.id_empresa = item.id_empresa
     and servico_existente.id = item.id_servico
    where item.id_empresa = new.id_empresa
      and item.id_funcionario = new.id_funcionario
      and item.status not in ('cancelado', 'concluido')
      and (new.id is null or item.id <> new.id)
      and tstzrange(
        item.inicio,
        item.fim + make_interval(mins => greatest(coalesce(servico_existente.intervalo_minutos, 0), 0)),
        '[)'
      ) && tstzrange(
        new.inicio,
        new.fim + make_interval(mins => coalesce(v_intervalo_novo, 0)),
        '[)'
      )
  ) then
    raise exception using
      errcode = '23P01',
      message = 'Este profissional ja possui um atendimento nesse horario ou no intervalo entre atendimentos.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."impedir_conflito_profissional_agendamento"() OWNER TO "postgres";


COMMENT ON FUNCTION "private"."impedir_conflito_profissional_agendamento"() IS 'Serializa agendamentos por profissional e aplica o intervalo entre servicos.';



CREATE OR REPLACE FUNCTION "private"."liberar_comissoes_conta_paga"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.status='paga' and old.status is distinct from 'paga' and new.id_comanda is not null then
    update public.lancamentos_comissao
       set status='liberada',liberada_em=coalesce(liberada_em,now()),updated_at=now()
     where id_empresa=new.id_empresa and id_comanda=new.id_comanda
       and status='prevista' and momento_liberacao='pagamento_cliente';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."liberar_comissoes_conta_paga"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text" DEFAULT NULL::"text", "p_acao" "text" DEFAULT NULL::"text", "p_tabela" "text" DEFAULT NULL::"text", "p_inicio" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_fim" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_pagina" integer DEFAULT 1, "p_por_pagina" integer DEFAULT 20) RETURNS TABLE("id" bigint, "created_at" timestamp with time zone, "acao" "text", "tabela" "text", "registro_id" "text", "origem" "text", "usuario_id" "uuid", "usuario_nome" "text", "usuario_email" "text", "papel_execucao" "text", "campos_alterados" "text"[], "dados_anteriores" "jsonb", "dados_novos" "jsonb", "total_count" bigint)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono', 'gerente']::public.tipos_usuarios[]
  ) then
    raise exception 'Você não possui permissão para consultar a auditoria.';
  end if;

  if not private.plano_tem_funcionalidade_empresa(p_id_empresa, 'auditoria') then
    raise exception 'A auditoria detalhada não está disponível no plano atual.';
  end if;

  return query
  select
    a.id,
    a.created_at,
    a.acao,
    a.tabela,
    a.registro_id,
    a.origem,
    a.usuario_id,
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      split_part(u.email, '@', 1),
      case when a.origem = 'sistema' then 'Sistema' else 'Usuário removido' end
    ) as usuario_nome,
    u.email::text as usuario_email,
    a.papel_execucao,
    a.campos_alterados,
    a.dados_anteriores,
    a.dados_novos,
    count(*) over() as total_count
  from public.auditorias a
  left join auth.users u on u.id = a.usuario_id
  where a.id_empresa = p_id_empresa
    and (
      nullif(btrim(p_busca), '') is null
      or a.tabela ilike '%' || btrim(p_busca) || '%'
      or a.registro_id ilike '%' || btrim(p_busca) || '%'
      or coalesce(u.email, '') ilike '%' || btrim(p_busca) || '%'
      or coalesce(u.raw_user_meta_data ->> 'full_name', '') ilike '%' || btrim(p_busca) || '%'
    )
    and (nullif(p_acao, '') is null or a.acao = p_acao)
    and (nullif(p_tabela, '') is null or a.tabela = p_tabela)
    and (p_inicio is null or a.created_at >= p_inicio)
    and (p_fim is null or a.created_at < p_fim)
  order by a.created_at desc, a.id desc
  limit least(greatest(p_por_pagina, 1), 100)
  offset (greatest(p_pagina, 1) - 1) * least(greatest(p_por_pagina, 1), 100);
end;
$$;


ALTER FUNCTION "private"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text", "p_acao" "text", "p_tabela" "text", "p_inicio" timestamp with time zone, "p_fim" timestamp with time zone, "p_pagina" integer, "p_por_pagina" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "private"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text", "p_acao" "text", "p_tabela" "text", "p_inicio" timestamp with time zone, "p_fim" timestamp with time zone, "p_pagina" integer, "p_por_pagina" integer) IS 'Lista a auditoria administrativa com paginação e tipos de retorno compatíveis com o esquema público.';



CREATE OR REPLACE FUNCTION "private"."listar_usuarios_administracao"("p_id_empresa" bigint) RETURNS TABLE("id" bigint, "user_id" "uuid", "nome" "text", "email" "text", "tipo" "public"."tipos_usuarios", "status" "public"."status_usuario_empresa", "created_at" timestamp with time zone, "ultimo_acesso_em" timestamp with time zone, "permissoes" "jsonb")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono', 'gerente']::public.tipos_usuarios[]
  ) then
    raise exception 'Você não possui permissão para consultar os usuários.';
  end if;

  return query
  select
    ue.id,
    ue.user_id,
    coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      split_part(u.email, '@', 1),
      'Usuário'
    ) as nome,
    u.email::text,
    ue.tipo,
    ue.status,
    ue.created_at,
    u.last_sign_in_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object('modulo', pu.modulo, 'permitido', pu.permitido)
        order by pu.modulo
      ) filter (where pu.id is not null),
      '[]'::jsonb
    ) as permissoes
  from public.usuarios_empresas ue
  join auth.users u on u.id = ue.user_id
  left join public.permissoes_usuarios pu
    on pu.id_empresa = ue.empresa_id
   and pu.usuario_empresa_id = ue.id
  where ue.empresa_id = p_id_empresa
  group by ue.id, ue.user_id, u.raw_user_meta_data, u.email,
           ue.tipo, ue.status, ue.created_at, u.last_sign_in_at
  order by
    case ue.tipo::text
      when 'dono' then 1
      when 'gerente' then 2
      when 'recepcionista' then 3
      else 4
    end,
    nome;
end;
$$;


ALTER FUNCTION "private"."listar_usuarios_administracao"("p_id_empresa" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "private"."listar_usuarios_administracao"("p_id_empresa" bigint) IS 'Lista os usuários da empresa convertendo explicitamente os campos do Auth para os tipos públicos declarados.';



CREATE OR REPLACE FUNCTION "private"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios, 'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para movimentar o caixa.';
  end if;
  if p_tipo not in ('suprimento', 'sangria', 'ajuste_entrada', 'ajuste_saida') then
    raise exception 'Tipo de movimento manual inválido.';
  end if;
  if coalesce(p_valor, 0) <= 0 then
    raise exception 'O valor do movimento deve ser maior que zero.';
  end if;
  if nullif(btrim(p_descricao), '') is null then
    raise exception 'Informe a descrição do movimento.';
  end if;

  insert into public.movimentos_caixa (
    id_empresa, id_caixa, id_sessao_caixa, tipo, origem,
    status, valor, descricao, ocorrido_em, criado_por
  ) values (
    p_id_empresa, 0, p_id_sessao_caixa, p_tipo, 'manual',
    'ativo', p_valor, btrim(p_descricao), now(), auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$$;


ALTER FUNCTION "private"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."movimentar_estoque_comanda"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare r record;
begin
  if new.status='fechada' and old.status is distinct from 'fechada' then
    for r in
      select ci.id,ci.id_empresa,ci.id_produto,ci.quantidade,ci.descricao_snapshot
        from public.comandas_itens ci
       where ci.id_comanda=new.id and ci.tipo_item='produto'
    loop
      insert into public.movimentos_estoque(
        id_empresa,id_produto,tipo,quantidade,estoque_antes,estoque_depois,
        descricao,status,origem,id_comanda_item,movimentado_em,criado_por
      ) values(
        r.id_empresa,r.id_produto,'saida_venda',r.quantidade,0,0,
        'Venda na comanda #'||new.id||' - '||r.descricao_snapshot,
        'ativo','comanda',r.id,now(),auth.uid()
      ) on conflict (id_comanda_item) where id_comanda_item is not null and tipo='saida_venda'
        do nothing;
    end loop;
  elsif new.status='cancelada' and old.status is distinct from 'cancelada' then
    update public.movimentos_estoque me
       set status='estornado',motivo_estorno='Cancelamento da comanda',updated_at=now()
     where me.id_comanda_item in (
       select ci.id from public.comandas_itens ci where ci.id_comanda=new.id
     ) and me.tipo='saida_venda' and me.status='ativo';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."movimentar_estoque_comanda"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_estoque_atual numeric;
  v_quantidade_movimento numeric;
  v_tipo text;
  v_origem text;
  v_movimento_id bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array[
      'dono'::public.tipos_usuarios,
      'gerente'::public.tipos_usuarios,
      'recepcionista'::public.tipos_usuarios
    ]
  ) then
    raise exception 'Você não possui permissão para movimentar o estoque.';
  end if;

  select p.estoque_atual
    into v_estoque_atual
  from public.produtos p
  where p.id = p_id_produto
    and p.id_empresa = p_id_empresa
    and p.ativo
    and p.controla_estoque
  for update;

  if not found then
    raise exception 'Produto inválido, inativo ou sem controle de estoque.';
  end if;

  if p_operacao = 'entrada' then
    if coalesce(p_quantidade, 0) <= 0 then
      raise exception 'Informe uma quantidade de entrada maior que zero.';
    end if;
    v_quantidade_movimento := p_quantidade;
    v_tipo := 'entrada_ajuste';
    v_origem := 'manual';
  elsif p_operacao = 'saida' then
    if coalesce(p_quantidade, 0) <= 0 then
      raise exception 'Informe uma quantidade de saída maior que zero.';
    end if;
    v_quantidade_movimento := p_quantidade;
    v_tipo := 'saida_consumo';
    v_origem := 'manual';
  elsif p_operacao = 'ajuste' then
    if p_quantidade is null or p_quantidade < 0 then
      raise exception 'O novo saldo do ajuste não pode ser negativo.';
    end if;
    if p_quantidade = v_estoque_atual then
      raise exception 'O saldo informado já é o saldo atual do produto.';
    end if;
    v_quantidade_movimento := abs(p_quantidade - v_estoque_atual);
    v_tipo := case
      when p_quantidade > v_estoque_atual then 'entrada_ajuste'
      else 'saida_ajuste'
    end;
    v_origem := 'ajuste';
  else
    raise exception 'Operação de estoque inválida.';
  end if;

  insert into public.movimentos_estoque (
    id_empresa, id_produto, tipo, quantidade,
    estoque_antes, estoque_depois, descricao,
    status, origem, movimentado_em, criado_por
  ) values (
    p_id_empresa, p_id_produto, v_tipo, v_quantidade_movimento,
    0, 0,
    coalesce(
      nullif(btrim(p_descricao), ''),
      case p_operacao
        when 'entrada' then 'Entrada manual de estoque'
        when 'saida' then 'Saída manual de estoque'
        else 'Ajuste de inventário'
      end
    ),
    'ativo', v_origem, now(), auth.uid()
  ) returning id into v_movimento_id;

  return v_movimento_id;
end;
$$;


ALTER FUNCTION "private"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") IS 'Registra entrada, saída ou ajuste manual e delega o saldo ao trigger de estoque.';



CREATE OR REPLACE FUNCTION "private"."normalizar_consentimento"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.consentiu then
    new.revogado_em := null;
  else
    new.revogado_em := coalesce(new.revogado_em, now());
  end if;

  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "private"."normalizar_consentimento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."obter_agendamento_site"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
  select jsonb_build_object(
    'token', a.site_access_token,
    'codigo', 'MK' || lpad(a.id::text, 6, '0'),
    'status', a.status,
    'inicio', a.inicio,
    'fim', a.fim,
    'sinal_status', a.sinal_status,
    'sinal_valor', a.sinal_valor,
    'cliente', jsonb_build_object(
      'nome', c.nome,
      'email', c.email,
      'telefone', c.telefone_principal
    ),
    'empresa', jsonb_build_object(
      'id', e.id,
      'nome', e.fantasia,
      'fuso_horario', coalesce(e.fuso_horario, 'America/Sao_Paulo')
    ),
    'servico', jsonb_build_object(
      'id', s.id,
      'nome', s.nome,
      'duracao_minutos', item.duracao_minutos,
      'preco', item.preco
    ),
    'profissional', jsonb_build_object(
      'id', f.id,
      'nome', regexp_replace(f.nome, '[[:space:]]*\(Teste\)[[:space:]]*$', '', 'i'),
      'cargo', coalesce(f.cargo, 'Profissional')
    ),
    'lembretes', coalesce(a.site_notification_preferences, '{}'::jsonb)
  )
  from public.agendamentos a
  join public.clientes c
    on c.id_empresa = a.id_empresa and c.id = a.id_cliente
  join public.empresas e
    on e.id = a.id_empresa
  join lateral (
    select i.*
    from public.agendamentos_servicos i
    where i.id_empresa = a.id_empresa
      and i.id_agendamento = a.id
    order by (i.status = 'cancelado'), i.ordem, i.id
    limit 1
  ) item on true
  join public.servicos s
    on s.id_empresa = item.id_empresa and s.id = item.id_servico
  join public.funcionarios f
    on f.id_empresa = item.id_empresa and f.id = item.id_funcionario
  where a.site_access_token = p_token;
$_$;


ALTER FUNCTION "private"."obter_agendamento_site"("p_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."obter_area_cliente_site"("p_id_empresa" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_cliente public.clientes%rowtype;
  v_empresa_nome text;
  v_resultado jsonb;
begin
  if auth.uid() is null then
    raise exception 'Autenticacao do cliente obrigatoria.';
  end if;

  select c.* into v_cliente
  from public.clientes c
  where c.id_empresa = p_id_empresa
    and c.auth_user_id = auth.uid()
    and c.ativo;

  if not found then
    raise exception 'Conta autenticada ainda nao vinculada a um cliente desta empresa.';
  end if;

  select coalesce(e.fantasia, e.razao_social, 'Empresa') into v_empresa_nome
  from public.empresas e
  where e.id = p_id_empresa;

  select jsonb_build_object(
    'empresa', jsonb_build_object(
      'id', p_id_empresa,
      'nome', v_empresa_nome
    ),
    'cliente', jsonb_build_object(
      'id', v_cliente.id,
      'nome', v_cliente.nome,
      'email', v_cliente.email,
      'telefone', v_cliente.telefone_principal,
      'data_nascimento', v_cliente.data_nascimento,
      'canal_preferido', v_cliente.canal_preferido
    ),
    'preferencias', coalesce((
      select jsonb_build_object(
        'whatsapp', p.whatsapp,
        'email', p.email,
        'sms', p.sms,
        'push', p.push,
        'antecedencias_minutos', p.antecedencias_minutos
      )
      from public.preferencias_lembrete p
      where p.id_empresa = p_id_empresa
        and p.id_cliente = v_cliente.id
        and p.ativo
    ), jsonb_build_object(
      'whatsapp', true,
      'email', true,
      'sms', false,
      'push', false,
      'antecedencias_minutos', array[1440, 120]
    )),
    'solicitacao_exclusao', (
      select jsonb_build_object(
        'id', sp.id,
        'status', sp.status,
        'solicitado_em', sp.solicitado_em
      )
      from public.solicitacoes_privacidade sp
      where sp.id_empresa = p_id_empresa
        and sp.id_cliente = v_cliente.id
        and sp.tipo = 'exclusao'
      order by sp.solicitado_em desc
      limit 1
    ),
    'agendamentos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'codigo', 'MK' || lpad(a.id::text, 6, '0'),
        'status', a.status,
        'inicio', a.inicio,
        'fim', a.fim,
        'valor_total', a.valor_total,
        'sinal_status', a.sinal_status,
        'sinal_valor', a.sinal_valor,
        'pagamento_status', a.pagamento_status,
        'confirmado_em', a.confirmado_em,
        'cancelado_em', a.cancelado_em,
        'motivo_cancelamento', a.motivo_cancelamento,
        'pode_confirmar', a.status in ('aguardando_confirmacao', 'aguardando_pagamento')
          and a.sinal_status <> 'pendente'
          and a.inicio > now(),
        'pode_cancelar', a.status not in ('cancelado', 'finalizado', 'no_show', 'em_atendimento')
          and a.inicio > now() + make_interval(mins => coalesce(pol.antecedencia_cancelamento_minutos, 1440)),
        'pode_reagendar', a.status not in ('cancelado', 'finalizado', 'no_show', 'em_atendimento')
          and a.inicio > now() + make_interval(mins => coalesce(pol.antecedencia_reagendamento_minutos, 1440)),
        'politica', jsonb_build_object(
          'antecedencia_cancelamento_minutos', coalesce(pol.antecedencia_cancelamento_minutos, 1440),
          'antecedencia_reagendamento_minutos', coalesce(pol.antecedencia_reagendamento_minutos, 1440),
          'texto_publico', pol.texto_publico
        ),
        'servico', jsonb_build_object(
          'id', item.id_servico,
          'nome', s.nome,
          'duracao_minutos', item.duracao_minutos,
          'preco', item.preco
        ),
        'profissional', jsonb_build_object(
          'id', item.id_funcionario,
          'nome', regexp_replace(f.nome, '[[:space:]]*\(Teste\)[[:space:]]*$', '', 'i'),
          'cargo', coalesce(f.cargo, 'Profissional')
        ),
        'unidade', jsonb_build_object(
          'id', u.id,
          'nome', u.nome,
          'bairro', u.bairro,
          'cidade', u.cidade
        ),
        'pagamentos', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', pg.id,
            'valor', pg.valor,
            'status', pg.status,
            'tipo', pg.tipo,
            'data_pagamento', pg.data_pagamento,
            'provedor', pg.provedor,
            'referencia', pg.referencia
          ) order by pg.data_pagamento desc, pg.id desc)
          from public.pagamentos pg
          where pg.id_empresa = a.id_empresa
            and pg.id_agendamento = a.id
        ), '[]'::jsonb)
      ) order by a.inicio desc, a.id desc)
      from public.agendamentos a
      join lateral (
        select i.*
        from public.agendamentos_servicos i
        where i.id_empresa = a.id_empresa
          and i.id_agendamento = a.id
        order by (i.status <> 'cancelado') desc, i.ordem, i.id
        limit 1
      ) item on true
      join public.servicos s
        on s.id_empresa = item.id_empresa and s.id = item.id_servico
      join public.funcionarios f
        on f.id_empresa = item.id_empresa and f.id = item.id_funcionario
      join public.unidades u
        on u.id_empresa = a.id_empresa and u.id = a.id_unidade
      left join lateral (
        select p.antecedencia_cancelamento_minutos,
               p.antecedencia_reagendamento_minutos,
               p.texto_publico
        from public.politicas_cancelamento p
        where p.id_empresa = a.id_empresa
          and p.ativo
          and current_date between p.vigente_desde and coalesce(p.vigente_ate, 'infinity'::date)
          and (p.id_unidade = a.id_unidade or p.id_unidade is null)
        order by (p.id_unidade = a.id_unidade) desc, p.vigente_desde desc, p.id desc
        limit 1
      ) pol on true
      where a.id_empresa = p_id_empresa
        and a.id_cliente = v_cliente.id
    ), '[]'::jsonb)
  ) into v_resultado;

  return v_resultado;
end;
$_$;


ALTER FUNCTION "private"."obter_area_cliente_site"("p_id_empresa" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."obter_catalogo_site"("p_id_empresa" bigint) RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
  select jsonb_build_object(
    'empresa', jsonb_build_object(
      'id', e.id,
      'nome', e.fantasia,
      'fuso_horario', coalesce(e.fuso_horario, 'America/Sao_Paulo')
    ),
    'servicos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'nome', s.nome,
        'descricao', s.descricao,
        'preco', s.preco,
        'duracao_minutos', s.duracao_minutos,
        'intervalo_minutos', s.intervalo_minutos,
        'exige_sinal', s.exige_sinal,
        'sinal_tipo', s.sinal_tipo,
        'sinal_valor', s.sinal_valor
      ) order by s.nome)
      from public.servicos s
      where s.id_empresa = e.id
        and s.ativo
        and s.permite_agendamento_online
    ), '[]'::jsonb),
    'profissionais', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'nome', regexp_replace(f.nome, '[[:space:]]*\(Teste\)[[:space:]]*$', '', 'i'),
        'cargo', coalesce(f.cargo, 'Profissional'),
        'cor_agenda', f.cor_agenda,
        'servicos', coalesce((
          select jsonb_agg(s.id order by s.nome)
          from public.servicos s
          left join public.funcionarios_servicos fs
            on fs.id_empresa = f.id_empresa
           and fs.id_funcionario = f.id
           and fs.id_servico = s.id
           and fs.ativo
          where s.id_empresa = f.id_empresa
            and s.ativo
            and s.permite_agendamento_online
            and (
              not exists (
                select 1
                from public.funcionarios_servicos configuracao
                where configuracao.id_empresa = f.id_empresa
                  and configuracao.id_funcionario = f.id
              )
              or fs.id is not null
            )
        ), '[]'::jsonb)
      ) order by f.nome)
      from public.funcionarios f
      where f.id_empresa = e.id
        and f.ativo
        and f.atende_clientes
    ), '[]'::jsonb)
  )
  from public.empresas e
  where e.id = p_id_empresa
    and e.status = 'ativo';
$_$;


ALTER FUNCTION "private"."obter_catalogo_site"("p_id_empresa" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date" DEFAULT CURRENT_DATE, "p_dias_periodo" integer DEFAULT 30) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_fuso text;
  v_tipo public.tipos_usuarios;
  v_funcionario_id bigint;
  v_escopo_pessoal boolean := false;
  v_pode_financeiro boolean := false;
  v_pode_avancado boolean := false;
  v_pode_estoque boolean := false;
  v_pode_contas boolean := false;
  v_dias integer;
  v_data date := coalesce(p_data_referencia, current_date);
  v_inicio_dia timestamptz;
  v_fim_dia timestamptz;
  v_inicio_periodo date;
  v_inicio_periodo_ts timestamptz;
  v_fim_periodo_ts timestamptz;
  v_inicio_periodo_anterior_ts timestamptz;
  v_agendamentos_hoje integer := 0;
  v_confirmados_hoje integer := 0;
  v_concluidos_hoje integer := 0;
  v_faturamento_hoje numeric := 0;
  v_faturamento_ontem numeric := 0;
  v_clientes_ativos integer := 0;
  v_clientes_novos integer := 0;
  v_clientes_novos_anterior integer := 0;
  v_capacidade_minutos integer := 0;
  v_ocupados_minutos integer := 0;
  v_agenda jsonb := '[]'::jsonb;
  v_faturamento_serie jsonb := '[]'::jsonb;
  v_servicos jsonb := '[]'::jsonb;
  v_funcionarios jsonb := '[]'::jsonb;
  v_estoque jsonb := '[]'::jsonb;
  v_contas jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or not private.usuario_pertence_empresa(p_id_empresa) then
    raise exception 'Você não possui acesso a esta empresa.';
  end if;

  if not private.plano_tem_funcionalidade_empresa(p_id_empresa, 'dashboard_basico') then
    raise exception 'O dashboard não está disponível no plano atual.';
  end if;

  select
    coalesce(nullif(e.fuso_horario, ''), 'America/Sao_Paulo'),
    ue.tipo,
    f.id
  into v_fuso, v_tipo, v_funcionario_id
  from public.usuarios_empresas ue
  join public.empresas e on e.id = ue.empresa_id
  left join public.funcionarios f
    on f.id_empresa = ue.empresa_id
   and f.usuario_empresa_id = ue.id
   and f.ativo
  where ue.empresa_id = p_id_empresa
    and ue.user_id = auth.uid()
    and ue.status = 'ativo'::public.status_usuario_empresa
  order by f.id nulls last
  limit 1;

  if not found then
    raise exception 'Vínculo ativo com a empresa não encontrado.';
  end if;

  v_escopo_pessoal := v_tipo = 'profissional'::public.tipos_usuarios;
  v_pode_financeiro := v_tipo in (
    'dono'::public.tipos_usuarios,
    'gerente'::public.tipos_usuarios
  ) and (
    private.plano_tem_funcionalidade_empresa(p_id_empresa, 'relatorios_financeiros_basicos')
    or private.plano_tem_funcionalidade_empresa(p_id_empresa, 'relatorios_dashboards_avancados')
  );
  v_pode_avancado := v_tipo in (
    'dono'::public.tipos_usuarios,
    'gerente'::public.tipos_usuarios
  ) and private.plano_tem_funcionalidade_empresa(
    p_id_empresa,
    'relatorios_dashboards_avancados'
  );
  v_pode_estoque := v_tipo <> 'profissional'::public.tipos_usuarios
    and private.plano_tem_funcionalidade_empresa(p_id_empresa, 'estoque');
  v_pode_contas := v_pode_financeiro
    and private.plano_tem_funcionalidade_empresa(p_id_empresa, 'contas_pagar_receber');

  v_dias := greatest(7, least(coalesce(p_dias_periodo, 30), 365));
  v_inicio_periodo := v_data - (v_dias - 1);
  v_inicio_dia := v_data::timestamp at time zone v_fuso;
  v_fim_dia := (v_data + 1)::timestamp at time zone v_fuso;
  v_inicio_periodo_ts := v_inicio_periodo::timestamp at time zone v_fuso;
  v_fim_periodo_ts := (v_data + 1)::timestamp at time zone v_fuso;
  v_inicio_periodo_anterior_ts := (v_inicio_periodo - v_dias)::timestamp at time zone v_fuso;

  select
    count(*)::integer,
    count(*) filter (where a.status = 'confirmado')::integer,
    count(*) filter (where a.status = 'finalizado')::integer
  into v_agendamentos_hoje, v_confirmados_hoje, v_concluidos_hoje
  from public.agendamentos a
  where a.id_empresa = p_id_empresa
    and a.status <> 'cancelado'
    and a.inicio < v_fim_dia
    and a.fim > v_inicio_dia
    and (
      not v_escopo_pessoal
      or (
        v_funcionario_id is not null
        and exists (
          select 1
          from public.agendamentos_servicos ags
          where ags.id_empresa = a.id_empresa
            and ags.id_agendamento = a.id
            and ags.id_funcionario = v_funcionario_id
            and ags.status <> 'cancelado'
        )
      )
    );

  if v_pode_financeiro then
    select
      coalesce(sum(c.valor_total) filter (
        where c.fechada_em >= v_inicio_dia
          and c.fechada_em < v_fim_dia
      ), 0),
      coalesce(sum(c.valor_total) filter (
        where c.fechada_em >= v_inicio_dia - interval '1 day'
          and c.fechada_em < v_inicio_dia
      ), 0)
    into v_faturamento_hoje, v_faturamento_ontem
    from public.comandas c
    where c.id_empresa = p_id_empresa
      and c.status = 'fechada'
      and c.fechada_em >= v_inicio_dia - interval '1 day'
      and c.fechada_em < v_fim_dia;
  end if;

  select count(*)::integer
  into v_clientes_ativos
  from public.clientes c
  where c.id_empresa = p_id_empresa and c.ativo;

  select
    count(*) filter (
      where c.created_at >= v_inicio_periodo_ts
        and c.created_at < v_fim_periodo_ts
    )::integer,
    count(*) filter (
      where c.created_at >= v_inicio_periodo_anterior_ts
        and c.created_at < v_inicio_periodo_ts
    )::integer
  into v_clientes_novos, v_clientes_novos_anterior
  from public.clientes c
  where c.id_empresa = p_id_empresa
    and c.created_at >= v_inicio_periodo_anterior_ts
    and c.created_at < v_fim_periodo_ts;

  with slots as (
    select distinct h.id_funcionario, slot.inicio
    from public.funcionarios_horarios h
    join public.funcionarios f
      on f.id_empresa = h.id_empresa
     and f.id = h.id_funcionario
     and f.ativo
     and f.atende_clientes
    cross join lateral generate_series(
      v_inicio_dia,
      v_fim_dia - interval '5 minutes',
      interval '5 minutes'
    ) slot(inicio)
    where h.id_empresa = p_id_empresa
      and h.ativo
      and h.dia_semana = extract(dow from v_data)::smallint
      and (not v_escopo_pessoal or h.id_funcionario = v_funcionario_id)
      and (slot.inicio at time zone v_fuso)::time >= h.hora_inicio
      and ((slot.inicio + interval '5 minutes') at time zone v_fuso)::time <= h.hora_fim
      and not (
        h.intervalo_inicio is not null
        and h.intervalo_fim is not null
        and (slot.inicio at time zone v_fuso)::time < h.intervalo_fim
        and ((slot.inicio + interval '5 minutes') at time zone v_fuso)::time > h.intervalo_inicio
      )
      and not exists (
        select 1
        from public.funcionarios_ausencias fa
        where fa.id_empresa = h.id_empresa
          and fa.id_funcionario = h.id_funcionario
          and fa.status = 'aprovado'
          and tstzrange(fa.inicio, fa.fim, '[)')
            && tstzrange(slot.inicio, slot.inicio + interval '5 minutes', '[)')
      )
      and not exists (
        select 1
        from public.bloqueios_agenda ba
        where ba.id_empresa = h.id_empresa
          and (ba.id_funcionario is null or ba.id_funcionario = h.id_funcionario)
          and ba.status = 'ativo'
          and tstzrange(ba.inicio, ba.fim, '[)')
            && tstzrange(slot.inicio, slot.inicio + interval '5 minutes', '[)')
      )
  ), ocupacao as (
    select
      count(*)::integer * 5 as capacidade,
      count(*) filter (
        where exists (
          select 1
          from public.agendamentos_servicos ags
          join public.agendamentos a
            on a.id_empresa = ags.id_empresa
           and a.id = ags.id_agendamento
          where ags.id_empresa = p_id_empresa
            and ags.id_funcionario = slots.id_funcionario
            and ags.status <> 'cancelado'
            and a.status not in ('cancelado', 'no_show')
            and tstzrange(ags.inicio, ags.fim, '[)')
              && tstzrange(slots.inicio, slots.inicio + interval '5 minutes', '[)')
        )
      )::integer * 5 as ocupados
    from slots
  )
  select coalesce(capacidade, 0), coalesce(ocupados, 0)
  into v_capacidade_minutos, v_ocupados_minutos
  from ocupacao;

  select coalesce(jsonb_agg(to_jsonb(agenda_item) order by agenda_item.inicio), '[]'::jsonb)
  into v_agenda
  from (
    select
      a.id,
      a.inicio,
      a.fim,
      a.status,
      c.id as cliente_id,
      c.nome as cliente_nome,
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', ags.id,
            'nome', s.nome,
            'profissional', f.nome,
            'cor', f.cor_agenda,
            'inicio', ags.inicio,
            'fim', ags.fim
          ) order by ags.inicio, ags.ordem
        )
        from public.agendamentos_servicos ags
        join public.servicos s
          on s.id_empresa = ags.id_empresa and s.id = ags.id_servico
        join public.funcionarios f
          on f.id_empresa = ags.id_empresa and f.id = ags.id_funcionario
        where ags.id_empresa = a.id_empresa
          and ags.id_agendamento = a.id
          and ags.status <> 'cancelado'
          and (not v_escopo_pessoal or ags.id_funcionario = v_funcionario_id)
      ), '[]'::jsonb) as servicos
    from public.agendamentos a
    join public.clientes c
      on c.id_empresa = a.id_empresa and c.id = a.id_cliente
    where a.id_empresa = p_id_empresa
      and a.status <> 'cancelado'
      and a.inicio < v_fim_dia
      and a.fim > v_inicio_dia
      and (
        not v_escopo_pessoal
        or (
          v_funcionario_id is not null
          and exists (
            select 1
            from public.agendamentos_servicos escopo
            where escopo.id_empresa = a.id_empresa
              and escopo.id_agendamento = a.id
              and escopo.id_funcionario = v_funcionario_id
              and escopo.status <> 'cancelado'
          )
        )
      )
    order by a.inicio
    limit 8
  ) agenda_item;

  if v_pode_financeiro then
    select coalesce(jsonb_agg(to_jsonb(serie) order by serie.data), '[]'::jsonb)
    into v_faturamento_serie
    from (
      select
        (v_inicio_periodo + dia.deslocamento)::date as data,
        coalesce(sum(c.valor_total), 0) as valor
      from generate_series(0, v_dias - 1) dia(deslocamento)
      left join public.comandas c
        on c.id_empresa = p_id_empresa
       and c.status = 'fechada'
       and (c.fechada_em at time zone v_fuso)::date = (v_inicio_periodo + dia.deslocamento)::date
      group by dia.deslocamento
      order by dia.deslocamento
    ) serie;
  end if;

  if v_pode_avancado then
    select coalesce(jsonb_agg(to_jsonb(ranking) order by ranking.faturamento desc, ranking.quantidade desc), '[]'::jsonb)
    into v_servicos
    from (
      select
        ci.id_servico as id,
        coalesce(s.nome, ci.descricao_snapshot) as nome,
        sum(ci.quantidade)::numeric as quantidade,
        coalesce(sum(ci.valor_total), 0)::numeric as faturamento
      from public.comandas c
      join public.comandas_itens ci
        on ci.id_empresa = c.id_empresa and ci.id_comanda = c.id
      left join public.servicos s
        on s.id_empresa = ci.id_empresa and s.id = ci.id_servico
      where c.id_empresa = p_id_empresa
        and c.status = 'fechada'
        and c.fechada_em >= v_inicio_periodo_ts
        and c.fechada_em < v_fim_periodo_ts
        and ci.tipo_item = 'servico'
      group by ci.id_servico, coalesce(s.nome, ci.descricao_snapshot)
      order by faturamento desc, quantidade desc
      limit 5
    ) ranking;

    select coalesce(jsonb_agg(to_jsonb(desempenho) order by desempenho.faturamento desc, desempenho.servicos desc), '[]'::jsonb)
    into v_funcionarios
    from (
      select
        f.id,
        f.nome,
        f.cargo,
        f.cor_agenda as cor,
        count(distinct c.id)::integer as atendimentos,
        sum(ci.quantidade)::numeric as servicos,
        coalesce(sum(ci.valor_total), 0)::numeric as faturamento,
        case
          when count(distinct c.id) = 0 then 0
          else round(coalesce(sum(ci.valor_total), 0) / count(distinct c.id), 2)
        end as ticket_medio
      from public.comandas c
      join public.comandas_itens ci
        on ci.id_empresa = c.id_empresa and ci.id_comanda = c.id
      join public.funcionarios f
        on f.id_empresa = ci.id_empresa and f.id = ci.id_funcionario
      where c.id_empresa = p_id_empresa
        and c.status = 'fechada'
        and c.fechada_em >= v_inicio_periodo_ts
        and c.fechada_em < v_fim_periodo_ts
        and ci.tipo_item = 'servico'
        and ci.id_funcionario is not null
      group by f.id, f.nome, f.cargo, f.cor_agenda
      order by faturamento desc, servicos desc
      limit 6
    ) desempenho;
  end if;

  if v_pode_estoque then
    select coalesce(jsonb_agg(to_jsonb(alerta) order by alerta.criticidade desc, alerta.nome), '[]'::jsonb)
    into v_estoque
    from (
      select
        p.id,
        p.nome,
        p.codigo,
        p.estoque_atual,
        p.estoque_minimo,
        p.unidade_medida,
        case
          when p.estoque_atual <= 0 then 2
          else 1
        end as criticidade
      from public.produtos p
      where p.id_empresa = p_id_empresa
        and p.ativo
        and p.controla_estoque
        and p.estoque_atual <= p.estoque_minimo
      order by criticidade desc, p.estoque_atual, p.nome
      limit 6
    ) alerta;
  end if;

  if v_pode_contas then
    select coalesce(jsonb_agg(to_jsonb(vencimento) order by vencimento.data_vencimento, vencimento.id), '[]'::jsonb)
    into v_contas
    from (
      select
        cp.id,
        c.id as conta_id,
        c.tipo,
        c.descricao,
        cp.numero_parcela,
        cp.data_vencimento,
        greatest(cp.valor_parcela - cp.valor_pago, 0)::numeric as saldo,
        cp.status,
        coalesce(cl.nome, nullif(fr.nome_fantasia, ''), fr.nome) as contraparte
      from public.contas_parcelas cp
      join public.contas c
        on c.id_empresa = cp.id_empresa and c.id = cp.id_conta
      left join public.clientes cl
        on cl.id_empresa = c.id_empresa and cl.id = c.id_cliente
      left join public.fornecedores fr
        on fr.id_empresa = c.id_empresa and fr.id = c.id_fornecedor
      where cp.id_empresa = p_id_empresa
        and c.status <> 'cancelada'
        and cp.status not in ('paga', 'cancelada')
        and greatest(cp.valor_parcela - cp.valor_pago, 0) > 0
        and cp.data_vencimento between v_data - 30 and v_data + 7
      order by cp.data_vencimento, cp.id
      limit 8
    ) vencimento;
  end if;

  return jsonb_build_object(
    'meta', jsonb_build_object(
      'data_referencia', v_data,
      'inicio_periodo', v_inicio_periodo,
      'dias_periodo', v_dias,
      'fuso_horario', v_fuso,
      'escopo_pessoal', v_escopo_pessoal,
      'pode_ver_financeiro', v_pode_financeiro,
      'relatorios_avancados', v_pode_avancado,
      'pode_ver_estoque', v_pode_estoque,
      'pode_ver_contas', v_pode_contas
    ),
    'indicadores', jsonb_build_object(
      'agendamentos_hoje', v_agendamentos_hoje,
      'confirmados_hoje', v_confirmados_hoje,
      'concluidos_hoje', v_concluidos_hoje,
      'faturamento_hoje', v_faturamento_hoje,
      'faturamento_ontem', v_faturamento_ontem,
      'variacao_faturamento', case
        when v_faturamento_ontem > 0
          then round(((v_faturamento_hoje - v_faturamento_ontem) / v_faturamento_ontem) * 100, 1)
        when v_faturamento_hoje > 0 then 100
        else 0
      end,
      'clientes_ativos', v_clientes_ativos,
      'clientes_novos', v_clientes_novos,
      'clientes_novos_anterior', v_clientes_novos_anterior,
      'variacao_clientes', case
        when v_clientes_novos_anterior > 0
          then round(((v_clientes_novos - v_clientes_novos_anterior)::numeric / v_clientes_novos_anterior) * 100, 1)
        when v_clientes_novos > 0 then 100
        else 0
      end,
      'capacidade_minutos', v_capacidade_minutos,
      'ocupados_minutos', v_ocupados_minutos,
      'taxa_ocupacao', case
        when v_capacidade_minutos > 0
          then round(least(100, v_ocupados_minutos::numeric / v_capacidade_minutos * 100), 1)
        else 0
      end
    ),
    'agenda', v_agenda,
    'faturamento_serie', v_faturamento_serie,
    'servicos_mais_vendidos', v_servicos,
    'desempenho_funcionarios', v_funcionarios,
    'estoque_baixo', v_estoque,
    'contas_vencimento', v_contas
  );
end;
$$;


ALTER FUNCTION "private"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date", "p_dias_periodo" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "private"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date", "p_dias_periodo" integer) IS 'Consolida indicadores, agenda e relatórios do dashboard com escopo por empresa, plano, cargo e fuso horário.';



CREATE OR REPLACE FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint DEFAULT NULL::bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id_unidade bigint;
begin
  select u.id into v_id_unidade
  from public.unidades u
  where u.id_empresa = p_id_empresa and u.ativo
  order by u.principal desc, u.id
  limit 1;

  return private.obter_disponibilidade_site(
    p_id_empresa, v_id_unidade, p_data, p_id_servico, p_id_funcionario
  );
end;
$$;


ALTER FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint DEFAULT NULL::bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_fuso text;
  v_hoje date;
  v_antecedencia_minutos integer := 120;
  v_janela_dias integer := 60;
  v_resultado jsonb;
begin
  select coalesce(u.fuso_horario, e.fuso_horario, 'America/Sao_Paulo')
    into v_fuso
  from public.unidades u
  join public.empresas e on e.id = u.id_empresa
  where u.id_empresa = p_id_empresa
    and u.id = p_id_unidade
    and u.ativo
    and e.status = 'ativo';

  if not found then
    raise exception 'Unidade indisponivel para agendamento online.';
  end if;

  select
    p.antecedencia_agendamento_minutos,
    p.janela_agendamento_dias
    into v_antecedencia_minutos, v_janela_dias
  from public.politicas_cancelamento p
  where p.id_empresa = p_id_empresa
    and p.ativo
    and p.vigente_desde <= p_data
    and (p.vigente_ate is null or p.vigente_ate >= p_data)
    and (p.id_unidade = p_id_unidade or p.id_unidade is null)
  order by (p.id_unidade = p_id_unidade) desc, p.vigente_desde desc, p.id desc
  limit 1;

  v_antecedencia_minutos := coalesce(v_antecedencia_minutos, 120);
  v_janela_dias := coalesce(v_janela_dias, 60);
  v_hoje := (now() at time zone v_fuso)::date;

  if p_data < v_hoje or p_data > v_hoje + v_janela_dias then
    raise exception 'Escolha uma data entre hoje e os proximos % dias.', v_janela_dias;
  end if;

  with servico as (
    select s.*
    from public.servicos s
    where s.id_empresa = p_id_empresa
      and s.id = p_id_servico
      and s.ativo
      and s.permite_agendamento_online
  ), elegiveis as (
    select
      f.id as id_funcionario,
      regexp_replace(f.nome, '[[:space:]]*\(Teste\)[[:space:]]*$', '', 'i') as nome_funcionario,
      coalesce(fs.duracao_personalizada, s.duracao_minutos) as duracao_minutos,
      greatest(coalesce(s.intervalo_minutos, 0), 0) as intervalo_minutos,
      coalesce(fs.valor_personalizado, s.preco) as preco,
      greatest(coalesce(cfg.duracao_slot_minutos, 30), 5) as passo_minutos
    from servico s
    join public.funcionarios f
      on f.id_empresa = s.id_empresa
     and f.ativo
     and f.atende_clientes
    left join public.funcionarios_servicos fs
      on fs.id_empresa = f.id_empresa
     and fs.id_funcionario = f.id
     and fs.id_servico = s.id
     and fs.ativo
    left join public.configuracoes_empresas cfg
      on cfg.id_empresa = f.id_empresa
    where (p_id_funcionario is null or f.id = p_id_funcionario)
      and (
        not exists (
          select 1
          from public.funcionarios_servicos configuracao
          where configuracao.id_empresa = f.id_empresa
            and configuracao.id_funcionario = f.id
        )
        or fs.id is not null
      )
  ), candidatos_locais as (
    select
      e.id_funcionario,
      e.nome_funcionario,
      e.duracao_minutos,
      e.intervalo_minutos,
      e.preco,
      ph.intervalo_inicio as profissional_intervalo_inicio,
      ph.intervalo_fim as profissional_intervalo_fim,
      uh.intervalo_inicio as unidade_intervalo_inicio,
      uh.intervalo_fim as unidade_intervalo_fim,
      slot.inicio_local,
      slot.inicio_local + make_interval(mins => e.duracao_minutos) as fim_local
    from elegiveis e
    join public.funcionarios_horarios ph
      on ph.id_empresa = p_id_empresa
     and ph.id_funcionario = e.id_funcionario
     and ph.ativo
     and ph.dia_semana = extract(dow from p_data)::integer
    join public.horarios_funcionamento uh
      on uh.id_empresa = p_id_empresa
     and uh.id_unidade = p_id_unidade
     and uh.ativo
     and uh.dia_semana = extract(dow from p_data)::integer
    cross join lateral generate_series(
      (p_data + greatest(ph.hora_inicio, uh.hora_abertura))::timestamp,
      (p_data + least(ph.hora_fim, uh.hora_fechamento))::timestamp
        - make_interval(mins => e.duracao_minutos),
      make_interval(mins => e.passo_minutos)
    ) as slot(inicio_local)
    where greatest(ph.hora_inicio, uh.hora_abertura)
      < least(ph.hora_fim, uh.hora_fechamento)
  ), candidatos as (
    select
      c.*,
      c.inicio_local at time zone v_fuso as inicio,
      c.fim_local at time zone v_fuso as fim
    from candidatos_locais c
    where not (
      c.profissional_intervalo_inicio is not null
      and c.profissional_intervalo_fim is not null
      and c.inicio_local < (p_data + c.profissional_intervalo_fim)::timestamp
      and c.fim_local > (p_data + c.profissional_intervalo_inicio)::timestamp
    )
    and not (
      c.unidade_intervalo_inicio is not null
      and c.unidade_intervalo_fim is not null
      and c.inicio_local < (p_data + c.unidade_intervalo_fim)::timestamp
      and c.fim_local > (p_data + c.unidade_intervalo_inicio)::timestamp
    )
  ), disponiveis as (
    select c.*
    from candidatos c
    where c.inicio >= now() + make_interval(mins => v_antecedencia_minutos)
      and not exists (
        select 1
        from public.agendamentos_servicos item
        join public.servicos servico_existente
          on servico_existente.id_empresa = item.id_empresa
         and servico_existente.id = item.id_servico
        where item.id_empresa = p_id_empresa
          and item.id_funcionario = c.id_funcionario
          and item.status not in ('cancelado', 'concluido')
          and item.inicio < c.fim + make_interval(mins => c.intervalo_minutos)
          and item.fim + make_interval(
            mins => greatest(coalesce(servico_existente.intervalo_minutos, 0), 0)
          ) > c.inicio
      )
      and not exists (
        select 1
        from public.funcionarios_ausencias ausencia
        where ausencia.id_empresa = p_id_empresa
          and ausencia.id_funcionario = c.id_funcionario
          and ausencia.status = 'aprovado'
          and ausencia.inicio < c.fim
          and ausencia.fim > c.inicio
      )
      and not exists (
        select 1
        from public.bloqueios_agenda bloqueio
        where bloqueio.id_empresa = p_id_empresa
          and bloqueio.status = 'ativo'
          and (bloqueio.id_unidade is null or bloqueio.id_unidade = p_id_unidade)
          and (bloqueio.id_funcionario is null or bloqueio.id_funcionario = c.id_funcionario)
          and bloqueio.inicio < c.fim
          and bloqueio.fim > c.inicio
      )
      and not exists (
        select 1
        from public.disponibilidades indisponivel
        where indisponivel.id_empresa = p_id_empresa
          and indisponivel.id_unidade = p_id_unidade
          and indisponivel.id_profissional = c.id_funcionario
          and indisponivel.tipo = 'indisponivel'
          and indisponivel.ativo
          and indisponivel.inicio < c.fim
          and indisponivel.fim > c.inicio
      )
      and (
        not exists (
          select 1
          from public.disponibilidades janela
          where janela.id_empresa = p_id_empresa
            and janela.id_unidade = p_id_unidade
            and janela.id_profissional = c.id_funcionario
            and janela.tipo = 'disponivel'
            and janela.ativo
            and (janela.inicio at time zone v_fuso)::date = p_data
        )
        or exists (
          select 1
          from public.disponibilidades janela
          where janela.id_empresa = p_id_empresa
            and janela.id_unidade = p_id_unidade
            and janela.id_profissional = c.id_funcionario
            and janela.tipo = 'disponivel'
            and janela.ativo
            and janela.inicio <= c.inicio
            and janela.fim >= c.fim
        )
      )
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'id_funcionario', d.id_funcionario,
    'nome_funcionario', d.nome_funcionario,
    'inicio', d.inicio,
    'fim', d.fim,
    'horario', to_char(d.inicio_local, 'HH24:MI'),
    'duracao_minutos', d.duracao_minutos,
    'intervalo_minutos', d.intervalo_minutos,
    'preco', d.preco
  ) order by d.inicio, d.nome_funcionario), '[]'::jsonb)
    into v_resultado
  from disponiveis d;

  return v_resultado;
end;
$_$;


ALTER FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."plano_limite_funcionalidade_empresa"("p_id_empresa" bigint, "p_funcionalidade" "text") RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select case
    when permissao.ilimitado then null
    else coalesce(permissao.limite, 0)::bigint
  end
  from (
    select pp.ilimitado, pp.limite
    from public.assinaturas a
    join public.planos p on p.id = a.id_plano and p.ativo
    join public.permissoes_planos pp
      on pp.plano_id = p.id
     and pp.funcionalidade = p_funcionalidade
     and pp.ativo
    where a.id_empresa = p_id_empresa
      and a.status::text in ('ativa', 'teste')
      and (a.teste_finaliza_em is null or a.teste_finaliza_em > now())
      and (a.periodo_atual_fim is null or a.periodo_atual_fim > now())
    order by a.inicio desc, a.id desc
    limit 1
  ) permissao;
$$;


ALTER FUNCTION "private"."plano_limite_funcionalidade_empresa"("p_id_empresa" bigint, "p_funcionalidade" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."plano_tem_funcionalidade_empresa"("p_id_empresa" bigint, "p_funcionalidade" "text") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select coalesce((
    select pp.ativo
    from public.assinaturas a
    join public.planos p on p.id = a.id_plano and p.ativo
    join public.permissoes_planos pp
      on pp.plano_id = p.id
     and pp.funcionalidade = p_funcionalidade
    where a.id_empresa = p_id_empresa
      and a.status::text in ('ativa', 'teste')
      and (a.teste_finaliza_em is null or a.teste_finaliza_em > now())
      and (a.periodo_atual_fim is null or a.periodo_atual_fim > now())
    order by a.inicio desc, a.id desc
    limit 1
  ), false);
$$;


ALTER FUNCTION "private"."plano_tem_funcionalidade_empresa"("p_id_empresa" bigint, "p_funcionalidade" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_agendamento_operacional"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.id_unidade is null then
    select u.id into new.id_unidade
    from public.unidades u
    where u.id_empresa = new.id_empresa and u.ativo
    order by u.principal desc, u.id
    limit 1;
  end if;

  if new.id_unidade is null then
    raise exception 'A empresa precisa de uma unidade ativa para receber agendamentos.';
  end if;

  if tg_op = 'INSERT' or new.sinal_status is distinct from old.sinal_status then
    new.pagamento_status := case
      when new.sinal_status = 'pago' then 'pago'
      when new.sinal_status = 'pendente' then 'pendente'
      else coalesce(new.pagamento_status, 'nao_exigido')
    end;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_agendamento_operacional"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_agendamento_servico"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_agendamento public.agendamentos%rowtype;
  v_duracao integer;
  v_preco numeric(10,2);
  v_tem_configuracao boolean;
begin
  select * into v_agendamento
  from public.agendamentos a
  where a.id = new.id_agendamento and a.id_empresa = new.id_empresa;

  if not found then
    raise exception 'Agendamento inválido para esta empresa.';
  end if;

  if v_agendamento.status in ('finalizado', 'no_show', 'cancelado') then
    raise exception 'Não é permitido alterar serviços de um agendamento encerrado.';
  end if;

  if new.inicio < v_agendamento.inicio
     or coalesce(new.fim, new.inicio) > v_agendamento.fim then
    raise exception 'O serviço precisa estar dentro do período do agendamento.';
  end if;

  select exists (
    select 1 from public.funcionarios_servicos fs
    where fs.id_empresa = new.id_empresa
      and fs.id_funcionario = new.id_funcionario
  ) into v_tem_configuracao;

  select
    coalesce(fs.duracao_personalizada, s.duracao_minutos),
    coalesce(fs.valor_personalizado, s.preco)
  into v_duracao, v_preco
  from public.servicos s
  join public.funcionarios f
    on f.id_empresa = s.id_empresa
   and f.id = new.id_funcionario
   and f.ativo
   and f.atende_clientes
  left join public.funcionarios_servicos fs
    on fs.id_empresa = s.id_empresa
   and fs.id_servico = s.id
   and fs.id_funcionario = new.id_funcionario
   and fs.ativo
  where s.id_empresa = new.id_empresa
    and s.id = new.id_servico
    and s.ativo
    and (not v_tem_configuracao or fs.id is not null);

  if not found then
    raise exception 'O profissional não está habilitado para este serviço.';
  end if;

  new.duracao_minutos = coalesce(new.duracao_minutos, v_duracao);
  new.preco = coalesce(new.preco, v_preco);
  new.fim = coalesce(new.fim, new.inicio + make_interval(mins => new.duracao_minutos));

  if new.fim > v_agendamento.fim then
    raise exception 'O serviço ultrapassa o fim do agendamento.';
  end if;

  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_agendamento_servico"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_ausencia_funcionario"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op='UPDATE' and new.id_empresa is distinct from old.id_empresa then
    raise exception 'A empresa da ausência não pode ser alterada.';
  end if;

  if not exists (
    select 1 from public.funcionarios f
     where f.id=new.id_funcionario and f.id_empresa=new.id_empresa and f.ativo
  ) then
    raise exception 'Funcionário inválido, inativo ou pertencente a outra empresa.';
  end if;

  if new.status='cancelada' then
    new.cancelado_em:=coalesce(new.cancelado_em,now());
    new.cancelado_por:=coalesce(new.cancelado_por,auth.uid());
  elsif exists (
    select 1 from public.agendamentos_servicos ags
    join public.agendamentos a on a.id=ags.id_agendamento
     where ags.id_empresa=new.id_empresa
       and ags.id_funcionario=new.id_funcionario
       and ags.status not in ('cancelado','finalizado','no_show')
       and a.status not in ('cancelado','finalizado','no_show')
       and tstzrange(ags.inicio,ags.fim,'[)') && tstzrange(new.inicio,new.fim,'[)')
  ) then
    raise exception 'Já existem agendamentos ativos durante esta ausência.';
  end if;

  new.criado_por:=coalesce(new.criado_por,auth.uid());
  new.updated_at:=now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_ausencia_funcionario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_bloqueio_agenda"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op='UPDATE' and new.id_empresa is distinct from old.id_empresa then
    raise exception 'A empresa do bloqueio não pode ser alterada.';
  end if;

  if new.id_funcionario is not null and not exists (
    select 1 from public.funcionarios f
     where f.id=new.id_funcionario and f.id_empresa=new.id_empresa and f.ativo
  ) then
    raise exception 'Funcionário inválido, inativo ou pertencente a outra empresa.';
  end if;

  if new.status='cancelado' then
    new.cancelado_em:=coalesce(new.cancelado_em,now());
    new.cancelado_por:=coalesce(new.cancelado_por,auth.uid());
  elsif exists (
    select 1 from public.agendamentos_servicos ags
    join public.agendamentos a on a.id=ags.id_agendamento
     where ags.id_empresa=new.id_empresa
       and (new.id_funcionario is null or ags.id_funcionario=new.id_funcionario)
       and ags.status not in ('cancelado','finalizado','no_show')
       and a.status not in ('cancelado','finalizado','no_show')
       and tstzrange(ags.inicio,ags.fim,'[)') && tstzrange(new.inicio,new.fim,'[)')
  ) then
    raise exception 'Já existem agendamentos ativos dentro deste bloqueio.';
  end if;

  new.criado_por:=coalesce(new.criado_por,auth.uid());
  new.updated_at:=now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_bloqueio_agenda"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_comanda"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_subtotal numeric(14,2);
  v_desconto_itens numeric(14,2);
begin
  if tg_op = 'UPDATE' then
    if new.id_empresa is distinct from old.id_empresa then
      raise exception 'A empresa da comanda não pode ser alterada.';
    end if;
    if old.status = 'cancelada'
       and (to_jsonb(new) - array['updated_at'])
           is distinct from
           (to_jsonb(old) - array['updated_at']) then
      raise exception 'Comanda cancelada não pode ser alterada.';
    end if;
    if old.status = 'fechada' and new.status is distinct from 'cancelada'
       and (to_jsonb(new) - array['updated_at'])
           is distinct from
           (to_jsonb(old) - array['updated_at']) then
      raise exception 'Comanda fechada não pode ter seus dados comerciais alterados.';
    end if;
    if new.status is distinct from old.status and not (
      (old.status = 'aberta' and new.status in ('fechada','cancelada'))
      or (old.status = 'fechada' and new.status = 'cancelada')
    ) then
      raise exception 'Transição de status inválida para a comanda.';
    end if;
  end if;

  if not exists (
    select 1 from public.clientes c
    where c.id = new.id_cliente
      and c.id_empresa = new.id_empresa
  ) then
    raise exception 'Cliente inválido ou pertencente a outra empresa.';
  end if;

  if new.id_funcionario_responsavel is not null and not exists (
    select 1 from public.funcionarios f
    where f.id = new.id_funcionario_responsavel
      and f.id_empresa = new.id_empresa
      and f.ativo
  ) then
    raise exception 'Funcionário responsável inválido ou inativo.';
  end if;

  if new.id_agendamento is not null and not exists (
    select 1 from public.agendamentos a
    where a.id = new.id_agendamento
      and a.id_empresa = new.id_empresa
      and a.id_cliente = new.id_cliente
  ) then
    raise exception 'O agendamento não pertence ao cliente e à empresa informados.';
  end if;

  if new.id_orcamento is not null and not exists (
    select 1 from public.orcamentos o
    where o.id = new.id_orcamento
      and o.id_empresa = new.id_empresa
      and o.id_cliente = new.id_cliente
  ) then
    raise exception 'O orçamento não pertence ao cliente e à empresa informados.';
  end if;

  select
    coalesce(sum(i.quantidade * i.valor_unitario_snapshot), 0),
    coalesce(sum(i.desconto), 0)
  into v_subtotal, v_desconto_itens
  from public.comandas_itens i
  where i.id_comanda = new.id;

  new.subtotal := v_subtotal;
  new.desconto_itens := v_desconto_itens;

  if new.status = 'fechada' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.fechada_em := coalesce(new.fechada_em, now());
  elsif new.status = 'cancelada' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.cancelada_em := coalesce(new.cancelada_em, now());
    if nullif(btrim(new.motivo_cancelamento), '') is null then
      raise exception 'Informe o motivo do cancelamento da comanda.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_comanda"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_comanda_item"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_empresa bigint;
  v_status text;
  v_nome text;
  v_preco numeric;
  v_custo numeric;
  v_base numeric;
begin
  if tg_op = 'UPDATE' and (
    new.id_comanda is distinct from old.id_comanda
    or new.tipo_item is distinct from old.tipo_item
    or new.id_servico is distinct from old.id_servico
    or new.id_produto is distinct from old.id_produto
    or new.id_orcamento_item is distinct from old.id_orcamento_item
  ) then
    raise exception 'Não é permitido trocar o vínculo ou o catálogo de um item existente.';
  end if;

  select c.id_empresa, c.status
  into v_empresa, v_status
  from public.comandas c
  where c.id = new.id_comanda;

  if not found then
    raise exception 'Comanda não encontrada.';
  end if;

  if v_status <> 'aberta' then
    raise exception 'Somente comandas abertas podem ter itens alterados.';
  end if;

  new.id_empresa := v_empresa;

  if new.id_funcionario is not null and not exists (
    select 1 from public.funcionarios f
    where f.id = new.id_funcionario and f.id_empresa = v_empresa and f.ativo
  ) then
    raise exception 'Funcionário inválido, inativo ou pertencente a outra empresa.';
  end if;

  if tg_op = 'INSERT' and new.tipo_item = 'servico' then
    select s.nome, s.preco into v_nome, v_preco
    from public.servicos s
    where s.id = new.id_servico and s.id_empresa = v_empresa and s.ativo;

    if not found then
      raise exception 'Serviço inválido, inativo ou pertencente a outra empresa.';
    end if;

    if not exists (
      select 1 from public.funcionarios_servicos fs
      where fs.id_empresa = v_empresa
        and fs.id_funcionario = new.id_funcionario
        and fs.id_servico = new.id_servico
        and fs.ativo
    ) then
      raise exception 'O funcionário não está habilitado para executar este serviço.';
    end if;

    new.descricao_snapshot := coalesce(nullif(btrim(new.descricao_snapshot), ''), v_nome);
    new.valor_unitario_snapshot := coalesce(new.valor_unitario_snapshot, v_preco);
  elsif tg_op = 'INSERT' and new.tipo_item = 'produto' then
    select p.nome, p.preco_venda, p.custo_medio into v_nome, v_preco, v_custo
    from public.produtos p
    where p.id = new.id_produto and p.id_empresa = v_empresa and p.ativo;

    if not found then
      raise exception 'Produto inválido, inativo ou pertencente a outra empresa.';
    end if;

    new.descricao_snapshot := coalesce(nullif(btrim(new.descricao_snapshot), ''), v_nome);
    new.valor_unitario_snapshot := coalesce(new.valor_unitario_snapshot, v_preco);
    new.custo_unitario_snapshot := coalesce(new.custo_unitario_snapshot, v_custo);
  elsif tg_op = 'INSERT' then
    if nullif(btrim(new.descricao_snapshot), '') is null or new.valor_unitario_snapshot is null then
      raise exception 'Itens avulsos exigem descrição e valor.';
    end if;
  end if;

  v_base := greatest(new.quantidade * new.valor_unitario_snapshot - new.desconto, 0);
  if new.comissao_tipo_snapshot = 'percentual' then
    new.comissao_calculada := round(v_base * new.comissao_valor_snapshot / 100, 2);
  elsif new.comissao_tipo_snapshot = 'fixo' then
    new.comissao_calculada := round(new.quantidade * new.comissao_valor_snapshot, 2);
  else
    new.comissao_calculada := 0;
  end if;

  new.updated_at := now();
  return new;
end
$$;


ALTER FUNCTION "private"."preparar_comanda_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_compra"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'UPDATE' then
    if new.id_empresa is distinct from old.id_empresa then
      raise exception 'A empresa da compra não pode ser alterada.';
    end if;
    if old.status in ('recebida','cancelada')
       and (to_jsonb(new) - array['observacoes','anexos','updated_at'])
           is distinct from
           (to_jsonb(old) - array['observacoes','anexos','updated_at']) then
      raise exception 'Compra recebida ou cancelada não pode ter seus dados comerciais alterados.';
    end if;
    if new.status = 'cancelada' and old.status <> 'cancelada'
       and exists (
         select 1
         from public.compras_itens ci
         where ci.id_compra = old.id
           and ci.quantidade_recebida > 0
       ) then
      raise exception 'Não cancele uma compra já recebida; estorne primeiro os movimentos de estoque.';
    end if;
  end if;

  if tg_op = 'INSERT' or new.id_fornecedor is distinct from old.id_fornecedor then
    if not exists (
      select 1
      from public.fornecedores f
      where f.id = new.id_fornecedor
        and f.id_empresa = new.id_empresa
        and f.ativo
    ) then
      raise exception 'Fornecedor inválido, inativo ou pertencente a outra empresa.';
    end if;
  elsif not exists (
    select 1
    from public.fornecedores f
    where f.id = new.id_fornecedor
      and f.id_empresa = new.id_empresa
  ) then
    raise exception 'Fornecedor inválido ou pertencente a outra empresa.';
  end if;

  new.criado_por := coalesce(new.criado_por, auth.uid());
  new.total_final := greatest(new.total_produtos + new.frete - new.desconto, 0);
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_compra"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_compra_item"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_empresa bigint;
  v_status text;
  v_nome text;
begin
  select c.id_empresa, c.status
    into v_empresa, v_status
  from public.compras c
  where c.id = new.id_compra;

  if not found then
    raise exception 'Compra não encontrada.';
  end if;
  if v_status in ('recebida','cancelada') then
    raise exception 'Itens de compra recebida ou cancelada não podem ser alterados.';
  end if;

  if tg_op = 'UPDATE' and (
    new.id_compra is distinct from old.id_compra
    or new.id_produto is distinct from old.id_produto
  ) then
    raise exception 'Não é permitido trocar a compra ou o produto do item.';
  end if;

  if tg_op = 'UPDATE' and new.quantidade_recebida < old.quantidade_recebida then
    raise exception 'A quantidade recebida não pode diminuir; estorne o movimento de estoque correspondente.';
  end if;

  select p.nome
    into v_nome
  from public.produtos p
  where p.id = new.id_produto
    and p.id_empresa = v_empresa
    and (p.ativo or tg_op = 'UPDATE');

  if not found then
    raise exception 'Produto inválido, inativo ou pertencente a outra empresa.';
  end if;

  new.id_empresa := v_empresa;
  new.descricao_snapshot := coalesce(nullif(btrim(new.descricao_snapshot), ''), v_nome);
  new.total := round(new.quantidade_comprada * new.valor_unitario - new.desconto, 2);
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_compra_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_horario_funcionario"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op='UPDATE' and new.id_empresa is distinct from old.id_empresa then
    raise exception 'A empresa do horário não pode ser alterada.';
  end if;

  if not exists (
    select 1 from public.funcionarios f
     where f.id=new.id_funcionario and f.id_empresa=new.id_empresa and f.ativo
  ) then
    raise exception 'Funcionário inválido, inativo ou pertencente a outra empresa.';
  end if;

  if new.ativo and exists (
    select 1 from public.horarios_funcionarios h
     where h.id_empresa=new.id_empresa
       and h.id_funcionario=new.id_funcionario
       and h.dia_semana=new.dia_semana
       and h.ativo
       and h.id<>coalesce(new.id,0)
       and daterange(h.vigente_de,coalesce(h.vigente_ate,'infinity'::date),'[]')
           && daterange(new.vigente_de,coalesce(new.vigente_ate,'infinity'::date),'[]')
       and h.hora_inicio < new.hora_fim
       and new.hora_inicio < h.hora_fim
  ) then
    raise exception 'Este horário se sobrepõe a outro período do funcionário.';
  end if;

  new.criado_por:=coalesce(new.criado_por,auth.uid());
  new.updated_at:=now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_horario_funcionario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_lancamento_comissao"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'UPDATE' then
    if new.id_empresa is distinct from old.id_empresa
       or new.id_funcionario is distinct from old.id_funcionario
       or new.id_comanda is distinct from old.id_comanda
       or new.id_comanda_item is distinct from old.id_comanda_item
       or new.valor_comissao is distinct from old.valor_comissao
       or new.tipo_calculo is distinct from old.tipo_calculo then
      raise exception 'A origem e o cálculo de uma comissão lançada são imutáveis.';
    end if;

    if old.status = 'estornada' and new.status is distinct from old.status then
      raise exception 'Comissão estornada não pode mudar de status.';
    end if;

    if old.status = 'paga'
       and new.status is distinct from old.status
       and not (
         new.status in ('liberada', 'parcial')
         and new.valor_pago >= 0
         and new.valor_pago < old.valor_pago
       ) then
      raise exception 'Comissão paga somente pode ser reaberta pelo estorno de um pagamento.';
    end if;
  end if;

  if new.status = 'liberada' then
    new.liberada_em := coalesce(new.liberada_em, now());
  elsif new.status = 'estornada' then
    new.estornada_em := coalesce(new.estornada_em, now());
    if nullif(btrim(new.motivo_estorno), '') is null then
      raise exception 'Informe o motivo do estorno da comissão.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_lancamento_comissao"() OWNER TO "postgres";


COMMENT ON FUNCTION "private"."preparar_lancamento_comissao"() IS 'Protege a origem da comissão e permite reabertura apenas quando um pagamento é estornado.';



CREATE OR REPLACE FUNCTION "private"."preparar_movimento_caixa"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_empresa bigint;
  v_caixa bigint;
  v_status_sessao text;
  v_saldo_esperado numeric(14,2);
  v_permite_negativo boolean;
  v_empresa_pagamento bigint;
  v_sessao_pagamento bigint;
  v_tipo_pagamento text;
  v_valor_pagamento numeric(14,2);
  v_status_pagamento text;
  v_forma_pagamento bigint;
  v_efeito_antigo numeric(14,2) := 0;
  v_efeito_novo numeric(14,2);
begin
  if tg_op = 'UPDATE' and (
    new.id_sessao_caixa is distinct from old.id_sessao_caixa
    or new.id_pagamento is distinct from old.id_pagamento
    or new.origem is distinct from old.origem
  ) then
    raise exception 'Sessão, pagamento e origem do movimento não podem ser alterados.';
  end if;

  select
    s.id_empresa, s.id_caixa, s.status, s.saldo_esperado,
    c.permite_saldo_negativo
  into
    v_empresa, v_caixa, v_status_sessao, v_saldo_esperado,
    v_permite_negativo
  from public.sessoes_caixa s
  join public.caixas c on c.id = s.id_caixa and c.id_empresa = s.id_empresa
  where s.id = new.id_sessao_caixa;

  if not found then
    raise exception 'Sessão de caixa não encontrada.';
  end if;

  if v_status_sessao <> 'aberta' then
    raise exception 'Movimentos só podem ser lançados em uma sessão aberta.';
  end if;

  new.id_empresa := v_empresa;
  new.id_caixa := v_caixa;

  if new.origem = 'pagamento' then
    select
      p.id_empresa, p.id_sessao_caixa, p.tipo, p.valor,
      p.status, p.id_forma_pagamento
    into
      v_empresa_pagamento, v_sessao_pagamento, v_tipo_pagamento,
      v_valor_pagamento, v_status_pagamento, v_forma_pagamento
    from public.pagamentos p
    where p.id = new.id_pagamento;

    if not found
       or v_empresa_pagamento <> v_empresa
       or v_sessao_pagamento <> new.id_sessao_caixa then
      raise exception 'O pagamento não pertence à sessão e à empresa informadas.';
    end if;

    if new.tipo <> (case when v_tipo_pagamento = 'entrada' then 'entrada' else 'saida' end)
       or new.valor <> v_valor_pagamento then
      raise exception 'Tipo e valor do movimento devem corresponder ao pagamento.';
    end if;

    if new.status = 'ativo' and v_status_pagamento <> 'confirmado' then
      raise exception 'Somente pagamentos confirmados podem gerar movimentos ativos.';
    end if;

    if new.status = 'estornado' and v_status_pagamento <> 'estornado' then
      raise exception 'O movimento só pode ser estornado junto com o pagamento.';
    end if;

    new.id_forma_pagamento := v_forma_pagamento;
  end if;

  if tg_op = 'INSERT' then
    new.criado_por := coalesce(new.criado_por, auth.uid());
  else
    v_efeito_antigo := case
      when old.status = 'estornado' then 0
      when old.tipo in ('entrada','suprimento','ajuste_entrada') then old.valor
      else -old.valor
    end;
  end if;

  v_efeito_novo := case
    when new.status = 'estornado' then 0
    when new.tipo in ('entrada','suprimento','ajuste_entrada') then new.valor
    else -new.valor
  end;

  if not v_permite_negativo
     and v_saldo_esperado - v_efeito_antigo + v_efeito_novo < 0 then
    raise exception 'O movimento deixaria o caixa com saldo negativo.';
  end if;

  if new.status = 'estornado' then
    if nullif(btrim(new.motivo_estorno), '') is null then
      raise exception 'Informe o motivo do estorno do movimento.';
    end if;
    new.estornado_em := coalesce(new.estornado_em, now());
    new.estornado_por := coalesce(new.estornado_por, auth.uid());
  else
    new.estornado_em := null;
    new.estornado_por := null;
    new.motivo_estorno := null;
  end if;

  new.updated_at := now();
  return new;
end
$$;


ALTER FUNCTION "private"."preparar_movimento_caixa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_movimento_estoque"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_estoque numeric;
  v_novo_estoque numeric;
  v_entrada boolean;
begin
  if tg_op = 'INSERT' then
    select p.estoque_atual
      into v_estoque
      from public.produtos p
     where p.id = new.id_produto
       and p.id_empresa = new.id_empresa
       and p.ativo
       and p.controla_estoque
     for update;

    if not found then
      raise exception 'Produto inválido, inativo, de outra empresa ou sem controle de estoque.';
    end if;

    v_entrada := new.tipo in ('entrada_compra','entrada_devolucao','entrada_ajuste');
    v_novo_estoque := case when v_entrada then v_estoque + new.quantidade else v_estoque - new.quantidade end;

    if v_novo_estoque < 0 then
      raise exception 'Estoque insuficiente. Disponível: %, solicitado: %.', v_estoque, new.quantidade;
    end if;

    new.estoque_antes := v_estoque;
    new.estoque_depois := v_novo_estoque;
    new.status := 'ativo';
    new.criado_por := coalesce(new.criado_por, auth.uid());
    new.movimentado_em := coalesce(new.movimentado_em, now());
    new.updated_at := now();

    update public.produtos
       set estoque_atual = v_novo_estoque,
           updated_at = now()
     where id = new.id_produto;

    return new;
  end if;

  if (to_jsonb(new) - array['status','estornado_em','estornado_por','motivo_estorno','updated_at'])
       is distinct from
     (to_jsonb(old) - array['status','estornado_em','estornado_por','motivo_estorno','updated_at']) then
    raise exception 'Movimentos de estoque são imutáveis; somente o estorno é permitido.';
  end if;

  if old.status = 'estornado' then
    raise exception 'Um movimento estornado não pode ser alterado.';
  end if;

  if new.status <> 'estornado' then
    raise exception 'A única alteração permitida é estornar o movimento.';
  end if;

  if nullif(btrim(new.motivo_estorno), '') is null then
    raise exception 'Informe o motivo do estorno.';
  end if;

  select p.estoque_atual into v_estoque
    from public.produtos p
   where p.id = old.id_produto and p.id_empresa = old.id_empresa
   for update;

  v_entrada := old.tipo in ('entrada_compra','entrada_devolucao','entrada_ajuste');
  v_novo_estoque := case when v_entrada then v_estoque - old.quantidade else v_estoque + old.quantidade end;

  if v_novo_estoque < 0 then
    raise exception 'Não é possível estornar: o estoque atual já foi consumido.';
  end if;

  update public.produtos
     set estoque_atual = v_novo_estoque,
         updated_at = now()
   where id = old.id_produto;

  new.estornado_em := coalesce(new.estornado_em, now());
  new.estornado_por := coalesce(new.estornado_por, auth.uid());
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_movimento_estoque"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_orcamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_subtotal numeric(14,2);
  v_desconto_itens numeric(14,2);
begin
  if tg_op = 'UPDATE' then
    if new.id_empresa is distinct from old.id_empresa then
      raise exception 'A empresa do orçamento não pode ser alterada.';
    end if;

    if old.status in ('recusado','expirado','convertido','cancelado')
       and (to_jsonb(new) - array['updated_at'])
           is distinct from
           (to_jsonb(old) - array['updated_at']) then
      raise exception 'Orçamento finalizado não pode ser alterado.';
    end if;

    if new.status is distinct from old.status and not (
      (old.status = 'rascunho' and new.status in ('enviado','cancelado','expirado'))
      or (old.status = 'enviado' and new.status in ('aprovado','recusado','cancelado','expirado'))
      or (old.status = 'aprovado' and new.status in ('convertido','cancelado'))
    ) then
      raise exception 'Transição de status inválida para o orçamento.';
    end if;
  end if;

  if not exists (
    select 1 from public.clientes c
    where c.id = new.id_cliente
      and c.id_empresa = new.id_empresa
  ) then
    raise exception 'Cliente inválido ou pertencente a outra empresa.';
  end if;

  select
    coalesce(sum(i.quantidade * i.valor_unitario_snapshot), 0),
    coalesce(sum(i.desconto), 0)
  into v_subtotal, v_desconto_itens
  from public.orcamentos_itens i
  where i.id_orcamento = new.id;

  new.subtotal := v_subtotal;
  new.desconto_itens := v_desconto_itens;

  if new.status = 'enviado' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.enviado_em := coalesce(new.enviado_em, now());
  elsif new.status = 'aprovado' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.aprovado_em := coalesce(new.aprovado_em, now());
  elsif new.status = 'recusado' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.recusado_em := coalesce(new.recusado_em, now());
  elsif new.status = 'convertido' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.convertido_em := coalesce(new.convertido_em, now());
  elsif new.status = 'cancelado' and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    new.cancelado_em := coalesce(new.cancelado_em, now());
  end if;

  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_orcamento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_orcamento_item"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_empresa bigint;
  v_status text;
  v_nome text;
  v_preco numeric;
begin
  if tg_op = 'UPDATE' and (
    new.id_orcamento is distinct from old.id_orcamento
    or new.tipo_item is distinct from old.tipo_item
    or new.id_servico is distinct from old.id_servico
    or new.id_produto is distinct from old.id_produto
  ) then
    raise exception 'Não é permitido trocar o vínculo ou o catálogo de um item existente.';
  end if;

  select o.id_empresa, o.status
  into v_empresa, v_status
  from public.orcamentos o
  where o.id = new.id_orcamento;

  if not found then
    raise exception 'Orçamento não encontrado.';
  end if;

  if v_status not in ('rascunho','enviado') then
    raise exception 'Somente orçamentos em rascunho ou enviados podem ter itens alterados.';
  end if;

  new.id_empresa := v_empresa;

  if tg_op = 'INSERT' and new.tipo_item = 'servico' then
    select s.nome, s.preco into v_nome, v_preco
    from public.servicos s
    where s.id = new.id_servico and s.id_empresa = v_empresa and s.ativo;

    if not found then
      raise exception 'Serviço inválido, inativo ou pertencente a outra empresa.';
    end if;

    new.descricao_snapshot := coalesce(nullif(btrim(new.descricao_snapshot), ''), v_nome);
    new.valor_unitario_snapshot := coalesce(new.valor_unitario_snapshot, v_preco);
  elsif tg_op = 'INSERT' and new.tipo_item = 'produto' then
    select p.nome, p.preco_venda into v_nome, v_preco
    from public.produtos p
    where p.id = new.id_produto and p.id_empresa = v_empresa and p.ativo;

    if not found then
      raise exception 'Produto inválido, inativo ou pertencente a outra empresa.';
    end if;

    new.descricao_snapshot := coalesce(nullif(btrim(new.descricao_snapshot), ''), v_nome);
    new.valor_unitario_snapshot := coalesce(new.valor_unitario_snapshot, v_preco);
  elsif tg_op = 'INSERT' then
    if nullif(btrim(new.descricao_snapshot), '') is null or new.valor_unitario_snapshot is null then
      raise exception 'Itens avulsos exigem descrição e valor.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end
$$;


ALTER FUNCTION "private"."preparar_orcamento_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_pagamento_comissao"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_pagamento bigint;
begin
  if tg_op='UPDATE' then
    if new.id_empresa is distinct from old.id_empresa or new.id_funcionario is distinct from old.id_funcionario then
      raise exception 'Empresa e funcionário do pagamento não podem ser alterados.';
    end if;
    if old.status='cancelado' then raise exception 'Pagamento cancelado não pode ser alterado.'; end if;

    if new.status='confirmado' and old.status<>'confirmado' then
      if new.valor_total<=0 or not exists (
        select 1 from public.pagamentos_comissao_itens i where i.id_pagamento_comissao=new.id
      ) then raise exception 'Inclua ao menos uma comissão antes de confirmar o pagamento.'; end if;

      new.pago_em:=coalesce(new.pago_em,now());
      new.confirmado_por:=coalesce(new.confirmado_por,auth.uid());

      insert into public.pagamentos(
        id_empresa,tipo,id_forma_pagamento,data_pagamento,valor,status,
        referencia,observacoes,criado_por,id_sessao_caixa
      ) values (
        new.id_empresa,'saida',new.id_forma_pagamento,new.pago_em,new.valor_total,'confirmado',
        'Pagamento de comissão #'||new.id,new.observacoes,auth.uid(),new.id_sessao_caixa
      ) returning id into v_pagamento;
      new.id_pagamento:=v_pagamento;
    elsif new.status='cancelado' and old.status='confirmado' then
      if nullif(btrim(new.motivo_cancelamento),'') is null then
        raise exception 'Informe o motivo do cancelamento.';
      end if;
      new.cancelado_em:=coalesce(new.cancelado_em,now());
      if old.id_pagamento is not null then
        update public.pagamentos
           set status='estornado',estornado_em=now(),estornado_por=auth.uid(),
               motivo_estorno=new.motivo_cancelamento,updated_at=now()
         where id=old.id_pagamento;
      end if;
    end if;
  end if;

  new.criado_por:=coalesce(new.criado_por,auth.uid());
  new.updated_at:=now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_pagamento_comissao"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_pagamento_comissao_item"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_empresa bigint;
  v_funcionario bigint;
  v_status text;
  v_lanc_empresa bigint;
  v_lanc_func bigint;
  v_disponivel numeric;
begin
  select pc.id_empresa,pc.id_funcionario,pc.status
    into v_empresa,v_funcionario,v_status
    from public.pagamentos_comissao pc where pc.id=new.id_pagamento_comissao;

  if not found then raise exception 'Pagamento de comissão não encontrado.'; end if;
  if v_status<>'rascunho' then raise exception 'Somente pagamentos em rascunho podem ter itens alterados.'; end if;

  select lc.id_empresa,lc.id_funcionario,
         lc.valor_comissao-lc.valor_pago-coalesce((
           select sum(pci.valor)
             from public.pagamentos_comissao_itens pci
             join public.pagamentos_comissao pco on pco.id=pci.id_pagamento_comissao
            where pci.id_lancamento_comissao=lc.id
              and pco.status='rascunho'
              and pci.id<>coalesce(new.id,0)
         ),0)
    into v_lanc_empresa,v_lanc_func,v_disponivel
    from public.lancamentos_comissao lc
   where lc.id=new.id_lancamento_comissao
     and lc.status in ('liberada','parcial');

  if not found then raise exception 'Lançamento não está disponível para pagamento.'; end if;
  if v_lanc_empresa<>v_empresa or v_lanc_func<>v_funcionario then
    raise exception 'O lançamento pertence a outra empresa ou funcionário.';
  end if;
  if new.valor>v_disponivel then
    raise exception 'Valor maior que o saldo disponível da comissão (%).',v_disponivel;
  end if;

  new.id_empresa:=v_empresa;
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_pagamento_comissao_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_regra_comissao"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op = 'UPDATE' and new.id_empresa is distinct from old.id_empresa then
    raise exception 'A empresa da regra não pode ser alterada.';
  end if;

  if new.id_funcionario is not null and not exists (
    select 1 from public.funcionarios f
    where f.id = new.id_funcionario and f.id_empresa = new.id_empresa
  ) then
    raise exception 'Funcionário inválido ou pertencente a outra empresa.';
  end if;

  if new.id_servico is not null and not exists (
    select 1 from public.servicos s
    where s.id = new.id_servico and s.id_empresa = new.id_empresa
  ) then
    raise exception 'Serviço inválido ou pertencente a outra empresa.';
  end if;

  if new.id_produto is not null and not exists (
    select 1 from public.produtos p
    where p.id = new.id_produto and p.id_empresa = new.id_empresa
  ) then
    raise exception 'Produto inválido ou pertencente a outra empresa.';
  end if;

  new.criado_por := coalesce(new.criado_por, auth.uid());
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "private"."preparar_regra_comissao"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."preparar_sessao_caixa"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_entradas numeric(14,2);
  v_saidas numeric(14,2);
  v_suprimentos numeric(14,2);
  v_sangrias numeric(14,2);
begin
  if tg_op = 'INSERT' then
    if new.status <> 'aberta' then
      raise exception 'Uma sessão de caixa deve ser criada com status aberta.';
    end if;

    new.aberta_em := coalesce(new.aberta_em, now());
    new.aberta_por := coalesce(new.aberta_por, auth.uid());
  else
    if new.id_empresa is distinct from old.id_empresa
       or new.id_caixa is distinct from old.id_caixa
       or new.aberta_em is distinct from old.aberta_em
       or new.aberta_por is distinct from old.aberta_por then
      raise exception 'Empresa, caixa e dados de abertura não podem ser alterados.';
    end if;

    if old.status in ('fechada','cancelada') then
      raise exception 'Uma sessão fechada ou cancelada não pode ser alterada.';
    end if;

    if new.saldo_inicial is distinct from old.saldo_inicial
       and exists (
         select 1 from public.movimentos_caixa m
         where m.id_sessao_caixa = old.id
       ) then
      raise exception 'O saldo inicial não pode ser alterado após existirem movimentos.';
    end if;
  end if;

  select
    coalesce(sum(m.valor) filter (
      where m.status = 'ativo' and m.tipo in ('entrada','ajuste_entrada')
    ), 0),
    coalesce(sum(m.valor) filter (
      where m.status = 'ativo' and m.tipo in ('saida','ajuste_saida')
    ), 0),
    coalesce(sum(m.valor) filter (
      where m.status = 'ativo' and m.tipo = 'suprimento'
    ), 0),
    coalesce(sum(m.valor) filter (
      where m.status = 'ativo' and m.tipo = 'sangria'
    ), 0)
  into v_entradas, v_saidas, v_suprimentos, v_sangrias
  from public.movimentos_caixa m
  where m.id_sessao_caixa = new.id;

  new.total_entradas := v_entradas;
  new.total_saidas := v_saidas;
  new.total_suprimentos := v_suprimentos;
  new.total_sangrias := v_sangrias;

  if new.status = 'fechada' then
    if new.saldo_final_informado is null then
      raise exception 'Informe o saldo contado para fechar o caixa.';
    end if;

    new.fechada_em := coalesce(new.fechada_em, now());
    new.fechada_por := coalesce(new.fechada_por, auth.uid());
    new.cancelada_em := null;
    new.cancelada_por := null;
    new.motivo_cancelamento := null;
  elsif new.status = 'cancelada' then
    if nullif(btrim(new.motivo_cancelamento), '') is null then
      raise exception 'Informe o motivo do cancelamento da sessão.';
    end if;

    new.cancelada_em := coalesce(new.cancelada_em, now());
    new.cancelada_por := coalesce(new.cancelada_por, auth.uid());
    new.fechada_em := null;
    new.fechada_por := null;
    new.saldo_final_informado := null;
  else
    new.fechada_em := null;
    new.fechada_por := null;
    new.saldo_final_informado := null;
    new.cancelada_em := null;
    new.cancelada_por := null;
    new.motivo_cancelamento := null;
  end if;

  new.updated_at := now();
  return new;
end
$$;


ALTER FUNCTION "private"."preparar_sessao_caixa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."processar_compra_item"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_delta numeric;
  v_estoque_antes numeric;
  v_custo_antes numeric;
  v_controla_estoque boolean;
begin
  if tg_op = 'DELETE' then
    perform private.recalcular_compra(old.id_compra);
    return old;
  end if;

  v_delta := new.quantidade_recebida
    - case when tg_op = 'UPDATE' then old.quantidade_recebida else 0 end;

  if v_delta > 0 then
    select p.estoque_atual, p.custo_medio, p.controla_estoque
      into v_estoque_antes, v_custo_antes, v_controla_estoque
    from public.produtos p
    where p.id = new.id_produto
      and p.id_empresa = new.id_empresa
    for update;

    if not found then
      raise exception 'Produto da compra não encontrado.';
    end if;

    if v_controla_estoque then
      insert into public.movimentos_estoque (
        id_empresa, id_produto, tipo, quantidade,
        estoque_antes, estoque_depois, descricao,
        status, origem, id_compra_item, movimentado_em, criado_por
      ) values (
        new.id_empresa, new.id_produto, 'entrada_compra', v_delta,
        0, 0, 'Recebimento da compra #' || new.id_compra,
        'ativo', 'compra', new.id, now(), auth.uid()
      );

      update public.produtos
         set custo_medio = round(
           (
             coalesce(v_custo_antes, 0) * v_estoque_antes
             + new.valor_unitario * v_delta
           ) / nullif(v_estoque_antes + v_delta, 0),
           2
         )
       where id = new.id_produto
         and id_empresa = new.id_empresa;
    else
      update public.produtos
         set custo_medio = new.valor_unitario
       where id = new.id_produto
         and id_empresa = new.id_empresa;
    end if;
  end if;

  perform private.recalcular_compra(new.id_compra);
  if tg_op = 'UPDATE' and new.id_compra <> old.id_compra then
    perform private.recalcular_compra(old.id_compra);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."processar_compra_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."processar_pagamento_comissao"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare r record;
begin
  if new.status is distinct from old.status then
    for r in select id_lancamento_comissao from public.pagamentos_comissao_itens where id_pagamento_comissao=new.id
    loop
      perform private.recalcular_lancamento_comissao(r.id_lancamento_comissao);
    end loop;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."processar_pagamento_comissao"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."processar_pagamento_comissao_item"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_op='DELETE' then
    perform private.recalcular_pagamento_comissao(old.id_pagamento_comissao);
    perform private.recalcular_lancamento_comissao(old.id_lancamento_comissao);
    return old;
  end if;
  perform private.recalcular_pagamento_comissao(new.id_pagamento_comissao);
  perform private.recalcular_lancamento_comissao(new.id_lancamento_comissao);
  if tg_op='UPDATE' and old.id_lancamento_comissao<>new.id_lancamento_comissao then
    perform private.recalcular_lancamento_comissao(old.id_lancamento_comissao);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."processar_pagamento_comissao_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."proteger_criador_empresa"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.criado_por is distinct from old.criado_por then
    raise exception 'O criador da empresa não pode ser alterado.';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."proteger_criador_empresa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."proteger_id_empresa"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if new.id_empresa is distinct from old.id_empresa then
    raise exception 'O vínculo com a empresa não pode ser alterado.';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."proteger_id_empresa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."proteger_registro_auditoria"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  raise exception 'Registros de auditoria são imutáveis e não podem ser alterados ou excluídos.';
end;
$$;


ALTER FUNCTION "private"."proteger_registro_auditoria"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."proteger_vinculo_empresa"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  outros_donos integer;
begin
  if tg_op = 'DELETE' then
    if old.tipo = 'dono'::public.tipos_usuarios
       and old.status = 'ativo'::public.status_usuario_empresa then
      select count(*) into outros_donos
      from public.usuarios_empresas ue
      where ue.empresa_id = old.empresa_id
        and ue.id <> old.id
        and ue.tipo = 'dono'::public.tipos_usuarios
        and ue.status = 'ativo'::public.status_usuario_empresa;

      if outros_donos = 0 then
        raise exception 'A empresa precisa manter ao menos um dono ativo.';
      end if;
    end if;
    return old;
  end if;

  if new.empresa_id is distinct from old.empresa_id
     or new.user_id is distinct from old.user_id then
    raise exception 'Empresa e usuário do vínculo não podem ser alterados.';
  end if;

  if old.tipo = 'dono'::public.tipos_usuarios
     and old.status = 'ativo'::public.status_usuario_empresa
     and (
       new.tipo <> 'dono'::public.tipos_usuarios
       or new.status <> 'ativo'::public.status_usuario_empresa
     ) then
    select count(*) into outros_donos
    from public.usuarios_empresas ue
    where ue.empresa_id = old.empresa_id
      and ue.id <> old.id
      and ue.tipo = 'dono'::public.tipos_usuarios
      and ue.status = 'ativo'::public.status_usuario_empresa;

    if outros_donos = 0 then
      raise exception 'A empresa precisa manter ao menos um dono ativo.';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."proteger_vinculo_empresa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."reagendar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_token uuid;
begin
  select a.site_access_token into v_token
  from public.agendamentos a
  join public.clientes c
    on c.id_empresa = a.id_empresa and c.id = a.id_cliente
  where a.id_empresa = p_id_empresa
    and a.id = p_id_agendamento
    and c.auth_user_id = auth.uid()
    and c.ativo
  for update of a;

  if not found then
    raise exception 'Agendamento nao encontrado para este cliente.';
  end if;

  if v_token is null then
    v_token := gen_random_uuid();
    update public.agendamentos
    set site_access_token = v_token
    where id_empresa = p_id_empresa and id = p_id_agendamento;
  end if;

  perform private.reagendar_agendamento_site(v_token, p_id_funcionario, p_inicio);
  return private.obter_area_cliente_site(p_id_empresa);
end;
$$;


ALTER FUNCTION "private"."reagendar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_agendamento public.agendamentos%rowtype;
  v_item public.agendamentos_servicos%rowtype;
  v_fuso text;
  v_disponivel boolean;
  v_fim timestamptz;
  v_antecedencia_reagendamento integer := 1440;
begin
  select * into v_agendamento
  from public.agendamentos a
  where a.site_access_token = p_token
  for update;

  if not found then raise exception 'Agendamento nao encontrado.'; end if;
  if v_agendamento.status in ('cancelado', 'finalizado', 'no_show', 'em_atendimento') then
    raise exception 'Este agendamento nao pode mais ser reagendado.';
  end if;

  select coalesce(p.antecedencia_reagendamento_minutos, 1440)
    into v_antecedencia_reagendamento
  from public.politicas_cancelamento p
  where p.id_empresa = v_agendamento.id_empresa
    and p.ativo
    and current_date between p.vigente_desde and coalesce(p.vigente_ate, 'infinity'::date)
    and (p.id_unidade = v_agendamento.id_unidade or p.id_unidade is null)
  order by (p.id_unidade = v_agendamento.id_unidade) desc, p.vigente_desde desc, p.id desc
  limit 1;

  if v_agendamento.inicio <= now() + make_interval(mins => coalesce(v_antecedencia_reagendamento, 1440)) then
    raise exception 'O prazo para reagendamento online desta reserva ja terminou.';
  end if;

  select * into v_item
  from public.agendamentos_servicos item
  where item.id_empresa = v_agendamento.id_empresa
    and item.id_agendamento = v_agendamento.id
    and item.status <> 'cancelado'
  order by item.ordem, item.id
  limit 1
  for update;

  select coalesce(u.fuso_horario, e.fuso_horario, 'America/Sao_Paulo')
    into v_fuso
  from public.unidades u
  join public.empresas e on e.id = u.id_empresa
  where u.id_empresa = v_agendamento.id_empresa
    and u.id = v_agendamento.id_unidade;

  perform pg_advisory_xact_lock(hashtextextended(
    v_agendamento.id_empresa::text || ':' || p_id_funcionario::text,
    0
  ));

  select exists (
    select 1
    from jsonb_array_elements(private.obter_disponibilidade_site(
      v_agendamento.id_empresa,
      v_agendamento.id_unidade,
      (p_inicio at time zone v_fuso)::date,
      v_item.id_servico,
      p_id_funcionario
    )) slot
    where (slot->>'id_funcionario')::bigint = p_id_funcionario
      and (slot->>'inicio')::timestamptz = p_inicio
  ) into v_disponivel;

  if not v_disponivel then
    raise exception using
      errcode = '23P01',
      message = 'Este horario nao esta mais disponivel. Escolha outro horario.';
  end if;

  v_fim := p_inicio + make_interval(mins => v_item.duracao_minutos);

  update public.agendamentos
  set inicio = p_inicio, fim = v_fim
  where id = v_agendamento.id and id_empresa = v_agendamento.id_empresa;

  update public.agendamentos_servicos
  set id_funcionario = p_id_funcionario, inicio = p_inicio, fim = v_fim
  where id = v_item.id and id_empresa = v_item.id_empresa;

  return private.obter_agendamento_site(p_token);
end;
$$;


ALTER FUNCTION "private"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_alocacao_pagamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_pagamento bigint;
  v_parcela bigint;
begin
  v_pagamento := coalesce(new.id_pagamento, old.id_pagamento);
  v_parcela := coalesce(new.id_parcela, old.id_parcela);

  update public.pagamentos p
     set valor_alocado = (
       select coalesce(sum(pa.valor), 0)
       from public.pagamentos_alocacoes pa
       where pa.id_pagamento = v_pagamento
     ),
     updated_at = now()
   where p.id = v_pagamento;

  perform private.recalcular_parcela(v_parcela);
  return coalesce(new, old);
end
$$;


ALTER FUNCTION "private"."recalcular_alocacao_pagamento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_cabecalho_item"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_documento_id bigint;
begin
  if tg_table_name = 'orcamentos_itens' then
    if tg_op = 'DELETE' then
      v_documento_id := old.id_orcamento;
    else
      v_documento_id := new.id_orcamento;
    end if;

    update public.orcamentos
       set updated_at = now()
     where id = v_documento_id;
  elsif tg_table_name = 'comandas_itens' then
    if tg_op = 'DELETE' then
      v_documento_id := old.id_comanda;
    else
      v_documento_id := new.id_comanda;
    end if;

    update public.comandas
       set updated_at = now()
     where id = v_documento_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."recalcular_cabecalho_item"() OWNER TO "postgres";


COMMENT ON FUNCTION "private"."recalcular_cabecalho_item"() IS 'Atualiza o cabeçalho comercial sem acessar NEW em operações DELETE.';



CREATE OR REPLACE FUNCTION "private"."recalcular_compra"("p_compra_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_total numeric;
  v_qtd numeric;
  v_recebida numeric;
begin
  select coalesce(sum(total),0),coalesce(sum(quantidade_comprada),0),coalesce(sum(quantidade_recebida),0)
    into v_total,v_qtd,v_recebida
    from public.compras_itens where id_compra=p_compra_id;

  update public.compras c
     set total_produtos=v_total,
         total_final=greatest(v_total+c.frete-c.desconto,0),
         status=case
           when c.status='cancelada' then c.status
           when v_qtd>0 and v_recebida>=v_qtd then 'recebida'
           when v_recebida>0 then 'recebida_parcial'
           when c.status in ('recebida','recebida_parcial') then 'pedido'
           else c.status
         end,
         recebido_em=case when v_qtd>0 and v_recebida>=v_qtd then coalesce(c.recebido_em,now()) else null end,
         updated_at=now()
   where c.id=p_compra_id;
end;
$$;


ALTER FUNCTION "private"."recalcular_compra"("p_compra_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_conta"("p_conta_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_total numeric(14,2);
  v_pago numeric(14,2);
  v_vencida boolean;
begin
  select
    coalesce(sum(cp.valor_parcela) filter (where cp.status <> 'cancelada'), 0),
    coalesce(sum(cp.valor_pago) filter (where cp.status <> 'cancelada'), 0),
    coalesce(bool_or(cp.status = 'atrasada'), false)
  into v_total, v_pago, v_vencida
  from public.contas_parcelas cp
  where cp.id_conta = p_conta_id;

  update public.contas c
     set valor_total = v_total,
         valor_pago = v_pago,
         status = case
           when c.status = 'cancelada' then 'cancelada'
           when v_total > 0 and v_pago >= v_total then 'paga'
           when v_pago > 0 then 'parcial'
           when v_vencida then 'vencida'
           else 'aberta'
         end,
         updated_at = now()
   where c.id = p_conta_id;
end
$$;


ALTER FUNCTION "private"."recalcular_conta"("p_conta_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_conta_por_parcela"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  perform private.recalcular_conta(coalesce(new.id_conta, old.id_conta));
  return coalesce(new, old);
end
$$;


ALTER FUNCTION "private"."recalcular_conta_por_parcela"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_lancamento_comissao"("p_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_pago numeric;
begin
  select coalesce(sum(i.valor),0) into v_pago
    from public.pagamentos_comissao_itens i
    join public.pagamentos_comissao pc on pc.id=i.id_pagamento_comissao
   where i.id_lancamento_comissao=p_id and pc.status='confirmado';

  update public.lancamentos_comissao lc
     set valor_pago=least(v_pago,lc.valor_comissao),
         status=case
           when lc.status='estornada' then 'estornada'
           when v_pago>=lc.valor_comissao then 'paga'
           when v_pago>0 then 'parcial'
           when lc.liberada_em is not null or lc.momento_liberacao='fechamento_comanda' then 'liberada'
           else 'prevista'
         end,
         updated_at=now()
   where lc.id=p_id;
end;
$$;


ALTER FUNCTION "private"."recalcular_lancamento_comissao"("p_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_pagamento_comissao"("p_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update public.pagamentos_comissao pc
     set valor_total=coalesce((select sum(i.valor) from public.pagamentos_comissao_itens i where i.id_pagamento_comissao=pc.id),0),
         updated_at=now()
   where pc.id=p_id;
end;
$$;


ALTER FUNCTION "private"."recalcular_pagamento_comissao"("p_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_parcela"("p_parcela_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_pago numeric(14,2);
begin
  select coalesce(sum(pa.valor), 0)
  into v_pago
  from public.pagamentos_alocacoes pa
  join public.pagamentos p on p.id = pa.id_pagamento
  where pa.id_parcela = p_parcela_id
    and p.status = 'confirmado';

  update public.contas_parcelas cp
     set valor_pago = v_pago,
         status = case
           when cp.status = 'cancelada' then 'cancelada'
           when v_pago >= cp.valor_parcela then 'paga'
           when v_pago > 0 then 'parcial'
           when cp.data_vencimento < current_date then 'atrasada'
           else 'aberta'
         end,
         paga_em = case
           when v_pago >= cp.valor_parcela then coalesce(cp.paga_em, now())
           else null
         end,
         updated_at = now()
   where cp.id = p_parcela_id;
end
$$;


ALTER FUNCTION "private"."recalcular_parcela"("p_parcela_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_parcelas_pagamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id_parcela bigint;
begin
  for v_id_parcela in
    select pa.id_parcela
    from public.pagamentos_alocacoes pa
    where pa.id_pagamento = new.id
  loop
    perform private.recalcular_parcela(v_id_parcela);
  end loop;
  return new;
end
$$;


ALTER FUNCTION "private"."recalcular_parcelas_pagamento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_sessao_caixa"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  update public.sessoes_caixa
     set updated_at = now()
   where id = coalesce(new.id_sessao_caixa, old.id_sessao_caixa);

  return coalesce(new, old);
end
$$;


ALTER FUNCTION "private"."recalcular_sessao_caixa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."recalcular_total_agendamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id_empresa bigint;
  v_id_agendamento bigint;
begin
  if tg_op = 'DELETE' then
    v_id_empresa := old.id_empresa;
    v_id_agendamento := old.id_agendamento;
  else
    v_id_empresa := new.id_empresa;
    v_id_agendamento := new.id_agendamento;
  end if;

  update public.agendamentos a
  set valor_total = coalesce((
    select coalesce(
      sum(item.preco) filter (where item.status <> 'cancelado'),
      sum(item.preco),
      0
    )
    from public.agendamentos_servicos item
    where item.id_empresa = v_id_empresa
      and item.id_agendamento = v_id_agendamento
  ), 0)
  where a.id_empresa = v_id_empresa and a.id = v_id_agendamento;

  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "private"."recalcular_total_agendamento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_status text;
  v_item jsonb;
  v_item_id bigint;
  v_quantidade numeric;
  v_restante numeric;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para receber compras.';
  end if;

  if p_itens is null
     or jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens) = 0 then
    raise exception 'Informe ao menos uma quantidade recebida.';
  end if;

  select c.status
    into v_status
  from public.compras c
  where c.id = p_compra_id
    and c.id_empresa = p_id_empresa
  for update;

  if not found then
    raise exception 'Compra não encontrada.';
  end if;
  if v_status not in ('pedido', 'recebida_parcial') then
    raise exception 'Esta compra não está disponível para recebimento.';
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_item_id := nullif(v_item->>'id_item', '')::bigint;
    v_quantidade := nullif(v_item->>'quantidade', '')::numeric;

    if v_item_id is null or coalesce(v_quantidade, 0) <= 0 then
      raise exception 'As quantidades recebidas devem ser maiores que zero.';
    end if;

    select ci.quantidade_comprada - ci.quantidade_recebida
      into v_restante
    from public.compras_itens ci
    where ci.id = v_item_id
      and ci.id_compra = p_compra_id
      and ci.id_empresa = p_id_empresa
    for update;

    if not found then
      raise exception 'Item de compra não encontrado.';
    end if;
    if v_quantidade > v_restante then
      raise exception 'Quantidade recebida maior que a quantidade pendente.';
    end if;

    update public.compras_itens
       set quantidade_recebida = quantidade_recebida + v_quantidade
     where id = v_item_id
       and id_empresa = p_id_empresa;
  end loop;

  select c.status into v_status
  from public.compras c
  where c.id = p_compra_id
    and c.id_empresa = p_id_empresa;

  return v_status;
end;
$$;


ALTER FUNCTION "private"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") IS 'Recebe parcial ou totalmente itens da compra; triggers geram as entradas de estoque.';



CREATE OR REPLACE FUNCTION "private"."registrar_auditoria"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$declare
  v_anterior jsonb;
  v_novo jsonb;
  v_referencia jsonb;
  v_empresa bigint;
  v_registro text;
  v_usuario uuid;
  v_campos text[];
  v_papel text;
begin
  if tg_op='INSERT' then
    v_novo:=to_jsonb(new);
    v_referencia:=v_novo;
  elsif tg_op='UPDATE' then
    v_anterior:=to_jsonb(old);
    v_novo:=to_jsonb(new);
    v_referencia:=v_novo;

    select array_agg(chave order by chave)
      into v_campos
      from (
        select key as chave from jsonb_each(v_anterior)
        union
        select key as chave from jsonb_each(v_novo)
      ) chaves
     where v_anterior->chave is distinct from v_novo->chave;
  else
    v_anterior:=to_jsonb(old);
    v_referencia:=v_anterior;
  end if;

  v_empresa:=coalesce(
    nullif(v_referencia->>'id_empresa','')::bigint,
    nullif(v_referencia->>'empresa_id','')::bigint,
    case
      when tg_table_schema='public' and tg_table_name='empresas' and tg_op<>'DELETE'
      then nullif(v_referencia->>'id','')::bigint
    end
  );

  v_registro:=coalesce(
    nullif(v_referencia->>'id',''),
    nullif(v_referencia->>'user_id',''),
    nullif(v_referencia->>'codigo','')
  );

  if v_registro is null then
    raise exception 'A tabela %.% não possui identificador compatível com a auditoria.',tg_table_schema,tg_table_name;
  end if;

  v_usuario:=auth.uid();
  v_papel:=nullif(current_setting('request.jwt.claim.role',true),'');

  insert into public.auditorias(
    id_empresa,usuario_id,acao,schema_nome,tabela,registro_id,
    dados_anteriores,dados_novos,origem,papel_execucao,
    transacao_id,campos_alterados
  ) values(
    v_empresa,v_usuario,tg_op,tg_table_schema,tg_table_name,v_registro,
    v_anterior,v_novo,
    case when v_usuario is null then 'sistema' else 'usuario' end,
    v_papel,txid_current(),v_campos
  );

  return coalesce(new,old);
end;$$;


ALTER FUNCTION "private"."registrar_auditoria"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."registrar_historico_agendamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_acao text;
begin
  if tg_op = 'INSERT' then
    v_acao := 'criado';
  elsif new.status is distinct from old.status then
    v_acao := case new.status
      when 'confirmado' then 'confirmado'
      when 'cancelado' then 'cancelado'
      else 'atualizado'
    end;
  elsif new.inicio is distinct from old.inicio or new.fim is distinct from old.fim then
    v_acao := 'reagendado';
  elsif new.pagamento_status is distinct from old.pagamento_status
     or new.pagamento_externo_id is distinct from old.pagamento_externo_id then
    v_acao := 'pagamento_atualizado';
  else
    v_acao := 'atualizado';
  end if;

  insert into public.historico_agendamentos (
    id_empresa, id_agendamento, id_unidade, acao,
    status_anterior, status_novo, motivo, origem,
    alterado_por, dados_anteriores, dados_novos
  ) values (
    new.id_empresa, new.id, new.id_unidade, v_acao,
    case when tg_op = 'UPDATE' then old.status end,
    new.status,
    case when v_acao = 'cancelado' then new.motivo_cancelamento end,
    case when new.site_booking_key is not null then 'site' else coalesce(new.origem, 'sistema') end,
    auth.uid(),
    case when tg_op = 'UPDATE' then to_jsonb(old) end,
    to_jsonb(new)
  );

  return new;
end;
$$;


ALTER FUNCTION "private"."registrar_historico_agendamento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id bigint;
  v_item jsonb;
  v_lancamento_id bigint;
  v_valor numeric(14,2);
  v_forma_tipo text;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para pagar comissões.';
  end if;
  if not exists (
    select 1 from public.funcionarios f
    where f.id = p_id_funcionario and f.id_empresa = p_id_empresa
  ) then
    raise exception 'Funcionário inválido ou pertencente a outra empresa.';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Selecione ao menos uma comissão para pagar.';
  end if;
  if p_periodo_inicio is not null and p_periodo_fim is not null
     and p_periodo_fim < p_periodo_inicio then
    raise exception 'O fim do período deve ser posterior ao início.';
  end if;
  if coalesce(p_pago_em, now()) > now() then
    raise exception 'A data do pagamento não pode estar no futuro.';
  end if;

  select fp.tipo into v_forma_tipo
  from public.formas_pagamento fp
  where fp.id = p_id_forma_pagamento
    and fp.id_empresa = p_id_empresa
    and fp.ativo;
  if not found then raise exception 'Forma de pagamento inválida ou inativa.'; end if;

  if p_id_sessao_caixa is not null then
    if v_forma_tipo <> 'dinheiro' then
      raise exception 'Somente pagamentos em dinheiro movimentam o caixa físico.';
    end if;
    if not exists (
      select 1 from public.sessoes_caixa s
      where s.id = p_id_sessao_caixa
        and s.id_empresa = p_id_empresa
        and s.status = 'aberta'
    ) then
      raise exception 'Sessão de caixa inválida ou fechada.';
    end if;
  end if;

  insert into public.pagamentos_comissao (
    id_empresa, id_funcionario, valor_total, status,
    periodo_inicio, periodo_fim, observacoes, criado_por
  ) values (
    p_id_empresa, p_id_funcionario, 0, 'rascunho',
    p_periodo_inicio, p_periodo_fim, nullif(btrim(p_observacoes), ''), auth.uid()
  ) returning id into v_id;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_lancamento_id := nullif(v_item->>'id_lancamento_comissao', '')::bigint;
    v_valor := nullif(v_item->>'valor', '')::numeric;
    if v_lancamento_id is null or coalesce(v_valor, 0) <= 0 then
      raise exception 'Revise as comissões e os valores do pagamento.';
    end if;

    insert into public.pagamentos_comissao_itens (
      id_empresa, id_pagamento_comissao, id_lancamento_comissao, valor
    ) values (p_id_empresa, v_id, v_lancamento_id, v_valor);
  end loop;

  update public.pagamentos_comissao
     set id_forma_pagamento = p_id_forma_pagamento,
         id_sessao_caixa = p_id_sessao_caixa,
         pago_em = coalesce(p_pago_em, now()),
         status = 'confirmado'
   where id = v_id and id_empresa = p_id_empresa;

  return v_id;
exception when unique_violation then
  raise exception 'Uma mesma comissão não pode aparecer duas vezes no pagamento.';
end;
$$;


ALTER FUNCTION "private"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") IS 'Paga lançamentos de comissão atomicamente e integra a saída ao financeiro.';



CREATE OR REPLACE FUNCTION "private"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_pagamento_id bigint;
  v_forma_tipo text;
  v_item jsonb;
  v_parcela_id bigint;
  v_valor_alocacao numeric(14,2);
  v_saldo_parcela numeric(14,2);
  v_tipo_conta text;
  v_total_alocado numeric(14,2) := 0;
begin
  if p_tipo not in ('entrada', 'saida') then
    raise exception 'Tipo de pagamento inválido.';
  end if;
  if not (
    private.usuario_tem_tipo_empresa(
      p_id_empresa,
      array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
    )
    or (
      p_tipo = 'entrada'
      and private.usuario_tem_tipo_empresa(
        p_id_empresa,
        array['recepcionista'::public.tipos_usuarios]
      )
    )
  ) then
    raise exception 'Você não possui permissão para registrar este pagamento.';
  end if;
  if coalesce(p_valor, 0) <= 0 then
    raise exception 'O valor do pagamento deve ser maior que zero.';
  end if;
  if p_alocacoes is null
     or jsonb_typeof(p_alocacoes) <> 'array'
     or jsonb_array_length(p_alocacoes) = 0 then
    raise exception 'Selecione pelo menos uma parcela para o pagamento.';
  end if;

  select f.tipo into v_forma_tipo
  from public.formas_pagamento f
  where f.id = p_id_forma_pagamento
    and f.id_empresa = p_id_empresa
    and f.ativo;
  if not found then raise exception 'Forma de pagamento inválida ou inativa.'; end if;

  if p_id_sessao_caixa is not null then
    if v_forma_tipo <> 'dinheiro' then
      raise exception 'Somente pagamentos em dinheiro movimentam o caixa físico.';
    end if;
    if not exists (
      select 1 from public.sessoes_caixa s
      where s.id = p_id_sessao_caixa
        and s.id_empresa = p_id_empresa
        and s.status = 'aberta'
    ) then
      raise exception 'Sessão de caixa inválida ou fechada.';
    end if;
  end if;

  for v_item in select value from jsonb_array_elements(p_alocacoes)
  loop
    v_parcela_id := nullif(v_item->>'id_parcela', '')::bigint;
    v_valor_alocacao := nullif(v_item->>'valor', '')::numeric;
    if v_parcela_id is null or coalesce(v_valor_alocacao, 0) <= 0 then
      raise exception 'Revise as parcelas e os valores do pagamento.';
    end if;

    select cp.valor_parcela - cp.valor_pago, c.tipo
      into v_saldo_parcela, v_tipo_conta
    from public.contas_parcelas cp
    join public.contas c on c.id = cp.id_conta and c.id_empresa = cp.id_empresa
    where cp.id = v_parcela_id
      and cp.id_empresa = p_id_empresa
      and cp.status <> 'cancelada'
      and c.status <> 'cancelada'
    for update of cp;

    if not found then raise exception 'Parcela inválida ou cancelada.'; end if;
    if (p_tipo = 'entrada' and v_tipo_conta <> 'receber')
       or (p_tipo = 'saida' and v_tipo_conta <> 'pagar') then
      raise exception 'O tipo do pagamento não corresponde ao tipo da conta.';
    end if;
    if v_valor_alocacao > v_saldo_parcela then
      raise exception 'O pagamento ultrapassa o saldo da parcela.';
    end if;
    v_total_alocado := v_total_alocado + v_valor_alocacao;
  end loop;

  if round(v_total_alocado, 2) <> round(p_valor, 2) then
    raise exception 'O valor do pagamento deve corresponder à soma das parcelas.';
  end if;

  insert into public.pagamentos (
    id_empresa, tipo, id_forma_pagamento, id_sessao_caixa,
    data_pagamento, valor, valor_alocado, status,
    referencia, observacoes, criado_por
  ) values (
    p_id_empresa, p_tipo, p_id_forma_pagamento, p_id_sessao_caixa,
    coalesce(p_data_pagamento, now()), p_valor, 0, 'confirmado',
    nullif(btrim(p_referencia), ''), nullif(btrim(p_observacoes), ''), auth.uid()
  ) returning id into v_pagamento_id;

  for v_item in select value from jsonb_array_elements(p_alocacoes)
  loop
    insert into public.pagamentos_alocacoes (
      id_empresa, id_pagamento, id_parcela, valor
    ) values (
      p_id_empresa, v_pagamento_id,
      (v_item->>'id_parcela')::bigint,
      (v_item->>'valor')::numeric
    );
  end loop;

  return v_pagamento_id;
end;
$$;


ALTER FUNCTION "private"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") IS 'Registra pagamento, aloca parcelas e movimenta caixa atomicamente.';



CREATE OR REPLACE FUNCTION "private"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") RETURNS TABLE("id_funcionario" bigint, "funcionario_nome" "text", "comissoes_geradas" numeric, "comissoes_previstas" numeric, "comissoes_liberadas" numeric, "comissoes_pagas" numeric, "comissoes_estornadas" numeric, "ajustes_manuais" numeric, "saldo_a_pagar" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para consultar este relatório.';
  end if;
  if p_data_inicio is null or p_data_fim is null or p_data_fim < p_data_inicio then
    raise exception 'Período do relatório inválido.';
  end if;

  return query
  with lancamentos as (
    select
      lc.id_funcionario,
      coalesce(sum(lc.valor_comissao) filter (
        where lc.status <> 'estornada'
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as geradas,
      coalesce(sum(lc.valor_comissao - lc.valor_pago) filter (
        where lc.status = 'prevista'
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as previstas,
      coalesce(sum(lc.valor_comissao - lc.valor_pago) filter (
        where lc.status in ('liberada', 'parcial')
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as liberadas,
      coalesce(sum(lc.valor_comissao) filter (
        where lc.status = 'estornada'
          and lc.estornada_em::date between p_data_inicio and p_data_fim
      ), 0) as estornadas,
      coalesce(sum(lc.valor_comissao) filter (
        where lc.tipo_origem = 'ajuste_manual'
          and lc.status <> 'estornada'
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as ajustes,
      coalesce(sum(lc.valor_comissao - lc.valor_pago) filter (
        where lc.status in ('liberada', 'parcial')
          and lc.competencia between p_data_inicio and p_data_fim
      ), 0) as saldo
    from public.lancamentos_comissao lc
    where lc.id_empresa = p_id_empresa
    group by lc.id_funcionario
  ), pagos as (
    select
      pc.id_funcionario,
      coalesce(sum(pci.valor), 0) as total
    from public.pagamentos_comissao pc
    join public.pagamentos_comissao_itens pci
      on pci.id_pagamento_comissao = pc.id
     and pci.id_empresa = pc.id_empresa
    where pc.id_empresa = p_id_empresa
      and pc.status = 'confirmado'
      and pc.pago_em::date between p_data_inicio and p_data_fim
    group by pc.id_funcionario
  )
  select
    f.id,
    f.nome::text,
    coalesce(l.geradas, 0),
    coalesce(l.previstas, 0),
    coalesce(l.liberadas, 0),
    coalesce(p.total, 0),
    coalesce(l.estornadas, 0),
    coalesce(l.ajustes, 0),
    coalesce(l.saldo, 0)
  from public.funcionarios f
  left join lancamentos l on l.id_funcionario = f.id
  left join pagos p on p.id_funcionario = f.id
  where f.id_empresa = p_id_empresa
    and (l.id_funcionario is not null or p.id_funcionario is not null)
  order by f.nome;
end;
$$;


ALTER FUNCTION "private"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") IS 'Resume comissões por funcionário no período informado.';



CREATE OR REPLACE FUNCTION "private"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") RETURNS TABLE("mes" "date", "receitas_previstas" numeric, "despesas_previstas" numeric, "receitas_realizadas" numeric, "despesas_realizadas" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_fuso text;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para visualizar relatórios financeiros.';
  end if;
  if p_data_inicio is null or p_data_fim is null or p_data_fim < p_data_inicio then
    raise exception 'Período do relatório inválido.';
  end if;
  if p_data_fim > p_data_inicio + interval '24 months' then
    raise exception 'O relatório está limitado a 24 meses por consulta.';
  end if;

  select coalesce(e.fuso_horario, 'America/Sao_Paulo') into v_fuso
  from public.empresas e where e.id = p_id_empresa;

  return query
  with meses as (
    select generate_series(
      date_trunc('month', p_data_inicio::timestamp),
      date_trunc('month', p_data_fim::timestamp),
      interval '1 month'
    )::date as mes
  ), previsto as (
    select date_trunc('month', cp.data_vencimento::timestamp)::date as mes,
           coalesce(sum(cp.valor_parcela) filter (where c.tipo = 'receber'), 0) as receitas,
           coalesce(sum(cp.valor_parcela) filter (where c.tipo = 'pagar'), 0) as despesas
    from public.contas_parcelas cp
    join public.contas c on c.id = cp.id_conta and c.id_empresa = cp.id_empresa
    where cp.id_empresa = p_id_empresa
      and cp.data_vencimento between p_data_inicio and p_data_fim
      and cp.status <> 'cancelada' and c.status <> 'cancelada'
    group by 1
  ), realizado as (
    select date_trunc('month', p.data_pagamento at time zone v_fuso)::date as mes,
           coalesce(sum(p.valor) filter (where p.tipo = 'entrada'), 0) as receitas,
           coalesce(sum(p.valor) filter (where p.tipo = 'saida'), 0) as despesas
    from public.pagamentos p
    where p.id_empresa = p_id_empresa
      and (p.data_pagamento at time zone v_fuso)::date between p_data_inicio and p_data_fim
      and p.status = 'confirmado'
    group by 1
  )
  select m.mes,
         coalesce(pr.receitas, 0)::numeric,
         coalesce(pr.despesas, 0)::numeric,
         coalesce(re.receitas, 0)::numeric,
         coalesce(re.despesas, 0)::numeric
  from meses m
  left join previsto pr on pr.mes = m.mes
  left join realizado re on re.mes = m.mes
  order by m.mes;
end;
$$;


ALTER FUNCTION "private"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") IS 'Retorna fluxo mensal previsto e realizado para o período.';



CREATE OR REPLACE FUNCTION "private"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono', 'gerente']::public.tipos_usuarios[]
  ) then
    raise exception 'Você não possui permissão para remover integrações.';
  end if;

  delete from public.integracoes
   where id = p_integracao_id
     and id_empresa = p_id_empresa;

  if not found then
    raise exception 'Integração não encontrada.';
  end if;
end;
$$;


ALTER FUNCTION "private"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."resolver_site_publico"("p_dominio" "text" DEFAULT NULL::"text", "p_slug" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
  with entrada as (
    select
      regexp_replace(
        split_part(regexp_replace(lower(btrim(coalesce(p_dominio, ''))), '^https?://', ''), '/', 1),
        ':[0-9]+$', ''
      ) as dominio,
      lower(btrim(coalesce(p_slug, ''))) as slug
  ), site_escolhido as (
    select sp.*
    from public.sites_publicos sp
    join public.empresas e on e.id = sp.id_empresa and e.status = 'ativo'
    cross join entrada x
    left join public.sites_publicos_dominios d on d.id_site = sp.id
    where sp.publicado
      and ((x.slug <> '' and sp.slug = x.slug) or (x.dominio <> '' and d.dominio = x.dominio))
    order by case when x.slug <> '' and sp.slug = x.slug then 0 else 1 end
    limit 1
  ), unidade_escolhida as (
    select u.*
    from site_escolhido sp
    join public.unidades u
      on u.id_empresa = sp.id_empresa
     and u.ativo
     and (u.id = sp.id_unidade_principal or (sp.id_unidade_principal is null and u.principal))
    order by (u.id = sp.id_unidade_principal) desc, u.principal desc, u.id
    limit 1
  )
  select jsonb_build_object(
    'site', jsonb_build_object(
      'id', sp.id,
      'slug', sp.slug,
      'dominio', (select d.dominio from public.sites_publicos_dominios d where d.id_site = sp.id order by d.principal desc, d.id limit 1),
      'nome_publico', coalesce(sp.nome_publico, e.fantasia),
      'titulo_hero', sp.titulo_hero,
      'destaque_hero', sp.destaque_hero,
      'descricao_hero', sp.descricao_hero,
      'titulo_sobre', sp.titulo_sobre,
      'descricao_sobre', sp.descricao_sobre,
      'imagem_hero_url', sp.imagem_hero_url,
      'imagem_compartilhamento_url', sp.imagem_compartilhamento_url,
      'instagram_url', sp.instagram_url,
      'whatsapp', coalesce(sp.whatsapp, ue.telefone),
      'email_publico', coalesce(sp.email_publico, ue.email),
      'texto_rodape', sp.texto_rodape,
      'titulo_seo', coalesce(sp.titulo_seo, sp.nome_publico, e.fantasia),
      'descricao_seo', coalesce(sp.descricao_seo, sp.descricao_hero),
      'palavras_chave', to_jsonb(sp.palavras_chave),
      'diferenciais', sp.diferenciais,
      'perguntas_frequentes', sp.perguntas_frequentes,
      'mostrar_precos', sp.mostrar_precos,
      'mostrar_profissionais', sp.mostrar_profissionais,
      'mostrar_avaliacoes', sp.mostrar_avaliacoes,
      'mostrar_endereco', sp.mostrar_endereco,
      'mostrar_horarios', sp.mostrar_horarios,
      'logo_url', ce.logo_url
    ),
    'empresa', jsonb_build_object(
      'id', e.id,
      'nome', e.fantasia,
      'fuso_horario', coalesce(e.fuso_horario, 'America/Sao_Paulo')
    ),
    'unidade', case when sp.mostrar_endereco and ue.id is not null then jsonb_build_object(
      'id', ue.id,
      'nome', ue.nome,
      'telefone', ue.telefone,
      'email', ue.email,
      'endereco', ue.endereco,
      'numero', ue.numero,
      'complemento', ue.complemento,
      'bairro', ue.bairro,
      'cidade', ue.cidade,
      'estado', ue.estado,
      'cep', ue.cep,
      'fuso_horario', ue.fuso_horario
    ) else null end,
    'horarios', case when sp.mostrar_horarios and ue.id is not null then coalesce((
      select jsonb_agg(jsonb_build_object(
        'dia_semana', h.dia_semana,
        'hora_abertura', h.hora_abertura,
        'hora_fechamento', h.hora_fechamento,
        'intervalo_inicio', h.intervalo_inicio,
        'intervalo_fim', h.intervalo_fim
      ) order by h.dia_semana)
      from public.horarios_funcionamento h
      where h.id_empresa = sp.id_empresa and h.id_unidade = ue.id and h.ativo
    ), '[]'::jsonb) else '[]'::jsonb end,
    'servicos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'nome', s.nome,
        'descricao', s.descricao,
        'preco', case when sp.mostrar_precos then s.preco else null end,
        'duracao_minutos', s.duracao_minutos,
        'intervalo_minutos', s.intervalo_minutos,
        'exige_sinal', s.exige_sinal,
        'sinal_tipo', s.sinal_tipo,
        'sinal_valor', case when sp.mostrar_precos then s.sinal_valor else null end
      ) order by s.nome)
      from public.servicos s
      where s.id_empresa = sp.id_empresa and s.ativo and s.permite_agendamento_online
    ), '[]'::jsonb),
    'profissionais', case when sp.mostrar_profissionais then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'nome', regexp_replace(f.nome, '[[:space:]]*\\(Teste\\)[[:space:]]*$', '', 'i'),
        'cargo', coalesce(f.cargo, 'Profissional'),
        'cor_agenda', f.cor_agenda,
        'servicos', coalesce((
          select jsonb_agg(s.id order by s.nome)
          from public.servicos s
          left join public.funcionarios_servicos fs
            on fs.id_empresa = f.id_empresa and fs.id_funcionario = f.id
           and fs.id_servico = s.id and fs.ativo
          where s.id_empresa = f.id_empresa and s.ativo and s.permite_agendamento_online
            and (not exists (
              select 1 from public.funcionarios_servicos configuracao
              where configuracao.id_empresa = f.id_empresa and configuracao.id_funcionario = f.id
            ) or fs.id is not null)
        ), '[]'::jsonb)
      ) order by f.nome)
      from public.funcionarios f
      where f.id_empresa = sp.id_empresa and f.ativo and f.atende_clientes
    ), '[]'::jsonb) else '[]'::jsonb end,
    'avaliacoes', case when sp.mostrar_avaliacoes then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'nota', a.nota,
        'comentario', a.comentario,
        'nome', coalesce(nullif(a.nome_publico, ''), split_part(c.nome, ' ', 1)),
        'created_at', a.created_at
      ) order by a.destaque desc, a.created_at desc)
      from public.avaliacoes a
      left join public.clientes c on c.id_empresa = a.id_empresa and c.id = a.id_cliente
      where a.id_empresa = sp.id_empresa
        and a.status = 'aprovada'
        and a.autorizado_publicacao
        and nullif(btrim(a.comentario), '') is not null
    ), '[]'::jsonb) else '[]'::jsonb end
  )
  from site_escolhido sp
  join public.empresas e on e.id = sp.id_empresa
  left join unidade_escolhida ue on true
  left join public.configuracoes_empresas ce on ce.id_empresa = sp.id_empresa;
$_$;


ALTER FUNCTION "private"."resolver_site_publico"("p_dominio" "text", "p_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id bigint;
  v_status text;
  v_item jsonb;
  v_tipo text;
  v_servico_id bigint;
  v_produto_id bigint;
  v_funcionario_id bigint;
  v_descricao text;
  v_quantidade numeric;
  v_valor numeric;
  v_desconto numeric;
  v_ordem integer := 0;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para gerenciar comandas.';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione pelo menos um item à comanda.';
  end if;
  if coalesce(p_desconto,0) < 0 or coalesce(p_acrescimo,0) < 0 then
    raise exception 'Desconto e acréscimo não podem ser negativos.';
  end if;
  if not exists (
    select 1 from public.clientes c
    where c.id = p_id_cliente and c.id_empresa = p_id_empresa and c.ativo
  ) then
    raise exception 'Cliente inválido, inativo ou pertencente a outra empresa.';
  end if;

  if p_comanda_id is null then
    insert into public.comandas (
      id_empresa,id_cliente,id_funcionario_responsavel,status,observacoes,
      subtotal,desconto_itens,desconto,acrescimo,criado_por
    ) values (
      p_id_empresa,p_id_cliente,p_id_funcionario_responsavel,'aberta',
      nullif(btrim(p_observacoes),''),0,0,0,0,auth.uid()
    ) returning id into v_id;
  else
    select c.status into v_status
    from public.comandas c
    where c.id = p_comanda_id and c.id_empresa = p_id_empresa
    for update;
    if not found then raise exception 'Comanda não encontrada.'; end if;
    if v_status <> 'aberta' then raise exception 'Somente comandas abertas podem ser editadas.'; end if;

    v_id := p_comanda_id;
    update public.comandas
       set id_cliente = p_id_cliente,
           id_funcionario_responsavel = p_id_funcionario_responsavel,
           observacoes = nullif(btrim(p_observacoes),''),
           desconto = 0,
           acrescimo = 0
     where id = v_id and id_empresa = p_id_empresa;
    delete from public.comandas_itens
     where id_comanda = v_id and id_empresa = p_id_empresa;
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_ordem := v_ordem + 1;
    v_tipo := v_item->>'tipo_item';
    v_servico_id := nullif(v_item->>'id_servico','')::bigint;
    v_produto_id := nullif(v_item->>'id_produto','')::bigint;
    v_funcionario_id := nullif(v_item->>'id_funcionario','')::bigint;
    v_descricao := nullif(btrim(v_item->>'descricao'),'');
    v_quantidade := nullif(v_item->>'quantidade','')::numeric;
    v_valor := nullif(v_item->>'valor_unitario','')::numeric;
    v_desconto := coalesce(nullif(v_item->>'desconto','')::numeric,0);

    if v_tipo not in ('servico','produto','outro')
       or coalesce(v_quantidade,0) <= 0
       or coalesce(v_valor,-1) < 0
       or v_desconto < 0
       or v_desconto > v_quantidade * v_valor then
      raise exception 'Revise o tipo, quantidade, preço e desconto dos itens.';
    end if;
    if v_tipo = 'servico' and (v_servico_id is null or v_produto_id is not null or v_funcionario_id is null) then
      raise exception 'Serviços exigem catálogo e profissional.';
    elsif v_tipo = 'produto' and (v_produto_id is null or v_servico_id is not null) then
      raise exception 'Selecione um produto válido.';
    elsif v_tipo = 'outro' and (v_servico_id is not null or v_produto_id is not null or v_descricao is null) then
      raise exception 'Itens avulsos exigem descrição.';
    end if;

    insert into public.comandas_itens (
      id_empresa,id_comanda,tipo_item,id_servico,id_produto,id_funcionario,
      descricao_snapshot,quantidade,valor_unitario_snapshot,desconto,ordem,observacoes
    ) values (
      p_id_empresa,v_id,v_tipo,v_servico_id,v_produto_id,v_funcionario_id,
      v_descricao,v_quantidade,v_valor,v_desconto,v_ordem,
      nullif(btrim(v_item->>'observacoes'),'')
    );
  end loop;

  update public.comandas
     set desconto = coalesce(p_desconto,0),
         acrescimo = coalesce(p_acrescimo,0)
   where id = v_id and id_empresa = p_id_empresa;

  return v_id;
end;
$$;


ALTER FUNCTION "private"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") IS 'Cria ou edita comanda aberta e seus itens atomicamente.';



CREATE OR REPLACE FUNCTION "private"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text" DEFAULT 'a_receber'::"text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_comanda_id bigint;
begin
  if p_condicao_pagamento not in ('a_receber', 'pago') then
    raise exception 'Condição de pagamento inválida para uma comanda aberta.';
  end if;

  v_comanda_id := public.salvar_comanda(
    p_comanda_id,
    p_id_empresa,
    p_id_cliente,
    p_id_funcionario_responsavel,
    p_desconto,
    p_acrescimo,
    p_observacoes,
    p_itens
  );

  update public.comandas
     set condicao_pagamento = p_condicao_pagamento
   where id = v_comanda_id
     and id_empresa = p_id_empresa
     and status = 'aberta';

  if not found then
    raise exception 'A condição de pagamento só pode ser alterada em uma comanda aberta.';
  end if;

  return v_comanda_id;
end;
$$;


ALTER FUNCTION "private"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text") IS 'Cria ou edita uma comanda aberta e salva a condição escolhida para o futuro fechamento.';



CREATE OR REPLACE FUNCTION "private"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_compra_id bigint;
  v_status text;
  v_item jsonb;
  v_produto_id bigint;
  v_nome_produto text;
  v_quantidade numeric;
  v_valor_unitario numeric;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para gerenciar compras.';
  end if;

  if p_itens is null
     or jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione pelo menos um produto à compra.';
  end if;

  if coalesce(p_frete, 0) < 0 or coalesce(p_desconto, 0) < 0 then
    raise exception 'Frete e desconto não podem ser negativos.';
  end if;

  if p_compra_id is null then
    insert into public.compras (
      id_empresa, id_fornecedor, data_compra, numero_documento,
      previsao_entrega, frete, desconto, observacoes, status,
      total_produtos, total_final, criado_por
    ) values (
      p_id_empresa, p_id_fornecedor, coalesce(p_data_compra, current_date),
      nullif(btrim(p_numero_documento), ''), p_previsao_entrega,
      0, 0, nullif(btrim(p_observacoes), ''), 'pedido', 0, 0, auth.uid()
    ) returning id into v_compra_id;
  else
    select c.status
      into v_status
    from public.compras c
    where c.id = p_compra_id
      and c.id_empresa = p_id_empresa
    for update;

    if not found then
      raise exception 'Compra não encontrada.';
    end if;
    if v_status not in ('rascunho', 'pedido') then
      raise exception 'Somente compras ainda não recebidas podem ser editadas.';
    end if;

    v_compra_id := p_compra_id;
    update public.compras
       set id_fornecedor = p_id_fornecedor,
           data_compra = coalesce(p_data_compra, current_date),
           numero_documento = nullif(btrim(p_numero_documento), ''),
           previsao_entrega = p_previsao_entrega,
           frete = 0,
           desconto = 0,
           observacoes = nullif(btrim(p_observacoes), ''),
           status = 'pedido'
     where id = v_compra_id
       and id_empresa = p_id_empresa;

    delete from public.compras_itens
     where id_compra = v_compra_id
       and id_empresa = p_id_empresa;
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_produto_id := nullif(v_item->>'id_produto', '')::bigint;
    v_quantidade := nullif(v_item->>'quantidade', '')::numeric;
    v_valor_unitario := nullif(v_item->>'valor_unitario', '')::numeric;

    if v_produto_id is null
       or coalesce(v_quantidade, 0) <= 0
       or coalesce(v_valor_unitario, -1) < 0 then
      raise exception 'Revise os produtos, quantidades e custos da compra.';
    end if;

    select p.nome
      into v_nome_produto
    from public.produtos p
    where p.id = v_produto_id
      and p.id_empresa = p_id_empresa
      and p.ativo;

    if not found then
      raise exception 'Produto inválido, inativo ou pertencente a outra empresa.';
    end if;

    insert into public.compras_itens (
      id_empresa, id_compra, id_produto, descricao_snapshot,
      quantidade_comprada, quantidade_recebida, valor_unitario,
      desconto, total
    ) values (
      p_id_empresa, v_compra_id, v_produto_id, v_nome_produto,
      v_quantidade, 0, v_valor_unitario, 0,
      round(v_quantidade * v_valor_unitario, 2)
    );
  end loop;

  update public.compras
     set frete = coalesce(p_frete, 0),
         desconto = coalesce(p_desconto, 0)
   where id = v_compra_id
     and id_empresa = p_id_empresa;

  return v_compra_id;
end;
$$;


ALTER FUNCTION "private"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") IS 'Cria ou edita compra ainda não recebida e substitui seus itens atomicamente.';



CREATE OR REPLACE FUNCTION "private"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) RETURNS "public"."configuracoes_empresas"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_config public.configuracoes_empresas;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono']::public.tipos_usuarios[]
  ) then
    raise exception 'Somente o administrador pode alterar as preferências da empresa.';
  end if;

  if p_logo_url is not null
     and btrim(p_logo_url) <> ''
     and btrim(p_logo_url) !~ '^https://[^[:space:]]+$' then
    raise exception 'A URL do logotipo precisa começar com https://.';
  end if;

  insert into public.configuracoes_empresas (
    id_empresa, tema_preferido, cor_primaria, cor_destaque,
    raio_interface, densidade_interface, logo_url, idioma, moeda,
    semana_inicia, duracao_slot_minutos, updated_by
  ) values (
    p_id_empresa, p_tema_preferido, upper(p_cor_primaria), upper(p_cor_destaque),
    p_raio_interface, p_densidade_interface,
    nullif(btrim(p_logo_url), ''), p_idioma, upper(p_moeda),
    p_semana_inicia, p_duracao_slot_minutos, auth.uid()
  )
  on conflict (id_empresa) do update set
    tema_preferido = excluded.tema_preferido,
    cor_primaria = excluded.cor_primaria,
    cor_destaque = excluded.cor_destaque,
    raio_interface = excluded.raio_interface,
    densidade_interface = excluded.densidade_interface,
    logo_url = excluded.logo_url,
    idioma = excluded.idioma,
    moeda = excluded.moeda,
    semana_inicia = excluded.semana_inicia,
    duracao_slot_minutos = excluded.duracao_slot_minutos,
    updated_at = now(),
    updated_by = auth.uid()
  returning * into v_config;

  return v_config;
end;
$_$;


ALTER FUNCTION "private"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id bigint;
  v_conta record;
  v_categoria_tipo text;
  v_valor_base numeric(14,2);
  v_valor_parcela numeric(14,2);
  v_indice integer;
begin
  if not (
    private.usuario_tem_tipo_empresa(
      p_id_empresa,
      array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
    )
    or (
      p_tipo = 'receber'
      and private.usuario_tem_tipo_empresa(
        p_id_empresa,
        array['recepcionista'::public.tipos_usuarios]
      )
    )
  ) then
    raise exception 'Você não possui permissão para gerenciar esta conta.';
  end if;

  if p_tipo not in ('receber', 'pagar') then
    raise exception 'Tipo de conta inválido.';
  end if;
  if nullif(btrim(p_descricao), '') is null then
    raise exception 'Informe a descrição da conta.';
  end if;
  if coalesce(p_valor_total, 0) <= 0 then
    raise exception 'O valor total deve ser maior que zero.';
  end if;
  if coalesce(p_numero_parcelas, 0) not between 1 and 120 then
    raise exception 'A quantidade de parcelas deve ficar entre 1 e 120.';
  end if;
  if p_valor_total < p_numero_parcelas * 0.01 then
    raise exception 'O valor total é insuficiente para a quantidade de parcelas.';
  end if;
  if p_primeiro_vencimento is null then
    raise exception 'Informe o primeiro vencimento.';
  end if;

  if p_id_categoria is not null then
    select c.tipo into v_categoria_tipo
    from public.categorias_financeiras c
    where c.id = p_id_categoria
      and c.id_empresa = p_id_empresa
      and c.ativo;

    if not found then
      raise exception 'Categoria financeira inválida ou inativa.';
    end if;
    if v_categoria_tipo <> 'ambos'
       and v_categoria_tipo <> (case when p_tipo = 'receber' then 'entrada' else 'saida' end) then
      raise exception 'A categoria não corresponde ao tipo da conta.';
    end if;
  end if;

  if p_id_cliente is not null and not exists (
    select 1 from public.clientes c
    where c.id = p_id_cliente and c.id_empresa = p_id_empresa and c.ativo
  ) then
    raise exception 'Cliente inválido ou inativo.';
  end if;
  if p_id_fornecedor is not null and not exists (
    select 1 from public.fornecedores f
    where f.id = p_id_fornecedor and f.id_empresa = p_id_empresa and f.ativo
  ) then
    raise exception 'Fornecedor inválido ou inativo.';
  end if;
  if p_tipo = 'receber' and p_id_fornecedor is not null then
    raise exception 'Contas a receber não podem possuir fornecedor.';
  end if;
  if p_tipo = 'pagar' and p_id_cliente is not null then
    raise exception 'Contas a pagar não podem possuir cliente.';
  end if;

  if p_conta_id is null then
    insert into public.contas (
      id_empresa, tipo, id_cliente, id_fornecedor, id_categoria,
      descricao, documento, data_emissao, competencia,
      valor_total, valor_pago, status, observacoes, criado_por
    ) values (
      p_id_empresa, p_tipo,
      case when p_tipo = 'receber' then p_id_cliente end,
      case when p_tipo = 'pagar' then p_id_fornecedor end,
      p_id_categoria, btrim(p_descricao), nullif(btrim(p_documento), ''),
      coalesce(p_data_emissao, current_date), p_competencia,
      0, 0, 'aberta', nullif(btrim(p_observacoes), ''), auth.uid()
    ) returning id into v_id;
  else
    select c.* into v_conta
    from public.contas c
    where c.id = p_conta_id and c.id_empresa = p_id_empresa
    for update;

    if not found then
      raise exception 'Conta não encontrada.';
    end if;
    if v_conta.id_comanda is not null then
      raise exception 'Contas geradas por comandas devem ser ajustadas na origem.';
    end if;
    if v_conta.status in ('paga', 'parcial', 'cancelada') or v_conta.valor_pago > 0 then
      raise exception 'Somente contas sem pagamentos podem ser editadas.';
    end if;

    v_id := p_conta_id;
    delete from public.contas_parcelas
    where id_conta = v_id and id_empresa = p_id_empresa;

    update public.contas
       set tipo = p_tipo,
           id_cliente = case when p_tipo = 'receber' then p_id_cliente end,
           id_fornecedor = case when p_tipo = 'pagar' then p_id_fornecedor end,
           id_categoria = p_id_categoria,
           descricao = btrim(p_descricao),
           documento = nullif(btrim(p_documento), ''),
           data_emissao = coalesce(p_data_emissao, current_date),
           competencia = p_competencia,
           observacoes = nullif(btrim(p_observacoes), ''),
           status = 'aberta', valor_total = 0, valor_pago = 0,
           cancelada_em = null, motivo_cancelamento = null
     where id = v_id and id_empresa = p_id_empresa;
  end if;

  v_valor_base := trunc(p_valor_total / p_numero_parcelas, 2);
  v_indice := 1;
  while v_indice <= p_numero_parcelas loop
    v_valor_parcela := case
      when v_indice = p_numero_parcelas
        then p_valor_total - v_valor_base * (p_numero_parcelas - 1)
      else v_valor_base
    end;

    insert into public.contas_parcelas (
      id_empresa, id_conta, numero_parcela, data_vencimento,
      valor_parcela, valor_pago, status
    ) values (
      p_id_empresa, v_id, v_indice,
      (p_primeiro_vencimento + ((v_indice - 1) * interval '1 month'))::date,
      v_valor_parcela, 0,
      case when p_primeiro_vencimento + ((v_indice - 1) * interval '1 month') < current_date
        then 'atrasada' else 'aberta' end
    );
    v_indice := v_indice + 1;
  end loop;

  return v_id;
end;
$$;


ALTER FUNCTION "private"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") IS 'Cria ou edita conta e parcelas atomicamente.';



CREATE OR REPLACE FUNCTION "private"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text" DEFAULT 'configurando'::"text") RETURNS "public"."integracoes"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_integracao public.integracoes;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono', 'gerente']::public.tipos_usuarios[]
  ) then
    raise exception 'Você não possui permissão para configurar integrações.';
  end if;

  if (p_tipo, p_provedor) not in (
    ('whatsapp', 'meta_cloud'),
    ('calendario', 'google_calendar'),
    ('email', 'resend'),
    ('webhook', 'webhook')
  ) then
    raise exception 'Tipo de integração não suportado.';
  end if;

  if jsonb_typeof(coalesce(p_configuracoes, '{}'::jsonb)) <> 'object' then
    raise exception 'As configurações da integração são inválidas.';
  end if;

  if coalesce(p_configuracoes, '{}'::jsonb) ?| array[
    'token', 'secret', 'password', 'senha', 'api_key', 'authorization'
  ] then
    raise exception 'Credenciais secretas devem ser salvas no servidor, nunca nesta configuração.';
  end if;

  if p_status not in ('configurando', 'inativa') then
    raise exception 'A ativação só pode ocorrer após validação segura das credenciais no servidor.';
  end if;

  insert into public.integracoes (
    id_empresa, tipo, provedor, configuracoes, status
  ) values (
    p_id_empresa, p_tipo, p_provedor,
    coalesce(p_configuracoes, '{}'::jsonb), p_status
  )
  on conflict (id_empresa, tipo, provedor) do update set
    configuracoes = excluded.configuracoes,
    status = excluded.status,
    ultimo_erro = null
  returning * into v_integracao;

  return v_integracao;
end;
$$;


ALTER FUNCTION "private"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text") IS 'Salva apenas configurações públicas. Tokens e segredos devem ficar em backend/Vault.';



CREATE OR REPLACE FUNCTION "private"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id bigint;
  v_status text;
  v_item jsonb;
  v_tipo text;
  v_servico_id bigint;
  v_produto_id bigint;
  v_descricao text;
  v_quantidade numeric;
  v_valor numeric;
  v_desconto numeric;
  v_ordem integer := 0;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios,'gerente'::public.tipos_usuarios,'recepcionista'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para gerenciar orçamentos.';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione pelo menos um item ao orçamento.';
  end if;
  if coalesce(p_desconto, 0) < 0 or coalesce(p_acrescimo, 0) < 0 then
    raise exception 'Desconto e acréscimo não podem ser negativos.';
  end if;
  if not exists (
    select 1 from public.clientes c
    where c.id = p_id_cliente and c.id_empresa = p_id_empresa and c.ativo
  ) then
    raise exception 'Cliente inválido, inativo ou pertencente a outra empresa.';
  end if;

  if p_orcamento_id is null then
    insert into public.orcamentos (
      id_empresa,id_cliente,status,validade,observacoes,
      subtotal,desconto_itens,desconto,acrescimo,criado_por
    ) values (
      p_id_empresa,p_id_cliente,'rascunho',p_validade,nullif(btrim(p_observacoes),''),
      0,0,0,0,auth.uid()
    ) returning id into v_id;
  else
    select o.status into v_status
    from public.orcamentos o
    where o.id = p_orcamento_id and o.id_empresa = p_id_empresa
    for update;

    if not found then raise exception 'Orçamento não encontrado.'; end if;
    if v_status not in ('rascunho','enviado') then
      raise exception 'Somente orçamentos em rascunho ou enviados podem ser editados.';
    end if;

    v_id := p_orcamento_id;
    update public.orcamentos
       set id_cliente = p_id_cliente,
           validade = p_validade,
           observacoes = nullif(btrim(p_observacoes),''),
           desconto = 0,
           acrescimo = 0
     where id = v_id and id_empresa = p_id_empresa;
    delete from public.orcamentos_itens
     where id_orcamento = v_id and id_empresa = p_id_empresa;
  end if;

  for v_item in select value from jsonb_array_elements(p_itens)
  loop
    v_ordem := v_ordem + 1;
    v_tipo := v_item->>'tipo_item';
    v_servico_id := nullif(v_item->>'id_servico','')::bigint;
    v_produto_id := nullif(v_item->>'id_produto','')::bigint;
    v_descricao := nullif(btrim(v_item->>'descricao'), '');
    v_quantidade := nullif(v_item->>'quantidade','')::numeric;
    v_valor := nullif(v_item->>'valor_unitario','')::numeric;
    v_desconto := coalesce(nullif(v_item->>'desconto','')::numeric, 0);

    if v_tipo not in ('servico','produto','outro')
       or coalesce(v_quantidade, 0) <= 0
       or coalesce(v_valor, -1) < 0
       or v_desconto < 0
       or v_desconto > v_quantidade * v_valor then
      raise exception 'Revise o tipo, quantidade, preço e desconto dos itens.';
    end if;
    if v_tipo = 'servico' and (v_servico_id is null or v_produto_id is not null) then
      raise exception 'Selecione um serviço válido.';
    elsif v_tipo = 'produto' and (v_produto_id is null or v_servico_id is not null) then
      raise exception 'Selecione um produto válido.';
    elsif v_tipo = 'outro' and (v_servico_id is not null or v_produto_id is not null or v_descricao is null) then
      raise exception 'Itens avulsos exigem descrição.';
    end if;

    insert into public.orcamentos_itens (
      id_empresa,id_orcamento,tipo_item,id_servico,id_produto,
      descricao_snapshot,quantidade,valor_unitario_snapshot,
      desconto,ordem,observacoes
    ) values (
      p_id_empresa,v_id,v_tipo,v_servico_id,v_produto_id,
      v_descricao,v_quantidade,v_valor,
      v_desconto,v_ordem,nullif(btrim(v_item->>'observacoes'),'')
    );
  end loop;

  update public.orcamentos
     set desconto = coalesce(p_desconto,0),
         acrescimo = coalesce(p_acrescimo,0)
   where id = v_id and id_empresa = p_id_empresa;

  return v_id;
end;
$$;


ALTER FUNCTION "private"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "private"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") IS 'Cria ou edita orçamento e seus itens atomicamente.';



CREATE OR REPLACE FUNCTION "private"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_item jsonb;
  v_modulo text;
  v_permitido boolean;
  v_tipo public.tipos_usuarios;
begin
  if not private.usuario_tem_tipo_empresa(p_id_empresa, array['dono']::public.tipos_usuarios[]) then
    raise exception 'Somente o administrador pode personalizar permissões.';
  end if;
  if not private.plano_tem_funcionalidade_empresa(p_id_empresa, 'permissoes_personalizadas') then
    raise exception 'Permissões personalizadas não estão disponíveis no plano atual.';
  end if;
  if jsonb_typeof(p_permissoes) <> 'array' then
    raise exception 'A lista de permissões é inválida.';
  end if;

  select ue.tipo into v_tipo
  from public.usuarios_empresas ue
  where ue.id = p_usuario_empresa_id and ue.empresa_id = p_id_empresa;
  if v_tipo is null then raise exception 'Usuário da empresa não encontrado.'; end if;

  delete from public.permissoes_usuarios
   where id_empresa = p_id_empresa and usuario_empresa_id = p_usuario_empresa_id;

  for v_item in select value from jsonb_array_elements(p_permissoes)
  loop
    v_modulo := v_item ->> 'modulo';
    v_permitido := coalesce((v_item ->> 'permitido')::boolean, true);
    if v_modulo not in (
      'dashboard', 'agendamentos', 'clientes', 'comandas', 'orcamentos',
      'funcionarios', 'servicos', 'produtos', 'fornecedores', 'financeiro',
      'comissoes', 'estoque', 'historico', 'configuracoes'
    ) then raise exception 'Módulo de permissão inválido: %.', v_modulo; end if;
    if v_tipo = 'dono'::public.tipos_usuarios
       and v_modulo = 'configuracoes'
       and not v_permitido then
      raise exception 'A administração não pode ser bloqueada para um dono.';
    end if;

    insert into public.permissoes_usuarios (
      id_empresa, usuario_empresa_id, modulo, permitido, atualizado_por
    ) values (
      p_id_empresa, p_usuario_empresa_id, v_modulo, v_permitido, auth.uid()
    );
  end loop;
end;
$$;


ALTER FUNCTION "private"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id bigint;
  v_servico bigint;
  v_produto bigint;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa,
    array['dono'::public.tipos_usuarios, 'gerente'::public.tipos_usuarios]
  ) then
    raise exception 'Você não possui permissão para gerenciar regras de comissão.';
  end if;

  if p_tipo_item not in ('todos', 'servico', 'produto') then
    raise exception 'Tipo de item da regra inválido.';
  end if;
  if p_tipo_calculo not in ('percentual', 'valor_fixo') then
    raise exception 'Tipo de cálculo inválido.';
  end if;
  if p_tipo_calculo = 'percentual' and coalesce(p_percentual, 0) not between 0.0001 and 100 then
    raise exception 'O percentual deve ser maior que zero e menor ou igual a 100.';
  end if;
  if p_tipo_calculo = 'valor_fixo' and coalesce(p_valor_fixo, 0) <= 0 then
    raise exception 'O valor fixo deve ser maior que zero.';
  end if;
  if p_base_calculo not in ('bruto', 'liquido_desconto') then
    raise exception 'Base de cálculo inválida.';
  end if;
  if p_momento_liberacao not in ('fechamento_comanda', 'pagamento_cliente') then
    raise exception 'Momento de liberação inválido.';
  end if;
  if p_vigente_de is null then
    raise exception 'Informe o início da vigência.';
  end if;
  if p_vigente_ate is not null and p_vigente_ate < p_vigente_de then
    raise exception 'O fim da vigência deve ser posterior ao início.';
  end if;

  if p_id_funcionario is not null and not exists (
    select 1 from public.funcionarios f
    where f.id = p_id_funcionario and f.id_empresa = p_id_empresa
  ) then
    raise exception 'Funcionário inválido ou pertencente a outra empresa.';
  end if;

  v_servico := case when p_tipo_item = 'servico' then p_id_servico end;
  v_produto := case when p_tipo_item = 'produto' then p_id_produto end;

  if v_servico is not null and not exists (
    select 1 from public.servicos s
    where s.id = v_servico and s.id_empresa = p_id_empresa
  ) then
    raise exception 'Serviço inválido ou pertencente a outra empresa.';
  end if;
  if v_produto is not null and not exists (
    select 1 from public.produtos p
    where p.id = v_produto and p.id_empresa = p_id_empresa
  ) then
    raise exception 'Produto inválido ou pertencente a outra empresa.';
  end if;

  if p_regra_id is null then
    begin
      insert into public.comissoes_regras (
        id_empresa, id_funcionario, id_servico, id_produto, tipo_item,
        tipo_calculo, percentual, valor_fixo, base_calculo,
        momento_liberacao, vigente_de, vigente_ate, prioridade, ativo, criado_por
      ) values (
        p_id_empresa, p_id_funcionario, v_servico, v_produto, p_tipo_item,
        p_tipo_calculo,
        case when p_tipo_calculo = 'percentual' then p_percentual end,
        case when p_tipo_calculo = 'valor_fixo' then p_valor_fixo end,
        p_base_calculo, p_momento_liberacao, p_vigente_de, p_vigente_ate,
        coalesce(p_prioridade, 0), coalesce(p_ativo, true), auth.uid()
      ) returning id into v_id;
    exception when unique_violation then
      raise exception 'Já existe uma regra com o mesmo escopo e início de vigência.';
    end;
  else
    perform 1 from public.comissoes_regras r
    where r.id = p_regra_id and r.id_empresa = p_id_empresa
    for update;
    if not found then raise exception 'Regra de comissão não encontrada.'; end if;

    begin
      update public.comissoes_regras
         set id_funcionario = p_id_funcionario,
             id_servico = v_servico,
             id_produto = v_produto,
             tipo_item = p_tipo_item,
             tipo_calculo = p_tipo_calculo,
             percentual = case when p_tipo_calculo = 'percentual' then p_percentual end,
             valor_fixo = case when p_tipo_calculo = 'valor_fixo' then p_valor_fixo end,
             base_calculo = p_base_calculo,
             momento_liberacao = p_momento_liberacao,
             vigente_de = p_vigente_de,
             vigente_ate = p_vigente_ate,
             prioridade = coalesce(p_prioridade, 0),
             ativo = coalesce(p_ativo, true)
       where id = p_regra_id and id_empresa = p_id_empresa;
    exception when unique_violation then
      raise exception 'Já existe uma regra com o mesmo escopo e início de vigência.';
    end;
    v_id := p_regra_id;
  end if;

  return v_id;
end;
$$;


ALTER FUNCTION "private"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "private"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) IS 'Cria ou atualiza uma regra de comissão com validação de escopo.';



CREATE OR REPLACE FUNCTION "private"."salvar_site_publico"("p_id_empresa" bigint, "p_config" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $_$
declare
  v_site public.sites_publicos%rowtype;
  v_slug text;
  v_dominio text;
  v_indice integer := 0;
begin
  if not private.usuario_tem_tipo_empresa(
    p_id_empresa, array['dono', 'gerente']::public.tipos_usuarios[]
  ) then
    raise exception 'Você não possui permissão para configurar o site público.';
  end if;

  v_slug := lower(btrim(coalesce(p_config->>'slug', '')));
  if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Use um slug com letras minúsculas, números e hífens.';
  end if;
  if jsonb_typeof(coalesce(p_config->'dominios', '[]'::jsonb)) <> 'array' then
    raise exception 'A lista de domínios é inválida.';
  end if;

  insert into public.sites_publicos (
    id_empresa, id_unidade_principal, slug, publicado, nome_publico,
    titulo_hero, destaque_hero, descricao_hero, titulo_sobre,
    descricao_sobre, imagem_hero_url, imagem_compartilhamento_url,
    instagram_url, whatsapp, email_publico, texto_rodape, titulo_seo,
    descricao_seo, palavras_chave, diferenciais, perguntas_frequentes,
    mostrar_precos, mostrar_profissionais, mostrar_avaliacoes,
    mostrar_endereco, mostrar_horarios, updated_at, atualizado_por
  ) values (
    p_id_empresa,
    nullif(p_config->>'id_unidade_principal', '')::bigint,
    v_slug,
    coalesce((p_config->>'publicado')::boolean, false),
    nullif(btrim(p_config->>'nome_publico'), ''),
    nullif(btrim(p_config->>'titulo_hero'), ''),
    nullif(btrim(p_config->>'destaque_hero'), ''),
    nullif(btrim(p_config->>'descricao_hero'), ''),
    nullif(btrim(p_config->>'titulo_sobre'), ''),
    nullif(btrim(p_config->>'descricao_sobre'), ''),
    nullif(btrim(p_config->>'imagem_hero_url'), ''),
    nullif(btrim(p_config->>'imagem_compartilhamento_url'), ''),
    nullif(btrim(p_config->>'instagram_url'), ''),
    nullif(btrim(p_config->>'whatsapp'), ''),
    nullif(btrim(p_config->>'email_publico'), ''),
    nullif(btrim(p_config->>'texto_rodape'), ''),
    nullif(btrim(p_config->>'titulo_seo'), ''),
    nullif(btrim(p_config->>'descricao_seo'), ''),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_config->'palavras_chave', '[]'::jsonb))), '{}'),
    coalesce(p_config->'diferenciais', '[]'::jsonb),
    coalesce(p_config->'perguntas_frequentes', '[]'::jsonb),
    coalesce((p_config->>'mostrar_precos')::boolean, true),
    coalesce((p_config->>'mostrar_profissionais')::boolean, true),
    coalesce((p_config->>'mostrar_avaliacoes')::boolean, false),
    coalesce((p_config->>'mostrar_endereco')::boolean, true),
    coalesce((p_config->>'mostrar_horarios')::boolean, true),
    now(), auth.uid()
  )
  on conflict (id_empresa) do update set
    id_unidade_principal = excluded.id_unidade_principal,
    slug = excluded.slug,
    publicado = excluded.publicado,
    nome_publico = excluded.nome_publico,
    titulo_hero = excluded.titulo_hero,
    destaque_hero = excluded.destaque_hero,
    descricao_hero = excluded.descricao_hero,
    titulo_sobre = excluded.titulo_sobre,
    descricao_sobre = excluded.descricao_sobre,
    imagem_hero_url = excluded.imagem_hero_url,
    imagem_compartilhamento_url = excluded.imagem_compartilhamento_url,
    instagram_url = excluded.instagram_url,
    whatsapp = excluded.whatsapp,
    email_publico = excluded.email_publico,
    texto_rodape = excluded.texto_rodape,
    titulo_seo = excluded.titulo_seo,
    descricao_seo = excluded.descricao_seo,
    palavras_chave = excluded.palavras_chave,
    diferenciais = excluded.diferenciais,
    perguntas_frequentes = excluded.perguntas_frequentes,
    mostrar_precos = excluded.mostrar_precos,
    mostrar_profissionais = excluded.mostrar_profissionais,
    mostrar_avaliacoes = excluded.mostrar_avaliacoes,
    mostrar_endereco = excluded.mostrar_endereco,
    mostrar_horarios = excluded.mostrar_horarios,
    updated_at = now(),
    atualizado_por = auth.uid()
  returning * into v_site;

  delete from public.sites_publicos_dominios
  where id_site = v_site.id;

  for v_dominio in
    select distinct regexp_replace(
      split_part(regexp_replace(lower(btrim(value)), '^https?://', ''), '/', 1),
      ':[0-9]+$', ''
    )
    from jsonb_array_elements_text(coalesce(p_config->'dominios', '[]'::jsonb))
    where nullif(btrim(value), '') is not null
  loop
    if v_dominio !~ '^[a-z0-9.-]+$' then
      raise exception 'Domínio inválido: %', v_dominio;
    end if;
    insert into public.sites_publicos_dominios (
      id_site, id_empresa, dominio, principal
    ) values (v_site.id, p_id_empresa, v_dominio, v_indice = 0);
    v_indice := v_indice + 1;
  end loop;

  if v_indice = 0 then
    raise exception 'Informe pelo menos um domínio para publicar o site.';
  end if;

  return to_jsonb(v_site) || jsonb_build_object(
    'dominios', (
      select jsonb_agg(d.dominio order by d.principal desc, d.dominio)
      from public.sites_publicos_dominios d
      where d.id_site = v_site.id
    )
  );
end;
$_$;


ALTER FUNCTION "private"."salvar_site_publico"("p_id_empresa" bigint, "p_config" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."sincronizar_disponibilidade_com_bloqueio"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id_bloqueio bigint;
begin
  if tg_op = 'DELETE' then
    if old.id_bloqueio_agenda is not null then
      update public.bloqueios_agenda
      set status = 'cancelado',
          cancelado_em = now(),
          cancelado_por = auth.uid(),
          motivo_cancelamento = 'Disponibilidade removida.',
          updated_at = now()
      where id_empresa = old.id_empresa
        and id = old.id_bloqueio_agenda
        and status = 'ativo';
    end if;
    return old;
  end if;

  if new.tipo = 'indisponivel' and new.ativo then
    if new.id_bloqueio_agenda is null then
      insert into public.bloqueios_agenda (
        id_empresa, id_unidade, id_funcionario, tipo, inicio, fim,
        dia_inteiro, motivo, status, criado_por
      ) values (
        new.id_empresa, new.id_unidade, new.id_profissional,
        'bloqueio', new.inicio, new.fim, false,
        coalesce(new.observacoes, 'Indisponibilidade do profissional.'),
        'ativo', coalesce(new.criado_por, auth.uid())
      )
      returning id into v_id_bloqueio;

      new.id_bloqueio_agenda := v_id_bloqueio;
    else
      update public.bloqueios_agenda
      set id_unidade = new.id_unidade,
          id_funcionario = new.id_profissional,
          inicio = new.inicio,
          fim = new.fim,
          motivo = coalesce(new.observacoes, 'Indisponibilidade do profissional.'),
          status = 'ativo',
          cancelado_em = null,
          cancelado_por = null,
          motivo_cancelamento = null,
          updated_at = now()
      where id_empresa = new.id_empresa
        and id = new.id_bloqueio_agenda;
    end if;
  elsif new.id_bloqueio_agenda is not null then
    update public.bloqueios_agenda
    set status = 'cancelado',
        cancelado_em = now(),
        cancelado_por = auth.uid(),
        motivo_cancelamento = 'Indisponibilidade desativada.',
        updated_at = now()
    where id_empresa = new.id_empresa
      and id = new.id_bloqueio_agenda
      and status = 'ativo';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."sincronizar_disponibilidade_com_bloqueio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."sincronizar_pagamento_caixa"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_tipo_movimento text;
  v_movimento_existente bigint;
begin
  if tg_op = 'UPDATE' then
    if old.status = 'estornado' and new.status is distinct from old.status then
      raise exception 'Um pagamento estornado não pode ser reativado.';
    end if;

    if old.status = 'confirmado' and new.status = 'pendente' then
      raise exception 'Um pagamento confirmado não pode voltar para pendente.';
    end if;

    select m.id into v_movimento_existente
    from public.movimentos_caixa m
    where m.id_pagamento = old.id;

    if found and new.id_sessao_caixa is distinct from old.id_sessao_caixa then
      raise exception 'Um pagamento já movimentado não pode trocar de sessão de caixa.';
    end if;
  end if;

  if new.id_sessao_caixa is null then
    return new;
  end if;

  v_tipo_movimento := case
    when new.tipo = 'entrada' then 'entrada'
    else 'saida'
  end;

  if new.status = 'confirmado' then
    insert into public.movimentos_caixa (
      id_sessao_caixa, id_pagamento, id_forma_pagamento,
      tipo, origem, status, valor, descricao, ocorrido_em
    )
    values (
      new.id_sessao_caixa, new.id, new.id_forma_pagamento,
      v_tipo_movimento, 'pagamento', 'ativo', new.valor,
      'Pagamento #' || new.id::text, new.data_pagamento
    )
    on conflict (id_pagamento) where id_pagamento is not null
    do update set
      id_forma_pagamento = excluded.id_forma_pagamento,
      tipo = excluded.tipo,
      status = 'ativo',
      valor = excluded.valor,
      descricao = excluded.descricao,
      ocorrido_em = excluded.ocorrido_em,
      estornado_em = null,
      estornado_por = null,
      motivo_estorno = null,
      updated_at = now();
  elsif new.status = 'estornado' then
    update public.movimentos_caixa
       set status = 'estornado',
           estornado_em = coalesce(estornado_em, now()),
           motivo_estorno = coalesce(new.motivo_estorno, 'Pagamento estornado'),
           updated_at = now()
     where id_pagamento = new.id;
  end if;

  return new;
end
$$;


ALTER FUNCTION "private"."sincronizar_pagamento_caixa"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."sincronizar_preferencias_lembrete_site"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.site_notification_preferences is null then
    return new;
  end if;

  insert into public.preferencias_lembrete (
    id_empresa, id_cliente, whatsapp, email, sms, push,
    antecedencias_minutos, ativo, origem, updated_at
  ) values (
    new.id_empresa,
    new.id_cliente,
    coalesce((new.site_notification_preferences->>'whatsapp')::boolean, true),
    coalesce((new.site_notification_preferences->>'email')::boolean, true),
    false,
    false,
    array[1440, 120],
    true,
    'site',
    now()
  )
  on conflict (id_empresa, id_cliente) do update
  set whatsapp = excluded.whatsapp,
      email = excluded.email,
      ativo = true,
      origem = 'site',
      updated_at = now();

  return new;
end;
$$;


ALTER FUNCTION "private"."sincronizar_preferencias_lembrete_site"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."sincronizar_status_servicos_agendamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.status is distinct from old.status then
    if new.status = 'em_atendimento' then
      update public.agendamentos_servicos
      set status = 'em_execucao', updated_at = now()
      where id_agendamento = new.id and id_empresa = new.id_empresa and status = 'reservado';
    elsif new.status in ('cancelado', 'no_show') then
      update public.agendamentos_servicos
      set status = 'cancelado', updated_at = now()
      where id_agendamento = new.id and id_empresa = new.id_empresa and status in ('reservado', 'em_execucao');
    elsif new.status = 'finalizado' then
      update public.agendamentos_servicos
      set status = 'concluido', updated_at = now()
      where id_agendamento = new.id and id_empresa = new.id_empresa and status in ('reservado', 'em_execucao');
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "private"."sincronizar_status_servicos_agendamento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."solicitar_exclusao_dados_site"("p_id_empresa" bigint, "p_motivo" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id_cliente bigint;
begin
  select c.id into v_id_cliente
  from public.clientes c
  where c.id_empresa = p_id_empresa
    and c.auth_user_id = auth.uid()
    and c.ativo;

  if v_id_cliente is null then
    raise exception 'Cliente autenticado nao encontrado.';
  end if;
  if char_length(coalesce(p_motivo, '')) > 500 then
    raise exception 'O motivo pode ter no maximo 500 caracteres.';
  end if;

  insert into public.solicitacoes_privacidade (
    id_empresa, id_cliente, tipo, status, motivo
  ) values (
    p_id_empresa, v_id_cliente, 'exclusao', 'pendente', nullif(btrim(p_motivo), '')
  )
  on conflict (id_empresa, id_cliente, tipo)
    where tipo = 'exclusao' and status in ('pendente', 'em_analise')
  do update set updated_at = now();

  return private.obter_area_cliente_site(p_id_empresa);
end;
$$;


ALTER FUNCTION "private"."solicitar_exclusao_dados_site"("p_id_empresa" bigint, "p_motivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."usuario_eh_cliente"("p_id_empresa" bigint, "p_id_cliente" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select auth.uid() is not null and exists (
    select 1
    from public.clientes c
    where c.id_empresa = p_id_empresa
      and c.id = p_id_cliente
      and c.auth_user_id = auth.uid()
      and c.ativo
  );
$$;


ALTER FUNCTION "private"."usuario_eh_cliente"("p_id_empresa" bigint, "p_id_cliente" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."usuario_eh_cliente_agendamento"("p_id_empresa" bigint, "p_id_agendamento" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select auth.uid() is not null and exists (
    select 1
    from public.agendamentos a
    join public.clientes c
      on c.id_empresa = a.id_empresa and c.id = a.id_cliente
    where a.id_empresa = p_id_empresa
      and a.id = p_id_agendamento
      and c.auth_user_id = auth.uid()
      and c.ativo
  );
$$;


ALTER FUNCTION "private"."usuario_eh_cliente_agendamento"("p_id_empresa" bigint, "p_id_agendamento" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."usuario_eh_funcionario"("p_funcionario_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.funcionarios f
    join public.usuarios_empresas ue
      on ue.id = f.usuario_empresa_id
     and ue.empresa_id = f.id_empresa
    where f.id = p_funcionario_id
      and ue.user_id = (select auth.uid())
      and ue.status = 'ativo'::public.status_usuario_empresa
      and f.ativo
  );
$$;


ALTER FUNCTION "private"."usuario_eh_funcionario"("p_funcionario_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."usuario_participa_agendamento"("p_agendamento_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.agendamentos_servicos ags
    join public.funcionarios f
      on f.id = ags.id_funcionario
     and f.id_empresa = ags.id_empresa
    join public.usuarios_empresas ue
      on ue.id = f.usuario_empresa_id
     and ue.empresa_id = f.id_empresa
    where ags.id_agendamento = p_agendamento_id
      and ue.user_id = (select auth.uid())
      and ue.status = 'ativo'::public.status_usuario_empresa
      and f.ativo
  );
$$;


ALTER FUNCTION "private"."usuario_participa_agendamento"("p_agendamento_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."usuario_pertence_empresa"("p_empresa_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.usuarios_empresas ue
    where ue.empresa_id = p_empresa_id
      and ue.user_id = (select auth.uid())
      and ue.status = 'ativo'::public.status_usuario_empresa
  );
$$;


ALTER FUNCTION "private"."usuario_pertence_empresa"("p_empresa_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."usuario_tem_tipo_empresa"("p_empresa_id" bigint, "p_tipos" "public"."tipos_usuarios"[]) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1
    from public.usuarios_empresas ue
    where ue.empresa_id = p_empresa_id
      and ue.user_id = (select auth.uid())
      and ue.status = 'ativo'::public.status_usuario_empresa
      and ue.tipo = any(p_tipos)
  );
$$;


ALTER FUNCTION "private"."usuario_tem_tipo_empresa"("p_empresa_id" bigint, "p_tipos" "public"."tipos_usuarios"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."validar_agendamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.fim <= new.inicio then
    raise exception 'O fim do agendamento deve ser posterior ao início.';
  end if;

  if (
    tg_op = 'INSERT'
    or new.inicio is distinct from old.inicio
    or new.fim is distinct from old.fim
  ) and new.inicio <= now() then
    raise exception 'Não é permitido criar ou reagendar para um horário passado.';
  end if;

  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status in ('finalizado', 'no_show', 'cancelado') then
      raise exception 'Um agendamento encerrado não pode mudar de status.';
    end if;

    if not (
      (old.status in ('aguardando_confirmacao', 'aguardando_pagamento') and new.status in ('confirmado', 'cancelado', 'no_show'))
      or (old.status = 'confirmado' and new.status in ('em_atendimento', 'cancelado', 'no_show'))
      or (old.status = 'em_atendimento' and new.status in ('finalizado', 'cancelado'))
    ) then
      raise exception 'Transição de status inválida: % para %.', old.status, new.status;
    end if;
  end if;

  if new.status = 'no_show' and now() < new.inicio then
    raise exception 'O não comparecimento só pode ser registrado após o início previsto.';
  end if;

  if new.status = 'cancelado' and nullif(btrim(new.motivo_cancelamento), '') is null then
    raise exception 'Informe o motivo do cancelamento.';
  end if;

  if tg_op = 'INSERT' or new.status is distinct from old.status then
    case new.status
      when 'confirmado' then new.confirmado_em = coalesce(new.confirmado_em, now());
      when 'em_atendimento' then new.iniciado_em = coalesce(new.iniciado_em, now());
      when 'finalizado' then new.finalizado_em = coalesce(new.finalizado_em, now());
      when 'no_show' then new.no_show_em = coalesce(new.no_show_em, now());
      when 'cancelado' then new.cancelado_em = coalesce(new.cancelado_em, now());
      else null;
    end case;
  end if;

  if new.sinal_status = 'pago' then
    new.sinal_pago_em = coalesce(new.sinal_pago_em, now());
  end if;

  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "private"."validar_agendamento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."validar_alocacao_pagamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_empresa_pagamento bigint;
  v_tipo_pagamento text;
  v_valor_pagamento numeric;
  v_empresa_parcela bigint;
  v_tipo_conta text;
  v_valor_parcela numeric;
  v_soma_pagamento numeric;
  v_soma_parcela numeric;
begin
  if tg_op = 'UPDATE' and (
    new.id_pagamento is distinct from old.id_pagamento
    or new.id_parcela is distinct from old.id_parcela
  ) then
    raise exception 'Não é permitido trocar o pagamento ou a parcela de uma alocação.';
  end if;

  select p.id_empresa, p.tipo, p.valor
    into v_empresa_pagamento, v_tipo_pagamento, v_valor_pagamento
  from public.pagamentos p
  where p.id = new.id_pagamento and p.status <> 'estornado';
  if not found then raise exception 'Pagamento inexistente ou estornado.'; end if;

  select cp.id_empresa, c.tipo, cp.valor_parcela
    into v_empresa_parcela, v_tipo_conta, v_valor_parcela
  from public.contas_parcelas cp
  join public.contas c on c.id = cp.id_conta
  where cp.id = new.id_parcela
    and cp.status <> 'cancelada'
    and c.status <> 'cancelada'
  for update of cp;
  if not found then raise exception 'Parcela ou conta inexistente ou cancelada.'; end if;

  if v_empresa_pagamento <> v_empresa_parcela then
    raise exception 'Pagamento e parcela pertencem a empresas diferentes.';
  end if;
  if (v_tipo_pagamento = 'entrada' and v_tipo_conta <> 'receber')
     or (v_tipo_pagamento = 'saida' and v_tipo_conta <> 'pagar') then
    raise exception 'O tipo do pagamento não corresponde ao tipo da conta.';
  end if;

  select coalesce(sum(pa.valor), 0) into v_soma_pagamento
  from public.pagamentos_alocacoes pa
  where pa.id_pagamento = new.id_pagamento
    and pa.id <> coalesce(new.id, -1);

  select coalesce(sum(pa.valor), 0) into v_soma_parcela
  from public.pagamentos_alocacoes pa
  join public.pagamentos p on p.id = pa.id_pagamento and p.status <> 'estornado'
  where pa.id_parcela = new.id_parcela
    and pa.id <> coalesce(new.id, -1);

  if v_soma_pagamento + new.valor > v_valor_pagamento then
    raise exception 'As alocações ultrapassam o valor do pagamento.';
  end if;
  if v_soma_parcela + new.valor > v_valor_parcela then
    raise exception 'Os pagamentos ultrapassam o valor da parcela.';
  end if;

  new.id_empresa := v_empresa_pagamento;
  return new;
end;
$$;


ALTER FUNCTION "private"."validar_alocacao_pagamento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."validar_disponibilidade_funcionario"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_fuso text;
  v_inicio_local timestamp;
  v_fim_local timestamp;
  v_data date;
  v_dia smallint;
begin
  if new.status in ('cancelado', 'finalizado', 'no_show') then
    return new;
  end if;

  if exists (
    select 1 from public.bloqueios_agenda b
    where b.id_empresa = new.id_empresa
      and b.status = 'ativo'
      and (b.id_funcionario is null or b.id_funcionario = new.id_funcionario)
      and tstzrange(b.inicio, b.fim, '[)') && tstzrange(new.inicio, new.fim, '[)')
  ) then
    raise exception 'O horário está bloqueado na agenda.';
  end if;

  if exists (
    select 1 from public.funcionarios_ausencias a
    where a.id_empresa = new.id_empresa
      and a.id_funcionario = new.id_funcionario
      and a.status = 'aprovado'
      and tstzrange(a.inicio, a.fim, '[)') && tstzrange(new.inicio, new.fim, '[)')
  ) then
    raise exception 'O funcionário está ausente nesse período.';
  end if;

  select e.fuso_horario into v_fuso
  from public.empresas e where e.id = new.id_empresa;

  v_inicio_local := new.inicio at time zone coalesce(v_fuso, 'America/Sao_Paulo');
  v_fim_local := new.fim at time zone coalesce(v_fuso, 'America/Sao_Paulo');
  v_data := v_inicio_local::date;
  v_dia := extract(dow from v_inicio_local)::smallint;

  if v_fim_local::date <> v_data then
    raise exception 'O serviço não pode atravessar dois dias da agenda.';
  end if;

  if exists (
    select 1 from public.funcionarios_horarios h
    where h.id_empresa = new.id_empresa
      and h.id_funcionario = new.id_funcionario
      and h.ativo
  ) and not exists (
    select 1 from public.funcionarios_horarios h
    where h.id_empresa = new.id_empresa
      and h.id_funcionario = new.id_funcionario
      and h.ativo
      and h.dia_semana = v_dia
      and h.hora_inicio <= v_inicio_local::time
      and h.hora_fim >= v_fim_local::time
      and (
        h.intervalo_inicio is null
        or h.intervalo_fim is null
        or not (
          v_inicio_local::time < h.intervalo_fim
          and v_fim_local::time > h.intervalo_inicio
        )
      )
  ) then
    raise exception 'O serviço está fora da jornada ou coincide com o intervalo do funcionário.';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "private"."validar_disponibilidade_funcionario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."validar_exclusao_compra_item"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if old.quantidade_recebida>0 then
    raise exception 'Item já recebido não pode ser excluído; estorne primeiro o estoque.';
  end if;
  return old;
end;
$$;


ALTER FUNCTION "private"."validar_exclusao_compra_item"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."validar_exclusao_item_comercial"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if tg_table_name = 'orcamentos_itens' and not exists (
    select 1 from public.orcamentos o
    where o.id = old.id_orcamento and o.status in ('rascunho','enviado')
  ) then
    raise exception 'Itens só podem ser removidos de orçamentos em rascunho ou enviados.';
  elsif tg_table_name = 'comandas_itens' and not exists (
    select 1 from public.comandas c
    where c.id = old.id_comanda and c.status = 'aberta'
  ) then
    raise exception 'Itens só podem ser removidos de comandas abertas.';
  end if;
  return old;
end
$$;


ALTER FUNCTION "private"."validar_exclusao_item_comercial"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."validar_servicos_no_periodo_agendamento"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if exists (
    select 1 from public.agendamentos_servicos s
    where s.id_empresa = new.id_empresa
      and s.id_agendamento = new.id
      and s.status not in ('cancelado')
      and (s.inicio < new.inicio or s.fim > new.fim)
  ) then
    raise exception 'Existem serviços fora do período do agendamento.';
  end if;
  return null;
end;
$$;


ALTER FUNCTION "private"."validar_servicos_no_periodo_agendamento"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."vincular_cliente_email_site"("p_id_empresa" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_email text := lower(btrim(coalesce(auth.jwt() ->> 'email', '')));
  v_id_cliente bigint;
  v_total integer;
  v_auth_conflitante boolean;
begin
  if auth.uid() is null or v_email = '' then
    raise exception 'Autenticacao por e-mail obrigatoria.';
  end if;

  select
    count(*),
    bool_or(c.auth_user_id is not null and c.auth_user_id <> auth.uid())
    into v_total, v_auth_conflitante
  from public.clientes c
  where c.id_empresa = p_id_empresa
    and c.ativo
    and lower(btrim(coalesce(c.email, ''))) = v_email;

  if coalesce(v_auth_conflitante, false) then
    raise exception 'Este e-mail ja esta associado a outra conta. Fale com a recepcao.';
  end if;
  if v_total = 0 then
    raise exception 'Nao encontramos um cadastro de cliente com este e-mail.';
  end if;
  if v_total > 1 then
    raise exception 'Ha cadastros duplicados com este e-mail. Fale com a recepcao para unifica-los.';
  end if;

  select c.id into v_id_cliente
  from public.clientes c
  where c.id_empresa = p_id_empresa
    and c.ativo
    and lower(btrim(coalesce(c.email, ''))) = v_email
  for update;

  update public.clientes
  set auth_user_id = auth.uid(), updated_at = now()
  where id_empresa = p_id_empresa
    and id = v_id_cliente
    and (auth_user_id is null or auth_user_id = auth.uid());

  return jsonb_build_object('vinculado', true, 'id_cliente', v_id_cliente);
end;
$$;


ALTER FUNCTION "private"."vincular_cliente_email_site"("p_id_empresa" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."vincular_cliente_site"("p_token" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_id_cliente bigint;
  v_id_empresa bigint;
  v_auth_atual uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticação do cliente obrigatória.';
  end if;

  select a.id_cliente, a.id_empresa, c.auth_user_id
    into v_id_cliente, v_id_empresa, v_auth_atual
  from public.agendamentos a
  join public.clientes c
    on c.id_empresa = a.id_empresa and c.id = a.id_cliente
  where a.site_access_token = p_token
  for update of c;

  if not found then
    raise exception 'Agendamento não encontrado.';
  end if;
  if v_auth_atual is not null and v_auth_atual <> auth.uid() then
    raise exception 'Este cliente já está associado a outra conta.';
  end if;

  update public.clientes
  set auth_user_id = auth.uid(), updated_at = now()
  where id_empresa = v_id_empresa and id = v_id_cliente;

  return public.obter_agendamento_site(p_token);
end;
$$;


ALTER FUNCTION "private"."vincular_cliente_site"("p_token" "uuid") OWNER TO "postgres";


GRANT USAGE ON SCHEMA "private" TO "authenticated";
GRANT USAGE ON SCHEMA "private" TO "anon";



REVOKE ALL ON FUNCTION "private"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."abrir_sessao_caixa"("p_id_empresa" bigint, "p_id_caixa" bigint, "p_saldo_inicial" numeric, "p_observacoes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."aceitar_convites_pendentes"() FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."aceitar_convites_pendentes"() TO "service_role";
GRANT ALL ON FUNCTION "private"."aceitar_convites_pendentes"() TO "authenticated";



REVOKE ALL ON FUNCTION "private"."alterar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_acao" "text", "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."alterar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_acao" "text", "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") TO "authenticated";
GRANT ALL ON FUNCTION "private"."alterar_agendamento_site"("p_token" "uuid", "p_acao" "text", "p_motivo" "text") TO "anon";



REVOKE ALL ON FUNCTION "private"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."alterar_status_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_status" "text", "p_observacao" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."atualizar_dados_cliente_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_data_nascimento" "date", "p_canal_preferido" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."atualizar_dados_cliente_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_data_nascimento" "date", "p_canal_preferido" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."atualizar_empresa_administracao"("p_id_empresa" bigint, "p_fantasia" "text", "p_razao_social" "text", "p_cnpj" "text", "p_email" "text", "p_contato1" "text", "p_contato2" "text", "p_fuso_horario" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."atualizar_preferencias_cliente_site"("p_id_empresa" bigint, "p_whatsapp" boolean, "p_email" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."atualizar_preferencias_cliente_site"("p_id_empresa" bigint, "p_whatsapp" boolean, "p_email" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") TO "service_role";
GRANT ALL ON FUNCTION "private"."atualizar_usuario_empresa_administracao"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_tipo" "public"."tipos_usuarios", "p_status" "public"."status_usuario_empresa") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) TO "service_role";
GRANT ALL ON FUNCTION "private"."atualizar_vencimentos_financeiros"("p_id_empresa" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."cancelar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."cancelar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "private"."cancelar_convite_empresa"("p_id_empresa" bigint, "p_convite_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."converter_orcamento_em_comanda"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_funcionario_responsavel" bigint, "p_funcionarios_servicos" "jsonb", "p_observacoes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "anon";
GRANT ALL ON FUNCTION "private"."criar_agendamento_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_nome" "text", "p_telefone" "text", "p_email" "text", "p_id_servico" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone, "p_observacoes" "text", "p_lembrete_whatsapp" boolean, "p_lembrete_email" boolean, "p_chave_idempotencia" "uuid") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") TO "service_role";
GRANT ALL ON FUNCTION "private"."criar_ajuste_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_descricao" "text", "p_valor" numeric, "p_competencia" "date") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") TO "service_role";
GRANT ALL ON FUNCTION "private"."criar_convite_empresa"("p_id_empresa" bigint, "p_email" "text", "p_tipo" "public"."tipos_usuarios") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."definir_updated_at"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."estornar_lancamento_comissao"("p_id_empresa" bigint, "p_lancamento_id" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."estornar_movimento_caixa"("p_movimento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."estornar_pagamento_comissao"("p_id_empresa" bigint, "p_pagamento_comissao_id" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."estornar_pagamento_financeiro"("p_pagamento_id" bigint, "p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date") TO "service_role";
GRANT ALL ON FUNCTION "private"."fechar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_data_vencimento" "date") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor_pagamento" numeric, "p_referencia" "text", "p_observacoes_pagamento" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor_pagamento" numeric, "p_referencia" "text", "p_observacoes_pagamento" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."fechar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_situacao_pagamento" "text", "p_data_vencimento" "date", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor_pagamento" numeric, "p_referencia" "text", "p_observacoes_pagamento" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."fechar_sessao_caixa"("p_sessao_id" bigint, "p_id_empresa" bigint, "p_saldo_contado" numeric, "p_observacoes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text", "p_acao" "text", "p_tabela" "text", "p_inicio" timestamp with time zone, "p_fim" timestamp with time zone, "p_pagina" integer, "p_por_pagina" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text", "p_acao" "text", "p_tabela" "text", "p_inicio" timestamp with time zone, "p_fim" timestamp with time zone, "p_pagina" integer, "p_por_pagina" integer) TO "service_role";
GRANT ALL ON FUNCTION "private"."listar_auditoria_administracao"("p_id_empresa" bigint, "p_busca" "text", "p_acao" "text", "p_tabela" "text", "p_inicio" timestamp with time zone, "p_fim" timestamp with time zone, "p_pagina" integer, "p_por_pagina" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."listar_usuarios_administracao"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."listar_usuarios_administracao"("p_id_empresa" bigint) TO "service_role";
GRANT ALL ON FUNCTION "private"."listar_usuarios_administracao"("p_id_empresa" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."movimentar_caixa_manual"("p_id_empresa" bigint, "p_id_sessao_caixa" bigint, "p_tipo" "text", "p_valor" numeric, "p_descricao" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."movimentar_estoque_manual"("p_id_empresa" bigint, "p_id_produto" bigint, "p_operacao" "text", "p_quantidade" numeric, "p_descricao" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."normalizar_consentimento"() FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."obter_agendamento_site"("p_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."obter_agendamento_site"("p_token" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "private"."obter_agendamento_site"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "private"."obter_agendamento_site"("p_token" "uuid") TO "anon";



REVOKE ALL ON FUNCTION "private"."obter_area_cliente_site"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."obter_area_cliente_site"("p_id_empresa" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."obter_catalogo_site"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."obter_catalogo_site"("p_id_empresa" bigint) TO "service_role";
GRANT ALL ON FUNCTION "private"."obter_catalogo_site"("p_id_empresa" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "private"."obter_catalogo_site"("p_id_empresa" bigint) TO "anon";



REVOKE ALL ON FUNCTION "private"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date", "p_dias_periodo" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date", "p_dias_periodo" integer) TO "service_role";
GRANT ALL ON FUNCTION "private"."obter_dashboard_empresa"("p_id_empresa" bigint, "p_data_referencia" "date", "p_dias_periodo" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "service_role";
GRANT ALL ON FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "anon";



REVOKE ALL ON FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "anon";
GRANT ALL ON FUNCTION "private"."obter_disponibilidade_site"("p_id_empresa" bigint, "p_id_unidade" bigint, "p_data" "date", "p_id_servico" bigint, "p_id_funcionario" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."plano_limite_funcionalidade_empresa"("p_id_empresa" bigint, "p_funcionalidade" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."plano_tem_funcionalidade_empresa"("p_id_empresa" bigint, "p_funcionalidade" "text") FROM PUBLIC;



REVOKE ALL ON FUNCTION "private"."reagendar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."reagendar_agendamento_cliente_site"("p_id_empresa" bigint, "p_id_agendamento" bigint, "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) TO "service_role";
GRANT ALL ON FUNCTION "private"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "private"."reagendar_agendamento_site"("p_token" "uuid", "p_id_funcionario" bigint, "p_inicio" timestamp with time zone) TO "anon";



REVOKE ALL ON FUNCTION "private"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "private"."receber_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "private"."registrar_pagamento_comissao"("p_id_empresa" bigint, "p_id_funcionario" bigint, "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_pago_em" timestamp with time zone, "p_periodo_inicio" "date", "p_periodo_fim" "date", "p_observacoes" "text", "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "private"."registrar_pagamento_financeiro"("p_id_empresa" bigint, "p_tipo" "text", "p_id_forma_pagamento" bigint, "p_id_sessao_caixa" bigint, "p_data_pagamento" timestamp with time zone, "p_valor" numeric, "p_referencia" "text", "p_observacoes" "text", "p_alocacoes" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") TO "service_role";
GRANT ALL ON FUNCTION "private"."relatorio_comissoes_funcionario"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") TO "service_role";
GRANT ALL ON FUNCTION "private"."relatorio_fluxo_financeiro"("p_id_empresa" bigint, "p_data_inicio" "date", "p_data_fim" "date") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "private"."remover_integracao_administracao"("p_id_empresa" bigint, "p_integracao_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."resolver_site_publico"("p_dominio" "text", "p_slug" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."resolver_site_publico"("p_dominio" "text", "p_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "private"."resolver_site_publico"("p_dominio" "text", "p_slug" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "private"."salvar_comanda"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."salvar_comanda_com_pagamento"("p_comanda_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_id_funcionario_responsavel" bigint, "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb", "p_condicao_pagamento" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "private"."salvar_compra"("p_compra_id" bigint, "p_id_empresa" bigint, "p_id_fornecedor" bigint, "p_data_compra" "date", "p_numero_documento" "text", "p_previsao_entrega" "date", "p_frete" numeric, "p_desconto" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) TO "service_role";
GRANT ALL ON FUNCTION "private"."salvar_configuracoes_empresa"("p_id_empresa" bigint, "p_tema_preferido" "text", "p_cor_primaria" "text", "p_cor_destaque" "text", "p_raio_interface" "text", "p_densidade_interface" "text", "p_logo_url" "text", "p_idioma" "text", "p_moeda" "text", "p_semana_inicia" smallint, "p_duracao_slot_minutos" smallint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."salvar_conta_financeira"("p_conta_id" bigint, "p_id_empresa" bigint, "p_tipo" "text", "p_id_categoria" bigint, "p_id_cliente" bigint, "p_id_fornecedor" bigint, "p_descricao" "text", "p_documento" "text", "p_data_emissao" "date", "p_competencia" "date", "p_valor_total" numeric, "p_numero_parcelas" integer, "p_primeiro_vencimento" "date", "p_observacoes" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text") TO "service_role";
GRANT ALL ON FUNCTION "private"."salvar_integracao_administracao"("p_id_empresa" bigint, "p_tipo" "text", "p_provedor" "text", "p_configuracoes" "jsonb", "p_status" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "private"."salvar_orcamento"("p_orcamento_id" bigint, "p_id_empresa" bigint, "p_id_cliente" bigint, "p_validade" "date", "p_desconto" numeric, "p_acrescimo" numeric, "p_observacoes" "text", "p_itens" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "private"."salvar_permissoes_usuario"("p_id_empresa" bigint, "p_usuario_empresa_id" bigint, "p_permissoes" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) TO "service_role";
GRANT ALL ON FUNCTION "private"."salvar_regra_comissao"("p_regra_id" bigint, "p_id_empresa" bigint, "p_id_funcionario" bigint, "p_tipo_item" "text", "p_id_servico" bigint, "p_id_produto" bigint, "p_tipo_calculo" "text", "p_percentual" numeric, "p_valor_fixo" numeric, "p_base_calculo" "text", "p_momento_liberacao" "text", "p_vigente_de" "date", "p_vigente_ate" "date", "p_prioridade" integer, "p_ativo" boolean) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."salvar_site_publico"("p_id_empresa" bigint, "p_config" "jsonb") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."salvar_site_publico"("p_id_empresa" bigint, "p_config" "jsonb") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."solicitar_exclusao_dados_site"("p_id_empresa" bigint, "p_motivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."solicitar_exclusao_dados_site"("p_id_empresa" bigint, "p_motivo" "text") TO "authenticated";



REVOKE ALL ON FUNCTION "private"."usuario_eh_cliente"("p_id_empresa" bigint, "p_id_cliente" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."usuario_eh_cliente"("p_id_empresa" bigint, "p_id_cliente" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."usuario_eh_cliente_agendamento"("p_id_empresa" bigint, "p_id_agendamento" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."usuario_eh_cliente_agendamento"("p_id_empresa" bigint, "p_id_agendamento" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."usuario_eh_funcionario"("p_funcionario_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."usuario_eh_funcionario"("p_funcionario_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."usuario_participa_agendamento"("p_agendamento_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."usuario_participa_agendamento"("p_agendamento_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."usuario_pertence_empresa"("p_empresa_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."usuario_pertence_empresa"("p_empresa_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."usuario_tem_tipo_empresa"("p_empresa_id" bigint, "p_tipos" "public"."tipos_usuarios"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."usuario_tem_tipo_empresa"("p_empresa_id" bigint, "p_tipos" "public"."tipos_usuarios"[]) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."vincular_cliente_email_site"("p_id_empresa" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."vincular_cliente_email_site"("p_id_empresa" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "private"."vincular_cliente_site"("p_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "private"."vincular_cliente_site"("p_token" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "private"."vincular_cliente_site"("p_token" "uuid") TO "authenticated";




