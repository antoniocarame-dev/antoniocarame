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
