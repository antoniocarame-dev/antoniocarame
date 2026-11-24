-- ACTUALIZACIÓN 2 · Pegar en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez sin problema.
-- =============================================================
-- Calendario: eventos personales, «otro» y de todo el día
-- =============================================================
-- Agenda libre: eventos personales y de todo el día
alter type tipo_evento add value if not exists 'personal';
alter type tipo_evento add value if not exists 'otro';
alter table public.eventos add column if not exists todo_el_dia boolean not null default false;
