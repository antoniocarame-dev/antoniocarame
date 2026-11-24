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
