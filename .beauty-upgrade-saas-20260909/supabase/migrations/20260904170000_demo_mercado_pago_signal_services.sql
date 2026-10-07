-- Configura valores simbólicos de sinal para testar o fluxo Pix do site.
-- Esta migration é deliberadamente específica do ambiente fictício
-- Murakami Beauty e deve ser substituída pelos valores comerciais reais.

do $$
declare
  v_id_empresa bigint;
  v_atualizados integer;
begin
  select sp.id_empresa
    into v_id_empresa
  from public.sites_publicos sp
  where sp.slug = 'murakami-beauty';

  if v_id_empresa is null then
    raise exception 'Site murakami-beauty não encontrado.';
  end if;

  update public.servicos s
  set exige_sinal = true,
      sinal_tipo = 'valor_fixo',
      sinal_valor = 1.00,
      updated_at = now()
  where s.id_empresa = v_id_empresa
    and s.ativo
    and s.nome in ('Coloração', 'Mechas', 'Maquiagem social');

  get diagnostics v_atualizados = row_count;
  if v_atualizados <> 3 then
    raise exception 'Esperava atualizar 3 serviços, mas atualizei %.', v_atualizados;
  end if;
end;
$$;
