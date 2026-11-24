-- ACTUALIZACIÓN 1 · Pegar en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez sin problema.
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
