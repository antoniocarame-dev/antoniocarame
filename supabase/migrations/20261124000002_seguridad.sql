-- =============================================================
-- Seguridad: funciones auxiliares + políticas RLS por rol
--   admin       → todo lo de su organización
--   colaborador → proyectos donde es miembro (sin finanzas)
--   cliente     → sus proyectos, solo lo marcado visible_cliente
--   personal    → (fase 2) checklists y registros
-- =============================================================

create or replace function public.mi_org() returns uuid
language sql stable security definer set search_path = public as $$
  select organizacion_id from perfiles where id = auth.uid()
$$;

create or replace function public.mi_rol() returns rol_global
language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid()
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rol = 'admin' from perfiles where id = auth.uid()), false)
$$;

create or replace function public.es_equipo() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select rol in ('admin','colaborador') from perfiles where id = auth.uid()), false)
$$;

create or replace function public.rol_en_proyecto(p uuid) returns rol_proyecto
language sql stable security definer set search_path = public as $$
  select rol from proyecto_miembros where proyecto_id = p and usuario_id = auth.uid()
$$;

create or replace function public.puede_ver_proyecto(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from proyectos pr
    where pr.id = p and pr.organizacion_id = mi_org()
      and (es_admin() or exists (select 1 from proyecto_miembros m where m.proyecto_id = p and m.usuario_id = auth.uid()))
  )
$$;

create or replace function public.puede_editar_proyecto(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from proyectos pr
    where pr.id = p and pr.organizacion_id = mi_org()
      and (es_admin() or exists (select 1 from proyecto_miembros m
           where m.proyecto_id = p and m.usuario_id = auth.uid() and m.rol in ('consultor','colaborador')))
  )
$$;

create or replace function public.puede_ver_negocio(n uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from negocios ng
    where ng.id = n and ng.organizacion_id = mi_org()
      and (es_admin() or exists (select 1 from proyectos pr join proyecto_miembros m on m.proyecto_id = pr.id
                                 where pr.negocio_id = n and m.usuario_id = auth.uid()))
  )
$$;

create or replace function public.puede_editar_negocio(n uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from negocios ng
    where ng.id = n and ng.organizacion_id = mi_org()
      and (es_admin() or exists (select 1 from proyectos pr join proyecto_miembros m on m.proyecto_id = pr.id
                                 where pr.negocio_id = n and m.usuario_id = auth.uid() and m.rol in ('consultor','colaborador')))
  )
$$;

-- ¿Comparte algún proyecto conmigo? (para ver nombres de responsables)
create or replace function public.comparte_proyecto(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from proyecto_miembros a join proyecto_miembros b on a.proyecto_id = b.proyecto_id
                 where a.usuario_id = auth.uid() and b.usuario_id = u)
$$;

-- ---------- Activar RLS en todo ----------
do $$
declare t text;
begin
  foreach t in array array['organizaciones','perfiles','negocios','contactos','proyectos','proyecto_finanzas',
    'proyecto_miembros','fases','hitos','eventos','plantillas','auditorias','auditoria_respuestas','hallazgos',
    'kpis','kpi_valores','acciones','tareas','documentos','documento_versiones','actas','comentarios']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- ---------- Organización y perfiles ----------
create policy org_ver on organizaciones for select to authenticated using (id = mi_org());
create policy org_editar on organizaciones for update to authenticated using (id = mi_org() and es_admin());

create policy perfiles_ver on perfiles for select to authenticated
  using (organizacion_id = mi_org() and (es_equipo() or id = auth.uid() or comparte_proyecto(id)));
create policy perfiles_editar on perfiles for update to authenticated
  using (organizacion_id = mi_org() and (id = auth.uid() or es_admin()));

-- Nadie salvo un admin cambia roles u organización
create or replace function public.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not es_admin()
     and (new.rol is distinct from old.rol or new.organizacion_id is distinct from old.organizacion_id
          or new.tarifa_hora is distinct from old.tarifa_hora) then
    raise exception 'Solo un administrador puede cambiar roles o tarifas';
  end if;
  return new;
end $$;
create trigger perfiles_proteger before update on perfiles for each row execute function proteger_perfil();

-- ---------- Negocios ----------
create policy negocios_ver on negocios for select to authenticated using (puede_ver_negocio(id));
create policy negocios_crear on negocios for insert to authenticated with check (organizacion_id = mi_org() and es_equipo());
create policy negocios_editar on negocios for update to authenticated using (puede_editar_negocio(id));
create policy negocios_borrar on negocios for delete to authenticated using (organizacion_id = mi_org() and es_admin());

