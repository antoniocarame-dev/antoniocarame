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
