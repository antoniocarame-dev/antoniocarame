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