create policy contactos_ver on contactos for select to authenticated using (puede_ver_negocio(negocio_id));
create policy contactos_escribir on contactos for all to authenticated
  using (puede_editar_negocio(negocio_id)) with check (puede_editar_negocio(negocio_id));

-- ---------- Proyectos ----------
create policy proyectos_ver on proyectos for select to authenticated using (puede_ver_proyecto(id));
create policy proyectos_crear on proyectos for insert to authenticated with check (organizacion_id = mi_org() and es_admin());
create policy proyectos_editar on proyectos for update to authenticated using (puede_editar_proyecto(id));
create policy proyectos_borrar on proyectos for delete to authenticated using (organizacion_id = mi_org() and es_admin());

-- Finanzas: solo admin
create policy finanzas_admin on proyecto_finanzas for all to authenticated
  using (es_admin() and puede_ver_proyecto(proyecto_id)) with check (es_admin() and puede_ver_proyecto(proyecto_id));

create policy miembros_ver on proyecto_miembros for select to authenticated using (puede_ver_proyecto(proyecto_id));
create policy miembros_admin on proyecto_miembros for all to authenticated
  using (es_admin() and puede_ver_proyecto(proyecto_id)) with check (es_admin() and puede_ver_proyecto(proyecto_id));

-- ---------- Tablas hijas de proyecto ----------
-- Patrón A (sin visibilidad): ver = miembro; escribir = equipo del proyecto
do $$
declare t text;
begin
  foreach t in array array['fases','hitos'] loop
    execute format('create policy %1$s_ver on %1$I for select to authenticated using (puede_ver_proyecto(proyecto_id))', t);
    execute format('create policy %1$s_escribir on %1$I for all to authenticated using (puede_editar_proyecto(proyecto_id)) with check (puede_editar_proyecto(proyecto_id))', t);
  end loop;
end $$;

-- Patrón B (con visible_cliente): el cliente solo ve lo visible
do $$
declare t text;
begin
  foreach t in array array['auditorias','hallazgos','kpis','acciones','actas'] loop
    execute format('create policy %1$s_ver on %1$I for select to authenticated using (puede_editar_proyecto(proyecto_id) or (visible_cliente and puede_ver_proyecto(proyecto_id)))', t);
    execute format('create policy %1$s_escribir on %1$I for all to authenticated using (puede_editar_proyecto(proyecto_id)) with check (puede_editar_proyecto(proyecto_id))', t);
  end loop;
end $$;

create policy respuestas_ver on auditoria_respuestas for select to authenticated using (
  exists (select 1 from auditorias a where a.id = auditoria_id
          and (puede_editar_proyecto(a.proyecto_id) or (a.visible_cliente and puede_ver_proyecto(a.proyecto_id)))));
create policy respuestas_escribir on auditoria_respuestas for all to authenticated
  using (exists (select 1 from auditorias a where a.id = auditoria_id and puede_editar_proyecto(a.proyecto_id)))
  with check (exists (select 1 from auditorias a where a.id = auditoria_id and puede_editar_proyecto(a.proyecto_id)));

create policy kpi_valores_ver on kpi_valores for select to authenticated using (
  exists (select 1 from kpis k where k.id = kpi_id
          and (puede_editar_proyecto(k.proyecto_id) or (k.visible_cliente and puede_ver_proyecto(k.proyecto_id)))));
create policy kpi_valores_escribir on kpi_valores for all to authenticated
  using (exists (select 1 from kpis k where k.id = kpi_id and puede_editar_proyecto(k.proyecto_id)))
  with check (exists (select 1 from kpis k where k.id = kpi_id and puede_editar_proyecto(k.proyecto_id)));

-- ---------- Tareas: el cliente ve todas las de su proyecto y avanza las suyas ----------
create policy tareas_ver on tareas for select to authenticated using (puede_ver_proyecto(proyecto_id));
create policy tareas_crear on tareas for insert to authenticated with check (puede_editar_proyecto(proyecto_id));
create policy tareas_editar on tareas for update to authenticated
  using (puede_editar_proyecto(proyecto_id) or (responsable_id = auth.uid() and puede_ver_proyecto(proyecto_id)));
create policy tareas_borrar on tareas for delete to authenticated using (puede_editar_proyecto(proyecto_id));

create or replace function public.limitar_edicion_tarea() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'hecha' and old.estado <> 'hecha' then new.completada_at := now(); end if;
  if new.estado <> 'hecha' then new.completada_at := null; end if;
  if auth.uid() is not null and not puede_editar_proyecto(old.proyecto_id) then
    -- Un cliente solo puede cambiar el estado de sus tareas
    if (new.titulo, new.descripcion, new.prioridad, new.responsable_id, new.vence, new.accion_id, new.proyecto_id)
       is distinct from (old.titulo, old.descripcion, old.prioridad, old.responsable_id, old.vence, old.accion_id, old.proyecto_id) then
      raise exception 'Solo puedes cambiar el estado de tus tareas';
    end if;
  end if;
  return new;
