-- Remove variável obsoleta apontada pelo plpgsql_check após as RPCs
-- privilegiadas terem sido movidas para o schema private.

create or replace function private.alterar_status_orcamento(
  p_orcamento_id bigint,
  p_id_empresa bigint,
  p_status text,
  p_observacao text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
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

revoke all on function private.alterar_status_orcamento(
  bigint, bigint, text, text
) from public, anon;
grant execute on function private.alterar_status_orcamento(
  bigint, bigint, text, text
) to authenticated;
