-- =============================================================
-- AC Consultoría · instalación completa de la base de datos
-- Pegar entero en Supabase → SQL Editor → Run (una sola vez, en un proyecto vacío).
-- Generado a partir de supabase/migrations. No incluye datos de ejemplo.
-- =============================================================

-- ----- 20261124000001_esquema.sql -----
-- =============================================================
-- AC Consultoría · Esquema base (MVP)
-- organización → negocios → proyectos → (fases, auditorías, hallazgos,
-- KPIs, acciones, tareas, documentos, actas, comentarios)
-- =============================================================

create extension if not exists pgcrypto;

-- ---------- Tipos ----------
create type rol_global      as enum ('admin','colaborador','cliente','personal');
create type rol_proyecto    as enum ('consultor','colaborador','cliente','personal');
create type estado_proyecto as enum ('diagnostico','en_curso','seguimiento','cerrado');
create type salud_proyecto  as enum ('verde','ambar','rojo');
create type tipo_negocio    as enum ('restaurante','bar','cafeteria','dark_kitchen','hotel','grupo','catering','otro');
create type estado_fase     as enum ('pendiente','en_curso','completada');
create type tipo_plantilla  as enum ('auditoria','sop','checklist','informe');
create type area_auditoria  as enum ('sala','cocina','compras','almacen','carta','equipo','experiencia_cliente','appcc');
create type estado_auditoria as enum ('borrador','completada');
create type tipo_hallazgo   as enum ('muda','dafo','observacion');
create type tipo_muda       as enum ('sobreproduccion','esperas','transporte','sobreprocesos','inventario','movimientos','defectos_mermas');
create type tipo_dafo       as enum ('debilidad','amenaza','fortaleza','oportunidad');
create type fase_pdca       as enum ('planificar','hacer','verificar','actuar');
create type estado_tarea    as enum ('pendiente','en_curso','bloqueada','hecha');
create type prioridad       as enum ('baja','media','alta');
create type sentido_kpi     as enum ('subir','bajar');
create type tipo_evento     as enum ('visita','auditoria','entrega','reunion','formacion');
create type entidad_comentario as enum ('tarea','documento','accion','hallazgo','acta');

-- ---------- Utilidad: updated_at ----------
create or replace function public.tocar_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ---------- Acceso ----------
create table public.organizaciones (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  logo_path   text,
  ajustes     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table public.perfiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre          text not null default '',
  email           text,
  telefono        text,
  rol             rol_global not null default 'cliente',
  tarifa_hora     numeric(10,2),
  created_at      timestamptz not null default now()
);
create index on public.perfiles (organizacion_id);

