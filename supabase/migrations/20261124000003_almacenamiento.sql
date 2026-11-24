-- =============================================================
-- Storage: bucket privado "documentos"
-- Rutas: proyectos/<proyecto_id>/...  ·  negocios/<negocio_id>/...
-- =============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('documentos', 'documentos', false, 52428800)
on conflict (id) do nothing;

create or replace function public.storage_puede_ver(nombre text) returns boolean
language sql stable security definer set search_path = public as $$
  select case split_part(nombre, '/', 1)
    when 'proyectos' then puede_ver_proyecto(nullif(split_part(nombre, '/', 2), '')::uuid)
    when 'negocios'  then puede_ver_negocio(nullif(split_part(nombre, '/', 2), '')::uuid)
    else false end
$$;

create or replace function public.storage_puede_subir(nombre text) returns boolean
language sql stable security definer set search_path = public as $$
  select case split_part(nombre, '/', 1)
    when 'proyectos' then puede_ver_proyecto(nullif(split_part(nombre, '/', 2), '')::uuid)   -- el cliente también sube
    when 'negocios'  then puede_editar_negocio(nullif(split_part(nombre, '/', 2), '')::uuid)
    else false end
$$;

create policy docs_leer on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and storage_puede_ver(name));
create policy docs_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and storage_puede_subir(name));
create policy docs_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (owner = auth.uid() or es_admin()) and storage_puede_ver(name));
