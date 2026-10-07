-- Em triggers DELETE, o registro NEW não existe. A versão anterior tentava
-- avaliar NEW antes de OLD dentro de coalesce(), interrompendo edições que
-- substituíam itens de comandas ou orçamentos.
create or replace function private.recalcular_cabecalho_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
comment on function private.recalcular_cabecalho_item() is
  'Atualiza o cabeçalho comercial sem acessar NEW em operações DELETE.';