-- ---------- Negocios ----------
create table public.negocios (
  id                 uuid primary key default gen_random_uuid(),
  organizacion_id    uuid not null references public.organizaciones(id) on delete cascade,
  nombre             text not null,
  tipo               tipo_negocio not null default 'restaurante',
  grupo              text,
  direccion          text,
  localidad          text,
  provincia          text default 'Cádiz',
  aforo              integer check (aforo >= 0),
  horarios           text,
  ticket_medio       numeric(10,2),
  plantilla          integer check (plantilla >= 0),
  food_cost_objetivo numeric(5,4) not null default 0.30 check (food_cost_objetivo between 0 and 1),
  notas              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on public.negocios (organizacion_id);
create trigger negocios_upd before update on public.negocios for each row execute function tocar_updated_at();

create table public.contactos (
  id         uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  nombre     text not null,
  cargo      text,
  email      text,
  telefono   text,
  principal  boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.contactos (negocio_id);

-- ---------- Proyectos ----------
create table public.proyectos (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  negocio_id      uuid not null references public.negocios(id) on delete restrict,
  codigo          text,
  titulo          text not null,
  tipo            text not null default 'control_costes',  -- apertura, reestructuracion, rediseno_carta, control_costes, formacion, otro
  estado          estado_proyecto not null default 'diagnostico',
  salud           salud_proyecto not null default 'verde',
  responsable_id  uuid references public.perfiles(id) on delete set null,
  fecha_inicio    date,
  fecha_fin       date,
  objetivos       text,
  alcance         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.proyectos (organizacion_id);
create index on public.proyectos (negocio_id);
create trigger proyectos_upd before update on public.proyectos for each row execute function tocar_updated_at();

-- Datos económicos internos: tabla aparte (RLS filtra filas, no columnas)
create table public.proyecto_finanzas (
  proyecto_id           uuid primary key references public.proyectos(id) on delete cascade,
  horas_presupuestadas  numeric(8,2) not null default 0,
  horas_consumidas      numeric(8,2) not null default 0,
  importe_presupuestado numeric(12,2) not null default 0,
  tarifa_hora           numeric(10,2),
  notas                 text
);

create table public.proyecto_miembros (
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  usuario_id  uuid not null references public.perfiles(id) on delete cascade,
  rol         rol_proyecto not null,
  created_at  timestamptz not null default now(),
  primary key (proyecto_id, usuario_id)
);
create index on public.proyecto_miembros (usuario_id);

create table public.fases (
  id           uuid primary key default gen_random_uuid(),
  proyecto_id  uuid not null references public.proyectos(id) on delete cascade,
  nombre       text not null,
  orden        integer not null default 0,
  fecha_inicio date,
  fecha_fin    date,
  estado       estado_fase not null default 'pendiente'
);
create index on public.fases (proyecto_id);

create table public.hitos (
  id          uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  fase_id     uuid references public.fases(id) on delete set null,
  titulo      text not null,
  fecha       date,
  completado  boolean not null default false
);
create index on public.hitos (proyecto_id);

create table public.eventos (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  proyecto_id     uuid references public.proyectos(id) on delete cascade,
  tipo            tipo_evento not null default 'visita',
  titulo          text not null,
  inicio          timestamptz not null,
  fin             timestamptz,
  lugar           text,
  notas           text,
  creado_por      uuid references public.perfiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index on public.eventos (organizacion_id, inicio);

-- ---------- Plantillas (biblioteca de la consultora) ----------
-- contenido de una auditoría: {"secciones":[{"titulo":"…","items":[{"id":"c1","texto":"…","peso":1}]}]}
create table public.plantillas (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  tipo            tipo_plantilla not null default 'auditoria',
  area            area_auditoria,
  nombre          text not null,
  descripcion     text,
  contenido       jsonb not null default '{"secciones":[]}'::jsonb,
  version         integer not null default 1,
  activa          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.plantillas (organizacion_id);
create trigger plantillas_upd before update on public.plantillas for each row execute function tocar_updated_at();

-- ---------- Diagnóstico ----------
create table public.auditorias (
  id              uuid primary key default gen_random_uuid(),
  proyecto_id     uuid not null references public.proyectos(id) on delete cascade,
  plantilla_id    uuid references public.plantillas(id) on delete set null,
  area            area_auditoria not null,
  titulo          text not null,
  fecha           date not null default current_date,
  auditor_id      uuid references public.perfiles(id) on delete set null,
  estado          estado_auditoria not null default 'borrador',
  puntuacion      numeric(5,2),            -- 0-100
  contenido       jsonb not null default '{"secciones":[]}'::jsonb,  -- copia congelada de la plantilla
  notas           text,
  visible_cliente boolean not null default true,
  created_at      timestamptz not null default now()
);
create index on public.auditorias (proyecto_id);

create table public.auditoria_respuestas (
  id           uuid primary key default gen_random_uuid(),
  auditoria_id uuid not null references public.auditorias(id) on delete cascade,
  item_id      text not null,
  valor        smallint check (valor between 0 and 4),   -- null = no aplica
  nota         text,
  foto_path    text,
  updated_at   timestamptz not null default now(),
  unique (auditoria_id, item_id)
);

create table public.hallazgos (
  id              uuid primary key default gen_random_uuid(),
  proyecto_id     uuid not null references public.proyectos(id) on delete cascade,
  auditoria_id    uuid references public.auditorias(id) on delete set null,
  tipo            tipo_hallazgo not null,
  muda            tipo_muda,
  dafo            tipo_dafo,
  area            area_auditoria,
  titulo          text not null,
  descripcion     text,
  impacto         smallint not null default 3 check (impacto between 1 and 5),
  esfuerzo        smallint not null default 3 check (esfuerzo between 1 and 5),
  coste_estimado  numeric(12,2),     -- € / mes que se pierden, si se conoce
  fotos           text[] not null default '{}',
  visible_cliente boolean not null default true,
  creado_por      uuid references public.perfiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint hallazgo_muda check (tipo <> 'muda' or muda is not null),
  constraint hallazgo_dafo check (tipo <> 'dafo' or dafo is not null)
);
create index on public.hallazgos (proyecto_id);

-- ---------- KPIs ----------
create table public.kpis (
  id              uuid primary key default gen_random_uuid(),
  proyecto_id     uuid not null references public.proyectos(id) on delete cascade,
  codigo          text,              -- food_cost, labour_cost, prime_cost, ticket_medio, mermas…
  nombre          text not null,
  unidad          text not null default '%',
  valor_base      numeric(14,4),
  objetivo        numeric(14,4),
  sentido         sentido_kpi not null default 'bajar',
  visible_cliente boolean not null default true,
  created_at      timestamptz not null default now()
);
create index on public.kpis (proyecto_id);

create table public.kpi_valores (
  id      uuid primary key default gen_random_uuid(),
  kpi_id  uuid not null references public.kpis(id) on delete cascade,
  periodo date not null,             -- primer día del mes medido
  valor   numeric(14,4) not null,
  fuente  text not null default 'manual',
  nota    text,
  unique (kpi_id, periodo)
);

-- ---------- Plan de mejora ----------
create table public.acciones (
  id              uuid primary key default gen_random_uuid(),
  proyecto_id     uuid not null references public.proyectos(id) on delete cascade,
  hallazgo_id     uuid references public.hallazgos(id) on delete set null,
  kpi_id          uuid references public.kpis(id) on delete set null,
  titulo          text not null,
  descripcion     text,
  fase_pdca       fase_pdca not null default 'planificar',
  responsable_id  uuid references public.perfiles(id) on delete set null,
  fecha_objetivo  date,
  prioridad       prioridad not null default 'media',
  resultado       text,
  visible_cliente boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.acciones (proyecto_id);
create trigger acciones_upd before update on public.acciones for each row execute function tocar_updated_at();

create table public.tareas (
  id             uuid primary key default gen_random_uuid(),
  proyecto_id    uuid not null references public.proyectos(id) on delete cascade,
  accion_id      uuid references public.acciones(id) on delete set null,
  titulo         text not null,
  descripcion    text,
  estado         estado_tarea not null default 'pendiente',
  prioridad      prioridad not null default 'media',
  responsable_id uuid references public.perfiles(id) on delete set null,
  vence          date,
  orden          integer not null default 0,
  completada_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public.tareas (proyecto_id);
create index on public.tareas (responsable_id);
create trigger tareas_upd before update on public.tareas for each row execute function tocar_updated_at();

-- ---------- Documentos ----------
create table public.documentos (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  proyecto_id     uuid references public.proyectos(id) on delete cascade,
  negocio_id      uuid references public.negocios(id) on delete cascade,
  carpeta         text not null default 'General',
  nombre          text not null,
  storage_path    text not null,
  mime            text,
  tamano          bigint,
  version         integer not null default 1,
  visible_cliente boolean not null default true,
  subido_por      uuid references public.perfiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint documento_ambito check (proyecto_id is not null or negocio_id is not null)
);
create index on public.documentos (proyecto_id);
create index on public.documentos (negocio_id);
create trigger documentos_upd before update on public.documentos for each row execute function tocar_updated_at();

create table public.documento_versiones (
  id           uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentos(id) on delete cascade,
  version      integer not null,
  storage_path text not null,
  tamano       bigint,
  subido_por   uuid references public.perfiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ---------- Comunicación ----------
create table public.actas (
  id              uuid primary key default gen_random_uuid(),
  proyecto_id     uuid not null references public.proyectos(id) on delete cascade,
  fecha           date not null default current_date,
  titulo          text not null,
  asistentes      text,
  contenido       text,
  acuerdos        jsonb not null default '[]'::jsonb,
  visible_cliente boolean not null default true,
  creado_por      uuid references public.perfiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index on public.actas (proyecto_id);

create table public.comentarios (
  id          uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  entidad     entidad_comentario not null,
  entidad_id  uuid not null,
  autor_id    uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  texto       text not null check (length(texto) between 1 and 5000),
  interno     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index on public.comentarios (entidad, entidad_id);

-- ---------- Alta de usuarios ----------
-- El primer usuario crea la organización y es admin. El resto entra como 'cliente'
-- y el admin le asigna rol desde la app (servidor con service role).
create or replace function public.alta_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  org uuid;
  r   rol_global := 'cliente';
begin
  select id into org from organizaciones order by created_at limit 1;
  if org is null then
    insert into organizaciones (nombre) values ('Mi consultora') returning id into org;
    r := 'admin';
  end if;
  if new.raw_app_meta_data ? 'rol' then
    r := (new.raw_app_meta_data->>'rol')::rol_global;
  end if;
  insert into perfiles (id, organizacion_id, nombre, email, rol)
  values (new.id, org, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)), new.email, r);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.alta_usuario();

-- ---------- Puntuación de auditoría (0-100) ----------
create or replace function public.recalcular_puntuacion(a uuid) returns numeric
language sql security invoker set search_path = public as $$
  update auditorias set puntuacion = (
    select round(avg(valor)::numeric / 4 * 100, 1) from auditoria_respuestas where auditoria_id = a and valor is not null
  ) where id = a
  returning puntuacion
$$;

-- ----- 20261124000002_seguridad.sql -----
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

-- ----- 20261124000003_almacenamiento.sql -----
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

-- ----- 20261124000004_politicas_insert.sql -----
-- Las políticas de lectura de proyectos y negocios no deben consultar su propia tabla:
-- en un INSERT ... RETURNING la fila nueva aún no es visible para esa subconsulta.
drop policy proyectos_ver on proyectos;
create policy proyectos_ver on proyectos for select to authenticated using (
  organizacion_id = mi_org() and (es_admin() or exists (
    select 1 from proyecto_miembros m where m.proyecto_id = proyectos.id and m.usuario_id = auth.uid())));

drop policy negocios_ver on negocios;
create policy negocios_ver on negocios for select to authenticated using (
  organizacion_id = mi_org() and (es_admin() or exists (
    select 1 from proyectos pr join proyecto_miembros m on m.proyecto_id = pr.id
    where pr.negocio_id = negocios.id and m.usuario_id = auth.uid())));

-- ----- 20261124000005_uso_personal_e_informes.sql -----
-- =============================================================
-- Uso personal: el cliente no entra en la plataforma, recibe informes.
-- · visible_cliente pasa a significar "incluir en informes"
-- · tareas y acciones pueden asignarse a un contacto del cliente por nombre
-- · tabla de informes
-- =============================================================
alter table tareas   add column responsable_externo text;
alter table acciones add column responsable_externo text;

comment on column hallazgos.visible_cliente is 'Incluir en informes';
comment on column acciones.visible_cliente  is 'Incluir en informes';
comment on column kpis.visible_cliente      is 'Incluir en informes';
comment on column actas.visible_cliente     is 'Incluir en informes';
comment on column auditorias.visible_cliente is 'Incluir en informes';

create type tipo_informe   as enum ('diagnostico','seguimiento','cierre');
create type estado_informe as enum ('borrador','enviado');

create table public.informes (
  id              uuid primary key default gen_random_uuid(),
  proyecto_id     uuid not null references public.proyectos(id) on delete cascade,
  tipo            tipo_informe not null default 'seguimiento',
  titulo          text not null,
  periodo_desde   date,
  periodo_hasta   date,
  introduccion    text,
  conclusiones    text,
  proximos_pasos  text,
  secciones       text[] not null default '{}',
  estado          estado_informe not null default 'borrador',
  enviado_at      timestamptz,
  enviado_a       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.informes (proyecto_id);
create trigger informes_upd before update on public.informes for each row execute function tocar_updated_at();

alter table public.informes enable row level security;
create policy informes_ver on informes for select to authenticated using (puede_editar_proyecto(proyecto_id));
create policy informes_escribir on informes for all to authenticated
  using (puede_editar_proyecto(proyecto_id)) with check (puede_editar_proyecto(proyecto_id));

-- ----- 20261124000006_costes_y_escandallos.sql -----
-- =============================================================
-- Fase 2 · Costes, compras, escandallos e ingeniería de menú
-- Proveedores: de la consultora (comunes a todos los clientes)
-- Productos, precios, facturas, escandallos y ventas: por negocio
-- =============================================================

create type unidad_compra  as enum ('kg','l','ud');
create type tipo_documento_compra as enum ('factura','albaran');
create type estado_factura as enum ('pendiente','validada');
create type tipo_escandallo as enum ('plato','elaboracion');

create table public.proveedores (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  nombre          text not null,
  cif             text,
  categoria       text,
  contacto        text,
  email           text,
  telefono        text,
  condiciones     text,      -- plazos de pago, pedido mínimo, días de reparto
  created_at      timestamptz not null default now()
);
create index on public.proveedores (organizacion_id);

create table public.productos (
  id                    uuid primary key default gen_random_uuid(),
  negocio_id            uuid not null references public.negocios(id) on delete cascade,
  nombre                text not null,
  familia               text not null default 'Otros',
  unidad                unidad_compra not null default 'kg',
  formato               text,                       -- "caja 5 kg", "garrafa 25 l"
  merma_pct             numeric(5,2) not null default 0 check (merma_pct >= 0 and merma_pct < 100),
  proveedor_habitual_id uuid references public.proveedores(id) on delete set null,
  alergenos             text[] not null default '{}',
  activo                boolean not null default true,
  created_at            timestamptz not null default now()
);
create index on public.productos (negocio_id);

create table public.facturas (
  id           uuid primary key default gen_random_uuid(),
  negocio_id   uuid not null references public.negocios(id) on delete cascade,
  proveedor_id uuid references public.proveedores(id) on delete set null,
  tipo         tipo_documento_compra not null default 'factura',
  numero       text,
  fecha        date,
  base         numeric(12,2),
  iva          numeric(12,2),
  total        numeric(12,2),
  archivo_path text,
  estado       estado_factura not null default 'pendiente',
  extraccion   jsonb,          -- lo que devolvió la lectura automática, para auditar
  notas        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on public.facturas (negocio_id, fecha);
create trigger facturas_upd before update on public.facturas for each row execute function tocar_updated_at();

create table public.lineas_factura (
  id              uuid primary key default gen_random_uuid(),
  factura_id      uuid not null references public.facturas(id) on delete cascade,
  orden           integer not null default 0,
  producto_id     uuid references public.productos(id) on delete set null,
  descripcion     text not null,
  cantidad        numeric(12,3) not null default 1,
  unidad          text,
  precio_unitario numeric(12,4) not null default 0,   -- sin IVA, ya con descuento
  descuento_pct   numeric(5,2) not null default 0,
  iva_pct         numeric(5,2),
  importe         numeric(12,2)
);
create index on public.lineas_factura (factura_id);
create index on public.lineas_factura (producto_id);

-- Histórico de precios por producto (de facturas validadas o a mano)
create table public.precios (
  id               uuid primary key default gen_random_uuid(),
  producto_id      uuid not null references public.productos(id) on delete cascade,
  proveedor_id     uuid references public.proveedores(id) on delete set null,
  fecha            date not null,
  precio           numeric(12,4) not null check (precio >= 0),   -- € sin IVA por unidad de compra
  cantidad         numeric(12,3),
  linea_factura_id uuid references public.lineas_factura(id) on delete cascade,
  created_at       timestamptz not null default now()
);
create index on public.precios (producto_id, fecha desc);

create table public.escandallos (
  id                 uuid primary key default gen_random_uuid(),
  negocio_id         uuid not null references public.negocios(id) on delete cascade,
  tipo               tipo_escandallo not null default 'plato',
  nombre             text not null,
  categoria          text,                     -- Entrantes, Principales, Postres…
  raciones           numeric(8,2) not null default 1 check (raciones > 0),
  rendimiento        numeric(12,3),            -- elaboraciones: cuánto sale (en unidad_rendimiento)
  unidad_rendimiento unidad_compra,
  pvp                numeric(10,2),            -- con IVA
  iva_pct            numeric(5,2) not null default 10,
  elaboracion        text,
  activo             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index on public.escandallos (negocio_id);
create trigger escandallos_upd before update on public.escandallos for each row execute function tocar_updated_at();

create table public.ingredientes_escandallo (
  id                uuid primary key default gen_random_uuid(),
  escandallo_id     uuid not null references public.escandallos(id) on delete cascade,
  orden             integer not null default 0,
  producto_id       uuid references public.productos(id) on delete restrict,
  sub_escandallo_id uuid references public.escandallos(id) on delete restrict,
  cantidad          numeric(12,4) not null check (cantidad >= 0),   -- en la unidad del producto o de la elaboración
  merma_pct         numeric(5,2),                                   -- si es distinta de la del producto
  constraint un_origen check ((producto_id is null) <> (sub_escandallo_id is null)),
  constraint no_a_si_mismo check (sub_escandallo_id is distinct from escandallo_id)
);
create index on public.ingredientes_escandallo (escandallo_id);

-- Unidades vendidas por plato y mes (para la ingeniería de menú)
create table public.ventas_plato (
  escandallo_id uuid not null references public.escandallos(id) on delete cascade,
  periodo       date not null,      -- primer día del mes
  unidades      integer not null check (unidades >= 0),
  primary key (escandallo_id, periodo)
);

-- Último precio, el anterior y la variación de cada producto
create or replace view public.v_productos_precio with (security_invoker = true) as
select p.*,
       u.precio  as precio_actual, u.fecha as fecha_precio, u.proveedor_id as proveedor_ultimo_id,
       a.precio  as precio_anterior, a.fecha as fecha_precio_anterior,
       case when a.precio > 0 then round((u.precio - a.precio) / a.precio * 100, 2) end as variacion_pct
from productos p
left join lateral (select precio, fecha, proveedor_id from precios where producto_id = p.id order by fecha desc, created_at desc limit 1) u on true
left join lateral (select precio, fecha from precios where producto_id = p.id order by fecha desc, created_at desc offset 1 limit 1) a on true;
grant select on public.v_productos_precio to authenticated;

-- ---------- RLS ----------
alter table proveedores enable row level security;
alter table productos enable row level security;
alter table facturas enable row level security;
alter table lineas_factura enable row level security;
alter table precios enable row level security;
alter table escandallos enable row level security;
alter table ingredientes_escandallo enable row level security;
alter table ventas_plato enable row level security;

create policy proveedores_equipo on proveedores for all to authenticated
  using (organizacion_id = mi_org() and es_equipo()) with check (organizacion_id = mi_org() and es_equipo());

create policy productos_equipo on productos for all to authenticated
  using (puede_editar_negocio(negocio_id)) with check (puede_editar_negocio(negocio_id));
create policy facturas_equipo on facturas for all to authenticated
  using (puede_editar_negocio(negocio_id)) with check (puede_editar_negocio(negocio_id));
create policy escandallos_equipo on escandallos for all to authenticated
  using (puede_editar_negocio(negocio_id)) with check (puede_editar_negocio(negocio_id));

create policy lineas_equipo on lineas_factura for all to authenticated
  using (exists (select 1 from facturas f where f.id = factura_id and puede_editar_negocio(f.negocio_id)))
  with check (exists (select 1 from facturas f where f.id = factura_id and puede_editar_negocio(f.negocio_id)));
create policy precios_equipo on precios for all to authenticated
  using (exists (select 1 from productos p where p.id = producto_id and puede_editar_negocio(p.negocio_id)))
  with check (exists (select 1 from productos p where p.id = producto_id and puede_editar_negocio(p.negocio_id)));
create policy ingredientes_equipo on ingredientes_escandallo for all to authenticated
  using (exists (select 1 from escandallos e where e.id = escandallo_id and puede_editar_negocio(e.negocio_id)))
  with check (exists (select 1 from escandallos e where e.id = escandallo_id and puede_editar_negocio(e.negocio_id)));
create policy ventas_equipo on ventas_plato for all to authenticated
  using (exists (select 1 from escandallos e where e.id = escandallo_id and puede_editar_negocio(e.negocio_id)))
  with check (exists (select 1 from escandallos e where e.id = escandallo_id and puede_editar_negocio(e.negocio_id)));

-- Un producto y una elaboración deben ser del mismo negocio que el escandallo
create or replace function public.validar_ingrediente() returns trigger
language plpgsql security definer set search_path = public as $$
declare n uuid;
begin
  select negocio_id into n from escandallos where id = new.escandallo_id;
  if new.producto_id is not null and not exists (select 1 from productos where id = new.producto_id and negocio_id = n) then
    raise exception 'El producto no pertenece a este negocio';
  end if;
  if new.sub_escandallo_id is not null and not exists (select 1 from escandallos where id = new.sub_escandallo_id and negocio_id = n and tipo = 'elaboracion') then
    raise exception 'La elaboración no pertenece a este negocio';
  end if;
  return new;
end $$;
create trigger ingredientes_validar before insert or update on ingredientes_escandallo for each row execute function validar_ingrediente();

-- Al validar una factura se registran los precios de sus líneas enlazadas a un producto
create or replace function public.validar_factura(f uuid) returns integer
language plpgsql security invoker set search_path = public as $$
declare n integer;
begin
  update facturas set estado = 'validada' where id = f;
  delete from precios where linea_factura_id in (select id from lineas_factura where factura_id = f);
  insert into precios (producto_id, proveedor_id, fecha, precio, cantidad, linea_factura_id)
  select l.producto_id, fa.proveedor_id, coalesce(fa.fecha, current_date), l.precio_unitario, l.cantidad, l.id
  from lineas_factura l join facturas fa on fa.id = l.factura_id
  where l.factura_id = f and l.producto_id is not null and l.precio_unitario > 0;
  get diagnostics n = row_count;
  return n;
end $$;

-- ----- 20261124000007_inventario_estandares.sql -----
-- =============================================================
-- Fase 2 (cierre) · Inventario y mermas · Estándares y formación
-- =============================================================

create type estado_inventario as enum ('abierto','cerrado');
create type motivo_merma as enum ('caducidad','deterioro','sobreproduccion','error_elaboracion','devolucion','rotura','otro');
create type tipo_estandar as enum ('sop','checklist','ficha','manual');
create type estado_estandar as enum ('borrador','en_prueba','implantado');

-- ---------- Inventarios (recuentos valorados) ----------
create table public.inventarios (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references public.negocios(id) on delete cascade,
  fecha       date not null default current_date,
  nombre      text not null,
  estado      estado_inventario not null default 'abierto',
  notas       text,
  created_at  timestamptz not null default now()
);
create index on public.inventarios (negocio_id, fecha);

create table public.inventario_lineas (
  inventario_id uuid not null references public.inventarios(id) on delete cascade,
  producto_id   uuid not null references public.productos(id) on delete cascade,
  cantidad      numeric(12,3),          -- null = sin contar todavía
  precio        numeric(12,4),          -- precio congelado al cerrar el inventario
  primary key (inventario_id, producto_id)
);

-- ---------- Mermas ----------
create table public.mermas (
  id            uuid primary key default gen_random_uuid(),
  negocio_id    uuid not null references public.negocios(id) on delete cascade,
  fecha         date not null default current_date,
  producto_id   uuid references public.productos(id) on delete set null,
  escandallo_id uuid references public.escandallos(id) on delete set null,
  cantidad      numeric(12,3) not null check (cantidad > 0),   -- en la unidad del producto o en raciones
  motivo        motivo_merma not null default 'otro',
  coste         numeric(12,2) not null default 0,              -- valorado al registrarla
  notas         text,
  created_at    timestamptz not null default now(),
  constraint merma_origen check ((producto_id is null) <> (escandallo_id is null))
);
create index on public.mermas (negocio_id, fecha);

-- ---------- Estándares (SOPs, checklists, fichas, manuales) ----------
create table public.estandares (
  id                  uuid primary key default gen_random_uuid(),
  proyecto_id         uuid not null references public.proyectos(id) on delete cascade,
  plantilla_id        uuid references public.plantillas(id) on delete set null,
  tipo                tipo_estandar not null default 'sop',
  titulo              text not null,
  area                area_auditoria,
  contenido           jsonb not null default '{"secciones":[]}'::jsonb,
  version             integer not null default 1,
  estado              estado_estandar not null default 'borrador',
  responsable_externo text,
  fecha_implantacion  date,
  visible_cliente     boolean not null default true,   -- incluir en informes
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on public.estandares (proyecto_id);
create trigger estandares_upd before update on public.estandares for each row execute function tocar_updated_at();

-- ---------- Formaciones ----------
create table public.formaciones (
  id              uuid primary key default gen_random_uuid(),
  proyecto_id     uuid not null references public.proyectos(id) on delete cascade,
  estandar_id     uuid references public.estandares(id) on delete set null,
  fecha           date not null default current_date,
  titulo          text not null,
  formador        text,
  duracion_h      numeric(5,2) not null default 1 check (duracion_h > 0),
  contenido       text,
  asistentes      jsonb not null default '[]'::jsonb,   -- [{nombre, puesto, asistio}]
  valoracion      numeric(3,1) check (valoracion between 0 and 10),
  visible_cliente boolean not null default true,
  created_at      timestamptz not null default now()
);
create index on public.formaciones (proyecto_id);

-- ---------- RLS ----------
alter table inventarios enable row level security;
alter table inventario_lineas enable row level security;
alter table mermas enable row level security;
alter table estandares enable row level security;
alter table formaciones enable row level security;

create policy inventarios_equipo on inventarios for all to authenticated
  using (puede_editar_negocio(negocio_id)) with check (puede_editar_negocio(negocio_id));
create policy inv_lineas_equipo on inventario_lineas for all to authenticated
  using (exists (select 1 from inventarios i where i.id = inventario_id and puede_editar_negocio(i.negocio_id)))
  with check (exists (select 1 from inventarios i where i.id = inventario_id and puede_editar_negocio(i.negocio_id)));
create policy mermas_equipo on mermas for all to authenticated
  using (puede_editar_negocio(negocio_id)) with check (puede_editar_negocio(negocio_id));
create policy estandares_equipo on estandares for all to authenticated
  using (puede_editar_proyecto(proyecto_id)) with check (puede_editar_proyecto(proyecto_id));
create policy formaciones_equipo on formaciones for all to authenticated
  using (puede_editar_proyecto(proyecto_id)) with check (puede_editar_proyecto(proyecto_id));

-- Al cerrar un inventario se congela el último precio de cada producto
create or replace function public.cerrar_inventario(inv uuid) returns void
language sql security invoker set search_path = public as $$
  update inventario_lineas l set precio = coalesce(v.precio_actual, 0)
  from v_productos_precio v where v.id = l.producto_id and l.inventario_id = inv;
  update inventarios set estado = 'cerrado' where id = inv;
$$;

-- ----- 20261124000008_ventas_resultados.sql -----
-- =============================================================
-- Fase 3 · Ventas, cuenta de resultados y KPIs del sector
-- =============================================================

-- Datos de operación del local para RevPASH y rotación de mesas
alter table negocios add column horas_apertura_dia numeric(4,1) not null default 8 check (horas_apertura_dia > 0);
alter table negocios add column servicios_dia smallint not null default 2 check (servicios_dia > 0);

-- Ventas diarias (importadas del TPV o a mano)
create table public.ventas_diarias (
  negocio_id   uuid not null references public.negocios(id) on delete cascade,
  fecha        date not null,
  ventas_netas numeric(12,2) not null check (ventas_netas >= 0),   -- sin IVA
  tickets      integer check (tickets >= 0),
  cubiertos    integer check (cubiertos >= 0),
  fuente       text not null default 'manual',                     -- manual, csv, tpv
  primary key (negocio_id, fecha)
);

-- Cuenta de resultados mensual. Ventas y materia prima se calculan solas si se dejan vacías.
create table public.cuentas_resultados (
  negocio_id   uuid not null references public.negocios(id) on delete cascade,
  periodo      date not null,               -- primer día del mes
  ventas_netas numeric(12,2),               -- si es null: suma de ventas diarias
  coste_mp     numeric(12,2),               -- si es null: compras validadas ± variación de inventario
  personal     numeric(12,2),               -- nóminas + seguridad social
  alquiler     numeric(12,2),
  suministros  numeric(12,2),               -- luz, agua, gas
  otros_gastos numeric(12,2),               -- gestoría, seguros, mantenimiento, marketing…
  notas        text,
  updated_at   timestamptz not null default now(),
  primary key (negocio_id, periodo)
);

alter table ventas_diarias enable row level security;
alter table cuentas_resultados enable row level security;
create policy ventas_diarias_equipo on ventas_diarias for all to authenticated
  using (puede_editar_negocio(negocio_id)) with check (puede_editar_negocio(negocio_id));
create policy cuentas_equipo on cuentas_resultados for all to authenticated
  using (puede_editar_negocio(negocio_id)) with check (puede_editar_negocio(negocio_id));

-- ----- 20261124000009_consultora.sql -----
-- =============================================================
-- Módulo interno de la consultora: horas, presupuestos, facturación y cobros
-- Solo lo ve el administrador. La factura legal se emite en el programa
-- contable (VeriFactu); aquí se registra para seguir cobros y rentabilidad.
-- =============================================================

create type tipo_hora as enum ('visita','oficina','desplazamiento','formacion','reunion','otro');
create type estado_presupuesto as enum ('borrador','enviado','aceptado','rechazado');
create type estado_cobro as enum ('pendiente','cobrada');

create table public.horas (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  proyecto_id     uuid references public.proyectos(id) on delete cascade,   -- null = trabajo interno (comercial, formación propia…)
  usuario_id      uuid not null default auth.uid() references public.perfiles(id) on delete cascade,
  fecha           date not null default current_date,
  horas           numeric(5,2) not null check (horas > 0 and horas <= 24),
  tipo            tipo_hora not null default 'oficina',
  descripcion     text,
  km              numeric(7,1) check (km >= 0),                               -- desplazamientos
  created_at      timestamptz not null default now()
);
create index on public.horas (organizacion_id, fecha);
create index on public.horas (proyecto_id);

create table public.presupuestos (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  negocio_id      uuid not null references public.negocios(id) on delete cascade,
  proyecto_id     uuid references public.proyectos(id) on delete set null,
  numero          text not null,
  fecha           date not null default current_date,
  validez_dias    integer not null default 30,
  titulo          text not null,
  introduccion    text,
  conceptos       jsonb not null default '[]'::jsonb,   -- [{descripcion, cantidad, unidad, precio}]
  iva_pct         numeric(5,2) not null default 21,
  condiciones     text,                                  -- forma y plazos de pago
  estado          estado_presupuesto not null default 'borrador',
  fecha_estado    date,
  notas           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organizacion_id, numero)
);
create index on public.presupuestos (organizacion_id, fecha);
create trigger presupuestos_upd before update on public.presupuestos for each row execute function tocar_updated_at();

-- Registro de facturas emitidas (número del programa contable) y su cobro
create table public.facturas_emitidas (
  id              uuid primary key default gen_random_uuid(),
  organizacion_id uuid not null references public.organizaciones(id) on delete cascade,
  negocio_id      uuid not null references public.negocios(id) on delete cascade,
  proyecto_id     uuid references public.proyectos(id) on delete set null,
  presupuesto_id  uuid references public.presupuestos(id) on delete set null,
  numero          text not null,
  concepto        text,
  fecha           date not null default current_date,
  vencimiento     date,
  base            numeric(12,2) not null check (base >= 0),
  iva_pct         numeric(5,2) not null default 21,
  irpf_pct        numeric(5,2) not null default 0,       -- retención si factura como autónomo a una empresa
  estado          estado_cobro not null default 'pendiente',
  fecha_cobro     date,
  created_at      timestamptz not null default now()
);
create index on public.facturas_emitidas (organizacion_id, fecha);

alter table horas enable row level security;
alter table presupuestos enable row level security;
alter table facturas_emitidas enable row level security;
create policy horas_admin on horas for all to authenticated
  using (organizacion_id = mi_org() and es_admin()) with check (organizacion_id = mi_org() and es_admin());
create policy presupuestos_admin on presupuestos for all to authenticated
  using (organizacion_id = mi_org() and es_admin()) with check (organizacion_id = mi_org() and es_admin());
create policy emitidas_admin on facturas_emitidas for all to authenticated
  using (organizacion_id = mi_org() and es_admin()) with check (organizacion_id = mi_org() and es_admin());

-- Las horas consumidas del proyecto salen del registro de horas
create or replace function public.sumar_horas() returns trigger
language plpgsql security definer set search_path = public as $$
declare p uuid;
begin
  foreach p in array array[coalesce(new.proyecto_id, old.proyecto_id), case when tg_op = 'UPDATE' then old.proyecto_id end] loop
    if p is not null then
      update proyecto_finanzas set horas_consumidas = coalesce((select sum(horas) from horas where proyecto_id = p), 0) where proyecto_id = p;
    end if;
  end loop;
  return null;
end $$;
create trigger horas_sumar after insert or update or delete on horas for each row execute function sumar_horas();

-- ----- 20261124000010_irpf_y_borrado.sql -----
-- =============================================================
-- Retención de IRPF en presupuestos y conservación de facturas emitidas
-- =============================================================

-- Retención de IRPF (autónomo que factura a empresas: 15 %, o 7 % los primeros años)
alter table public.presupuestos add column if not exists irpf_pct numeric(5,2) not null default 0;

-- Las facturas emitidas se conservan aunque se borre el cliente (obligación fiscal):
-- se guarda el nombre del cliente en la propia factura y el enlace pasa a ser opcional.
alter table public.facturas_emitidas add column if not exists cliente_nombre text;
update public.facturas_emitidas f set cliente_nombre = n.nombre from public.negocios n where n.id = f.negocio_id and f.cliente_nombre is null;
alter table public.facturas_emitidas alter column negocio_id drop not null;
alter table public.facturas_emitidas drop constraint if exists facturas_emitidas_negocio_id_fkey;
alter table public.facturas_emitidas add constraint facturas_emitidas_negocio_id_fkey
  foreign key (negocio_id) references public.negocios(id) on delete set null;

-- Los proyectos de un cliente se borran con él (antes lo impedía)
alter table public.proyectos drop constraint if exists proyectos_negocio_id_fkey;
alter table public.proyectos add constraint proyectos_negocio_id_fkey
  foreign key (negocio_id) references public.negocios(id) on delete cascade;

-- Las horas trabajadas se conservan al borrar un proyecto (pasan a trabajo interno)
alter table public.horas drop constraint if exists horas_proyecto_id_fkey;
alter table public.horas add constraint horas_proyecto_id_fkey
  foreign key (proyecto_id) references public.proyectos(id) on delete set null;