end $$;
create trigger tareas_limitar before update on tareas for each row execute function limitar_edicion_tarea();

-- ---------- Agenda ----------
create policy eventos_ver on eventos for select to authenticated using (
  organizacion_id = mi_org() and (es_admin() or (proyecto_id is not null and puede_ver_proyecto(proyecto_id))
                                  or (es_equipo() and proyecto_id is null)));
create policy eventos_escribir on eventos for all to authenticated
  using (organizacion_id = mi_org() and (es_admin() or (proyecto_id is not null and puede_editar_proyecto(proyecto_id))))
  with check (organizacion_id = mi_org() and (es_admin() or (proyecto_id is not null and puede_editar_proyecto(proyecto_id))));

-- ---------- Plantillas: solo el equipo ----------
create policy plantillas_ver on plantillas for select to authenticated using (organizacion_id = mi_org() and es_equipo());
create policy plantillas_escribir on plantillas for all to authenticated
  using (organizacion_id = mi_org() and es_equipo()) with check (organizacion_id = mi_org() and es_equipo());

-- ---------- Documentos ----------
create or replace function public.puede_ver_documento(d documentos) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when d.proyecto_id is not null then puede_editar_proyecto(d.proyecto_id) or (d.visible_cliente and puede_ver_proyecto(d.proyecto_id))
    else puede_editar_negocio(d.negocio_id) or (d.visible_cliente and puede_ver_negocio(d.negocio_id))
  end
$$;
create or replace function public.puede_editar_documento(d documentos) returns boolean
language sql stable security definer set search_path = public as $$
  select case when d.proyecto_id is not null then puede_editar_proyecto(d.proyecto_id) else puede_editar_negocio(d.negocio_id) end
$$;

create policy documentos_ver on documentos for select to authenticated using (puede_ver_documento(documentos));
-- El cliente puede subir documentos a su proyecto (siempre visibles)
create policy documentos_crear on documentos for insert to authenticated with check (
  organizacion_id = mi_org() and (puede_editar_documento(documentos)
    or (proyecto_id is not null and visible_cliente and subido_por = auth.uid() and puede_ver_proyecto(proyecto_id))));
create policy documentos_editar on documentos for update to authenticated using (puede_editar_documento(documentos));
create policy documentos_borrar on documentos for delete to authenticated
  using (puede_editar_documento(documentos) or subido_por = auth.uid());

create policy versiones_ver on documento_versiones for select to authenticated
  using (exists (select 1 from documentos d where d.id = documento_id and puede_ver_documento(d)));
create policy versiones_crear on documento_versiones for insert to authenticated
  with check (exists (select 1 from documentos d where d.id = documento_id and puede_editar_documento(d)));

-- ---------- Comentarios ----------
create policy comentarios_ver on comentarios for select to authenticated
  using (puede_editar_proyecto(proyecto_id) or (not interno and puede_ver_proyecto(proyecto_id)));
create policy comentarios_crear on comentarios for insert to authenticated
  with check (autor_id = auth.uid() and (puede_editar_proyecto(proyecto_id) or (not interno and puede_ver_proyecto(proyecto_id))));
create policy comentarios_borrar on comentarios for delete to authenticated using (autor_id = auth.uid() or es_admin());

-- ---------- Vista resumen para el panel (respeta RLS del usuario) ----------
create or replace view public.v_proyectos_resumen with (security_invoker = true) as
select p.id, p.titulo, p.codigo, p.tipo, p.estado, p.salud, p.fecha_inicio, p.fecha_fin, p.responsable_id,
       p.negocio_id, n.nombre as negocio_nombre, n.localidad as negocio_localidad,
       (select count(*) from tareas t where t.proyecto_id = p.id) as tareas_total,
       (select count(*) from tareas t where t.proyecto_id = p.id and t.estado = 'hecha') as tareas_hechas,
       (select count(*) from tareas t where t.proyecto_id = p.id and t.estado <> 'hecha' and t.vence < current_date) as tareas_vencidas,
       (select fase.nombre from fases fase where fase.proyecto_id = p.id and fase.estado = 'en_curso' order by fase.orden limit 1) as fase_actual
from proyectos p join negocios n on n.id = p.negocio_id;

grant select on public.v_proyectos_resumen to authenticated;
