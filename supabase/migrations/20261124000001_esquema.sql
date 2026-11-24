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
