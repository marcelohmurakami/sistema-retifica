-- Permite que o estorno de um pagamento restaure uma comissao paga.
-- Demais campos de origem continuam imutaveis e comissoes estornadas seguem terminais.

create or replace function private.preparar_lancamento_comissao()
returns trigger
language plpgsql
set search_path = ''
as $$
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
comment on function private.preparar_lancamento_comissao()
  is 'Protege a origem da comissão e permite reabertura apenas quando um pagamento é estornado.';
