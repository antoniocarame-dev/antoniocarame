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
