-- Agenda libre: eventos personales y de todo el día
alter type tipo_evento add value if not exists 'personal';
alter type tipo_evento add value if not exists 'otro';
alter table public.eventos add column if not exists todo_el_dia boolean not null default false;

-- Las citas sin proyecto (personales o internas) también se pueden crear, cambiar y borrar
drop policy if exists eventos_escribir on public.eventos;
create policy eventos_escribir on public.eventos for all to authenticated
  using (organizacion_id = mi_org() and (es_admin() or (es_equipo() and proyecto_id is null)
         or (proyecto_id is not null and puede_editar_proyecto(proyecto_id))))
  with check (organizacion_id = mi_org() and (es_admin() or (es_equipo() and proyecto_id is null)
         or (proyecto_id is not null and puede_editar_proyecto(proyecto_id))));
