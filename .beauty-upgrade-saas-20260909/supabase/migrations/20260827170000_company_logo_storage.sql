-- Logotipos são públicos para leitura, mas somente o dono da empresa pode
-- enviar ou remover arquivos dentro da pasta da própria empresa.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'company-assets',
  'company-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists company_logos_donos_selecionam on storage.objects;
create policy company_logos_donos_selecionam
on storage.objects
for select
to authenticated
using (
  bucket_id = 'company-assets'
  and coalesce((storage.foldername(name))[1], '') ~ '^[0-9]+$'
  and (storage.foldername(name))[2] = 'logos'
  and private.usuario_tem_tipo_empresa(
    ((storage.foldername(name))[1])::bigint,
    array['dono']::public.tipos_usuarios[]
  )
);

drop policy if exists company_logos_donos_inserem on storage.objects;
create policy company_logos_donos_inserem
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-assets'
  and coalesce((storage.foldername(name))[1], '') ~ '^[0-9]+$'
  and (storage.foldername(name))[2] = 'logos'
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'webp')
  and private.usuario_tem_tipo_empresa(
    ((storage.foldername(name))[1])::bigint,
    array['dono']::public.tipos_usuarios[]
  )
);

drop policy if exists company_logos_donos_excluem on storage.objects;
create policy company_logos_donos_excluem
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'company-assets'
  and coalesce((storage.foldername(name))[1], '') ~ '^[0-9]+$'
  and (storage.foldername(name))[2] = 'logos'
  and private.usuario_tem_tipo_empresa(
    ((storage.foldername(name))[1])::bigint,
    array['dono']::public.tipos_usuarios[]
  )
);
